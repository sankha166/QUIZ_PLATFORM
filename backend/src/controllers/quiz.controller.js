const quizService = require('../services/quiz.service');
const quizListingService = require('../services/quizListing.service');
const questionService = require('../services/question.service');
const { query } = require('../config/db');

const getStudentPreferredDomain = async (userId) => {
  if (!userId) return null;
  const result = await query('SELECT preferred_domain_id FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.preferred_domain_id || null;
};

const getAll = async (req, res, next) => {
  try {
    const { search, category, difficulty, sort, status } = req.query;
    const role = req.user?.role || 'GUEST';
    let { domain_id } = req.query;

    // Students always see quizzes from their selected domain unless an explicit
    // domain is supplied by a future multi-domain student UI.
    if (role === 'STUDENT' && (!domain_id || domain_id === 'all')) {
      domain_id = await getStudentPreferredDomain(req.user.id);
    }

    res.json({
      success: true,
      quizzes: await quizListingService.getAll({ role, search, category, difficulty, sort, status, domain_id }),
    });
  } catch (e) {
    next(e);
  }
};

const getById = async (req, res, next) => {
  try {
    const quiz = await quizService.getById(req.params.id, req.user.role);
    if (req.user?.role === 'STUDENT') {
      const preferredDomain = await getStudentPreferredDomain(req.user.id);
      if (preferredDomain && String(quiz.domain_id) !== String(preferredDomain)) {
        const err = new Error('Quiz is outside your selected domain');
        err.status = 403;
        throw err;
      }
    }
    res.json({ success: true, quiz });
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => { try { res.status(201).json({ success: true, quiz: await quizService.create(cleanQuizTimestamps(req.body)) }); } catch (e) { next(e); } };
const cleanQuizTimestamps = (body) => {
  const cleaned = { ...body };
  for (const key of ['live_start_at', 'live_end_at']) {
    if (cleaned[key] === '') cleaned[key] = null;
  }
  return cleaned;
};

const update = async (req, res, next) => { try { res.json({ success: true, quiz: await quizService.update(req.params.id, cleanQuizTimestamps(req.body) ) }); } catch (e) { next(e); } };
const updateStatus = async (req, res, next) => {
  try {
    const quiz = await quizService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, quiz });
    if (req.body.status === 'published') {
      questionService.translateQuiz(req.params.id).catch((error) => {
        console.error(`Unable to pre-translate published quiz ${req.params.id}:`, error.message);
      });
    }
  } catch (e) { next(e); }
};
const remove = async (req, res, next) => { try { res.json({ success: true, ...await quizService.remove(req.params.id) }); } catch (e) { next(e); } };

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const share = async (req, res, next) => {
  try {
    const quiz = await quizService.getById(req.params.id, 'GUEST');
    if (quiz.status !== 'published' || quiz.is_live_quiz) {
      return res.status(404).send('Quiz not available');
    }
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const pageUrl = `${frontendUrl}/student/quizzes/${quiz.id}`;
    const imageUrl = quiz.thumbnail_url
      ? (/^https?:\/\//i.test(quiz.thumbnail_url) ? quiz.thumbnail_url : `${frontendUrl}/${String(quiz.thumbnail_url).replace(/^\//, '')}`)
      : `${frontendUrl}/logo1.png`;
    const title = `${quiz.title} | Quizora`;
    const description = quiz.description || `Try this ${quiz.difficulty || ''} quiz on Quizora.`;
    res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${escapeHtml(imageUrl)}"><meta property="og:url" content="${escapeHtml(pageUrl)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(imageUrl)}"><meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}"><title>${escapeHtml(title)}</title></head><body><p>Opening ${escapeHtml(quiz.title)}…</p><script>location.replace(${JSON.stringify(pageUrl)})</script></body></html>`);
  } catch (e) {
    next(e);
  }
};

module.exports = { getAll, getById, create, update, updateStatus, remove, share };