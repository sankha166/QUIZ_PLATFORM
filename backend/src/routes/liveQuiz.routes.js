const router = require('express').Router();
const { query } = require('../config/db');
const authenticate = require('../middleware/auth');
const studentOnly = require('../middleware/studentOnly');

// A live event has one absolute start instant. If an explicit end is not set,
// its end is the start plus the sum of all question timers.
const liveEndSql = `COALESCE(q.live_end_at,q.live_start_at + (SELECT COALESCE(SUM(GREATEST(COALESCE(qu.time_limit_seconds,30),5)),0) * INTERVAL '1 second' FROM questions qu WHERE qu.quiz_id=q.id))`;
const allDomainSql = `(q.live_all_domains=true OR q.category_id IS NULL)`;
const nowSql = `NOW()`;

router.get('/', authenticate, async (req, res, next) => {
  try {
    const admin = req.user.role === 'ADMIN';
    const params = [];
    let domainFilter = '';
    let visibility = '';
    let mineSelect = '';
    let mineJoin = '';

    if (!admin) {
      params.push(req.user.id);
      domainFilter = `AND (${allDomainSql} OR c.domain_id=(SELECT preferred_domain_id FROM users WHERE id=$1) OR (SELECT preferred_domain_id FROM users WHERE id=$1) IS NULL)`;
      visibility = `AND (q.status='published' OR (q.status='unpublished' AND q.live_start_at <= ${nowSql}))`;
      mineJoin = `LEFT JOIN attempts mya ON mya.quiz_id=q.id AND mya.user_id=$1 AND mya.status!='in_progress'`;
      mineSelect = `COUNT(DISTINCT mya.id)::int my_attempt_count,COALESCE(MAX(mya.live_rating),0)::numeric(10,2) my_rating,MAX(mya.completed_at) my_completed_at,`;
    }

    const r = await query(`SELECT q.*,c.name category_name,c.domain_id,d.name domain_name,${mineSelect}COUNT(DISTINCT a.id)::int attempt_count,COUNT(DISTINCT lqr.id)::int registration_count,COUNT(DISTINCT qs.id)::int question_count,${liveEndSql} computed_end_at,CASE WHEN q.live_start_at>${nowSql} THEN 'upcoming' WHEN ${liveEndSql}>=${nowSql} THEN 'live' ELSE 'completed' END live_state FROM quizzes q LEFT JOIN categories c ON c.id=q.category_id LEFT JOIN domains d ON d.id=c.domain_id LEFT JOIN questions qs ON qs.quiz_id=q.id LEFT JOIN attempts a ON a.quiz_id=q.id AND a.status!='in_progress' LEFT JOIN live_quiz_registrations lqr ON lqr.quiz_id=q.id ${mineJoin} WHERE q.is_live_quiz=true ${visibility} ${domainFilter} GROUP BY q.id,c.name,c.domain_id,d.name ORDER BY q.live_start_at ASC`, params);
    res.json({ success: true, quizzes: r.rows });
  } catch (e) { next(e); }
});

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const r = await query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='draft')::int drafts,COUNT(*) FILTER(WHERE status='published' AND live_start_at <= ${nowSql} AND ${liveEndSql}>=${nowSql})::int live_now,COUNT(*) FILTER(WHERE status='published' AND live_start_at > ${nowSql})::int upcoming,COUNT(*) FILTER(WHERE status='unpublished' OR (${liveEndSql}<${nowSql} AND live_start_at<=${nowSql}))::int completed FROM quizzes q WHERE is_live_quiz=true`);
    if (req.user.role === 'ADMIN') {
      const a = await query(`SELECT COUNT(*)::int attempts,COALESCE(AVG(live_rating),0)::numeric(10,2) avg_rating FROM attempts a JOIN quizzes q ON q.id=a.quiz_id WHERE q.is_live_quiz=true AND a.status!='in_progress'`);
      return res.json({ success: true, stats: { ...r.rows[0], ...a.rows[0] } });
    }
    const m = await query(`SELECT COUNT(*)::int attempted,COALESCE(SUM(live_rating),0)::numeric(10,2) rating FROM attempts a JOIN quizzes q ON q.id=a.quiz_id WHERE q.is_live_quiz=true AND a.user_id=$1 AND a.status!='in_progress'`, [req.user.id]);
    const rank = await query(`WITH totals AS (SELECT user_id,SUM(live_rating) total_rating FROM attempts a JOIN quizzes q ON q.id=a.quiz_id WHERE q.is_live_quiz=true AND a.status!='in_progress' GROUP BY user_id) SELECT COUNT(*)::int+1 rank FROM totals WHERE total_rating>(SELECT COALESCE(SUM(live_rating),0) FROM attempts WHERE user_id=$1 AND status!='in_progress' AND quiz_id IN(SELECT id FROM quizzes WHERE is_live_quiz=true))`, [req.user.id]);
    res.json({ success: true, stats: { attempted: m.rows[0].attempted, rating: m.rows[0].rating, overall_rank: rank.rows[0].rank, upcoming: r.rows[0].upcoming } });
  } catch (e) { next(e); }
});

router.get('/ranking', authenticate, studentOnly, async (req, res, next) => {
  try {
    const r = await query(`WITH totals AS (SELECT u.id,u.name,u.avatar_url,u.bio,COUNT(a.id)::int attended,COALESCE(SUM(a.live_rating),0)::numeric(12,2) total_rating,COALESCE(MAX(a.live_rating),0)::numeric(12,2) best_rating FROM users u LEFT JOIN attempts a ON a.user_id=u.id AND a.status!='in_progress' AND a.quiz_id IN (SELECT id FROM quizzes WHERE is_live_quiz=true) WHERE u.role='STUDENT' AND u.status='active' GROUP BY u.id,u.name,u.avatar_url,u.bio),ranked AS (SELECT totals.*,ROW_NUMBER() OVER (ORDER BY total_rating DESC,attended DESC,name ASC)::int rank FROM totals WHERE attended>0) SELECT * FROM ranked ORDER BY rank ASC`);
    res.json({ success: true, ranking: r.rows, me: r.rows.find(x => String(x.id) === String(req.user.id)) || null });
  } catch (e) { next(e); }
});

router.get('/:quizId/stats', authenticate, async (req, res, next) => {
  try {
    const q = await query(`SELECT q.*,${liveEndSql} computed_end_at,CASE WHEN q.live_start_at>${nowSql} THEN 'upcoming' WHEN ${liveEndSql}>=${nowSql} THEN 'live' ELSE 'completed' END live_state FROM quizzes q WHERE q.id=$1 AND q.is_live_quiz=true`, [req.params.quizId]);
    if (!q.rows.length) return res.status(404).json({ success: false, message: 'Live quiz not found' });
    const quiz = q.rows[0];
    const a = await query(`SELECT COUNT(*)::int attempts,COUNT(DISTINCT user_id)::int students,COALESCE(SUM(live_rating),0)::numeric(10,2) total_rating,COALESCE(AVG(live_rating),0)::numeric(10,2) avg_rating,COALESCE(MAX(live_rating),0)::numeric(10,2) top_rating FROM attempts WHERE quiz_id=$1 AND status!='in_progress'`, [quiz.id]);
    const reg = await query('SELECT COUNT(*)::int registrations FROM live_quiz_registrations WHERE quiz_id=$1', [quiz.id]);
    let student = { rating: 0, rank: null, attempted: false };
    if (req.user.role === 'STUDENT') {
      const mine = await query(`SELECT COALESCE(live_rating,0) rating FROM attempts WHERE quiz_id=$1 AND user_id=$2 AND status!='in_progress' ORDER BY completed_at DESC LIMIT 1`, [quiz.id, req.user.id]);
      student.attempted = mine.rows.length > 0;
      student.rating = Number(mine.rows[0]?.rating || 0);
      const rr = await query(`WITH totals AS (SELECT user_id,MAX(live_rating) rating FROM attempts WHERE quiz_id=$1 AND status!='in_progress' GROUP BY user_id) SELECT COUNT(*)::int+1 rank FROM totals WHERE rating>$2`, [quiz.id, student.rating]);
      student.rank = student.attempted ? rr.rows[0].rank : null;
    }
    res.json({ success: true, stats: { id: quiz.id, title: quiz.title, status: quiz.status, live_state: quiz.live_state, live_start_at: quiz.live_start_at, computed_end_at: quiz.computed_end_at, ...a.rows[0], ...reg.rows[0], ...student } });
  } catch (e) { next(e); }
});

router.post('/:quizId/register', authenticate, studentOnly, async (req, res, next) => {
  try {
    const r = await query(`SELECT q.id FROM quizzes q LEFT JOIN categories c ON c.id=q.category_id WHERE q.id=$1 AND q.is_live_quiz=true AND q.status='published' AND q.live_start_at>${nowSql} AND ${liveEndSql}>${nowSql} AND (${allDomainSql} OR (SELECT preferred_domain_id FROM users WHERE id=$2) IS NULL OR c.domain_id=(SELECT preferred_domain_id FROM users WHERE id=$2))`, [req.params.quizId, req.user.id]);
    if (!r.rows.length) return res.status(400).json({ success: false, message: 'Registration is not available for this live quiz' });
    await query(`INSERT INTO live_quiz_registrations(quiz_id,user_id) VALUES($1,$2) ON CONFLICT(quiz_id,user_id) DO NOTHING`, [req.params.quizId, req.user.id]);
    res.json({ success: true, registered: true });
  } catch (e) { next(e); }
});

router.get('/:quizId/registration', authenticate, studentOnly, async (req, res, next) => {
  try {
    const r = await query('SELECT 1 FROM live_quiz_registrations WHERE quiz_id=$1 AND user_id=$2', [req.params.quizId, req.user.id]);
    res.json({ success: true, registered: r.rows.length > 0 });
  } catch (e) { next(e); }
});

router.post('/:quizId/end', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required' });
    const r = await query(`UPDATE quizzes SET status='unpublished',live_end_at=${nowSql},updated_at=NOW() WHERE id=$1 AND is_live_quiz=true AND live_start_at<=${nowSql} RETURNING id,status,live_end_at`, [req.params.quizId]);
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Live quiz not found or has not started' });
    res.json({ success: true, quiz: r.rows[0] });
  } catch (e) { next(e); }
});

router.post('/:quizId/start', authenticate, studentOnly, async (req, res, next) => {
  try {
    const r = await query(`SELECT q.*,c.domain_id,${liveEndSql} computed_end_at FROM quizzes q LEFT JOIN categories c ON c.id=q.category_id WHERE q.id=$1 AND q.is_live_quiz=true AND q.status='published' AND q.live_start_at<=${nowSql} AND ${liveEndSql}>${nowSql} AND (${allDomainSql} OR c.domain_id=(SELECT preferred_domain_id FROM users WHERE id=$2) OR (SELECT preferred_domain_id FROM users WHERE id=$2) IS NULL)`, [req.params.quizId, req.user.id]);
    if (!r.rows.length) return res.status(403).json({ success: false, message: 'This live quiz is not available for your domain, has ended, or has not started' });
    const quiz = r.rows[0];
    const completed = await query(`SELECT id,live_rating,completed_at FROM attempts WHERE quiz_id=$1 AND user_id=$2 AND status!='in_progress' ORDER BY completed_at DESC LIMIT 1`, [req.params.quizId, req.user.id]);
    if (completed.rows.length) return res.status(409).json({ success: false, message: 'You have already completed this live quiz', completed: true, rating: completed.rows[0].live_rating, completedAt: completed.rows[0].completed_at });
    let a = await query(`SELECT id FROM attempts WHERE quiz_id=$1 AND user_id=$2 AND status='in_progress'`, [req.params.quizId, req.user.id]);
    let attemptId = a.rows[0]?.id;
    if (!attemptId) {
      a = await query(`INSERT INTO attempts(quiz_id,user_id,status,expiry_time) VALUES($1,$2,'in_progress',$3) RETURNING id`, [req.params.quizId, req.user.id, new Date(Date.now() + 86400000)]);
      attemptId = a.rows[0].id;
    }
    const questions = await query(`SELECT q.*,json_agg(json_build_object('id',o.id,'option_text',o.option_text) ORDER BY o.id) options FROM questions q LEFT JOIN options o ON o.question_id=q.id WHERE q.quiz_id=$1 GROUP BY q.id ORDER BY q.id`, [req.params.quizId]);
    if (!questions.rows.length) return res.status(400).json({ success: false, message: 'This live quiz has no questions configured' });
    res.json({ success: true, attemptId, quiz, questions: questions.rows });
  } catch (e) { next(e); }
});

router.post('/:quizId/answer', authenticate, studentOnly, async (req, res, next) => {
  try {
    const { attemptId, questionId, optionId, timeTaken } = req.body;
    const qr = await query(`SELECT qu.id,qu.marks,qu.time_limit_seconds,(SELECT id FROM options WHERE question_id=qu.id AND is_correct=true LIMIT 1) correct_option_id,z.live_score_025,z.live_score_050,z.live_score_075,z.live_score_100,z.live_score_wrong FROM questions qu JOIN quizzes z ON z.id=qu.quiz_id WHERE qu.id=$1 AND qu.quiz_id=$2 AND z.is_live_quiz=true AND z.status='published' AND z.live_start_at<=${nowSql} AND ${liveEndSql}>=${nowSql}`, [questionId, req.params.quizId]);
    if (!qr.rows.length) return res.status(404).json({ success: false, message: 'Live question is no longer active' });
    const ar = await query(`SELECT id FROM attempts WHERE id=$1 AND quiz_id=$2 AND user_id=$3 AND status='in_progress'`, [attemptId, req.params.quizId, req.user.id]);
    if (!ar.rows.length) return res.status(404).json({ success: false, message: 'Live attempt not found' });
    const x = qr.rows[0];
    const limit = Math.max(5, Number(x.time_limit_seconds) || 30);
    const t = Math.max(0, Number(timeTaken) || 0);
    if (t > limit) return res.status(400).json({ success: false, message: 'Question time expired' });
    const correct = optionId != null && String(optionId) === String(x.correct_option_id);
    let multiplier = 0;
    if (correct) {
      const ratio = t / limit;
      multiplier = ratio <= .25 ? Number(x.live_score_025) : ratio <= .5 ? Number(x.live_score_050) : ratio <= .75 ? Number(x.live_score_075) : Number(x.live_score_100);
    } else if (optionId != null) {
      multiplier = Number(x.live_score_wrong);
    }
    const rating = Number((Number(x.marks || 1) * multiplier).toFixed(2));

    await query(`INSERT INTO answers(attempt_id,question_id,selected_option_id,is_correct,time_taken,response_at) VALUES($1,$2,$3,$4,$5,NOW()) ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_option_id=EXCLUDED.selected_option_id,is_correct=EXCLUDED.is_correct,time_taken=EXCLUDED.time_taken,response_at=NOW()`, [attemptId, questionId, optionId || null, optionId != null ? correct : null, t]);
    await query(`UPDATE attempts SET live_rating=COALESCE((SELECT SUM(CASE WHEN a.is_correct=true THEN q.marks*(CASE WHEN a.time_taken<=q.time_limit_seconds*.25 THEN z.live_score_025 WHEN a.time_taken<=q.time_limit_seconds*.5 THEN z.live_score_050 WHEN a.time_taken<=q.time_limit_seconds*.75 THEN z.live_score_075 ELSE z.live_score_100 END) WHEN a.selected_option_id IS NULL THEN 0 ELSE q.marks*z.live_score_wrong END) FROM answers a JOIN questions q ON q.id=a.question_id JOIN quizzes z ON z.id=q.quiz_id WHERE a.attempt_id=$1),0) WHERE id=$2`, [attemptId, attemptId]);
    const d = await query(`SELECT o.id,COUNT(a.id)::int chosen FROM options o LEFT JOIN answers a ON a.question_id=o.question_id AND a.selected_option_id=o.id AND a.attempt_id IN(SELECT id FROM attempts WHERE quiz_id=$1) WHERE o.question_id=$2 GROUP BY o.id ORDER BY o.id`, [req.params.quizId, questionId]);
    const latest = await query('SELECT COALESCE(live_rating,0)::numeric(10,2) rating FROM attempts WHERE id=$1', [attemptId]);
    res.json({ success: true, correct, correctOptionId: x.correct_option_id, rating, totalRating: latest.rows[0].rating, multiplier, distribution: d.rows });
  } catch (e) { next(e); }
});

router.post('/:quizId/finish', authenticate, studentOnly, async (req, res, next) => {
  try {
    const a = await query(`SELECT id FROM attempts WHERE id=$1 AND quiz_id=$2 AND user_id=$3 AND status='in_progress'`, [req.body.attemptId, req.params.quizId, req.user.id]);
    if (!a.rows.length) return res.status(404).json({ success: false, message: 'Live attempt not found' });

    // Recalculate from persisted answers immediately before finalizing. This
    // makes the completed rating authoritative even if the last answer was
    // submitted at the question deadline or the browser was briefly delayed.
    const finalized = await query(`UPDATE attempts SET live_rating=COALESCE((SELECT SUM(CASE WHEN ans.is_correct=true THEN q.marks*(CASE WHEN ans.time_taken<=q.time_limit_seconds*.25 THEN z.live_score_025 WHEN ans.time_taken<=q.time_limit_seconds*.5 THEN z.live_score_050 WHEN ans.time_taken<=q.time_limit_seconds*.75 THEN z.live_score_075 ELSE z.live_score_100 END) WHEN ans.selected_option_id IS NULL THEN 0 ELSE q.marks*z.live_score_wrong END) FROM answers ans JOIN questions q ON q.id=ans.question_id JOIN quizzes z ON z.id=q.quiz_id WHERE ans.attempt_id=$1),0),status='passed',score=ROUND(COALESCE((SELECT SUM(CASE WHEN ans.is_correct=true THEN q.marks*(CASE WHEN ans.time_taken<=q.time_limit_seconds*.25 THEN z.live_score_025 WHEN ans.time_taken<=q.time_limit_seconds*.5 THEN z.live_score_050 WHEN ans.time_taken<=q.time_limit_seconds*.75 THEN z.live_score_075 ELSE z.live_score_100 END) WHEN ans.selected_option_id IS NULL THEN 0 ELSE q.marks*z.live_score_wrong END) FROM answers ans JOIN questions q ON q.id=ans.question_id JOIN quizzes z ON z.id=q.quiz_id WHERE ans.attempt_id=$1),0))::int,percentage=NULL,completed_at=NOW() WHERE id=$1 RETURNING live_rating`, [req.body.attemptId]);
    const finalRating = Number(finalized.rows[0]?.live_rating || 0);
    const rank = await query(`WITH totals AS (SELECT user_id,MAX(live_rating) rating FROM attempts WHERE quiz_id=$1 AND status!='in_progress' GROUP BY user_id) SELECT COUNT(*)::int+1 rank FROM totals WHERE rating>$2`, [req.params.quizId, finalRating]);
    res.json({ success: true, rating: finalRating, rank: rank.rows[0].rank });
  } catch (e) { next(e); }
});

module.exports = router;
