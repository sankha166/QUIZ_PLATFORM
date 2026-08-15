-- Live quiz-only scoring and isolation from normal quiz analytics.
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS live_rating NUMERIC(10,2) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_attempts_live_rating ON attempts(quiz_id, live_rating DESC) WHERE live_rating IS NOT NULL;
