// Standalone question routes for PUT /api/questions/:id and DELETE /api/questions/:id
const router = require('express').Router();
const ctrl = require('../controllers/question.controller');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.put('/:id', authenticate, adminOnly, ctrl.update);
router.delete('/:id', authenticate, adminOnly, ctrl.remove);

module.exports = router;
