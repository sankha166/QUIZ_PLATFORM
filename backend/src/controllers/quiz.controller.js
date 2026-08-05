const quizService = require('../services/quiz.service');

const getAll = async (req, res, next) => {
  try {
    const { search, category, difficulty, sort, status } = req.query;
    const data = await quizService.getAll({ role: req.user.role, search, category, difficulty, sort, status });
    res.json({ success: true, quizzes: data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await quizService.getById(req.params.id, req.user.role);
    res.json({ success: true, quiz: data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await quizService.create(req.body);
    res.status(201).json({ success: true, quiz: data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await quizService.update(req.params.id, req.body);
    res.json({ success: true, quiz: data });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await quizService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, quiz: data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const data = await quizService.remove(req.params.id);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, updateStatus, remove };
