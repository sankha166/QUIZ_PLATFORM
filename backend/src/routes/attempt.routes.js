const router = require('express').Router();
const ctrl = require('../controllers/attempt.controller');
const authenticate = require('../middleware/auth');
const studentOnly = require('../middleware/studentOnly');

// Start / submit — students only
router.post('/quizzes/:quizId/start', authenticate, studentOnly, ctrl.start);
router.post('/quizzes/:quizId/submit', authenticate, studentOnly, ctrl.submit);

// View own attempts — any authenticated user (student can see their own)
router.get('/attempts', authenticate, ctrl.getMyAttempts);
router.get('/attempts/:id', authenticate, ctrl.getAttemptById);

module.exports = router;
