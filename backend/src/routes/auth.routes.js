const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

router.post('/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate, ctrl.register
);

router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate, ctrl.login
);

router.post('/logout', authenticate, ctrl.logout);

router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
  validate, ctrl.forgotPassword
);

router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Token required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate, ctrl.resetPassword
);

module.exports = router;
