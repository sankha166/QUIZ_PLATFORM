const quizService = require('../services/quiz.service');
const quizListingService = require('../services/quizListing.service');
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

const create = async (req, res, next) => { try { res.status(201).json({ success: true, quiz: await quizService.create(req.body) }); } catch (e) { next(e); } };
const update = async (req, res, next) => { try { res.json({ success: true, quiz: await quizService.update(req.params.id, req.body) }); } catch (e) { next(e); } };
const updateStatus = async (req, res, next) => { try { res.json({ success: true, quiz: await quizService.updateStatus(req.params.id, req.body.status) }); } catch (e) { next(e); } };
const remove = async (req, res, next) => { try { res.json({ success: true, ...await quizService.remove(req.params.id) }); } catch (e) { next(e); } };

module.exports = { getAll, getById, create, update, updateStatus, remove };