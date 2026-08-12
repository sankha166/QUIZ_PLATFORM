-- Favorites, quick reviews, and avatar storage.
ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;

CREATE TABLE IF NOT EXISTS favorite_quizzes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, quiz_id)
);
CREATE INDEX IF NOT EXISTS idx_favorite_quizzes_user ON favorite_quizzes(user_id);

CREATE TABLE IF NOT EXISTS quiz_reviews (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER UNIQUE NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  mood VARCHAR(20) NOT NULL CHECK (mood IN ('love','happy','okay','sad','angry')),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_reviews_quiz ON quiz_reviews(quiz_id);
