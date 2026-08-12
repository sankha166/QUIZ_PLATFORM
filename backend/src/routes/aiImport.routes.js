const router=require('express').Router();const multer=require('multer');const ctrl=require('../controllers/aiImport.controller');const authenticate=require('../middleware/auth');const adminOnly=require('../middleware/adminOnly');
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:15*1024*1024}});
router.post('/import-questions',authenticate,adminOnly,upload.single('file'),ctrl.importQuestions);
module.exports=router;
