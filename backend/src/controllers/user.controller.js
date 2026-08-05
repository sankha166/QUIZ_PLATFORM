const userService = require('../services/user.service');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const data = await userService.getAll({ page, limit, search });
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await userService.getById(req.params.id);
    res.json({ success: true, user: data });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await userService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, user: data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const data = await userService.remove(req.params.id);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, updateStatus, remove };
