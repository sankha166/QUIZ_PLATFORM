-- Quiz Platform: Initial Schema Migration

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(10)  NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('ADMIN','STUDENT')),
  status     VARCHAR(10)  NOT NULL DEFAULT 'active'  CHECK (status IN ('active','inactive')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  difficulty    VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  duration      INTEGER NOT NULL CHECK (duration > 0),
  passing_score INTEGER NOT NULL CHECK (passing_score BETWEEN 1 AND 100),
  max_attempts  INTEGER NOT NULL DEFAULT 1 CHECK (max_attempts > 0),
  status        VARCHAR(15) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','unpublished')),
  thumbnail_url VARCHAR(500),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id            SERIAL PRIMARY KEY,
  quiz_id       INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  marks         INTEGER NOT NULL DEFAULT 1 CHECK (marks > 0),
  explanation   TEXT,
  difficulty    VARCHAR(10) CHECK (difficulty IN ('easy','medium','hard')),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Options table
CREATE TABLE IF NOT EXISTS options (
  id          SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE
);

-- Attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id                SERIAL PRIMARY KEY,
  quiz_id           INTEGER NOT NULL REFERENCES quizzes(id),
  user_id           INTEGER NOT NULL REFERENCES users(id),
  score             INTEGER,
  percentage        NUMERIC(5,2),
  correct_answers   INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  unanswered        INTEGER DEFAULT 0,
  time_taken        INTEGER,
  status            VARCHAR(15) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','passed','failed')),
  expiry_time       TIMESTAMP NOT NULL,
  started_at        TIMESTAMP DEFAULT NOW(),
  completed_at      TIMESTAMP
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id                 SERIAL PRIMARY KEY,
  attempt_id         INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id        INTEGER NOT NULL REFERENCES questions(id),
  selected_option_id INTEGER REFERENCES options(id),
  is_correct         BOOLEAN,
  UNIQUE (attempt_id, question_id)
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quizzes_status   ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(category_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user    ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz    ON attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt  ON answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz   ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id);
