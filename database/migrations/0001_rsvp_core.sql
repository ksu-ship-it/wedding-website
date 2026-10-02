CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE guest_list_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  source_filename TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  row_count INTEGER NOT NULL CHECK (row_count >= 0),
  validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES guest_list_versions(id) ON DELETE CASCADE,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invitees (
  id TEXT PRIMARY KEY,
  version_id UUID NOT NULL REFERENCES guest_list_versions(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  normalized_first_name TEXT NOT NULL,
  normalized_last_name TEXT NOT NULL,
  plus_one_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (version_id, normalized_first_name, normalized_last_name)
);

CREATE TABLE invitation_sessions (
  token TEXT PRIMARY KEY,
  invitee_id TEXT NOT NULL REFERENCES invitees(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES guest_list_versions(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE lookup_attempt_windows (
  client_key_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  failed_attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempt_count >= 0),
  blocked_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes')
);

CREATE TABLE rsvp_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES guest_list_versions(id) ON DELETE CASCADE,
  responded_by_invitee_id TEXT NOT NULL REFERENCES invitees(id),
  contact_email TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, version_id)
);

CREATE TABLE attendance_responses (
  submission_id UUID NOT NULL REFERENCES rsvp_submissions(id) ON DELETE CASCADE,
  invitee_id TEXT NOT NULL REFERENCES invitees(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('attending', 'declining', 'undecided')),
  PRIMARY KEY (submission_id, invitee_id)
);

CREATE TABLE plus_one_responses (
  submission_id UUID NOT NULL REFERENCES rsvp_submissions(id) ON DELETE CASCADE,
  granted_to_invitee_id TEXT NOT NULL REFERENCES invitees(id) ON DELETE CASCADE,
  guest_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('attending', 'declining', 'undecided')),
  PRIMARY KEY (submission_id, granted_to_invitee_id)
);

CREATE INDEX idx_invitees_version_lookup
  ON invitees (version_id, normalized_first_name, normalized_last_name);

CREATE INDEX idx_households_version
  ON households (version_id);

CREATE INDEX idx_submission_version
  ON rsvp_submissions (version_id, household_id);
