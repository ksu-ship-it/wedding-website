import { describe, expect, it } from "vitest";

import { validateHouseholdSubmissionRequest } from "@/lib/rsvp/validation";

const inviteeIds = ["a1", "a2"];
const request = {
  responses: { a1: "attending", a2: "undecided" },
  plusOnes: [],
};

describe("optional RSVP email", () => {
  it("accepts a blank email and normalizes it to null", () => {
    expect(validateHouseholdSubmissionRequest({ ...request, contactEmail: "" }, inviteeIds).contactEmail).toBeNull();
    expect(validateHouseholdSubmissionRequest(request, inviteeIds).contactEmail).toBeNull();
  });

  it("retains a valid address after trimming whitespace", () => {
    expect(
      validateHouseholdSubmissionRequest({ ...request, contactEmail: "  guest@example.com  " }, inviteeIds).contactEmail,
    ).toBe("guest@example.com");
  });

  it("rejects malformed addresses without changing attendance input", () => {
    expect(() =>
      validateHouseholdSubmissionRequest({ ...request, contactEmail: "not-an-email" }, inviteeIds),
    ).toThrow(/email is not a valid address/i);
    expect(request.responses).toEqual({ a1: "attending", a2: "undecided" });
  });
});
