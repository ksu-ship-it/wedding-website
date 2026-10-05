import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseGuestListCsv } from "@/lib/rsvp/guest-list-import";

const header = "invitee_id,household_id,first_name,last_name,plus_one_allowed,household_label";

 describe("guest-list CSV import", () => {
  it("parses UTF-8 names, groups, and boolean plus-one grants", () => {
    const preview = parseGuestListCsv(
      `${header}\n` +
      "guest-1,party-1,Zoë,O'Neil,true,The O'Neil party\n" +
      "guest-2,party-1,Alex,O'Neil,false,The O'Neil party",
    );

    expect(preview.rowCount).toBe(2);
    expect(preview.rows).toEqual([
      {
        inviteeId: "guest-1",
        householdId: "party-1",
        firstName: "Zoë",
        lastName: "O'Neil",
        plusOneAllowed: true,
        householdLabel: "The O'Neil party",
      },
      {
        inviteeId: "guest-2",
        householdId: "party-1",
        firstName: "Alex",
        lastName: "O'Neil",
        plusOneAllowed: false,
        householdLabel: "The O'Neil party",
      },
    ]);
    expect(preview.issues).toEqual([]);
  });

  it("accepts blank surnames and detects duplicate full names including blank surnames", () => {
    const preview = parseGuestListCsv(
      `${header}\n` +
      "guest-1,party-1,Steve,,false,Steve household\n" +
      "guest-2,party-1,Christina,Lorper,true,Steve household",
    );

    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0].lastName).toBe("");
    expect(preview.issues).toEqual([]);

    const duplicate = parseGuestListCsv(
      `${header}\n` +
      "guest-1,party-1,Steve,,false,First household\n" +
      "guest-2,party-2,steve,,false,Second household",
    );
    expect(duplicate.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "first_name", message: "Full name is duplicated in this guest list." }),
    ]));
  });

  it("accepts the complete production guest-list CSV", () => {
    const csv = readFileSync(resolve(process.cwd(), "tests/fixtures/rsvp-guests-prod.csv"), "utf8");
    const preview = parseGuestListCsv(csv);

    expect(preview.issues).toEqual([]);
    expect(preview.rows).toHaveLength(111);
    expect(preview.rows.find((row) => row.inviteeId === "ashley-michael-su")?.lastName).toBe("Chin");
    expect(preview.rows.find((row) => row.inviteeId === "lawrence-stephanie-su")?.lastName).toBe("Chang");
  });

  it("reports empty, malformed, and missing-column files", () => {
    expect(parseGuestListCsv("").issues[0]).toMatchObject({ rowNumber: 1 });
    expect(parseGuestListCsv(`${header}\n\"broken`).issues[0]).toMatchObject({ rowNumber: 2 });
    expect(parseGuestListCsv("invitee_id,first_name\ng1,Ada").issues[0].message).toMatch(/missing required columns/i);
  });

  it("reports duplicate IDs and normalized names, missing households, and invalid booleans by row", () => {
    const preview = parseGuestListCsv(
      `${header}\n` +
      "guest-1,party-1,Ada,Love,true,Love party\n" +
      "guest-1,party-1,Grace,Love,false,Love party\n" +
      "guest-3,party-2,ada,love,true,Other party\n" +
      "guest-4,,Eve,Park,no,",
    );

    expect(preview.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ rowNumber: 3, field: "invitee_id" }),
      expect.objectContaining({ rowNumber: 4, field: "first_name" }),
      expect.objectContaining({ rowNumber: 5, field: "household_id" }),
      expect.objectContaining({ rowNumber: 5, field: "plus_one_allowed" }),
    ]));
    expect(preview.rows).toEqual([]);
  });

  it("flags conflicting labels for one household", () => {
    const preview = parseGuestListCsv(
      `${header}\n` +
      "guest-1,party-1,Ada,Love,true,First label\n" +
      "guest-2,party-1,Grace,Love,false,Second label",
    );

    expect(preview.issues).toContainEqual(expect.objectContaining({ rowNumber: 3, field: "household_label" }));
  });
});
