const { query } = require('../config/db');

const getAll = async () => {
  const result = await query(`
    SELECT d.*, COUNT(c.id)::int AS category_count,
           COUNT(DISTINCT q.id)::int AS quiz_count
    FROM domains d
    LEFT JOIN categories c ON c.domain_id = d.id
    LEFT JOIN quizzes q ON q.category_id = c.id
    GROUP BY d.id
    ORDER BY d.name ASC
  `);
  return result.rows;
};

const getById = async (id) => {
  const result = await query(`
    SELECT d.*, COUNT(c.id)::int AS category_count,
           COUNT(DISTINCT q.id)::int AS quiz_count
    FROM domains d
    LEFT JOIN categories c ON c.domain_id = d.id
    LEFT JOIN quizzes q ON q.category_id = c.id
    WHERE d.id = $1
    GROUP BY d.id
  `, [id]);
  if (!result.rows.length) { const err = new Error('Domain not found'); err.status = 404; throw err; }
  return result.rows[0];
};

const create = async ({ name, description }) => {
  const result = await query(
    `INSERT INTO domains (name, description) VALUES ($1, $2) RETURNING *`,
    [name.trim(), description?.trim() || null]
  );
  return result.rows[0];
};

const update = async (id, { name, description }) => {
  const result = await query(
    `UPDATE domains SET name=$1, description=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
    [name.trim(), description?.trim() || null, id]
  );
  if (!result.rows.length) { const err = new Error('Domain not found'); err.status = 404; throw err; }
  return result.rows[0];
};

const remove = async (id) => {
  const domain = await getById(id);
  if (domain.name === 'Engineering') { const err = new Error('Engineering cannot be deleted'); err.status = 400; throw err; }
  const used = await query('SELECT id FROM categories WHERE domain_id=$1 LIMIT 1', [id]);
  if (used.rows.length) { const err = new Error('Cannot delete a domain containing categories'); err.status = 400; throw err; }
  await query('DELETE FROM domains WHERE id=$1', [id]);
  return { message: 'Domain deleted successfully' };
};

module.exports = { getAll, getById, create, update, remove };
