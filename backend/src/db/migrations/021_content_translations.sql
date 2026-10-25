-- Optional JSON translations keep English content as the canonical fallback.
-- Keys are language codes: en, hi, and bn.
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS title_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_translations JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_text_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS explanation_translations JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE options
  ADD COLUMN IF NOT EXISTS option_text_translations JSONB NOT NULL DEFAULT '{}'::jsonb;
