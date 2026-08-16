-- Live quiz scheduling is an instant in time. Store it as timestamptz so
-- admin and student see the exact same event regardless of server/browser timezone.
-- Existing TIMESTAMP values were intentionally entered as IST wall-clock values.
ALTER TABLE quizzes
  ALTER COLUMN live_start_at TYPE TIMESTAMPTZ
  USING (live_start_at AT TIME ZONE 'Asia/Kolkata');

ALTER TABLE quizzes
  ALTER COLUMN live_end_at TYPE TIMESTAMPTZ
  USING (live_end_at AT TIME ZONE 'Asia/Kolkata');

CREATE INDEX IF