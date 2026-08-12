-- Student domain preference
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_domain_id INTEGER;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_preferred_domain_id_fkey;

ALTER TABLE users
  ADD CONSTRAINT users_preferred_domain_id_fkey
  FOREIGN KEY (preferred_domain_id) REFERENCES domains(id) ON DELETE SET NULL;

-- Preserve the current Engineering experience for existing students.
UPDATE users
SET preferred_domain_id = (SELECT id FROM domains WHERE name = 'Engineering')
WHERE role = 'STUDENT' AND preferred_domain_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_preferred_domain ON users(preferred_domain_id);
