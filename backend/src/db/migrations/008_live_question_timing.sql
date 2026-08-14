-- Per-question timing used by live quizzes and normal result review.
ALTER TABLE questions ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS time_taken INTEGER NOT NULL DEFAULT 0;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS response_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
