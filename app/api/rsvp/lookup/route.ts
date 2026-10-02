import { NextResponse } from "next/server";

import { lookupGuestInvitation } from "@/lib/rsvp/guest-lookup";
import { createInvitationSessionData, writeInvitationSessionCookie } from "@/lib/rsvp/session";
import { parseGuestLookupRequest } from "@/lib/rsvp/validation";

export const dynamic = "force-dynamic";

function getClientIdentifier(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",").at(-1)?.trim() || "unknown-client";
  }

  return "unknown-client";
}

export async function POST(request: Request) {
  let data;
  try {
    const payload = await request.json();
    data = parseGuestLookupRequest(payload);
  } catch {
    return NextResponse.json(
      { message: "Please enter both a first and last name to continue." },
      { status: 400 },
    );
  }

  try {
    const lookup = await lookupGuestInvitation(
      data.firstName,
      data.lastName,
      getClientIdentifier(request),
    );

    if (lookup.status === "rate-limited") {
      const retryAfterSeconds = Math.max(1, Math.ceil(lookup.retryAfterMs / 1000));
      return NextResponse.json(
        { message: "Too many attempts. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

    if (lookup.status === "not-found") {
      return NextResponse.json(
        { message: "We couldn't find that invitation." },
        { status: 404 },
      );
    }

    const { match, currentSubmission } = lookup;

    const householdMember = match.members[0];
    const versionId = householdMember.versionId ?? "v1";
    const cookie = writeInvitationSessionCookie(
      createInvitationSessionData(householdMember.id, match.householdId, versionId),
    );

    return NextResponse.json(
      {
        household: {
          householdId: match.householdId,
          members: match.members.map((member) => ({
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            plusOneAllowed: member.plusOneAllowed,
          })),
        },
        responses: currentSubmission?.responses ?? null,
        plusOnes: currentSubmission?.plusOnes ?? [],
        contactEmail: currentSubmission?.contactEmail ?? null,
        songRequest: currentSubmission?.songRequest ?? null,
      },
      {
        headers: {
          "Set-Cookie": cookie,
        },
      },
    );
  } catch {
    return NextResponse.json(
      { message: "We couldn't open that invitation right now. Please try again." },
      { status: 503 },
    );
  }
}
