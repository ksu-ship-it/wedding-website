import type {
  AttendanceStatus,
  HouseholdSubmissionRequest,
  Invitee,
  InvitationSessionPayload,
} from "./types";
import type { HouseholdSubmissionWrite, SavedHouseholdSubmission } from "./repository";
import { validateHouseholdSubmissionRequest } from "./validation";

export interface HouseholdSubmissionRepository {
  findHouseholdInvitees(householdId: string, versionId: string): Promise<Invitee[]>;
  saveHouseholdSubmission(input: HouseholdSubmissionWrite): Promise<SavedHouseholdSubmission>;
}

export class SubmissionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubmissionValidationError";
  }
}

export interface HouseholdSubmissionConfirmation {
  submissionId: string;
  submittedAt: string;
  updatedAt: string;
  songRequest: HouseholdSubmissionRequest["songRequest"];
  responses: Record<string, AttendanceStatus>;
  plusOnes: HouseholdSubmissionRequest["plusOnes"];
}

export async function submitHouseholdResponse(
  session: InvitationSessionPayload,
  input: unknown,
  repository: HouseholdSubmissionRepository,
): Promise<HouseholdSubmissionConfirmation> {
  const invitees = await repository.findHouseholdInvitees(
    session.householdId,
    session.versionId,
  );
  const inviteeIds = invitees.map((invitee) => invitee.id);
  const plusOneAllowedInviteeIds = invitees
    .filter((invitee) => invitee.plusOneAllowed)
    .map((invitee) => invitee.id);

  if (!inviteeIds.includes(session.inviteeId)) {
    throw new SubmissionValidationError("Invitation is not valid for this household.");
  }

  let submission: HouseholdSubmissionRequest;
  try {
    submission = validateHouseholdSubmissionRequest(
      input,
      inviteeIds,
      plusOneAllowedInviteeIds,
    );
  } catch (error) {
    throw new SubmissionValidationError(
      error instanceof Error ? error.message : "The household response is invalid.",
    );
  }

  const saved = await repository.saveHouseholdSubmission({
    householdId: session.householdId,
    versionId: session.versionId,
    respondedByInviteeId: session.inviteeId,
    contactEmail: submission.contactEmail,
    songRequest: submission.songRequest,
    responses: submission.responses,
    plusOnes: submission.plusOnes,
  });

  return {
    submissionId: saved.id,
    submittedAt: saved.submittedAt,
    updatedAt: saved.updatedAt,
    songRequest: saved.songRequest,
    responses: saved.responses,
    plusOnes: saved.plusOnes,
  };
}