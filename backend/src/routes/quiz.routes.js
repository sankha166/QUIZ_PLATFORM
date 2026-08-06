const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/quiz.controller');
const authenticate = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validate');

// Use optional auth so admin users get their role recognized (to see drafts/unpublished),
// while unauthenticated visitors still get the public published-only listing.
router.get('/', optionalAuth, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);

router.post('/',
  authenticate, adminOnly,
  [
    body('title').trim().isLength({ min: 1 }).withMessage('Title required'),
    body('difficulty').isIn(['easy','medium','hard']).withMessage('Difficulty must be easy, medium, or hard'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (minutes)'),
    body('passing_score').isInt({ min: 1, max: 100 }).withMessage('Passing score must be between 1 and 100'),
    body('max_attempts').optional().isInt({ min: 1 }).withMessage('Max attempts must be a positive integer'),
  ],
  validate, ctrl.create
);

router.put('/:id', authenticate, adminOnly, ctrl.update);

router.patch('/:id/publish',
  authenticate, adminOnly,
  [body('status').isIn(['published','unpublished','draft']).withMessage('Invalid status')],
  validate, ctrl.updateStatus
);

router.delete('/:id', authenticate, adminOnly, ctrl.remove);

module.exports = router;
