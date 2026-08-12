-- Domain -> Category hierarchy
CREATE TABLE IF NOT EXISTS domains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO domains (name, description)
VALUES ('Engineering', 'Engineering, technology and computer-science related quizzes.')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS domain_id INTEGER;

UPDATE categories
SET domain_id = (SELECT id FROM domains WHERE name = 'Engineering')
WHERE domain_id IS NULL;

ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_domain_id_fkey;

ALTER TABLE categories
  ADD CONSTRAINT categories_domain_id_fkey
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE RESTRICT;

ALTER TABLE categories ALTER COLUMN domain_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_domain ON categories(domain_id);
CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name);
