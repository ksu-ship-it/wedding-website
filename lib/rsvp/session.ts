import { createHmac, timingSafeEqual } from "node:crypto";

import type { InvitationSessionPayload } from "./types";

export const INVITATION_SESSION_COOKIE_NAME = "rsvp_invitation_session";
export const DEFAULT_INVITATION_SESSION_TTL_MS = 1000 * 60 * 60 * 4;

function getSessionSecret(): string {
  return process.env.RSVP_SESSION_SECRET ?? "development-rsvp-session-secret";
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createInvitationSessionData(
  inviteeId: string,
  householdId: string,
  versionId: string,
  issuedAt = Date.now(),
  ttlMs = DEFAULT_INVITATION_SESSION_TTL_MS,
): InvitationSessionPayload {
  return {
    inviteeId,
    householdId,
    versionId,
    issuedAt,
    expiresAt: issuedAt + ttlMs,
  };
}

export function signInvitationSession(
  payload: InvitationSessionPayload,
): string {
  const serialized = JSON.stringify(payload);
  const signature = createHmac("sha256", getSessionSecret())
    .update(serialized)
    .digest("hex");

  return `${encodeBase64Url(serialized)}.${signature}`;
}

export function verifyInvitationSession(token: string | null | undefined): InvitationSessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const serialized = decodeBase64Url(encodedPayload);
  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(serialized)
    .digest("hex");

  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as InvitationSessionPayload;
    if (parsed.expiresAt <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readInvitationSessionCookie(
  cookieHeader: string | null | undefined,
): InvitationSessionPayload | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === INVITATION_SESSION_COOKIE_NAME) {
      return verifyInvitationSession(rest.join("="));
    }
  }

  return null;
}

export function writeInvitationSessionCookie(
  payload: InvitationSessionPayload,
): string {
  const token = signInvitationSession(payload);
  const maxAgeSeconds = Math.max(1, Math.ceil((payload.expiresAt - Date.now()) / 1000));

  return [
    `${INVITATION_SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}
