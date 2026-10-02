import { createHmac } from "node:crypto";

import { getDatabaseClient, type RsvpDatabaseClient } from "./db";
import type { LookupAttemptWindow } from "./types";

export const LOOKUP_WINDOW_MS = 60_000;
export const LOOKUP_MAX_FAILURES = 5;
export const LOOKUP_RETRY_MS = 30_000;

export function hashClientIdentifier(
  clientIdentifier: string,
  secret = process.env.RSVP_SESSION_SECRET ?? "development-rsvp-rate-limit-secret",
): string {
  return createHmac("sha256", secret)
    .update(clientIdentifier.trim())
    .digest("hex");
}

export function getRetryAfterMs(failedAttempts: number): number {
  return Math.min(LOOKUP_RETRY_MS, Math.max(1000, failedAttempts * 1000));
}

export async function evaluateLookupRateLimit(
  clientIdentifier: string,
  now = Date.now(),
  db: RsvpDatabaseClient | null = getDatabaseClient(),
): Promise<{ allowed: boolean; retryAfterMs: number; clientKeyHash: string }> {
  const clientKeyHash = hashClientIdentifier(clientIdentifier);

  if (!db) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The RSVP database is not configured for lookup throttling.");
    }
    return { allowed: true, retryAfterMs: 0, clientKeyHash };
  }

  const rows = (await db`INSERT INTO lookup_attempt_windows (
      client_key_hash, window_started_at, failed_attempt_count, blocked_until, expires_at
    ) VALUES (
      ${clientKeyHash}, NOW(), 0, NULL, NOW() + INTERVAL '30 minutes'
    )
    ON CONFLICT (client_key_hash) DO UPDATE SET
      window_started_at = CASE
        WHEN lookup_attempt_windows.window_started_at <= NOW() - INTERVAL '1 minute' THEN NOW()
        ELSE lookup_attempt_windows.window_started_at
      END,
      failed_attempt_count = CASE
        WHEN lookup_attempt_windows.window_started_at <= NOW() - INTERVAL '1 minute' THEN 0
        ELSE lookup_attempt_windows.failed_attempt_count
      END,
      blocked_until = CASE
        WHEN lookup_attempt_windows.window_started_at <= NOW() - INTERVAL '1 minute' THEN NULL
        WHEN lookup_attempt_windows.blocked_until > NOW() THEN lookup_attempt_windows.blocked_until
        WHEN lookup_attempt_windows.failed_attempt_count >= ${LOOKUP_MAX_FAILURES}
          THEN NOW() + INTERVAL '30 seconds'
        ELSE NULL
      END,
      expires_at = NOW() + INTERVAL '30 minutes'
    RETURNING client_key_hash AS "clientKeyHash",
      window_started_at AS "windowStartedAt",
      failed_attempt_count AS "failedAttemptCount",
      blocked_until AS "blockedUntil",
      expires_at AS "expiresAt";`) as LookupAttemptWindow[];

  const blockedUntil = rows[0]?.blockedUntil
    ? new Date(rows[0].blockedUntil).getTime()
    : null;
  const allowed = !existsBlockedWindow(blockedUntil, now);

  return {
    allowed,
    retryAfterMs: allowed ? 0 : Math.max(1000, blockedUntil! - now),
    clientKeyHash,
  };
}

export async function recordFailedLookupAttempt(
  clientIdentifier: string,
  db: RsvpDatabaseClient | null = getDatabaseClient(),
): Promise<number> {
  const clientKeyHash = hashClientIdentifier(clientIdentifier);
  if (!db) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The RSVP database is not configured for lookup throttling.");
    }
    return 0;
  }

  const rows = (await db`INSERT INTO lookup_attempt_windows (
      client_key_hash, window_started_at, failed_attempt_count, blocked_until, expires_at
    ) VALUES (
      ${clientKeyHash}, NOW(), 1, NULL, NOW() + INTERVAL '30 minutes'
    )
    ON CONFLICT (client_key_hash) DO UPDATE SET
      window_started_at = CASE
        WHEN lookup_attempt_windows.window_started_at <= NOW() - INTERVAL '1 minute' THEN NOW()
        ELSE lookup_attempt_windows.window_started_at
      END,
      failed_attempt_count = CASE
        WHEN lookup_attempt_windows.window_started_at <= NOW() - INTERVAL '1 minute' THEN 1
        ELSE lookup_attempt_windows.failed_attempt_count + 1
      END,
      blocked_until = CASE
        WHEN lookup_attempt_windows.window_started_at <= NOW() - INTERVAL '1 minute'
          THEN NULL
        WHEN lookup_attempt_windows.failed_attempt_count + 1 >= ${LOOKUP_MAX_FAILURES}
          THEN NOW() + INTERVAL '30 seconds'
        ELSE NULL
      END,
      expires_at = NOW() + INTERVAL '30 minutes'
    RETURNING failed_attempt_count AS "failedAttemptCount";`) as LookupAttemptWindow[];

  return Number(rows[0]?.failedAttemptCount ?? 0);
}

export async function resetLookupRateLimit(
  clientIdentifier: string,
  db: RsvpDatabaseClient | null = getDatabaseClient(),
): Promise<void> {
  const clientKeyHash = hashClientIdentifier(clientIdentifier);
  if (!db) {
    return;
  }

  await db`DELETE FROM lookup_attempt_windows WHERE client_key_hash = ${clientKeyHash};`;
}

function existsBlockedWindow(blockedUntilMs: number | null, now: number): boolean {
  return blockedUntilMs !== null && blockedUntilMs > now;
}
