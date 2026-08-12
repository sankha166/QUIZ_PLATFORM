const adminService=require('../services/admin.service');
const getAllAttempts=async(req,res,next)=>{try{res.json({success:true,...await adminService.getAllAttempts(req.query)});}catch(e){next(e);}};
const getAttemptById=async(req,res,next)=>{try{res.json({success:true,attempt:await adminService.getAttemptById(req.params.id)});}catch(e){next(e);}};
const getAnalytics=async(req,res,next)=>{try{res.json({success:true,...await adminService.getAnalytics({domain_id:req.query.domain_id||null})});}catch(e){next(e);}};
module.exports={getAllAttempts,getAttemptById,getAnalytics};
