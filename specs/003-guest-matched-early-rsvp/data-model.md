# Data Model: Guest-Matched Early RSVP

**Selected storage**: Neon-managed PostgreSQL Free. Neon hosts and operates the database; the couple does not self-host a database. The entities and invariants below are provider-independent. Keep usage within the current 0.5 GB storage, 100 CU-hour/project, and 5 GB egress limits to remain on the $0 plan.

## Entities

### Guest-List Version

A validated snapshot that is imported, previewed, and published as one unit.

- `id`: stable version identifier
- `status`: `draft`, `published`, or `archived`
- `source_filename`: original upload name for host reference
- `created_by`: authenticated host identity
- `created_at`, `published_at`: audit timestamps
- `row_count`, `validation_summary`: import review metadata

Only one version is current for guest lookup. Publishing a valid version atomically replaces the active version; it does not rewrite the attribution of prior submissions.

### Household / Party

A host-defined group shown together after one invitee matches.

- `id`: stable group identifier within a guest-list version
- `version_id`: guest-list version
- `label`: optional host-facing label; not shown to unmatched visitors

A household belongs to one roster version and contains one or more invitees.

### Invitee

A person included on the published invitation roster.

- `id`: stable host-supplied identifier
- `version_id`: guest-list version
- `household_id`: assigned party
- `first_name`, `last_name`: display names
- `normalized_first_name`, `normalized_last_name`: trimmed, case-folded lookup values
- `plus_one_allowed`: whether this invitee has one additional guest slot

Within a published version, the normalized first/last pair must be unique. The host resolves collisions before publication. Names are not returned in public page data.

### Invitation Session (transient)

Short-lived authorization established after a unique match.

- `invitee_id`, `household_id`, `version_id`: matched authorization scope
- `issued_at`, `expires_at`: bounded validity window
- `session_token`: opaque, signed or random value held only in an HTTP-only, secure-in-production, same-site cookie

The session is not an account and does not grant access to other households or host tools. A name match alone remains low-assurance.

### Lookup Attempt Window

A short-lived counter used to throttle repeated name-match attempts across serverless instances.

- `client_key_hash`: keyed hash of the normalized client network identifier; do not store raw IP addresses or attempted names
- `window_started_at`: start of the active attempt window
- `failed_attempt_count`: failed lookups in the window
- `blocked_until`: nullable retry time after the threshold is reached
- `expires_at`: cleanup time for old counter state

The lookup handler updates this record atomically before matching. Return the same generic no-match result for invalid and unknown names; return a retry response only when the request is throttled. The hash key uses a server-only secret and is not reversible without it.

### RSVP Submission

The latest complete submission for one household/party.

- `id`: submission identifier
- `household_id`, `version_id`: invitation and roster attribution
- `responded_by_invitee_id`: matched invitee
- `contact_email`: nullable; supplied by a guest for host follow-up
- `submitted_at`, `updated_at`: response audit timestamps

A household has one current submission for the active event. A resubmission updates the current response rather than creating multiple active answers. Host history can retain superseded versions if needed for audit.

### Attendance Response

One person's answer within a party submission.

- `submission_id`: containing party response
- `invitee_id`: one roster member
- `status`: `attending`, `declining`, or `undecided`

A submission has exactly one response per invitee in its household.

### Plus-One Response

An optional response for the single extra guest slot attached to a granted invitee.

- `submission_id`: containing party response
- `granted_to_invitee_id`: invitee who owns the allowance
- `guest_name`: nullable; label defaults to "Guest of [Name]"
- `status`: `attending`, `declining`, or `undecided`

At most one plus-one response may exist per granted invitee per submission. It is valid only when that invitee's `plus_one_allowed` is true. There is no plus-one entity or control for other invitees.

## Relationships

- Guest-List Version 1-to-many Households and Invitees.
- Household 1-to-many Invitees.
- Invitee 1-to-0/1 Plus-One grant.
- Household 1-to-0/1 current RSVP Submission per event.
- RSVP Submission 1-to-many Attendance Responses and 0-to-many Plus-One Responses.
- Invitation Session is scoped to exactly one matched invitee, household, and roster version.

## Validation and Integrity Rules

- Import rows require stable invitee ID, first name, last name, household ID, and a boolean plus-one permission.
- Every referenced household must exist in the same draft version; identifiers and normalized full names must not conflict.
- Import validation is preview-only until all rows pass; publishing a roster version is atomic.
- Matching requires both names and exact equality after trimming outer whitespace and case-folding. No partial, fuzzy, or suggested matches.
- One response per roster invitee is required for a complete submission; each status is from the enumerated set.
- All submitted invitee IDs must belong to the authorized household and current roster version.
- Plus-one data is accepted only for a granted invitee, with no more than one slot, and never changes the roster's plus-one permission.
- Email is nullable. When present, it must pass email format validation; it is not an identity key.
- Household response writes succeed or fail as one logical transaction. Confirmation is returned only after durable save.
- Guest endpoints cannot read or mutate roster records directly; host management requires host authorization.
- Repeated lookup attempts are limited without exposing whether any specific name exists.
