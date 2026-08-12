const domainService = require('../services/domain.service');

const getAll = async (req, res, next) => { try { res.json({ success:true, domains: await domainService.getAll() }); } catch(e){ next(e); } };
const getById = async (req, res, next) => { try { res.json({ success:true, domain: await domainService.getById(req.params.id) }); } catch(e){ next(e); } };
const create = async (req, res, next) => { try { res.status(201).json({ success:true, domain: await domainService.create(req.body) }); } catch(e){ next(e); } };
const update = async (req, res, next) => { try { res.json({ success:true, domain: await domainService.update(req.params.id, req.body) }); } catch(e){ next(e); } };
const remove = async (req, res, next) => { try { res.json({ success:true, ...(await domainService.remove(req.params.id)) }); } catch(e){ next(e); } };
module.exports = { getAll, getById, create, update, remove };
