const router = require('express').Router();
const ctrl = require('../controllers/question.controller');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// GET /api/quizzes/:quizId/questions — admin sees correct answers, students don't
router.get('/:quizId/questions', authenticate, ctrl.getByQuiz);
// POST /api/quizzes/:quizId/questions — admin only
router.post('/:quizId/questions', authenticate, adminOnly, ctrl.add);

module.exports = router;
