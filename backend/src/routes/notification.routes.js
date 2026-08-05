const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, ctrl.getNotifications);
router.patch('/:id/read', authenticate, ctrl.markRead);
router.patch('/read-all', authenticate, ctrl.markAllRead);
router.delete('/:id', authenticate, ctrl.deleteOne);

module.exports = router;
