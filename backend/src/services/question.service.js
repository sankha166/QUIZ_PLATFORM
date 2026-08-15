const { query, getClient } = require('../config/db');

const getByQuiz = async (quizId, includeCorrect = false) => {
  const questions = await query(`SELECT q.*, COUNT(o.id)::int option_count FROM questions q LEFT JOIN options o ON o.question_id=q.id WHERE q.quiz_id=$1 GROUP BY q.id ORDER BY q.id`, [quizId]);
  const result = [];
  for (const q of questions.rows) {
    const opts = await query(`SELECT id,option_text ${includeCorrect ? ', is_correct' : ''} FROM options WHERE question_id=$1 ORDER BY id`, [q.id]);
    result.push({ ...q, options: opts.rows });
  }
  return result;
};

const validate = (options) => {
  if (!options || options.length < 2) { const e = new Error('At least 2 options are required'); e.status = 400; throw e; }
  if (options.filter(o => o.is_correct).length !== 1) { const e = new Error('Exactly one option must be marked as correct'); e.status = 400; throw e; }
};

const resolveLiveTime = async (quizId, requested) => {
  const q = await query('SELECT is_live_quiz, live_same_question_time, live_question_time_seconds FROM quizzes WHERE id=$1', [quizId]);
  if (!q.rows.length) { const e = new Error('Quiz not found'); e.status = 404; throw e; }
  if (!q.rows[0].is_live_quiz) return requested ? Math.max(5, Number(requested)) : null;
  if (q.rows[0].live_same_question_time) return Math.min(600, Math.max(5, Number(q.rows[0].live_question_time_seconds) || 30));
  if (requested === undefined || requested === null || requested === '') return 30;
  return Math.min(600, Math.max(5, Number(requested) || 30));
};

const add = async (quizId, { question_text, marks, explanation, difficulty, time_limit_seconds, options }) => {
  validate(options);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const liveTime = await resolveLiveTime(quizId, time_limit_seconds);
    const qr = await client.query(`INSERT INTO questions(quiz_id,question_text,marks,explanation,difficulty,time_limit_seconds) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [quizId, question_text, marks || 1, explanation || null, difficulty || null, liveTime]);
    const question = qr.rows[0], inserted = [];
    for (const o of options) { const r = await client.query('INSERT INTO options(question_id,option_text,is_correct) VALUES($1,$2,$3) RETURNING *', [question.id, o.option_text, o.is_correct || false]); inserted.push(r.rows[0]); }
    await client.query('COMMIT');
    return { ...question, options: inserted };
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
};

const update = async (id, { question_text, marks, explanation, difficulty, time_limit_seconds, options }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT quiz_id FROM questions WHERE id=$1', [id]);
    if (!existing.rows.length) { const e = new Error('Question not found'); e.status = 404; throw e; }
    const liveTime = await resolveLiveTime(existing.rows[0].quiz_id, time_limit_seconds);
    const qr = await client.query(`UPDATE questions SET question_text=COALESCE($1,question_text),marks=COALESCE($2,marks),explanation=COALESCE($3,explanation),difficulty=COALESCE($4,difficulty),time_limit_seconds=COALESCE($5,time_limit_seconds) WHERE id=$6 RETURNING *`, [question_text, marks, explanation, difficulty, liveTime, id]);
    let inserted = [];
    if (options && options.length >= 2) {
      validate(options);
      await client.query('DELETE FROM options WHERE question_id=$1', [id]);
      for (const o of options) { const r = await client.query('INSERT INTO options(question_id,option_text,is_correct) VALUES($1,$2,$3) RETURNING *', [id, o.option_text, o.is_correct || false]); inserted.push(r.rows[0]); }
    } else {
      const r = await client.query('SELECT * FROM options WHERE question_id=$1 ORDER BY id', [id]); inserted = r.rows;
    }
    await client.query('COMMIT');
    return { ...qr.rows[0], options: inserted };
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
};

const remove = async id => { const r = await query('DELETE FROM questions WHERE id=$1 RETURNING id', [id]); if (!r.rows.length) { const e = new Error('Question not found'); e.status = 404; throw e; } return { message: 'Question deleted successfully' }; };
module.exports = { getByQuiz, add, update, remove };
