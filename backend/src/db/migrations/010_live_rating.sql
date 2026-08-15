-- Live quiz rating is isolated from normal quiz score/leaderboard systems.
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS live_rating NUMERIC(10,2) NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_attempts_live_rating ON attempts(quiz_id, live_rating DESC) WHERE status <> 'in_progress';
