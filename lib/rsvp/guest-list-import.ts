import { parse } from "csv-parse/sync";

import { normalizeGuestName } from "./validation";

const REQUIRED_COLUMNS = [
  "invitee_id",
  "household_id",
  "first_name",
  "last_name",
  "plus_one_allowed",
] as const;
const ALLOWED_COLUMNS = [...REQUIRED_COLUMNS, "household_label"];

export interface GuestListImportRow {
  inviteeId: string;
  householdId: string;
  firstName: string;
  lastName: string;
  plusOneAllowed: boolean;
  householdLabel: string | null;
}

export interface GuestListImportIssue {
  rowNumber: number;
  field: string;
  message: string;
}

export interface GuestListImportPreview {
  rowCount: number;
  rows: GuestListImportRow[];
  rowNumbers: number[];
  issues: GuestListImportIssue[];
}

interface CsvGuestRow {
  [key: string]: string | undefined;
  invitee_id?: string;
  household_id?: string;
  first_name?: string;
  last_name?: string;
  plus_one_allowed?: string;
  household_label?: string;
}

export function parseGuestListCsv(csv: string): GuestListImportPreview {
  if (!csv.trim()) {
    return {
      rowCount: 0,
      rows: [],
      rowNumbers: [],
      issues: [{ rowNumber: 1, field: "file", message: "The guest list file is empty." }],
    };
  }

  let records: CsvGuestRow[];
  try {
    records = parse(csv, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false,
    }) as CsvGuestRow[];
  } catch (error) {
    return {
      rowCount: 0,
      rows: [],
      rowNumbers: [],
      issues: [{
        rowNumber: Number((error as { lines?: number }).lines ?? 1),
        field: "file",
        message: "The CSV file is malformed.",
      }],
    };
  }

  if (records.length === 0) {
    return {
      rowCount: 0,
      rows: [],
      rowNumbers: [],
      issues: [{ rowNumber: 1, field: "file", message: "The guest list has no data rows." }],
    };
  }

  const columns = Object.keys(records[0]);
  const issues: GuestListImportIssue[] = [];
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missingColumns.length > 0) {
    issues.push({
      rowNumber: 1,
      field: "header",
      message: `Missing required columns: ${missingColumns.join(", ")}.`,
    });
  }

  for (const column of columns) {
    if (!ALLOWED_COLUMNS.includes(column)) {
      issues.push({ rowNumber: 1, field: column, message: `Unexpected column: ${column}.` });
    }
  }

  const rows: Array<{ rowNumber: number; value: GuestListImportRow }> = [];
  const rowIssues = new Map<number, GuestListImportIssue[]>();
  const idRows = new Map<string, number>();
  const nameRows = new Map<string, number>();
  const householdLabels = new Map<string, { label: string | null; rowNumber: number }>();

  function addIssue(issue: GuestListImportIssue) {
    issues.push(issue);
    rowIssues.set(issue.rowNumber, [...(rowIssues.get(issue.rowNumber) ?? []), issue]);
  }

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const inviteeId = record.invitee_id?.trim() ?? "";
    const householdId = record.household_id?.trim() ?? "";
    const firstName = record.first_name?.trim() ?? "";
    const lastName = record.last_name?.trim() ?? "";
    const booleanValue = record.plus_one_allowed?.trim().toLocaleLowerCase("en-US") ?? "";
    const householdLabel = record.household_label?.trim() || null;

    if (!inviteeId) addIssue({ rowNumber, field: "invitee_id", message: "Invitee ID is required." });
    if (!householdId) addIssue({ rowNumber, field: "household_id", message: "Household is required." });
    if (!firstName) addIssue({ rowNumber, field: "first_name", message: "First name is required." });
    if (!lastName) addIssue({ rowNumber, field: "last_name", message: "Last name is required." });
    if (firstName.length > 80) addIssue({ rowNumber, field: "first_name", message: "First name must be 80 characters or fewer." });
    if (lastName.length > 80) addIssue({ rowNumber, field: "last_name", message: "Last name must be 80 characters or fewer." });

    if (booleanValue !== "true" && booleanValue !== "false") {
      addIssue({ rowNumber, field: "plus_one_allowed", message: "Plus-one permission must be true or false." });
    }

    if (inviteeId) {
      const previousRow = idRows.get(inviteeId);
      if (previousRow) {
        addIssue({ rowNumber: previousRow, field: "invitee_id", message: "Invitee ID is duplicated in this file." });
        addIssue({ rowNumber, field: "invitee_id", message: "Invitee ID is duplicated in this file." });
      } else {
        idRows.set(inviteeId, rowNumber);
      }
    }

    if (firstName && lastName) {
      const normalizedName = `${normalizeGuestName(firstName)}\u0000${normalizeGuestName(lastName)}`;
      const previousRow = nameRows.get(normalizedName);
      if (previousRow) {
        addIssue({ rowNumber: previousRow, field: "first_name", message: "Full name is duplicated in this guest list." });
        addIssue({ rowNumber, field: "first_name", message: "Full name is duplicated in this guest list." });
      } else {
        nameRows.set(normalizedName, rowNumber);
      }
    }

    if (householdId) {
      const previousHousehold = householdLabels.get(householdId);
      if (previousHousehold && previousHousehold.label !== householdLabel) {
        addIssue({ rowNumber: previousHousehold.rowNumber, field: "household_label", message: "Household labels must be consistent." });
        addIssue({ rowNumber, field: "household_label", message: "Household labels must be consistent." });
      } else if (!previousHousehold) {
        householdLabels.set(householdId, { label: householdLabel, rowNumber });
      }
    }

    if (!rowIssues.has(rowNumber)) {
      rows.push({
        rowNumber,
        value: {
          inviteeId,
          householdId,
          firstName,
          lastName,
          plusOneAllowed: booleanValue === "true",
          householdLabel,
        },
      });
    }
  });

  const validEntries = rows.filter(({ rowNumber }) => !rowIssues.has(rowNumber));
  const validRows = validEntries.map(({ value }) => value);
  if (missingColumns.length > 0 || columns.some((column) => !ALLOWED_COLUMNS.includes(column))) {
    validRows.length = 0;
  }

  return {
    rowCount: records.length,
    rows: validRows,
    rowNumbers: missingColumns.length > 0 || columns.some((column) => !ALLOWED_COLUMNS.includes(column))
      ? []
      : validEntries.map(({ rowNumber }) => rowNumber),
    issues,
  };
}
