import { findGuestMatch, type GuestRosterEntry } from "./matching";
import { getDatabaseClient, requireDatabaseClient } from "./db";
import type {
  AttendanceStatus,
  Invitee,
  PlusOneSubmission,
  RSVPSubmission,
} from "./types";
import { normalizeGuestName } from "./validation";
import type { GuestListImportPreview } from "./guest-list-import";

export interface HouseholdSubmissionWrite {
  householdId: string;
  versionId: string;
  respondedByInviteeId: string;
  contactEmail: string | null;
  responses: Record<string, AttendanceStatus>;
  plusOnes: PlusOneSubmission[];
}

export interface SavedHouseholdSubmission extends RSVPSubmission {
  responses: Record<string, AttendanceStatus>;
  plusOnes: PlusOneSubmission[];
}

export interface HostRsvpResponseRow {
  household: string;
  invitee: string;
  attendance: AttendanceStatus | null;
  plusOneName: string | null;
  plusOneAttendance: AttendanceStatus | null;
  contactEmail: string | null;
  versionId: string;
  submittedAt: string | null;
}

const demoSubmissions = new Map<string, SavedHouseholdSubmission>();

export const demoGuestRoster: GuestRosterEntry[] = [
  { id: "a1", householdId: "h1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: true },
  { id: "a2", householdId: "h1", firstName: "Brandon", lastName: "Anderson", plusOneAllowed: false },
  { id: "c1", householdId: "h2", firstName: "Carlos", lastName: "Nguyen", plusOneAllowed: false },
  { id: "c2", householdId: "h2", firstName: "Leah", lastName: "Nguyen", plusOneAllowed: true },
  { id: "d1", householdId: "h3", firstName: "Diana", lastName: "Patel", plusOneAllowed: true },
  { id: "d2", householdId: "h3", firstName: "Marcus", lastName: "Patel", plusOneAllowed: false },
];

export function getGuestRoster(): GuestRosterEntry[] {
  return demoGuestRoster;
}

export async function lookupGuestHousehold(firstName: string, lastName: string) {
  const sql = getDatabaseClient();

  if (!sql) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The RSVP database is not configured.");
    }

    return findGuestMatch(getGuestRoster(), firstName, lastName);
  }

  const roster = await sql`
    WITH active_version AS (
      SELECT id
      FROM guest_list_versions
      WHERE status = 'published'
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT 1
    )
    SELECT
      invitee.id,
      invitee.household_id AS "householdId",
      invitee.version_id AS "versionId",
      invitee.first_name AS "firstName",
      invitee.last_name AS "lastName",
      invitee.plus_one_allowed AS "plusOneAllowed"
    FROM invitees AS invitee
    INNER JOIN active_version AS version ON version.id = invitee.version_id
    ORDER BY invitee.first_name, invitee.last_name
  `;

  return findGuestMatch(roster as unknown as GuestRosterEntry[], firstName, lastName);
}

export async function findHouseholdInvitees(
  householdId: string,
  versionId: string,
): Promise<Invitee[]> {
  const sql = getDatabaseClient();

  if (!sql) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The RSVP database is not configured.");
    }

    return demoGuestRoster
      .filter((guest) => guest.householdId === householdId)
      .map((guest) => ({
        id: guest.id,
        householdId,
        versionId,
        firstName: guest.firstName,
        lastName: guest.lastName,
        normalizedFirstName: guest.firstName.trim().toLocaleLowerCase("en-US"),
        normalizedLastName: guest.lastName.trim().toLocaleLowerCase("en-US"),
        plusOneAllowed: guest.plusOneAllowed,
      }));
  }

  const rows = await sql`
    SELECT
      invitee.id,
      invitee.household_id AS "householdId",
      invitee.version_id AS "versionId",
      invitee.first_name AS "firstName",
      invitee.last_name AS "lastName",
      invitee.normalized_first_name AS "normalizedFirstName",
      invitee.normalized_last_name AS "normalizedLastName",
      invitee.plus_one_allowed AS "plusOneAllowed"
    FROM invitees AS invitee
    INNER JOIN guest_list_versions AS version
      ON version.id = invitee.version_id
    WHERE invitee.household_id = ${householdId}
      AND invitee.version_id = ${versionId}
      AND version.status = 'published'
      AND version.id = (
        SELECT id
        FROM guest_list_versions
        WHERE status = 'published'
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT 1
      )
    ORDER BY invitee.first_name, invitee.last_name
  `;

  return rows as unknown as Invitee[];
}

export async function getHouseholdSubmission(
  householdId: string,
  versionId: string,
): Promise<SavedHouseholdSubmission | null> {
  const sql = getDatabaseClient();

  if (!sql) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The RSVP database is not configured.");
    }

    return demoSubmissions.get(`${householdId}:${versionId}`) ?? null;
  }

  const rows = await sql`
    SELECT
      submission.id,
      submission.household_id AS "householdId",
      submission.version_id AS "versionId",
      submission.responded_by_invitee_id AS "respondedByInviteeId",
      submission.contact_email AS "contactEmail",
      submission.submitted_at AS "submittedAt",
      submission.updated_at AS "updatedAt",
      COALESCE(
        jsonb_object_agg(attendance.invitee_id, attendance.status)
          FILTER (WHERE attendance.invitee_id IS NOT NULL),
        '{}'::jsonb
      ) AS responses,
      COALESCE(
        (
          SELECT jsonb_agg(jsonb_build_object(
            'grantedToInviteeId', guest.granted_to_invitee_id,
            'guestName', guest.guest_name,
            'status', guest.status
          ))
          FROM plus_one_responses AS guest
          WHERE guest.submission_id = submission.id
        ),
        '[]'::jsonb
      ) AS "plusOnes"
    FROM rsvp_submissions AS submission
    LEFT JOIN attendance_responses AS attendance
      ON attendance.submission_id = submission.id
    WHERE submission.household_id = ${householdId}
      AND submission.version_id = ${versionId}
    GROUP BY submission.id
  `;

  return (rows[0] as unknown as SavedHouseholdSubmission | undefined) ?? null;
}

export async function saveHouseholdSubmission(
  input: HouseholdSubmissionWrite,
): Promise<SavedHouseholdSubmission> {
  const sql = getDatabaseClient();

  if (!sql) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The RSVP database is not configured.");
    }

    const key = `${input.householdId}:${input.versionId}`;
    const previous = demoSubmissions.get(key);
    const timestamp = new Date().toISOString();
    const saved: SavedHouseholdSubmission = {
      id: previous?.id ?? `demo-${input.householdId}-${input.versionId}`,
      householdId: input.householdId,
      versionId: input.versionId,
      respondedByInviteeId: input.respondedByInviteeId,
      contactEmail: input.contactEmail,
      submittedAt: previous?.submittedAt ?? timestamp,
      updatedAt: timestamp,
      responses: input.responses,
      plusOnes: input.plusOnes,
    };
    demoSubmissions.set(key, saved);
    return saved;
  }

  const database = requireDatabaseClient();
  const responseRows = JSON.stringify(
    Object.entries(input.responses).map(([inviteeId, status]) => ({ inviteeId, status })),
  );
  const plusOneRows = JSON.stringify(input.plusOnes);
  const rows = await database`
    WITH household_invitees AS (
      SELECT invitee.id
      FROM invitees AS invitee
      INNER JOIN guest_list_versions AS version
        ON version.id = invitee.version_id
      WHERE invitee.household_id = ${input.householdId}
        AND invitee.version_id = ${input.versionId}
        AND version.status = 'published'
        AND version.id = (
          SELECT id
          FROM guest_list_versions
          WHERE status = 'published'
          ORDER BY published_at DESC NULLS LAST, created_at DESC
          LIMIT 1
        )
    ),
    submitted_responses AS (
      SELECT response."inviteeId" AS invitee_id, response.status
      FROM jsonb_to_recordset(${responseRows}::jsonb)
        AS response("inviteeId" text, status text)
    ),
    submitted_plus_ones AS (
      SELECT
        guest."grantedToInviteeId" AS granted_to_invitee_id,
        guest."guestName" AS guest_name,
        guest.status
      FROM jsonb_to_recordset(${plusOneRows}::jsonb)
        AS guest("grantedToInviteeId" text, "guestName" text, status text)
    ),
    complete_party AS (
      SELECT 1
      WHERE EXISTS (
        SELECT 1 FROM household_invitees WHERE id = ${input.respondedByInviteeId}
      )
        AND (SELECT COUNT(*) FROM household_invitees)
          = (SELECT COUNT(*) FROM submitted_responses)
        AND NOT EXISTS (
          SELECT id FROM household_invitees
          EXCEPT
          SELECT invitee_id FROM submitted_responses
        )
        AND NOT EXISTS (
          SELECT invitee_id FROM submitted_responses
          EXCEPT
          SELECT id FROM household_invitees
        )
        AND NOT EXISTS (
          SELECT 1 FROM submitted_responses
          WHERE status NOT IN ('attending', 'declining', 'undecided')
        )
        AND NOT EXISTS (
          SELECT 1
          FROM submitted_plus_ones AS guest
          LEFT JOIN invitees AS granted
            ON granted.id = guest.granted_to_invitee_id
          WHERE granted.id IS NULL
            OR granted.household_id <> ${input.householdId}
            OR granted.version_id <> ${input.versionId}
            OR granted.plus_one_allowed = FALSE
            OR guest.status NOT IN ('attending', 'declining', 'undecided')
        )
        AND (SELECT COUNT(*) FROM submitted_plus_ones)
          = (SELECT COUNT(DISTINCT granted_to_invitee_id) FROM submitted_plus_ones)
    ),
    saved_submission AS (
      INSERT INTO rsvp_submissions (
        household_id,
        version_id,
        responded_by_invitee_id,
        contact_email
      )
      SELECT
        ${input.householdId},
        ${input.versionId},
        ${input.respondedByInviteeId},
        ${input.contactEmail}
      FROM complete_party
      ON CONFLICT (household_id, version_id) DO UPDATE SET
        responded_by_invitee_id = EXCLUDED.responded_by_invitee_id,
        contact_email = EXCLUDED.contact_email,
        updated_at = NOW()
      RETURNING id, household_id, version_id, responded_by_invitee_id,
        contact_email, submitted_at, updated_at
    ),
    saved_attendance AS (
      INSERT INTO attendance_responses (submission_id, invitee_id, status)
      SELECT saved_submission.id, submitted_responses.invitee_id, submitted_responses.status
      FROM saved_submission
      CROSS JOIN submitted_responses
      ON CONFLICT (submission_id, invitee_id) DO UPDATE SET status = EXCLUDED.status
      RETURNING invitee_id, status
    ),
    removed_plus_ones AS (
      DELETE FROM plus_one_responses AS existing
      USING saved_submission
      WHERE existing.submission_id = saved_submission.id
        AND NOT EXISTS (
          SELECT 1
          FROM submitted_plus_ones AS submitted
          WHERE submitted.granted_to_invitee_id = existing.granted_to_invitee_id
        )
      RETURNING existing.granted_to_invitee_id
    ),
    saved_plus_ones AS (
      INSERT INTO plus_one_responses (
        submission_id,
        granted_to_invitee_id,
        guest_name,
        status
      )
      SELECT
        saved_submission.id,
        submitted_plus_ones.granted_to_invitee_id,
        submitted_plus_ones.guest_name,
        submitted_plus_ones.status
      FROM saved_submission
      CROSS JOIN submitted_plus_ones
      CROSS JOIN (SELECT COUNT(*) FROM removed_plus_ones) AS cleanup
      ON CONFLICT (submission_id, granted_to_invitee_id) DO UPDATE SET
        guest_name = EXCLUDED.guest_name,
        status = EXCLUDED.status
      RETURNING granted_to_invitee_id AS "grantedToInviteeId",
        guest_name AS "guestName", status
    )
    SELECT
      saved_submission.id,
      saved_submission.household_id AS "householdId",
      saved_submission.version_id AS "versionId",
      saved_submission.responded_by_invitee_id AS "respondedByInviteeId",
      saved_submission.contact_email AS "contactEmail",
      saved_submission.submitted_at AS "submittedAt",
      saved_submission.updated_at AS "updatedAt",
      (SELECT jsonb_object_agg(invitee_id, status) FROM saved_attendance) AS responses,
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'grantedToInviteeId', "grantedToInviteeId",
          'guestName', "guestName",
          'status', status
        )) FROM saved_plus_ones),
        '[]'::jsonb
      ) AS "plusOnes"
    FROM saved_submission
  `;

  if (!rows[0]) {
    throw new Error("The household response could not be saved.");
  }

  return rows[0] as unknown as SavedHouseholdSubmission;
}

export async function createDraftGuestList(
  preview: GuestListImportPreview,
  sourceFilename: string,
  createdBy = "host",
): Promise<{ versionId: string; rowCount: number; validRows: number }> {
  const database = requireDatabaseClient();
  const rosterRows = JSON.stringify(preview.rows.map((row) => ({
    inviteeId: row.inviteeId,
    householdId: row.householdId,
    firstName: row.firstName,
    lastName: row.lastName,
    normalizedFirstName: normalizeGuestName(row.firstName),
    normalizedLastName: normalizeGuestName(row.lastName),
    plusOneAllowed: row.plusOneAllowed,
    householdLabel: row.householdLabel,
  })));
  const validationSummary = JSON.stringify({
    issues: preview.issues,
    validRows: preview.rows.length,
    invalidRows: preview.rowCount - preview.rows.length,
  });

  const rows = await database`
    WITH draft_version AS (
      INSERT INTO guest_list_versions (
        status, source_filename, created_by, row_count, validation_summary
      ) VALUES (
        'draft', ${sourceFilename.slice(0, 255)}, ${createdBy}, ${preview.rowCount}, ${validationSummary}::jsonb
      )
      RETURNING id
    ),
    household_source AS (
      SELECT DISTINCT source_row."householdId", source_row."householdLabel"
      FROM jsonb_to_recordset(${rosterRows}::jsonb) AS source_row(
        "inviteeId" text,
        "householdId" text,
        "firstName" text,
        "lastName" text,
        "normalizedFirstName" text,
        "normalizedLastName" text,
        "plusOneAllowed" boolean,
        "householdLabel" text
      )
    ),
    inserted_households AS (
      INSERT INTO households (version_id, external_id, label)
      SELECT
        draft_version.id,
        household_source."householdId",
        COALESCE(NULLIF(household_source."householdLabel", ''), household_source."householdId")
      FROM draft_version
      CROSS JOIN household_source
      RETURNING id, version_id, external_id
    ),
    inserted_invitees AS (
      INSERT INTO invitees (
        id,
        version_id,
        household_id,
        first_name,
        last_name,
        normalized_first_name,
        normalized_last_name,
        plus_one_allowed
      )
      SELECT
        draft_version.id::text || ':' || source_row."inviteeId",
        draft_version.id,
        inserted_households.id,
        source_row."firstName",
        source_row."lastName",
        source_row."normalizedFirstName",
        source_row."normalizedLastName",
        source_row."plusOneAllowed"
      FROM draft_version
      CROSS JOIN jsonb_to_recordset(${rosterRows}::jsonb) AS source_row(
        "inviteeId" text,
        "householdId" text,
        "firstName" text,
        "lastName" text,
        "normalizedFirstName" text,
        "normalizedLastName" text,
        "plusOneAllowed" boolean,
        "householdLabel" text
      )
      INNER JOIN inserted_households
        ON inserted_households.version_id = draft_version.id
        AND inserted_households.external_id = source_row."householdId"
      RETURNING id
    )
    SELECT
      draft_version.id AS "versionId",
      ${preview.rowCount}::integer AS "rowCount",
      (SELECT COUNT(*)::integer FROM inserted_invitees) AS "validRows"
    FROM draft_version
  `;

  if (!rows[0]) throw new Error("The guest-list draft could not be created.");
  return rows[0] as { versionId: string; rowCount: number; validRows: number };
}

export async function publishGuestList(versionId: string): Promise<boolean> {
  const database = requireDatabaseClient();
  const rows = await database`
    WITH candidate AS (
      SELECT id
      FROM guest_list_versions
      WHERE id = ${versionId}
        AND status = 'draft'
        AND COALESCE(jsonb_array_length(validation_summary->'issues'), 0) = 0
    ),
    updated_versions AS (
      UPDATE guest_list_versions AS version
      SET status = CASE
            WHEN version.id = candidate.id THEN 'published'
            ELSE 'archived'
          END,
          published_at = CASE
            WHEN version.id = candidate.id THEN NOW()
            ELSE version.published_at
          END
      FROM candidate
      WHERE version.status = 'published' OR version.id = candidate.id
      RETURNING version.id, version.status
    )
    SELECT id
    FROM updated_versions
    WHERE status = 'published'
      AND id = ${versionId}
  `;

  return rows.length === 1;
}

export async function getHostRsvpResponses(): Promise<HostRsvpResponseRow[]> {
  const database = requireDatabaseClient();
  const rows = await database`
    SELECT
      COALESCE(household.label, household.external_id) AS household,
      invitee.first_name || ' ' || invitee.last_name AS invitee,
      attendance.status AS attendance,
      plus_one.guest_name AS "plusOneName",
      plus_one.status AS "plusOneAttendance",
      submission.contact_email AS "contactEmail",
      version.id AS "versionId",
      submission.updated_at AS "submittedAt"
    FROM invitees AS invitee
    INNER JOIN households AS household
      ON household.id = invitee.household_id
      AND household.version_id = invitee.version_id
    INNER JOIN guest_list_versions AS version
      ON version.id = invitee.version_id
    LEFT JOIN rsvp_submissions AS submission
      ON submission.household_id = household.id
      AND submission.version_id = version.id
    LEFT JOIN attendance_responses AS attendance
      ON attendance.submission_id = submission.id
      AND attendance.invitee_id = invitee.id
    LEFT JOIN plus_one_responses AS plus_one
      ON plus_one.submission_id = submission.id
      AND plus_one.granted_to_invitee_id = invitee.id
    ORDER BY version.created_at DESC, household.label, invitee.first_name, invitee.last_name
  `;

  return rows as unknown as HostRsvpResponseRow[];
}
