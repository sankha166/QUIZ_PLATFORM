const { query } = require('../config/db');
const questionService = require('./question.service');
const scoringService = require('./scoring.service');
const notifService = require('./notification.service');

const preferred = async (uid) => {
  const result = await query('SELECT preferred_domain_id FROM users WHERE id=$1', [uid]);
  return result.rows[0]?.preferred_domain_id || null;
};

const domainCheck = async (qid, uid) => {
  const domainId = await preferred(uid);
  if (!domainId) return;
  const result = await query(
    'SELECT c.domain_id FROM quizzes q LEFT JOIN categories c ON c.id=q.category_id WHERE q.id=$1',
    [qid],
  );
  if (!result.rows.length || String(result.rows[0].domain_id) !== String(domainId)) {
    const error = new Error('Quiz is outside your selected domain');
    error.status = 403;
    throw error;
  }
};

const start = async (qid, uid) => {
  const result = await query(
    'SELECT q.*,c.domain_id FROM quizzes q LEFT JOIN categories c ON c.id=q.category_id WHERE q.id=$1 AND q.status=$2',
    [qid, 'published'],
  );
  if (!result.rows.length) {
    const error = new Error('Quiz not found or not published');
    error.status = 404;
    throw error;
  }
  const quiz = result.rows[0];
  if (quiz.is_live_quiz) {
    const error = new Error('Live quizzes must be entered from Live Quizzes');
    error.status = 403;
    throw error;
  }
  await domainCheck(qid, uid);
  const inProgress = await query(
    `SELECT id,expiry_time FROM attempts
     WHERE quiz_id=$1 AND user_id=$2 AND status='in_progress' AND expiry_time>NOW()`,
    [qid, uid],
  );
  if (inProgress.rows.length) {
    return {
      attemptId: inProgress.rows[0].id,
      questions: await questionService.getByQuiz(qid, false),
      expiryTime: inProgress.rows[0].expiry_time,
      quiz,
    };
  }
  const count = await query(
    `SELECT COUNT(*)::int cnt FROM attempts
     WHERE quiz_id=$1 AND user_id=$2 AND status IN ('passed','failed')`,
    [qid, uid],
  );
  if (count.rows[0].cnt >= quiz.max_attempts) {
    const error = new Error('Maximum attempts reached for this quiz');
    error.status = 400;
    throw error;
  }
  const expiry = new Date(Date.now() + quiz.duration * 60000);
  const created = await query(
    `INSERT INTO attempts(quiz_id,user_id,status,expiry_time)
     VALUES($1,$2,'in_progress',$3) RETURNING *`,
    [qid, uid, expiry],
  );
  return {
    attemptId: created.rows[0].id,
    questions: await questionService.getByQuiz(qid, false),
    expiryTime: created.rows[0].expiry_time,
    quiz,
  };
};

const submit = async (qid, uid, { attemptId, answers }) => {
  const result = await query(
    `SELECT a.*,q.passing_score,q.id quiz_id,q.is_live_quiz
     FROM attempts a JOIN quizzes q ON q.id=a.quiz_id
     WHERE a.id=$1 AND a.user_id=$2 AND a.quiz_id=$3`,
    [attemptId, uid, qid],
  );
  if (!result.rows.length) {
    const error = new Error('Attempt not found');
    error.status = 404;
    throw error;
  }
  const attempt = result.rows[0];
  if (attempt.is_live_quiz) {
    const error = new Error('Live quiz attempts are submitted automatically');
    error.status = 400;
    throw error;
  }
  if (attempt.status !== 'in_progress') {
    const error = new Error('Attempt already submitted');
    error.status = 400;
    throw error;
  }
  const submission = await scoringService.calculateResult(
    attemptId,
    answers,
    { id: attempt.quiz_id, passing_score: attempt.passing_score },
  );
  try {
    const quiz = await query('SELECT title FROM quizzes WHERE id=$1', [qid]);
    await notifService.notifyQuizResult(uid, {
      quizTitle: quiz.rows[0]?.title || 'Quiz',
      percentage: submission.percentage,
      status: submission.status,
      attemptId: submission.attemptId,
    });
  } catch (_) {
    // Notification delivery must not prevent a completed attempt from returning.
  }
  return submission;
};

const getMyAttempts = async (uid) => {
  const domainId = await preferred(uid);
  const result = await query(
    `SELECT a.*,q.title quiz_title,q.duration,q.passing_score,q.is_live_quiz,
            c.name category_name,c.domain_id,dm.name domain_name
     FROM attempts a
     JOIN quizzes q ON q.id=a.quiz_id
     LEFT JOIN categories c ON c.id=q.category_id
     LEFT JOIN domains dm ON dm.id=c.domain_id
     WHERE a.user_id=$1 AND a.status!='in_progress'
       AND COALESCE(q.is_live_quiz,FALSE)=FALSE
       AND ($2::int IS NULL OR c.domain_id=$2)
     ORDER BY a.completed_at DESC`,
    [uid, domainId],
  );
  return result.rows;
};

const getAttemptById = async (aid, uid) => {
  const attemptResult = await query(
    `SELECT a.*,q.title quiz_title,q.passing_score,q.duration,q.is_live_quiz,
            c.name category_name,c.domain_id,dm.name domain_name
     FROM attempts a
     JOIN quizzes q ON q.id=a.quiz_id
     LEFT JOIN categories c ON c.id=q.category_id
     LEFT JOIN domains dm ON dm.id=c.domain_id
     WHERE a.id=$1 AND a.user_id=$2 AND COALESCE(q.is_live_quiz,FALSE)=FALSE`,
    [aid, uid],
  );
  if (!attemptResult.rows.length) {
    const error = new Error('Attempt not found');
    error.status = 404;
    throw error;
  }

  const attempt = attemptResult.rows[0];
  const answerResult = await query(
    `SELECT q.id question_id,ans.id answer_id,ans.selected_option_id,ans.is_correct,
            COALESCE(ans.time_taken,0) time_taken,q.question_text,q.explanation,q.question_image_url,q.explanation_image_url,q.marks,
            sel.option_text selected_option_text,
            COALESCE((
              SELECT json_agg(
                json_build_object('id',o.id,'option_text',o.option_text,'is_correct',o.is_correct)
                ORDER BY o.id
              )
              FROM options o WHERE o.question_id=q.id
            ),'[]'::json) options
     FROM questions q
     LEFT JOIN answers ans ON ans.question_id=q.id AND ans.attempt_id=$1
     LEFT JOIN options sel ON sel.id=ans.selected_option_id
     WHERE q.quiz_id=$2
     ORDER BY q.id`,
    [aid, attempt.quiz_id],
  );

  const comparison = await query(
    `SELECT COUNT(*)::int completed_attempts,
            COALESCE(AVG(percentage),0)::numeric(5,2) average_percentage,
            COALESCE(AVG(time_taken),0)::numeric(10,1) average_time,
            COALESCE(MAX(percentage),0)::numeric(5,2) topper_percentage,
            COUNT(*) FILTER (WHERE percentage>$2)::int attempts_ahead
     FROM attempts
     WHERE quiz_id=$1 AND status IN ('passed','failed')`,
    [attempt.quiz_id, attempt.percentage || 0],
  );
  const topper = await query(
    `SELECT a.percentage,a.time_taken,u.name
     FROM attempts a JOIN users u ON u.id=a.user_id
     WHERE a.quiz_id=$1 AND a.status IN ('passed','failed')
     ORDER BY a.percentage DESC,a.time_taken ASC NULLS LAST,a.completed_at ASC
     LIMIT 1`,
    [attempt.quiz_id],
  );
  const questionStats = await query(
    `SELECT q.id question_id,
            COUNT(ans.id)::int response_count,
            COUNT(ans.id) FILTER (WHERE ans.is_correct=TRUE)::int correct_count,
            COALESCE(AVG(ans.time_taken),0)::numeric(10,1) average_time
     FROM questions q
     LEFT JOIN answers ans ON ans.question_id=q.id
     LEFT JOIN attempts att ON att.id=ans.attempt_id
       AND att.quiz_id=$1 AND att.status IN ('passed','failed')
     WHERE q.quiz_id=$1
     GROUP BY q.id
     ORDER BY q.id`,
    [attempt.quiz_id],
  );

  return {
    ...attempt,
    answers: answerResult.rows.map((answer) => ({
      ...answer,
      selected_option_id: answer.selected_option_id || null,
      is_correct: answer.answer_id ? answer.is_correct : null,
    })),
    analysis: {
      comparison: comparison.rows[0],
      topper: topper.rows[0] || null,
      questionStats: questionStats.rows,
    },
  };
};

module.exports = { start, submit, getMyAttempts, getAttemptById };
