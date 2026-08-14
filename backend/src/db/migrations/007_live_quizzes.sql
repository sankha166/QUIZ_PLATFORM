-- Scheduled live quiz events and student registrations.
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS live_start_at TIMESTAMP;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS live_end_at TIMESTAMP;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_live_quiz BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_quizzes_live_window ON quizzes(is_live_quiz,live_start_at,live_end_at);
CREATE TABLE IF NOT EXISTS live_quiz_registrations (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(quiz_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_live_registrations_user ON live_quiz_registrations(user_id);
