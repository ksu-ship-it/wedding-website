export interface GuestRosterEntry {
  id: string;
  householdId: string;
  versionId?: string;
  firstName: string;
  lastName: string;
  plusOneAllowed: boolean;
}

export type GuestMatchResult =
  | { status: "matched"; householdId: string; members: GuestRosterEntry[] }
  | { status: "ambiguous" }
  | { status: "not-found" };

export function normalizeGuestLookupName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function findGuestMatch(
  roster: GuestRosterEntry[],
  firstName: string,
  lastName: string,
): GuestMatchResult {
  const normalizedFirst = normalizeGuestLookupName(firstName);
  const normalizedLast = normalizeGuestLookupName(lastName);

  const exactMatches = roster.filter((member) => {
    return (
      normalizeGuestLookupName(member.firstName) === normalizedFirst &&
      normalizeGuestLookupName(member.lastName) === normalizedLast
    );
  });

  if (exactMatches.length === 0) {
    return { status: "not-found" };
  }

  if (exactMatches.length > 1) {
    return { status: "ambiguous" };
  }

  const householdId = exactMatches[0].householdId;
  const householdMembers = roster.filter((member) => member.householdId === householdId);

  return {
    status: "matched",
    householdId,
    members: householdMembers,
  };
}
