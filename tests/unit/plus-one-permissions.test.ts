import { describe, expect, it, vi } from "vitest";

import { submitHouseholdResponse } from "@/lib/rsvp/submission-service";
import type { Invitee, InvitationSessionPayload } from "@/lib/rsvp/types";
import { validateHouseholdSubmissionRequest } from "@/lib/rsvp/validation";

const attendanceResponses = { a1: "attending", a2: "undecided" };
const allowedInvitees = ["a1", "a2"];
const grantedInvitees = ["a1"];
const session: InvitationSessionPayload = {
  inviteeId: "a1",
  householdId: "h1",
  versionId: "v1",
  issuedAt: 1,
  expiresAt: 99_999_999_999_999,
};
const invitees: Invitee[] = [
  {
    id: "a1",
    householdId: "h1",
    versionId: "v1",
    firstName: "Alicia",
    lastName: "Anderson",
    normalizedFirstName: "alicia",
    normalizedLastName: "anderson",
    plusOneAllowed: true,
  },
  {
    id: "a2",
    householdId: "h1",
    versionId: "v1",
    firstName: "Brandon",
    lastName: "Anderson",
    normalizedFirstName: "brandon",
    normalizedLastName: "anderson",
    plusOneAllowed: false,
  },
];

function submission(plusOnes: unknown) {
  return {
    contactEmail: null,
    responses: attendanceResponses,
    plusOnes,
  };
}

describe("plus-one permissions", () => {
  it("accepts one granted guest with a blank name", () => {
    expect(
      validateHouseholdSubmissionRequest(
        submission([{ grantedToInviteeId: "a1", guestName: "", status: "attending" }]),
        allowedInvitees,
        grantedInvitees,
      ).plusOnes,
    ).toEqual([{ grantedToInviteeId: "a1", guestName: null, status: "attending" }]);
  });

  it("rejects a plus-one attached to an invitee without a grant", () => {
    expect(() =>
      validateHouseholdSubmissionRequest(
        submission([{ grantedToInviteeId: "a2", guestName: null, status: "attending" }]),
        allowedInvitees,
        grantedInvitees,
      ),
    ).toThrow(/not granted a plus-one/i);
  });

  it("rejects duplicate plus-one entries for the same grant", () => {
    expect(() =>
      validateHouseholdSubmissionRequest(
        submission([
          { grantedToInviteeId: "a1", guestName: null, status: "attending" },
          { grantedToInviteeId: "a1", guestName: "Second guest", status: "attending" },
        ]),
        allowedInvitees,
        grantedInvitees,
      ),
    ).toThrow(/one plus-one per invitee/i);
  });

  it("rejects a request exceeding the number of granted plus-one slots", () => {
    expect(() =>
      validateHouseholdSubmissionRequest(
        submission([
          { grantedToInviteeId: "a1", guestName: null, status: "attending" },
          { grantedToInviteeId: "a2", guestName: null, status: "attending" },
        ]),
        allowedInvitees,
        grantedInvitees,
      ),
    ).toThrow(/not granted a plus-one/i);
  });

  it("derives grants from the current household roster before saving", async () => {
    const saveHouseholdSubmission = vi.fn(async (input: {
      householdId: string;
      versionId: string;
      respondedByInviteeId: string;
      contactEmail: string | null;
      responses: Record<string, "attending" | "declining" | "undecided">;
      plusOnes: Array<{ grantedToInviteeId: string; guestName: string | null; status: "attending" | "declining" | "undecided" }>;
    }) => ({
      id: "submission-1",
      householdId: input.householdId,
      versionId: input.versionId,
      respondedByInviteeId: input.respondedByInviteeId,
      contactEmail: input.contactEmail,
      submittedAt: "2026-09-30T12:00:00.000Z",
      updatedAt: "2026-09-30T12:00:00.000Z",
      responses: input.responses,
      plusOnes: input.plusOnes,
    }));
    const repository = {
      findHouseholdInvitees: vi.fn(async () => invitees),
      saveHouseholdSubmission,
    };
    const validRequest = {
      contactEmail: null,
      responses: attendanceResponses,
      plusOnes: [{ grantedToInviteeId: "a1", guestName: null, status: "attending" }],
    };

    const result = await submitHouseholdResponse(session, validRequest, repository);

    expect(result.plusOnes).toEqual(validRequest.plusOnes);
    expect(saveHouseholdSubmission).toHaveBeenCalledWith(expect.objectContaining({ plusOnes: validRequest.plusOnes }));
    await expect(
      submitHouseholdResponse(session, {
        ...validRequest,
        plusOnes: [{ grantedToInviteeId: "a2", guestName: null, status: "attending" }],
      }, repository),
    ).rejects.toThrow(/not granted a plus-one/i);
    expect(saveHouseholdSubmission).toHaveBeenCalledTimes(1);
  });
});
