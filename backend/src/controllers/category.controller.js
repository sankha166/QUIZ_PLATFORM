const categoryService = require('../services/category.service');

const getAll = async (req, res, next) => {
  try {
    const data = await categoryService.getAll();
    res.json({ success: true, categories: data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await categoryService.getById(req.params.id);
    res.json({ success: true, category: data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await categoryService.create(req.body);
    res.status(201).json({ success: true, category: data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await categoryService.update(req.params.id, req.body);
    res.json({ success: true, category: data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const data = await categoryService.remove(req.params.id);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
