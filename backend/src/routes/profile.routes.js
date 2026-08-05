const router = require('express').Router();
const profileService = require('../services/profile.service');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json({ success: true, profile: await profileService.getProfile(req.user.id) }); }
  catch (err) { next(err); }
});

router.put('/', authenticate, async (req, res, next) => {
  try { res.json({ success: true, profile: await profileService.updateProfile(req.user.id, req.body) }); }
  catch (err) { next(err); }
});

router.put('/password', authenticate, async (req, res, next) => {
  try { res.json({ success: true, ...(await profileService.changePassword(req.user.id, req.body)) }); }
  catch (err) { next(err); }
});

module.exports = router;
