-- Keep live_rating derived from submitted answers so a completed live quiz
-- cannot lose its rating because of request ordering or a stale calculation.
CREATE OR REPLACE FUNCTION refresh_live_attempt_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_attempt_id INTEGER;
BEGIN
  target_attempt_id := COALESCE(NEW.attempt_id, OLD.attempt_id);

  UPDATE attempts a
  SET live_rating = COALESCE((
    SELECT SUM(
      CASE
        WHEN ans.is_correct = TRUE THEN
          q.marks * CASE
            WHEN ans.time_taken <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.25
              THEN quiz.live_score_025
            WHEN ans.time_taken <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.50
              THEN quiz.live_score_050
            WHEN ans.time_taken <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.75
              THEN quiz.live_score_075
            ELSE quiz.live_score_100
          END
        WHEN ans.selected_option_id IS NULL THEN 0
        ELSE q.marks * quiz.live_score_wrong
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
      SELECT 1
      FROM quizzes qz
      WHERE qz.id = a.quiz_id
        AND qz.is_live_quiz = TRUE
    );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_live_attempt_rating ON answers;
CREATE TRIGGER trg_refresh_live_attempt_rating
AFTER INSERT OR UPDATE OR DELETE ON answers
FOR EACH ROW
EXECUTE FUNCTION refresh_live_attempt_rating();

-- Repair any existing live attempts whose stored rating is stale.
UPDATE attempts a
SET live_rating = COALESCE((
  SELECT SUM(
    CASE
      WHEN ans.is_correct = TRUE THEN
        q.marks * CASE
          WHEN ans.time_taken <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.25
            THEN quiz.live_score_025
          WHEN ans.time_taken <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.50
            THEN quiz.live_score_050
          WHEN ans.time_taken <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.75
            THEN quiz.live_score_075
          ELSE quiz.live_score_100
        END
      WHEN ans.selected_option_id IS NULL THEN 0
      ELSE q.marks * quiz.live_score_wrong
    END
  )
  FROM answers ans
  JOIN questions q ON q.id = ans.question_id
  JOIN quizzes quiz ON quiz.id = q.quiz_id
  WHERE ans.attempt_id = a.id
    AND quiz.is_live_quiz = TRUE
), 0)
WHERE a.quiz_id IN (SELECT id FROM quizzes WHERE is_live_quiz = TRUE);
