const { query } = require('../config/db');

const getAll = async () => {
  const result = await query(
    `SELECT c.*, COUNT(q.id)::int AS quiz_count
     FROM categories c
     LEFT JOIN quizzes q ON q.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name ASC`
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await query(
    `SELECT c.*, COUNT(q.id)::int AS quiz_count
     FROM categories c
     LEFT JOIN quizzes q ON q.category_id = c.id
     WHERE c.id = $1
     GROUP BY c.id`,
    [id]
  );
  if (!result.rows.length) {
    const err = new Error('Category not found'); err.status = 404; throw err;
  }
  return result.rows[0];
};

const create = async ({ name, description }) => {
  const result = await query(
    `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`,
    [name, description || null]
  );
  return result.rows[0];
};

const update = async (id, { name, description }) => {
  const result = await query(
    `UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
    [name, description || null, id]
  );
  if (!result.rows.length) {
    const err = new Error('Category not found'); err.status = 404; throw err;
  }
  return result.rows[0];
};

const remove = async (id) => {
  const quizCheck = await query('SELECT id FROM quizzes WHERE category_id = $1 LIMIT 1', [id]);
  if (quizCheck.rows.length) {
    const err = new Error('Cannot delete category with associated quizzes'); err.status = 400; throw err;
  }
  const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (!result.rows.length) {
    const err = new Error('Category not found'); err.status = 404; throw err;
  }
  return { message: 'Category deleted successfully' };
};

module.exports = { getAll, getById, create, update, remove };
