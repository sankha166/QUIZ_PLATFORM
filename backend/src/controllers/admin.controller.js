const adminService=require('../services/admin.service');
const getAllAttempts=async(req,res,next)=>{try{res.json({success:true,...await adminService.getAllAttempts(req.query)});}catch(e){next(e);}};
const getAttemptById=async(req,res,next)=>{try{res.json({success:true,attempt:await adminService.getAttemptById(req.params.id)});}catch(e){next(e);}};
const getAnalytics=async(req,res,next)=>{try{res.json({success:true,...await adminService.getAnalytics({domain_id:req.query.domain_id||null})});}catch(e){next(e);}};
const getQuestionReports=async(req,res,next)=>{try{res.json({success:true,reports:await adminService.getQuestionReports(req.query)});}catch(e){next(e);}};
const updateQuestionReport=async(req,res,next)=>{try{res.json({success:true,report:await adminService.updateQuestionReport(req.params.id,req.body)});}catch(e){next(e);}};
module.exports={getAllAttempts,getAttemptById,getAnalytics,getQuestionReports,updateQuestionReport};
