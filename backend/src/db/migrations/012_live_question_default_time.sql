-- Optional single timer for all live-quiz questions.
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS live_same_question_time BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS live_question_time_seconds INTEGER NOT NULL DEFAULT 30;

-- Keep the configured default in the valid live-question range.
UPDATE quizzes
SET live_question_time_seconds = LEAST(600, GREATEST(5, COALESCE(live_question_time_seconds, 30)))
WHERE is_live_quiz = TRUE;
