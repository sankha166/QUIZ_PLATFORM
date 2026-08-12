const aiImportService=require('../services/aiImport.service');
const importQuestions=async(req,res,next)=>{try{const data=await aiImportService.importQuestions({text:req.body?.text,file:req.file});res.json({success:true,...data});}catch(e){next(e);}};
module.exports={importQuestions};
