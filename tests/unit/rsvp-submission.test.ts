import { describe, expect, it, vi } from "vitest";

import { submitHouseholdResponse } from "@/lib/rsvp/submission-service";
import type { AttendanceStatus, Invitee, InvitationSessionPayload } from "@/lib/rsvp/types";

const session: InvitationSessionPayload = {
  inviteeId: "a1",
  householdId: "h1",
  versionId: "v1",
  issuedAt: 1,
  expiresAt: 99_999_999_999_999,
};

const household: Invitee[] = [
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

const request = {
  contactEmail: null,
  songRequest: "Dreams by Fleetwood Mac",
  responses: { a1: "attending", a2: "undecided" },
  plusOnes: [],
};

function createRepository() {
  const saved = new Map<string, { id: string; responses: Record<string, AttendanceStatus> }>();

  return {
    findHouseholdInvitees: vi.fn(async () => household),
    saveHouseholdSubmission: vi.fn(async (input: {
      householdId: string;
      versionId: string;
      respondedByInviteeId: string;
      contactEmail: string | null;
      songRequest: string | null;
      responses: Record<string, AttendanceStatus>;
      plusOnes: { grantedToInviteeId: string; guestName: string | null; status: AttendanceStatus }[];
    }) => {
      const key = `${input.householdId}:${input.versionId}`;
      const previous = saved.get(key);
      const result = { id: previous?.id ?? "submission-1", responses: input.responses };
      saved.set(key, result);
      return {
        ...result,
        householdId: input.householdId,
        versionId: input.versionId,
        respondedByInviteeId: input.respondedByInviteeId,
        contactEmail: input.contactEmail,
        songRequest: input.songRequest,
        submittedAt: "2026-09-30T12:00:00.000Z",
        updatedAt: "2026-09-30T12:00:00.000Z",
        plusOnes: input.plusOnes,
      };
    }),
  };
}

describe("household RSVP submission", () => {
  it("validates and saves one complete response for every household member", async () => {
    const repository = createRepository();

    const result = await submitHouseholdResponse(session, request, repository);

    expect(repository.saveHouseholdSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId: "h1",
        versionId: "v1",
        respondedByInviteeId: "a1",
        responses: request.responses,
        songRequest: "Dreams by Fleetwood Mac",
      }),
    );
    expect(result.responses).toEqual(request.responses);
  });

  it("rejects a response containing someone outside the session household", async () => {
    const repository = createRepository();

    await expect(
      submitHouseholdResponse(session, {
        ...request,
        responses: { ...request.responses, stranger: "attending" },
      }, repository),
    ).rejects.toThrow(/household invitee/i);
    expect(repository.saveHouseholdSubmission).not.toHaveBeenCalled();
  });

  it("rejects incomplete household responses without saving partial answers", async () => {
    const repository = createRepository();

    await expect(
      submitHouseholdResponse(session, {
        ...request,
        responses: { a1: "attending" },
      }, repository),
    ).rejects.toThrow(/every invited household member requires a response/i);
    expect(repository.saveHouseholdSubmission).not.toHaveBeenCalled();
  });

  it("does not return confirmation when the atomic save fails", async () => {
    const repository = createRepository();
    repository.saveHouseholdSubmission.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(submitHouseholdResponse(session, request, repository)).rejects.toThrow(
      "database unavailable",
    );
  });

  it("resubmits changed answers against the same current household submission", async () => {
    const repository = createRepository();

    const first = await submitHouseholdResponse(session, request, repository);
    const second = await submitHouseholdResponse(session, {
      ...request,
      responses: { a1: "declining", a2: "attending" },
    }, repository);

    expect(second.submissionId).toBe(first.submissionId);
    expect(second.responses).toEqual({ a1: "declining", a2: "attending" });
    expect(repository.saveHouseholdSubmission).toHaveBeenCalledTimes(2);
  });
});
