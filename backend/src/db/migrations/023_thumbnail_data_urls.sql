-- Uploaded thumbnail previews are stored as data URLs when no object-storage
-- service is configured. A VARCHAR(500) cannot hold a normal PNG data URL.
ALTER TABLE quizzes
  ALTER COLUMN thumbnail_url TYPE TEXT;
