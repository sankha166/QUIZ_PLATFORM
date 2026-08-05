const { query } = require('../config/db');
const notifService = require('./notification.service');

const getAll = async ({ role, search, category, difficulty, sort, status } = {}) => {
  let conditions = [];
  let params = [];
  let idx = 1;

  // Students only see published quizzes
  if (role === 'STUDENT') {
    conditions.push(`q.status = 'published'`);
  } else if (status) {
    // Admin can filter by status
    conditions.push(`q.status = $${idx}`);
    params.push(status);
    idx++;
  }

  if (search) {
    conditions.push(`(q.title ILIKE $${idx} OR c.name ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  if (category) {
    conditions.push(`q.category_id = $${idx}`);
    params.push(category);
    idx++;
  }

  if (difficulty) {
    conditions.push(`q.difficulty = $${idx}`);
    params.push(difficulty);
    idx++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'q.created_at DESC';
  if (sort === 'popular') orderBy = 'attempt_count DESC';
  else if (sort === 'oldest') orderBy = 'q.created_at ASC';

  const result = await query(
    `SELECT q.*, c.name AS category_name,
            COUNT(DISTINCT qs.id)::int AS question_count,
            COUNT(DISTINCT a.id)::int  AS attempt_count
     FROM quizzes q
     LEFT JOIN categories c ON c.id = q.category_id
     LEFT JOIN questions  qs ON qs.quiz_id = q.id
     LEFT JOIN attempts   a  ON a.quiz_id = q.id
     ${whereClause}
     GROUP BY q.id, c.name
     ORDER BY ${orderBy}`,
    params
  );
  return result.rows;
};

const getById = async (id, role) => {
  const result = await query(
    `SELECT q.*, c.name AS category_name,
            COUNT(DISTINCT qs.id)::int AS question_count,
            COUNT(DISTINCT a.id)::int  AS attempt_count
     FROM quizzes q
     LEFT JOIN categories c  ON c.id = q.category_id
     LEFT JOIN questions  qs ON qs.quiz_id = q.id
     LEFT JOIN attempts   a  ON a.quiz_id = q.id
     WHERE q.id = $1
     GROUP BY q.id, c.name`,
    [id]
  );

  if (!result.rows.length) {
    const err = new Error('Quiz not found'); err.status = 404; throw err;
  }

  const quiz = result.rows[0];
  if (role === 'STUDENT' && quiz.status !== 'published') {
    const err = new Error('Quiz not available'); err.status = 404; throw err;
  }
  return quiz;
};

const create = async ({ title, description, category_id, difficulty, duration, passing_score, max_attempts, thumbnail_url }) => {
  const result = await query(
    `INSERT INTO quizzes (title, description, category_id, difficulty, duration, passing_score, max_attempts, thumbnail_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
     RETURNING *`,
    [title, description || null, category_id, difficulty, duration, passing_score, max_attempts || 1, thumbnail_url || null]
  );
  return result.rows[0];
};

const update = async (id, fields) => {
  const allowed = ['title', 'description', 'category_id', 'difficulty', 'duration', 'passing_score', 'max_attempts', 'thumbnail_url'];
  const updates = [];
  const params = [];
  let idx = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = $${idx}`);
      params.push(fields[key]);
      idx++;
    }
  }

  if (!updates.length) {
    const err = new Error('No fields to update'); err.status = 400; throw err;
  }

  updates.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query(
    `UPDATE quizzes SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (!result.rows.length) {
    const err = new Error('Quiz not found'); err.status = 404; throw err;
  }
  return result.rows[0];
};

const updateStatus = async (id, status) => {
  if (status === 'published') {
    const qCount = await query('SELECT COUNT(*)::int AS cnt FROM questions WHERE quiz_id = $1', [id]);
    if (qCount.rows[0].cnt === 0) {
      const err = new Error('Cannot publish quiz with no questions'); err.status = 400; throw err;
    }
    // Notify all active students
    try {
      const quizInfo = await query('SELECT title FROM quizzes WHERE id = $1', [id]);
      const students = await query(`SELECT id FROM users WHERE role='STUDENT' AND status='active'`);
      await notifService.notifyNewQuiz(students.rows.map(s => s.id), {
        quizTitle: quizInfo.rows[0]?.title,
        quizId: parseInt(id),
      });
    } catch (_) { /* non-fatal */ }
  }
  const result = await query(
    `UPDATE quizzes SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (!result.rows.length) {
    const err = new Error('Quiz not found'); err.status = 404; throw err;
  }
  return result.rows[0];
};

const remove = async (id) => {
  const result = await query('DELETE FROM quizzes WHERE id = $1 RETURNING id', [id]);
  if (!result.rows.length) {
    const err = new Error('Quiz not found'); err.status = 404; throw err;
  }
  return { message: 'Quiz deleted successfully' };
};

module.exports = { getAll, getById, create, update, updateStatus, remove };
