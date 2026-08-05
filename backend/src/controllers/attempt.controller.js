const attemptService = require('../services/attempt.service');

const start = async (req, res, next) => {
  try {
    const data = await attemptService.start(req.params.quizId, req.user.id);
    res.status(201).json({ success: true, ...data });
  } catch (err) { next(err); }
};

const submit = async (req, res, next) => {
  try {
    const data = await attemptService.submit(req.params.quizId, req.user.id, req.body);
    res.json({ success: true, result: data });
  } catch (err) { next(err); }
};

const getMyAttempts = async (req, res, next) => {
  try {
    const data = await attemptService.getMyAttempts(req.user.id);
    res.json({ success: true, attempts: data });
  } catch (err) { next(err); }
};

const getAttemptById = async (req, res, next) => {
  try {
    const data = await attemptService.getAttemptById(req.params.id, req.user.id);
    res.json({ success: true, attempt: data });
  } catch (err) { next(err); }
};

module.exports = { start, submit, getMyAttempts, getAttemptById };
