const adminService = require('../services/admin.service');

const getAllAttempts = async (req, res, next) => {
  try {
    const data = await adminService.getAllAttempts(req.query);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const getAttemptById = async (req, res, next) => {
  try {
    const data = await adminService.getAttemptById(req.params.id);
    res.json({ success: true, attempt: data });
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getAnalytics();
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

module.exports = { getAllAttempts, getAttemptById, getAnalytics };
