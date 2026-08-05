const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.get('/', authenticate, adminOnly, ctrl.getAll);
router.get('/:id', authenticate, adminOnly, ctrl.getById);
router.patch('/:id/status', authenticate, adminOnly, ctrl.updateStatus);
router.delete('/:id', authenticate, adminOnly, ctrl.remove);

module.exports = router;
