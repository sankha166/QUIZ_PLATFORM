const { query } = require('../config/db');

const getAll = async ({ role, search, category, domain_id, difficulty, sort, status } = {}) => {
  const conditions = ['COALESCE(q.is_live_quiz, FALSE) = FALSE'];
  const params = [];
  let idx = 1;
  if (role !== 'ADMIN') conditions.push(`q.status = 'published'`);
  else if (status) { conditions.push(`q.status = $${idx}`); params.push(status); idx++; }
  if (search) { conditions.push(`(q.title ILIKE $${idx} OR c.name ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
  if (category && category !== 'all') { conditions.push(`q.category_id = $${idx}`); params.push(category); idx++; }
  if (domain_id && domain_id !== 'all') { conditions.push(`c.domain_id = $${idx}`); params.push(domain_id); idx++; }
  if (difficulty) { conditions.push(`q.difficulty = $${idx}`); params.push(difficulty); idx++; }
  const orderBy = sort === 'popular' ? 'attempt_count DESC' : sort === 'oldest' ? 'q.created_at ASC' : 'q.created_at DESC';
  const result = await query(`SELECT q.*, c.name category_name, c.domain_id, d.name domain_name, COUNT(DISTINCT qs.id)::int question_count, COUNT(DISTINCT a.id)::int attempt_count FROM quizzes q LEFT JOIN categories c ON c.id = q.category_id LEFT JOIN domains d ON d.id = c.domain_id LEFT JOIN questions qs ON qs.quiz_id = q.id LEFT JOIN attempts a ON a.quiz_id = q.id WHERE ${conditions.join(' AND ')} GROUP BY q.id, c.name, c.domain_id, d.name ORDER BY ${orderBy}`, params);
  return result.rows;
};

const getById = async (id, role) => {
  const result = await query(`SELECT q.*, c.name category_name, c.domain_id, d.name domain_name, COUNT(DISTINCT qs.id)::int question_count, COUNT(DISTINCT a.id)::int attempt_count FROM quizzes q LEFT JOIN categories c ON c.id = q.category_id LEFT JOIN domains d ON d.id = c.domain_id LEFT JOIN questions qs ON qs.quiz_id = q.id LEFT JOIN attempts a ON a.quiz_id = q.id WHERE q.id = $1 GROUP BY q.id, c.name, c.domain_id, d.name`, [id]);
  if (!result.rows.length) { const e = new Error('Quiz not found'); e.status = 404; throw e; }
  const quiz = result.rows[0];
  if (role === 'STUDENT' && (quiz.status !== 'published' || quiz.is_live_quiz)) { const e = new Error('Quiz not available'); e.status = 404; throw e; }
  return quiz;
};

const scoreValue = (value, fallback) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const timeValue = (value, fallback = 30) => Math.min(600, Math.max(5, Number(value) || fallback));

// The admin UI sends an IST wall-clock value. Convert it once to an absolute
// instant. The database column is TIMESTAMPTZ after migration 013, so neither
// the Node server timezone nor the browser timezone can add another +05:30.
const normalizeIstTimestamp = (value) => {
  if (!value) return value;
  const text = String(value).trim();
  if (!text) return null;
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
    return text;
  }
  const wall = text.slice(0, 19).replace('T', ' ');
  const date = new Date(`${wall.replace(' ', 'T')}+05:30`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const create = async ({ title, description, category_id, difficulty, duration, passing_score, max_attempts, thumbnail_url, is_live_quiz, live_start_at, live_end_at, live_all_domains, live_score_025, live_score_050, live_score_075, live_score_100, live_score_wrong, live_same_question_time, live_question_time_seconds }) => {
  const live = Boolean(is_live_quiz);
  const catId = category_id ? parseInt(category_id, 10) : null;
  if (live && !live_start_at) { const e = new Error('Live quiz requires a start time'); e.status = 400; throw e; }
  if (live && !live_all_domains && !catId) { const e = new Error('Select a category or choose All Domains'); e.status = 400; throw e; }
  const safeDuration = live ? 1 : Number(duration) || 10;
  const startAt = live ? normalizeIstTimestamp(live_start_at) : null;
  const result = await query(`INSERT INTO quizzes (title, description, category_id, difficulty, duration, passing_score, max_attempts, thumbnail_url, status, is_live_quiz, live_start_at, live_end_at, live_all_domains, live_score_025, live_score_050, live_score_075, live_score_100, live_score_wrong, live_same_question_time, live_question_time_seconds) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft',$9,$10,NULL,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`, [title, description || null, Number.isNaN(catId) ? null : catId, difficulty, safeDuration, passing_score || 60, max_attempts || 1, thumbnail_url || null, live, startAt, Boolean(live_all_domains), scoreValue(live_score_025, 2), scoreValue(live_score_050, 1.5), scoreValue(live_score_075, 1.25), scoreValue(live_score_100, 1), scoreValue(live_score_wrong, -0.5), live && Boolean(live_same_question_time), timeValue(live_question_time_seconds)]);
  return result.rows[0];
};

const update = async (id, fields) => {
  const current = await query('SELECT is_live_quiz FROM quizzes WHERE id = $1', [id]);
  if (!current.rows.length) { const e = new Error('Quiz not found'); e.status = 404; throw e; }
  const willBeLive = Boolean(current.rows[0].is_live_quiz || fields.is_live_quiz === true);
  const allowed = ['title','description','category_id','difficulty','duration','passing_score','max_attempts','thumbnail_url','is_live_quiz','live_start_at','live_end_at','live_all_domains','live_score_025','live_score_050','live_score_075','live_score_100','live_score_wrong','live_same_question_time','live_question_time_seconds'];
  const updates = [], params = [];
  let idx = 1;
  for (const key of allowed) {
    if (fields[key] === undefined) continue;
    if (key === 'duration' && willBeLive) continue;
    let val = fields[key];
    if (key === 'category_id') { val = val ? parseInt(val, 10) : null; if (Number.isNaN(val)) val = null; }
    if (key === 'is_live_quiz' || key === 'live_all_domains' || key === 'live_same_question_time') val = Boolean(val);
    if (key.startsWith('live_score_')) val = scoreValue(val, 0);
    if (key === 'live_question_time_seconds') val = timeValue(val);
    if (key === 'live_start_at') val = normalizeIstTimestamp(val);
    if (key === 'live_end_at' && current.rows[0].is_live_quiz) val = null;
    updates.push(`${key} = $${idx}`);
    params.push(val);
    idx++;
  }
  if (willBeLive) updates.push('duration = 1');
  if (!updates.length) { const e = new Error('No fields to update'); e.status = 400; throw e; }
  updates.push('updated_at = NOW()');
  params.push(id);
  const result = await query(`UPDATE quizzes SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, params);
  if (!result.rows.length) { const e = new Error('Quiz not found'); e.status = 404; throw e; }
  if (result.rows[0].is_live_quiz && result.rows[0].live_same_question_time && fields.live_question_time_seconds !== undefined) {
    await query('UPDATE questions SET time_limit_seconds=$1 WHERE quiz_id=$2', [timeValue(fields.live_question_time_seconds), id]);
  }
  return result.rows[0];
};

const updateStatus = async (id, status) => {
  const q = await query('SELECT is_live_quiz, live_start_at, live_all_domains, category_id FROM quizzes WHERE id = $1', [id]);
  if (!q.rows.length) { const e = new Error('Quiz not found'); e.status = 404; throw e; }
  if (status === 'published') {
    const qc = await query('SELECT COUNT(*)::int cnt FROM questions WHERE quiz_id = $1', [id]);
    if (qc.rows[0].cnt === 0) { const e = new Error('Cannot publish quiz with no questions'); e.status = 400; throw e; }
    if (q.rows[0].is_live_quiz && !q.rows[0].live_start_at) { const e = new Error('Live quiz requires a start time'); e.status = 400; throw e; }
    if (q.rows[0].is_live_quiz && !q.rows[0].live_all_domains && !q.rows[0].category_id) { const e = new Error('Live quiz needs a category or All Domains'); e.status = 400; throw e; }
  }
  return (await query('UPDATE quizzes SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id])).rows[0];
};

const remove = async id => {
  const result = await query('DELETE FROM quizzes WHERE id = $1 RETURNING id', [id]);
  if (!result.rows.length) { const e = new Error('Quiz not found'); e.status = 404; throw e; }
  return { message: 'Quiz deleted successfully' };
};

module.exports = { getAll, getById, create, update, updateStatus, remove };
