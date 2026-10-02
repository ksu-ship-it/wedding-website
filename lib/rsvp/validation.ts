import type {
  AttendanceStatus,
  GuestLookupRequest,
  HouseholdSubmissionRequest,
} from "./types";

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "attending",
  "declining",
  "undecided",
];

export const MAX_NAME_LENGTH = 80;

export function normalizeGuestName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function isValidName(value: unknown, fieldName = "name"): string | null {
  if (typeof value !== "string") {
    return `${fieldName} must be a text value.`;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return `${fieldName} is required.`;
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return `${fieldName} must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  return null;
}

export function validateContactEmail(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Email must be a string or empty.");
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error("Email is not a valid address.");
  }

  return trimmed;
}

export function validateAttendanceStatus(value: unknown): AttendanceStatus {
  if (typeof value !== "string") {
    throw new Error("Attendance status must be a string.");
  }

  const normalized = value.trim().toLowerCase();
  if (!ATTENDANCE_STATUSES.includes(normalized as AttendanceStatus)) {
    throw new Error(`Unsupported attendance status: ${value}`);
  }

  return normalized as AttendanceStatus;
}

export function assertNoUnexpectedFields(
  record: Record<string, unknown>,
  allowedFields: string[],
): void {
  const unexpected = Object.keys(record).filter(
    (key) => !allowedFields.includes(key),
  );

  if (unexpected.length > 0) {
    throw new Error(`Unexpected fields in request: ${unexpected.join(", ")}`);
  }
}

export function parseGuestLookupRequest(input: unknown): GuestLookupRequest {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Guest lookup request must be an object.");
  }

  const record = input as Record<string, unknown>;
  assertNoUnexpectedFields(record, ["firstName", "lastName"]);

  const firstNameError = isValidName(record.firstName, "First name");
  if (firstNameError) {
    throw new Error(firstNameError);
  }

  const lastNameError = isValidName(record.lastName, "Last name");
  if (lastNameError) {
    throw new Error(lastNameError);
  }

  const firstName = String(record.firstName).trim();
  const lastName = String(record.lastName).trim();

  return {
    firstName,
    lastName,
  };
}

export function validateHouseholdSubmissionRequest(
  input: unknown,
  householdInviteeIds: readonly string[],
  plusOneAllowedInviteeIds: readonly string[] = [],
): HouseholdSubmissionRequest {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Household submission request must be an object.");
  }

  const record = input as Record<string, unknown>;
  assertNoUnexpectedFields(record, ["contactEmail", "responses", "plusOnes"]);

  const responses = record.responses;
  if (typeof responses !== "object" || responses === null || Array.isArray(responses)) {
    throw new Error("Submission responses must be an object keyed by invitee id.");
  }

  const normalizedResponses: Record<string, AttendanceStatus> = {};
  for (const [inviteeId, statusValue] of Object.entries(responses)) {
    if (!householdInviteeIds.includes(inviteeId)) {
      throw new Error(`Submitted person is not a household invitee: ${inviteeId}`);
    }

    normalizedResponses[inviteeId] = validateAttendanceStatus(statusValue);
  }

  if (
    Object.keys(normalizedResponses).length !== householdInviteeIds.length ||
    !householdInviteeIds.every((inviteeId) => inviteeId in normalizedResponses)
  ) {
    throw new Error("Every invited household member requires a response.");
  }

  const plusOnesValue = record.plusOnes ?? [];
  if (!Array.isArray(plusOnesValue)) {
    throw new Error("Plus-one responses must be a list.");
  }

  const seenPlusOneGrants = new Set<string>();
  const normalizedPlusOnes = plusOnesValue.map((value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error("Plus-one data must be an object.");
    }

    const plusOneRecord = value as Record<string, unknown>;
    assertNoUnexpectedFields(plusOneRecord, [
      "grantedToInviteeId",
      "guestName",
      "status",
    ]);

    const grantedToInviteeId = String(plusOneRecord.grantedToInviteeId ?? "");
    if (!householdInviteeIds.includes(grantedToInviteeId)) {
      throw new Error("Plus-one grant must reference a household invitee.");
    }
    if (!plusOneAllowedInviteeIds.includes(grantedToInviteeId)) {
      throw new Error("This invitee is not granted a plus-one.");
    }
    if (seenPlusOneGrants.has(grantedToInviteeId)) {
      throw new Error("Only one plus-one per invitee is allowed.");
    }
    seenPlusOneGrants.add(grantedToInviteeId);

    const guestName = plusOneRecord.guestName;
    if (guestName !== undefined && guestName !== null && typeof guestName !== "string") {
      throw new Error("Plus-one name must be text or empty.");
    }
    const normalizedGuestName = typeof guestName === "string" ? guestName.trim() || null : null;
    if (normalizedGuestName && normalizedGuestName.length > MAX_NAME_LENGTH) {
      throw new Error(`Plus-one name must be ${MAX_NAME_LENGTH} characters or fewer.`);
    }

    return {
      grantedToInviteeId,
      guestName: normalizedGuestName,
      status: validateAttendanceStatus(plusOneRecord.status),
    };
  });

  return {
    contactEmail: validateContactEmail(record.contactEmail),
    responses: normalizedResponses,
    plusOnes: normalizedPlusOnes,
  };
}
