import { evaluateLookupRateLimit, recordFailedLookupAttempt, resetLookupRateLimit } from "./rate-limit";
import {
  getHouseholdSubmission,
  lookupGuestHousehold,
  type SavedHouseholdSubmission,
} from "./repository";
import type { GuestMatchResult } from "./matching";

export interface GuestLookupDependencies {
  evaluateLookupRateLimit: (clientIdentifier: string) => Promise<{
    allowed: boolean;
    retryAfterMs: number;
  }>;
  recordFailedLookupAttempt: (clientIdentifier: string) => Promise<number>;
  resetLookupRateLimit: (clientIdentifier: string) => Promise<void>;
  lookupGuestHousehold: (firstName: string, lastName: string) => Promise<GuestMatchResult>;
  getHouseholdSubmission: (
    householdId: string,
    versionId: string,
  ) => Promise<SavedHouseholdSubmission | null>;
}

export type GuestLookupResult =
  | { status: "matched"; match: Extract<GuestMatchResult, { status: "matched" }>; currentSubmission: SavedHouseholdSubmission | null }
  | { status: "not-found" }
  | { status: "rate-limited"; retryAfterMs: number };

const defaultDependencies: GuestLookupDependencies = {
  evaluateLookupRateLimit,
  recordFailedLookupAttempt,
  resetLookupRateLimit,
  lookupGuestHousehold,
  getHouseholdSubmission,
};

export async function lookupGuestInvitation(
  firstName: string,
  lastName: string,
  clientIdentifier: string,
  dependencies: GuestLookupDependencies = defaultDependencies,
): Promise<GuestLookupResult> {
  const limit = await dependencies.evaluateLookupRateLimit(clientIdentifier);
  if (!limit.allowed) {
    return { status: "rate-limited", retryAfterMs: limit.retryAfterMs };
  }

  const match = await dependencies.lookupGuestHousehold(firstName, lastName);
  if (match.status !== "matched") {
    await dependencies.recordFailedLookupAttempt(clientIdentifier);
    return { status: "not-found" };
  }

  await dependencies.resetLookupRateLimit(clientIdentifier);
  const versionId = match.members[0]?.versionId ?? "v1";
  const currentSubmission = await dependencies.getHouseholdSubmission(
    match.householdId,
    versionId,
  );

  return { status: "matched", match, currentSubmission };
}
