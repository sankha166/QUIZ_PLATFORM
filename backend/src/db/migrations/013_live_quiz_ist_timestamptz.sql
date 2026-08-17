-- Live quiz scheduling is an absolute instant. Existing values in the old
-- TIMESTAMP column were entered as IST wall-clock values, so convert them to
-- TIMESTAMPTZ exactly once. The guard makes this migration safe if the local
-- migration command is run more than once.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'quizzes'
      AND column_name = 'live_start_at'
      AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE quizzes
      ALTER COLUMN live_start_at TYPE TIMESTAMPTZ
      USING (live_start_at AT TIME ZONE 'Asia/Kolkata');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'quizzes'
      AND column_name = 'live_end_at'
      AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE quizzes
      ALTER COLUMN live_end_at TYPE TIMESTAMPTZ
      USING (live_end_at AT TIME ZONE 'Asia/Kolkata');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quizzes_live_start_at_tz
  ON quizzes(is_live_quiz, live_start_at);
