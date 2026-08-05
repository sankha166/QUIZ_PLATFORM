const { query } = require('../config/db');
const questionService = require('./question.service');
const scoringService = require('./scoring.service');
const notifService = require('./notification.service');

const start = async (quizId, userId) => {
  // Fetch quiz
  const quizResult = await query('SELECT * FROM quizzes WHERE id = $1 AND status = $2', [quizId, 'published']);
  if (!quizResult.rows.length) {
    const err = new Error('Quiz not found or not published'); err.status = 404; throw err;
  }
  const quiz = quizResult.rows[0];

  // Check if there is an in_progress attempt already
  const inProgress = await query(
    `SELECT id FROM attempts WHERE quiz_id = $1 AND user_id = $2 AND status = 'in_progress' AND expiry_time > NOW()`,
    [quizId, userId]
  );
  if (inProgress.rows.length) {
    // Return the existing attempt
    const existingAttemptId = inProgress.rows[0].id;
    const questions = await questionService.getByQuiz(quizId, false);
    const expiryResult = await query('SELECT expiry_time FROM attempts WHERE id = $1', [existingAttemptId]);
    return {
      attemptId: existingAttemptId,
      questions,
      expiryTime: expiryResult.rows[0].expiry_time,
      quiz,
    };
  }

  // Check max attempts
  const completedCount = await query(
    `SELECT COUNT(*)::int AS cnt FROM attempts
     WHERE quiz_id = $1 AND user_id = $2 AND status IN ('passed','failed')`,
    [quizId, userId]
  );
  if (completedCount.rows[0].cnt >= quiz.max_attempts) {
    const err = new Error('Maximum attempts reached for this quiz'); err.status = 400; throw err;
  }

  // Create new attempt
  const expiryTime = new Date(Date.now() + quiz.duration * 60 * 1000);
  const attemptResult = await query(
    `INSERT INTO attempts (quiz_id, user_id, status, expiry_time)
     VALUES ($1, $2, 'in_progress', $3) RETURNING *`,
    [quizId, userId, expiryTime]
  );
  const attempt = attemptResult.rows[0];

  // Return questions WITHOUT is_correct
  const questions = await questionService.getByQuiz(quizId, false);

  return {
    attemptId: attempt.id,
    questions,
    expiryTime: attempt.expiry_time,
    quiz,
  };
};

const submit = async (quizId, userId, { attemptId, answers }) => {
  // Verify attempt belongs to user and quiz
  const attemptResult = await query(
    `SELECT a.*, q.passing_score, q.id AS quiz_id
     FROM attempts a
     JOIN quizzes q ON q.id = a.quiz_id
     WHERE a.id = $1 AND a.user_id = $2 AND a.quiz_id = $3`,
    [attemptId, userId, quizId]
  );

  if (!attemptResult.rows.length) {
    const err = new Error('Attempt not found'); err.status = 404; throw err;
  }

  const attempt = attemptResult.rows[0];

  if (attempt.status !== 'in_progress') {
    const err = new Error('Attempt already submitted'); err.status = 400; throw err;
  }

  // Backend timer validation — expired answers are treated as unanswered
  const now = new Date();
  const expiry = new Date(attempt.expiry_time);
  const gracePeriodMs = 5000;
  let validAnswers = answers;
  if (now > new Date(expiry.getTime() + gracePeriodMs)) {
    validAnswers = []; // All answers discarded if submitted well after expiry
  }

  const quiz = { id: attempt.quiz_id, passing_score: attempt.passing_score };
  const result = await scoringService.calculateResult(attemptId, validAnswers, quiz);

  // Send notification to student
  try {
    const quizInfo = await query('SELECT title FROM quizzes WHERE id = $1', [quizId]);
    await notifService.notifyQuizResult(userId, {
      quizTitle: quizInfo.rows[0]?.title || 'Quiz',
      percentage: result.percentage,
      status: result.status,
      attemptId: result.attemptId,
    });
  } catch (_) { /* non-fatal */ }

  return result;
};

const getMyAttempts = async (userId) => {
  const result = await query(
    `SELECT a.*, q.title AS quiz_title, q.duration, q.passing_score, c.name AS category_name
     FROM attempts a
     JOIN quizzes q ON q.id = a.quiz_id
     LEFT JOIN categories c ON c.id = q.category_id
     WHERE a.user_id = $1 AND a.status != 'in_progress'
     ORDER BY a.completed_at DESC`,
    [userId]
  );
  return result.rows;
};

const getAttemptById = async (attemptId, userId) => {
  const attemptResult = await query(
    `SELECT a.*, q.title AS quiz_title, q.passing_score, q.duration, c.name AS category_name
     FROM attempts a
     JOIN quizzes q ON q.id = a.quiz_id
     LEFT JOIN categories c ON c.id = q.category_id
     WHERE a.id = $1 AND a.user_id = $2`,
    [attemptId, userId]
  );

  if (!attemptResult.rows.length) {
    const err = new Error('Attempt not found'); err.status = 404; throw err;
  }

  const attempt = attemptResult.rows[0];

  // Fetch answers with question and option details
  const answersResult = await query(
    `SELECT ans.id, ans.question_id, ans.selected_option_id, ans.is_correct,
            q.question_text, q.explanation, q.marks,
            sel_opt.option_text AS selected_option_text,
            cor_opt.id AS correct_option_id,
            cor_opt.option_text AS correct_option_text
     FROM answers ans
     JOIN questions q ON q.id = ans.question_id
     LEFT JOIN options sel_opt ON sel_opt.id = ans.selected_option_id
     LEFT JOIN options cor_opt ON cor_opt.question_id = q.id AND cor_opt.is_correct = TRUE
     WHERE ans.attempt_id = $1
     ORDER BY q.id ASC`,
    [attemptId]
  );

  return { ...attempt, answers: answersResult.rows };
};

module.exports = { start, submit, getMyAttempts, getAttemptById };
