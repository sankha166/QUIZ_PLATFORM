ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS live_all_domains BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_quizzes_live_all_domains ON quizzes(is_live_quiz,live_all_domains);