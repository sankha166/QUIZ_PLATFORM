-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  data       JSONB DEFAULT '{}',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Add avatar/bio columns to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS bio        TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
