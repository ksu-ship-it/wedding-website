import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rsvp/rate-limit", () => ({
  evaluateLookupRateLimit: vi.fn(),
  recordFailedLookupAttempt: vi.fn(),
  resetLookupRateLimit: vi.fn(),
}));
vi.mock("@/lib/rsvp/repository", () => ({
  getHouseholdSubmission: vi.fn(),
  lookupGuestHousehold: vi.fn(),
}));

import { lookupGuestInvitation } from "@/lib/rsvp/guest-lookup";
import type { GuestMatchResult } from "@/lib/rsvp/matching";
import type { SavedHouseholdSubmission } from "@/lib/rsvp/repository";

function createDependencies(match: GuestMatchResult) {
  return {
    evaluateLookupRateLimit: vi.fn(async () => ({ allowed: true, retryAfterMs: 0 })),
    recordFailedLookupAttempt: vi.fn(async () => 1),
    resetLookupRateLimit: vi.fn(async () => undefined),
    lookupGuestHousehold: vi.fn(async () => match),
    getHouseholdSubmission: vi.fn(async () => null as SavedHouseholdSubmission | null),
  };
}

describe("guest invitation lookup", () => {
  it("does not reveal whether an unknown or ambiguous match was found", async () => {
    const unknown = createDependencies({ status: "not-found" });
    const ambiguous = createDependencies({ status: "ambiguous" });

    const unknownResult = await lookupGuestInvitation("Unknown", "Guest", "client-key", unknown);
    const ambiguousResult = await lookupGuestInvitation("Duplicate", "Guest", "client-key", ambiguous);

    expect(unknownResult).toEqual({ status: "not-found" });
    expect(ambiguousResult).toEqual(unknownResult);
    expect(unknown.recordFailedLookupAttempt).toHaveBeenCalledOnce();
    expect(ambiguous.recordFailedLookupAttempt).toHaveBeenCalledOnce();
  });

  it("stops before roster lookup when the durable limiter blocks the client", async () => {
    const dependencies = createDependencies({ status: "not-found" });
    dependencies.evaluateLookupRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterMs: 12_000,
    });

    const result = await lookupGuestInvitation("Alicia", "Anderson", "client-key", dependencies);

    expect(result).toEqual({ status: "rate-limited", retryAfterMs: 12_000 });
    expect(dependencies.lookupGuestHousehold).not.toHaveBeenCalled();
    expect(dependencies.recordFailedLookupAttempt).not.toHaveBeenCalled();
  });

  it("returns the unique household and current responses while resetting failed attempts", async () => {
    const matched: GuestMatchResult = {
      status: "matched",
      householdId: "h1",
      members: [
        {
          id: "a1",
          householdId: "h1",
          versionId: "v1",
          firstName: "Alicia",
          lastName: "Anderson",
          plusOneAllowed: true,
        },
      ],
    };
    const currentSubmission: SavedHouseholdSubmission = {
      id: "submission-1",
      householdId: "h1",
      versionId: "v1",
      respondedByInviteeId: "a1",
      contactEmail: null,
      submittedAt: "2026-09-30T12:00:00.000Z",
      updatedAt: "2026-09-30T12:00:00.000Z",
      responses: { a1: "attending" },
      plusOnes: [],
    };
    const dependencies = createDependencies(matched);
    dependencies.getHouseholdSubmission.mockResolvedValueOnce(currentSubmission);

    const result = await lookupGuestInvitation("Alicia", "Anderson", "client-key", dependencies);

    expect(result).toEqual({ status: "matched", match: matched, currentSubmission });
    expect(dependencies.getHouseholdSubmission).toHaveBeenCalledWith("h1", "v1");
    expect(dependencies.resetLookupRateLimit).toHaveBeenCalledOnce();
  });
});
