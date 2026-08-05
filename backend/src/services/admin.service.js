const { query } = require('../config/db');

const getAllAttempts = async ({ page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT a.*, u.name AS student_name, u.email AS student_email, q.title AS quiz_title
     FROM attempts a
     JOIN users u ON u.id = a.user_id
     JOIN quizzes q ON q.id = a.quiz_id
     WHERE a.status != 'in_progress'
     ORDER BY a.completed_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM attempts WHERE status != 'in_progress'`);
  return { attempts: result.rows, total: countResult.rows[0].total, page: parseInt(page), limit: parseInt(limit) };
};

const getAttemptById = async (id) => {
  const attemptResult = await query(
    `SELECT a.*, u.name AS student_name, u.email AS student_email, q.title AS quiz_title
     FROM attempts a
     JOIN users u ON u.id = a.user_id
     JOIN quizzes q ON q.id = a.quiz_id
     WHERE a.id = $1`,
    [id]
  );
  if (!attemptResult.rows.length) {
    const err = new Error('Attempt not found'); err.status = 404; throw err;
  }

  const answersResult = await query(
    `SELECT ans.*, q.question_text, q.explanation,
            sel.option_text AS selected_option_text,
            cor.option_text AS correct_option_text
     FROM answers ans
     JOIN questions q ON q.id = ans.question_id
     LEFT JOIN options sel ON sel.id = ans.selected_option_id
     LEFT JOIN options cor ON cor.question_id = q.id AND cor.is_correct = TRUE
     WHERE ans.attempt_id = $1 ORDER BY q.id`,
    [id]
  );

  return { ...attemptResult.rows[0], answers: answersResult.rows };
};

const getAnalytics = async () => {
  const [
    totalStudents,
    totalQuizzes,
    publishedQuizzes,
    draftQuizzes,
    totalQuestions,
    totalAttempts,
    avgScore,
    passedAttempts,
    failedAttempts,
  ] = await Promise.all([
    query(`SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'STUDENT'`),
    query(`SELECT COUNT(*)::int AS cnt FROM quizzes`),
    query(`SELECT COUNT(*)::int AS cnt FROM quizzes WHERE status = 'published'`),
    query(`SELECT COUNT(*)::int AS cnt FROM quizzes WHERE status = 'draft'`),
    query(`SELECT COUNT(*)::int AS cnt FROM questions`),
    query(`SELECT COUNT(*)::int AS cnt FROM attempts WHERE status != 'in_progress'`),
    query(`SELECT COALESCE(AVG(percentage),0)::numeric(5,2) AS avg FROM attempts WHERE status != 'in_progress'`),
    query(`SELECT COUNT(*)::int AS cnt FROM attempts WHERE status = 'passed'`),
    query(`SELECT COUNT(*)::int AS cnt FROM attempts WHERE status = 'failed'`),
  ]);

  // Attempts over last 30 days
  const attemptsOverTime = await query(
    `SELECT DATE(completed_at) AS date, COUNT(*)::int AS count
     FROM attempts
     WHERE status != 'in_progress' AND completed_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(completed_at)
     ORDER BY date ASC`
  );

  // Student registrations last 30 days
  const registrations = await query(
    `SELECT DATE(created_at) AS date, COUNT(*)::int AS count
     FROM users WHERE role = 'STUDENT' AND created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at) ORDER BY date ASC`
  );

  // Popular quizzes
  const popularQuizzes = await query(
    `SELECT q.title, COUNT(a.id)::int AS attempts
     FROM quizzes q
     LEFT JOIN attempts a ON a.quiz_id = q.id AND a.status != 'in_progress'
     GROUP BY q.id ORDER BY attempts DESC LIMIT 5`
  );

  // Avg score per quiz
  const avgScorePerQuiz = await query(
    `SELECT q.title, COALESCE(AVG(a.percentage),0)::numeric(5,2) AS avg_score
     FROM quizzes q
     LEFT JOIN attempts a ON a.quiz_id = q.id AND a.status != 'in_progress'
     GROUP BY q.id ORDER BY avg_score DESC LIMIT 8`
  );

  // Popular categories
  const popularCategories = await query(
    `SELECT c.name, COUNT(a.id)::int AS attempts
     FROM categories c
     JOIN quizzes q ON q.category_id = c.id
     LEFT JOIN attempts a ON a.quiz_id = q.id AND a.status != 'in_progress'
     GROUP BY c.id ORDER BY attempts DESC LIMIT 6`
  );

  return {
    stats: {
      totalStudents: totalStudents.rows[0].cnt,
      totalQuizzes: totalQuizzes.rows[0].cnt,
      publishedQuizzes: publishedQuizzes.rows[0].cnt,
      draftQuizzes: draftQuizzes.rows[0].cnt,
      totalQuestions: totalQuestions.rows[0].cnt,
      totalAttempts: totalAttempts.rows[0].cnt,
      averageScore: parseFloat(avgScore.rows[0].avg),
      passedAttempts: passedAttempts.rows[0].cnt,
      failedAttempts: failedAttempts.rows[0].cnt,
    },
    charts: {
      attemptsOverTime: attemptsOverTime.rows,
      studentRegistrations: registrations.rows,
      popularQuizzes: popularQuizzes.rows,
      avgScorePerQuiz: avgScorePerQuiz.rows,
      popularCategories: popularCategories.rows,
      passFail: [
        { name: 'Passed', value: passedAttempts.rows[0].cnt },
        { name: 'Failed', value: failedAttempts.rows[0].cnt },
      ],
    },
  };
};

module.exports = { getAllAttempts, getAttemptById, getAnalytics };
