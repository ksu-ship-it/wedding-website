import { describe, expect, it } from "vitest";

import { parseGuestLookupRequest } from "@/lib/rsvp/validation";

describe("guest lookup validation", () => {
  it("accepts an omitted or blank last name", () => {
    expect(parseGuestLookupRequest({ firstName: " Steve ", lastName: " " })).toEqual({
      firstName: "Steve",
      lastName: "",
    });
    expect(parseGuestLookupRequest({ firstName: "Steve" })).toEqual({
      firstName: "Steve",
      lastName: "",
    });
  });
});