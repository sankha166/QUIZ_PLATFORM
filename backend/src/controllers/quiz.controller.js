const quizService=require('../services/quiz.service');
const getAll=async(req,res,next)=>{try{const {search,category,difficulty,sort,status,domain_id}=req.query;const role=req.user?.role||'GUEST';res.json({success:true,quizzes:await quizService.getAll({role,search,category,difficulty,sort,status,domain_id})});}catch(e){next(e);}};
const getById=async(req,res,next)=>{try{res.json({success:true,quiz:await quizService.getById(req.params.id,req.user.role)});}catch(e){next(e);}};
const create=async(req,res,next)=>{try{res.status(201).json({success:true,quiz:await quizService.create(req.body)});}catch(e){next(e);}};
const update=async(req,res,next)=>{try{res.json({success:true,quiz:await quizService.update(req.params.id,req.body)});}catch(e){next(e);}};
const updateStatus=async(req,res,next)=>{try{res.json({success:true,quiz:await quizService.updateStatus(req.params.id,req.body.status)});}catch(e){next(e);}};
const remove=async(req,res,next)=>{try{res.json({success:true,...await quizService.remove(req.params.id)});}catch(e){next(e);}};
module.exports={getAll,getById,create,update,updateStatus,remove};
