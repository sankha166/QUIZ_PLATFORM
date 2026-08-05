const { query } = require('../config/db');
const notifService = require('./notification.service');

const getAll = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const offset = (page - 1) * limit;
  let params = [`%${search}%`, limit, offset];

  const result = await query(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
            COUNT(DISTINCT a.id)::int            AS quizzes_attempted,
            COALESCE(AVG(a.percentage), 0)::numeric(5,2) AS average_score
     FROM users u
     LEFT JOIN attempts a ON a.user_id = u.id AND a.status != 'in_progress'
     WHERE u.role = 'STUDENT' AND (u.name ILIKE $1 OR u.email ILIKE $1)
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $2 OFFSET $3`,
    params
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM users WHERE role = 'STUDENT' AND (name ILIKE $1 OR email ILIKE $1)`,
    [`%${search}%`]
  );

  return {
    users: result.rows,
    total: countResult.rows[0].total,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

const getById = async (id) => {
  const userResult = await query(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
            COUNT(DISTINCT a.id)::int            AS quizzes_attempted,
            COALESCE(AVG(a.percentage), 0)::numeric(5,2) AS average_score,
            COALESCE(MAX(a.percentage), 0)::numeric(5,2) AS highest_score
     FROM users u
     LEFT JOIN attempts a ON a.user_id = u.id AND a.status != 'in_progress'
     WHERE u.id = $1
     GROUP BY u.id`,
    [id]
  );

  if (!userResult.rows.length) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }

  const attempts = await query(
    `SELECT a.id, a.percentage, a.status, a.completed_at, q.title AS quiz_title
     FROM attempts a
     JOIN quizzes q ON q.id = a.quiz_id
     WHERE a.user_id = $1 AND a.status != 'in_progress'
     ORDER BY a.completed_at DESC
     LIMIT 20`,
    [id]
  );

  return { ...userResult.rows[0], attempts: attempts.rows };
};

const updateStatus = async (id, status) => {
  const result = await query(
    `UPDATE users SET status = $1 WHERE id = $2 AND role = 'STUDENT' RETURNING id, name, email, status`,
    [status, id]
  );
  if (!result.rows.length) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  // Notify the user about their account status change
  try { await notifService.notifyAccountStatus(id, status); } catch (_) {}
  return result.rows[0];
};

const remove = async (id) => {
  const result = await query('DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id', [id, 'STUDENT']);
  if (!result.rows.length) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  return { message: 'User deleted successfully' };
};

module.exports = { getAll, getById, updateStatus, remove };
