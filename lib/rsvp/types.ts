export type AttendanceStatus = "attending" | "declining" | "undecided";
export type GuestListVersionStatus = "draft" | "published" | "archived";

export interface GuestListVersion {
  id: string;
  status: GuestListVersionStatus;
  sourceFilename: string;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
  rowCount: number;
  validationSummary: Record<string, unknown>;
}

export interface Household {
  id: string;
  versionId: string;
  label: string | null;
  createdAt?: string;
}

export interface Invitee {
  id: string;
  versionId: string;
  householdId: string;
  firstName: string;
  lastName: string;
  normalizedFirstName: string;
  normalizedLastName: string;
  plusOneAllowed: boolean;
}

export interface InvitationSessionPayload {
  inviteeId: string;
  householdId: string;
  versionId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface LookupAttemptWindow {
  clientKeyHash: string;
  windowStartedAt: string;
  failedAttemptCount: number;
  blockedUntil: string | null;
  expiresAt: string;
}

export interface RSVPSubmission {
  id: string;
  householdId: string;
  versionId: string;
  respondedByInviteeId: string;
  contactEmail: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface AttendanceResponse {
  submissionId: string;
  inviteeId: string;
  status: AttendanceStatus;
}

export interface PlusOneResponse {
  submissionId: string;
  grantedToInviteeId: string;
  guestName: string | null;
  status: AttendanceStatus;
}

export interface PlusOneSubmission {
  grantedToInviteeId: string;
  guestName: string | null;
  status: AttendanceStatus;
}

export interface GuestLookupRequest {
  firstName: string;
  lastName: string;
}

export interface HouseholdSubmissionRequest {
  contactEmail: string | null;
  responses: Record<string, AttendanceStatus>;
  plusOnes: PlusOneSubmission[];
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface CsvImportSummary {
  rowCount: number;
  validRows: number;
  invalidRows: number;
  warnings: number;
}
