import { NextResponse } from "next/server";

import {
  HOST_SESSION_COOKIE_NAME,
  DEFAULT_HOST_SESSION_TTL_MS,
  readHostSessionCookie,
  verifyAdminPassword,
  writeHostSessionCookie,
} from "@/lib/rsvp/admin-auth";
import { parseGuestListCsv } from "@/lib/rsvp/guest-list-import";
import {
  createDraftGuestList,
  getHostRsvpResponses,
  publishGuestList,
} from "@/lib/rsvp/repository";
import {
  evaluateLookupRateLimit,
  recordFailedLookupAttempt,
  resetLookupRateLimit,
} from "@/lib/rsvp/rate-limit";
import { isSameOriginRequest } from "@/lib/rsvp/request-security";

export const dynamic = "force-dynamic";

const MAX_IMPORT_BYTES = 1_000_000;

function getClientIdentifier(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown-client";
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function csvCell(value: string | null | undefined): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function makeCsv(rows: Awaited<ReturnType<typeof getHostRsvpResponses>>): string {
  const columns = [
    "household",
    "invitee",
    "attendance",
    "plus_one_name",
    "plus_one_attendance",
    "contact_email",
    "song_request",
    "roster_version",
    "submitted_at",
  ] as const;

  return [
    columns.map(csvCell).join(","),
    ...rows.map((row) => [
      row.household,
      row.invitee,
      row.attendance,
      row.plusOneName,
      row.plusOneAttendance,
      row.contactEmail,
      row.songRequest,
      row.versionId,
      row.submittedAt,
    ].map(csvCell).join(",")),
  ].join("\r\n");
}

function hostCookie(payload: { role: "host"; issuedAt: number; expiresAt: number }): string {
  return writeHostSessionCookie(payload);
}

async function login(request: Request, payload: Record<string, unknown>) {
  const clientIdentifier = `host-login:${getClientIdentifier(request)}`;
  const limit = await evaluateLookupRateLimit(clientIdentifier);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many sign-in attempts. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil(limit.retryAfterMs / 1000))),
          "Cache-Control": "private, no-store",
        },
      },
    );
  }

  const password = typeof payload.password === "string" ? payload.password : "";
  if (!verifyAdminPassword(password, process.env.RSVP_ADMIN_PASSWORD_HASH)) {
    await recordFailedLookupAttempt(clientIdentifier);
    return jsonError("The host passphrase was not accepted.", 401);
  }

  await resetLookupRateLimit(clientIdentifier);
  const issuedAt = Date.now();
  const cookie = hostCookie({
    role: "host",
    issuedAt,
    expiresAt: issuedAt + DEFAULT_HOST_SESSION_TTL_MS,
  });
  return NextResponse.json(
    { authenticated: true },
    { headers: { "Set-Cookie": cookie, "Cache-Control": "private, no-store" } },
  );
}

export async function GET(request: Request) {
  if (!readHostSessionCookie(request.headers.get("cookie"))) {
    return jsonError("Host authentication is required.", 401);
  }

  const action = new URL(request.url).searchParams.get("action");
  if (action === "session") {
    return NextResponse.json({ authenticated: true }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  try {
    const responses = await getHostRsvpResponses();
    if (action === "export") {
      return new NextResponse(makeCsv(responses), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="rsvp-responses.csv"',
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (action !== "responses") return jsonError("Unsupported host action.", 400);

    return NextResponse.json({ responses }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return jsonError("Host RSVP data is temporarily unavailable.", 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError("This request could not be verified.", 403);

  const isFormData = request.headers.get("content-type")?.includes("multipart/form-data") ?? false;
  let action: string;
  let payload: Record<string, unknown>;
  let uploadedFile: File | null = null;

  try {
    if (isFormData) {
      const formData = await request.formData();
      action = String(formData.get("action") ?? "");
      const file = formData.get("file");
      uploadedFile = file instanceof File ? file : null;
      payload = {};
    } else {
      const parsed = await request.json();
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return jsonError("The host request is invalid.", 400);
      }
      payload = parsed as Record<string, unknown>;
      action = typeof payload.action === "string" ? payload.action : "";
    }
  } catch {
    return jsonError("The host request is invalid.", 400);
  }

  if (action === "login") return login(request, payload);

  if (action === "logout") {
    const expiredCookie = [
      `${HOST_SESSION_COOKIE_NAME}=`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=0",
      ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; ");
    return NextResponse.json({ authenticated: false }, {
      headers: { "Set-Cookie": expiredCookie, "Cache-Control": "private, no-store" },
    });
  }

  if (!readHostSessionCookie(request.headers.get("cookie"))) {
    return jsonError("Host authentication is required.", 401);
  }

  try {
    if (action === "preview") {
      if (!uploadedFile) return jsonError("Choose a CSV file to preview.", 400);
      if (uploadedFile.size > MAX_IMPORT_BYTES) {
        return jsonError("The CSV file must be 1 MB or smaller.", 413);
      }

      const csv = await uploadedFile.text();
      const parsed = parseGuestListCsv(csv);
      const sourceFilename = uploadedFile.name.split(/[\\/]/).pop() || "guest-list.csv";
      const draft = await createDraftGuestList(parsed, sourceFilename);

      return NextResponse.json({
        preview: {
          versionId: draft.versionId,
          rowCount: parsed.rowCount,
          validRows: parsed.rows.length,
          invalidRows: parsed.rowCount - parsed.rows.length,
          rows: parsed.rows.map((row, index) => ({
            rowNumber: parsed.rowNumbers[index],
            inviteeId: row.inviteeId,
            firstName: row.firstName,
            lastName: row.lastName,
          })),
          issues: parsed.issues,
        },
      }, { headers: { "Cache-Control": "private, no-store" } });
    }

    if (action === "publish") {
      if (typeof payload.versionId !== "string" || !payload.versionId) {
        return jsonError("Choose a valid guest-list draft to publish.", 400);
      }
      const published = await publishGuestList(payload.versionId);
      if (!published) return jsonError("This draft has errors or is no longer available to publish.", 409);
      return NextResponse.json({ published: true }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    return jsonError("Unsupported host action.", 400);
  } catch {
    return jsonError("Host RSVP data is temporarily unavailable.", 503);
  }
}