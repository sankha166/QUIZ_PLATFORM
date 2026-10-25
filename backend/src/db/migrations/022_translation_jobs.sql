ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS translation_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS translation_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS translation_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS translation_error TEXT;

ALTER TABLE quizzes
  DROP CONSTRAINT IF EXISTS quizzes_translation_status_check;

ALTER TABLE quizzes
  ADD CONSTRAINT quizzes_translation_status_check
  CHECK (translation_status IN ('pending', 'processing', 'completed', 'failed'));
