-- Store per-question time spent for assessment analytics and result review.
ALTER TABLE answers ADD COLUMN IF NOT EXISTS time_taken INTEGER NOT NULL DEFAULT 0 CHECK (time_taken >= 0);
