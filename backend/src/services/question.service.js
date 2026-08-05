const { query, getClient } = require('../config/db');

const getByQuiz = async (quizId, includeCorrect = false) => {
  const questions = await query(
    `SELECT q.*, COUNT(o.id)::int AS option_count
     FROM questions q
     LEFT JOIN options o ON o.question_id = q.id
     WHERE q.quiz_id = $1
     GROUP BY q.id
     ORDER BY q.id ASC`,
    [quizId]
  );

  const result = [];
  for (const q of questions.rows) {
    const opts = await query(
      `SELECT id, option_text ${includeCorrect ? ', is_correct' : ''}
       FROM options WHERE question_id = $1 ORDER BY id ASC`,
      [q.id]
    );
    result.push({ ...q, options: opts.rows });
  }
  return result;
};

const add = async (quizId, { question_text, marks, explanation, difficulty, options }) => {
  // Validate at least 2 options and exactly one correct
  if (!options || options.length < 2) {
    const err = new Error('At least 2 options are required'); err.status = 400; throw err;
  }
  const correctCount = options.filter((o) => o.is_correct).length;
  if (correctCount !== 1) {
    const err = new Error('Exactly one option must be marked as correct'); err.status = 400; throw err;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const qResult = await client.query(
      `INSERT INTO questions (quiz_id, question_text, marks, explanation, difficulty)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [quizId, question_text, marks || 1, explanation || null, difficulty || null]
    );
    const question = qResult.rows[0];

    const insertedOptions = [];
    for (const opt of options) {
      const oResult = await client.query(
        `INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3) RETURNING *`,
        [question.id, opt.option_text, opt.is_correct || false]
      );
      insertedOptions.push(oResult.rows[0]);
    }

    await client.query('COMMIT');
    return { ...question, options: insertedOptions };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const update = async (id, { question_text, marks, explanation, difficulty, options }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const qResult = await client.query(
      `UPDATE questions SET question_text = COALESCE($1, question_text),
       marks = COALESCE($2, marks), explanation = COALESCE($3, explanation),
       difficulty = COALESCE($4, difficulty)
       WHERE id = $5 RETURNING *`,
      [question_text, marks, explanation, difficulty, id]
    );

    if (!qResult.rows.length) {
      await client.query('ROLLBACK');
      const err = new Error('Question not found'); err.status = 404; throw err;
    }

    let insertedOptions = [];
    if (options && options.length >= 2) {
      const correctCount = options.filter((o) => o.is_correct).length;
      if (correctCount !== 1) {
        await client.query('ROLLBACK');
        const err = new Error('Exactly one option must be marked as correct'); err.status = 400; throw err;
      }
      await client.query('DELETE FROM options WHERE question_id = $1', [id]);
      for (const opt of options) {
        const oResult = await client.query(
          `INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3) RETURNING *`,
          [id, opt.option_text, opt.is_correct || false]
        );
        insertedOptions.push(oResult.rows[0]);
      }
    } else {
      const opts = await client.query('SELECT * FROM options WHERE question_id = $1 ORDER BY id', [id]);
      insertedOptions = opts.rows;
    }

    await client.query('COMMIT');
    return { ...qResult.rows[0], options: insertedOptions };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const remove = async (id) => {
  const result = await query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);
  if (!result.rows.length) {
    const err = new Error('Question not found'); err.status = 404; throw err;
  }
  return { message: 'Question deleted successfully' };
};

module.exports = { getByQuiz, add, update, remove };
