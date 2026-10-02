import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const HOST_SESSION_COOKIE_NAME = "wedding_rsvp_admin_session";
export const DEFAULT_HOST_SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function getHostSessionSecret(): string {
  return process.env.RSVP_SESSION_SECRET ?? "development-rsvp-admin-session-secret";
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export interface HostSessionPayload {
  role: "host";
  issuedAt: number;
  expiresAt: number;
}

export function hashAdminPassword(password: string): string {
  return `sha256:${createHash("sha256").update(password).digest("hex")}`;
}

export function verifyAdminPassword(
  password: string,
  expectedHash: string | undefined,
): boolean {
  if (!expectedHash) {
    return false;
  }

  const hashValue = expectedHash.startsWith("sha256:")
    ? expectedHash.slice("sha256:".length)
    : expectedHash;
  const candidateHash = createHash("sha256").update(password).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(hashValue, "hex"),
      Buffer.from(candidateHash, "hex"),
    );
  } catch {
    return false;
  }
}

export function signHostSession(payload: HostSessionPayload): string {
  const serialized = JSON.stringify(payload);
  const signature = createHmac("sha256", getHostSessionSecret())
    .update(serialized)
    .digest("hex");

  return `${encodeBase64Url(serialized)}.${signature}`;
}

export function verifyHostSession(
  token: string | null | undefined,
): HostSessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const serialized = decodeBase64Url(encodedPayload);
  const expectedSignature = createHmac("sha256", getHostSessionSecret())
    .update(serialized)
    .digest("hex");

  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as HostSessionPayload;
    if (parsed.role !== "host" || parsed.expiresAt <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readHostSessionCookie(
  cookieHeader: string | null | undefined,
): HostSessionPayload | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === HOST_SESSION_COOKIE_NAME) {
      return verifyHostSession(rest.join("="));
    }
  }

  return null;
}

export function writeHostSessionCookie(
  payload: HostSessionPayload,
): string {
  const token = signHostSession(payload);
  const maxAgeSeconds = Math.max(1, Math.ceil((payload.expiresAt - Date.now()) / 1000));

  return [
    `${HOST_SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}
