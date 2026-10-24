ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS default_question_marks NUMERIC(10,2) NOT NULL DEFAULT 1;
ALTER TABLE questions ALTER COLUMN marks TYPE NUMERIC(10,2) USING marks::numeric;
UPDATE quizzes SET default_question_marks = 1 WHERE default_question_marks IS NULL OR default_question_marks <= 0;
