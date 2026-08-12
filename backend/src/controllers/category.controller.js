const categoryService=require('../services/category.service');
const getAll=async(req,res,next)=>{try{res.json({success:true,categories:await categoryService.getAll({domain_id:req.query.domain_id||null})});}catch(e){next(e);}};
const getById=async(req,res,next)=>{try{res.json({success:true,category:await categoryService.getById(req.params.id)});}catch(e){next(e);}};
const create=async(req,res,next)=>{try{res.status(201).json({success:true,category:await categoryService.create(req.body)});}catch(e){next(e);}};
const update=async(req,res,next)=>{try{res.json({success:true,category:await categoryService.update(req.params.id,req.body)});}catch(e){next(e);}};
const remove=async(req,res,next)=>{try{res.json({success:true,...await categoryService.remove(req.params.id)});}catch(e){next(e);}};
module.exports={getAll,getById,create,update,remove};
