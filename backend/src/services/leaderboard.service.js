const { query } = require('../config/db');

const getLeaderboard = async ({ type = 'overall', categoryId, period = 'all' } = {}) => {
  const params = [];
  let idx = 1;

  // Date filter clause (appended to JOIN ON, not WHERE)
  let dateFilter = '';
  if (period === 'weekly') {
    dateFilter = `AND a.completed_at >= NOW() - INTERVAL '7 days'`;
  } else if (period === 'monthly') {
    dateFilter = `AND a.completed_at >= NOW() - INTERVAL '30 days'`;
  }

  // Category filter — safe parameterised
  let categoryJoin = '';
  let categoryWhere = '';
  if (type === 'category' && categoryId) {
    const parsed = parseInt(categoryId, 10);
    if (!isNaN(parsed)) {
      categoryJoin = `JOIN quizzes qz ON qz.id = a.quiz_id`;
      categoryWhere = `AND qz.category_id = $${idx}`;
      params.push(parsed);
      idx++;
    }
  }

  const sql = `
    SELECT u.id, u.name,
           COUNT(a.id)::int                              AS quizzes_completed,
           COALESCE(AVG(a.percentage),0)::numeric(5,2)  AS average_score,
           COALESCE(MAX(a.percentage),0)::numeric(5,2)  AS highest_score
    FROM users u
    JOIN attempts a
      ON a.user_id = u.id
      AND a.status != 'in_progress'
      ${dateFilter}
    ${categoryJoin}
    WHERE u.role = 'STUDENT'
      AND u.status = 'active'
      ${categoryWhere}
    GROUP BY u.id
    HAVING COUNT(a.id) > 0
    ORDER BY average_score DESC, quizzes_completed DESC
    LIMIT 50
  `;

  const result = await query(sql, params);
  return result.rows.map((row, index) => ({ rank: index + 1, ...row }));
};

module.exports = { getLeaderboard };
