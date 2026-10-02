ALTER TABLE households
  ADD COLUMN external_id TEXT;

UPDATE households
SET external_id = id::text
WHERE external_id IS NULL;

ALTER TABLE households
  ALTER COLUMN external_id SET NOT NULL;

CREATE UNIQUE INDEX idx_households_version_external_id
  ON households (version_id, external_id);