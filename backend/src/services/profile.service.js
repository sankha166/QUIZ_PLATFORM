const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

const getProfile = async (userId) => {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.avatar_url, u.bio, u.created_at,
            u.preferred_domain_id, d.name AS preferred_domain_name,
            COUNT(DISTINCT a.id)::int AS quizzes_attempted,
            COALESCE(AVG(a.percentage),0)::numeric(5,2) AS average_score,
            COALESCE(MAX(a.percentage),0)::numeric(5,2) AS highest_score,
            COUNT(DISTINCT CASE WHEN a.status='passed' THEN a.id END)::int AS quizzes_passed
     FROM users u
     LEFT JOIN domains d ON d.id = u.preferred_domain_id
     LEFT JOIN attempts a ON a.user_id = u.id AND a.status != 'in_progress'
     WHERE u.id = $1 GROUP BY u.id, d.name`,
    [userId]
  );
  if (!result.rows.length) { const e = new Error('User not found'); e.status = 404; throw e; }
  return result.rows[0];
};

const updateProfile = async (userId, { name, bio, avatar_url, preferred_domain_id }) => {
  const domainId = preferred_domain_id === undefined || preferred_domain_id === '' ? null : Number(preferred_domain_id);
  if (preferred_domain_id !== undefined && preferred_domain_id !== '' && !Number.isInteger(domainId)) {
    const e = new Error('Invalid preferred domain'); e.status = 400; throw e;
  }
  if (domainId !== null) {
    const domain = await query('SELECT id FROM domains WHERE id=$1', [domainId]);
    if (!domain.rows.length) { const e = new Error('Selected domain not found'); e.status = 400; throw e; }
  }
  const result = await query(
    `UPDATE users SET
       name = COALESCE($1, name),
       bio = COALESCE($2, bio),
       avatar_url = COALESCE($3, avatar_url),
       preferred_domain_id = CASE WHEN $4::int IS NULL THEN preferred_domain_id ELSE $4::int END,
       updated_at = NOW()
     WHERE id = $5
     RETURNING id, name, email, role, status, avatar_url, bio, preferred_domain_id, updated_at`,
    [name || null, bio || null, avatar_url || null, domainId, userId]
  );
  return result.rows[0];
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const result = await query('SELECT password FROM users WHERE id = $1', [userId]);
  if (!result.rows.length) { const e = new Error('User not found'); e.status = 404; throw e; }

  const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
  if (!valid) { const e = new Error('Current password is incorrect'); e.status = 400; throw e; }

  const hashed = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, userId]);
  return { message: 'Password changed successfully' };
};

module.exports = { getProfile, updateProfile, changePassword };
