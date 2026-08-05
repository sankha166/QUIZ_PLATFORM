const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ success: true, ...data });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

const forgotPassword = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const data = await authService.resetPassword(req.body);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

module.exports = { register, login, logout, forgotPassword, resetPassword };
