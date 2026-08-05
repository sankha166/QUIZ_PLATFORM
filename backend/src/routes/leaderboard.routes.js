const router = require('express').Router();
const ctrl = require('../controllers/leaderboard.controller');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, ctrl.getLeaderboard);

module.exports = router;
