-- Keep live_rating derived from submitted answers so a completed live quiz
-- cannot lose its rating because of request ordering or stale calculations.
CREATE OR REPLACE FUNCTION refresh_live_attempt_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_attempt_id INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_attempt_id := OLD.attempt_id;
  ELSE
    target_attempt_id := NEW.attempt_id;
  END IF;

  UPDATE attempts a
  SET live_rating = COALESCE((
    SELECT SUM(
      CASE
        WHEN ans.is_correct = TRUE THEN
          COALESCE(q.marks, 1) * CASE
            WHEN COALESCE(ans.time_taken, 0) <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.25 THEN COALESCE(quiz.live_score_025, 2.00)
            WHEN COALESCE(ans.time_taken, 0) <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.50 THEN COALESCE(quiz.live_score_050, 1.50)
            WHEN COALESCE(ans.time_taken, 0) <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.75 THEN COALESCE(quiz.live_score_075, 1.25)
            ELSE COALESCE(quiz.live_score_100, 1.00)
          END
        WHEN ans.selected_option_id IS NULL THEN 0
        ELSE COALESCE(q.marks, 1) * COALESCE(quiz.live_score_wrong, -0.50)
      END
    )
    FROM answers ans
    JOIN questions q ON q.id = ans.question_id
    JOIN quizzes quiz ON quiz.id = q.quiz_id
    WHERE ans.attempt_id = a.id
      AND quiz.is_live_quiz = TRUE
  ), 0)
  WHERE a.id = target_attempt_id
    AND EXISTS (
      SELECT 1 FROM quizzes qz
      WHERE qz.id = a.quiz_id AND qz.is_live_quiz = TRUE
    );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_live_attempt_rating ON answers;
CREATE TRIGGER trg_refresh_live_attempt_rating
AFTER INSERT OR UPDATE OR DELETE ON answers
FOR EACH ROW EXECUTE FUNCTION refresh_live_attempt_rating();

-- Repair previously completed live attempts whose stored rating is stale.
UPDATE attempts a
SET live_rating = COALESCE((
  SELECT SUM(
    CASE
      WHEN ans.is_correct = TRUE THEN
        COALESCE(q.marks, 1) * CASE
          WHEN COALESCE(ans.time_taken, 0) <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.25 THEN COALESCE(z.live_score_025, 2.00)
          WHEN COALESCE(ans.time_taken, 0) <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.50 THEN COALESCE(z.live_score_050, 1.50)
          WHEN COALESCE(ans.time_taken, 0) <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.75 THEN COALESCE(z.live_score_075, 1.25)
          ELSE COALESCE(z.live_score_100, 1.00)
        END
      WHEN ans.selected_option_id IS NULL THEN 0
      ELSE COALESCE(q.marks, 1) * COALESCE(z.live_score_wrong, -0.50)
    END
  )
  FROM answers ans
  JOIN questions q ON q.id = ans.question_id
  JOIN quizzes z ON z.id = q.quiz_id
  WHERE ans.attempt_id = a.id AND z.is_live_quiz = TRUE
), 0)
WHERE a.quiz_id IN (SELECT id FROM quizzes WHERE is_live_quiz = TRUE);