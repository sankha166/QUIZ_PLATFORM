const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.get('/attempts', authenticate, adminOnly, ctrl.getAllAttempts);
router.get('/attempts/:id', authenticate, adminOnly, ctrl.getAttemptById);
router.get('/analytics', authenticate, adminOnly, ctrl.getAnalytics);

module.exports = router;
