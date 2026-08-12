const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/domain.controller');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validate');

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, adminOnly, [body('name').trim().isLength({min:1,max:100}).withMessage('Name required')], validate, ctrl.create);
router.put('/:id', authenticate, adminOnly, [body('name').trim().isLength({min:1,max:100}).withMessage('Name required')], validate, ctrl.update);
router.delete('/:id', authenticate, adminOnly, ctrl.remove);
module.exports = router;
