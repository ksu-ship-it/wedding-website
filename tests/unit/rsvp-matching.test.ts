import { describe, expect, it } from "vitest";

import {
  findGuestMatch,
  normalizeGuestLookupName,
  type GuestRosterEntry,
} from "@/lib/rsvp/matching";

describe("rsvp matching", () => {
  it("normalizes case and outer whitespace without altering accents or punctuation", () => {
    expect(normalizeGuestLookupName("  José  ")).toBe("josé");
    expect(normalizeGuestLookupName("   MARY-ANN   ")).toBe("mary-ann");
  });

  it("returns the matched household for an exact match", () => {
    const roster: GuestRosterEntry[] = [
      { id: "a1", householdId: "h1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: true },
      { id: "a2", householdId: "h1", firstName: "Brandon", lastName: "Anderson", plusOneAllowed: false },
      { id: "b1", householdId: "h2", firstName: "Carlos", lastName: "Nguyen", plusOneAllowed: false },
    ];

    expect(findGuestMatch(roster, "Alicia", "Anderson")).toMatchObject({
      householdId: "h1",
      members: expect.arrayContaining([
        expect.objectContaining({ id: "a1" }),
        expect.objectContaining({ id: "a2" }),
      ]),
    });
  });

  it("rejects an ambiguous duplicate normalized name", () => {
    const roster: GuestRosterEntry[] = [
      { id: "a1", householdId: "h1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: true },
      { id: "b1", householdId: "h2", firstName: "alicia", lastName: "anderson", plusOneAllowed: true },
    ];

    expect(findGuestMatch(roster, " Alicia ", "anderson")).toEqual({
      status: "ambiguous",
    });
  });

  it("returns not found when no exact match exists", () => {
    const roster: GuestRosterEntry[] = [
      { id: "a1", householdId: "h1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: true },
    ];

    expect(findGuestMatch(roster, "Noah", "Smith")).toEqual({
      status: "not-found",
    });
  });

  it("matches a guest whose roster entry has no last name", () => {
    const roster: GuestRosterEntry[] = [
      { id: "steve", householdId: "h1", firstName: "Steve", lastName: "", plusOneAllowed: false },
    ];

    expect(findGuestMatch(roster, "Steve", "")).toMatchObject({
      status: "matched",
      householdId: "h1",
    });
  });
});
