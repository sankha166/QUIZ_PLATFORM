const questionService = require('../services/question.service');

const getByQuiz = async (req, res, next) => {
  try {
    const quizId = req.params.quizId || req.params.id;
    const includeCorrect = req.user.role === 'ADMIN';
    const data = await questionService.getByQuiz(quizId, includeCorrect);
    res.json({ success: true, questions: data });
  } catch (err) { next(err); }
};

const add = async (req, res, next) => {
  try {
    const quizId = req.params.quizId || req.params.id;
    const data = await questionService.add(quizId, req.body);
    res.status(201).json({ success: true, question: data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await questionService.update(req.params.id, req.body);
    res.json({ success: true, question: data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const data = await questionService.remove(req.params.id);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

module.exports = { getByQuiz, add, update, remove };
