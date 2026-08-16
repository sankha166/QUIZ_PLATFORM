-- Recalculate completed live-quiz ratings from recorded answers.
-- This repairs attempts that previously finished with live_rating = 0 even
-- though their answers were scored correctly.
UPDATE attempts a
SET live_rating = COALESCE((
  SELECT SUM(
    CASE
      WHEN ans.is_correct = TRUE THEN
        COALESCE(q.marks, 1) * CASE
          WHEN COALESCE(ans.time_taken, 0) <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.25
            THEN COALESCE(z.live_score_025, 2.00)
          WHEN COALESCE(ans.time_taken, 0) <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.50
            THEN COALESCE(z.live_score_050, 1.50)
          WHEN COALESCE(ans.time_taken, 0) <= GREATEST(COALESCE(q.time_limit_seconds, 30), 5) * 0.75
            THEN COALESCE(z.live_score_075, 1.25)
          ELSE COALESCE(z.live_score_100, 1.00)
        END
      WHEN ans.selected_option_id IS NULL THEN 0
      ELSE COALESCE(q.marks, 1) * COALESCE(z.live_score_wrong, -0.50)
    END
  )
  FROM answers ans
  JOIN questions q ON q.id = ans.question_id
  JOIN quizzes z ON z.id = q.quiz_id
  WHERE ans.attempt_id = a.id
    AND z.is_live_quiz = TRUE
), 0)
WHERE a.quiz_id IN (SELECT id FROM quizzes WHERE is_live_quiz = TRUE)
  AND a.status <> 'in_progress';
