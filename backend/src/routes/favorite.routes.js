const router=require('express').Router();
const {query}=require('../config/db');
const authenticate=require('../middleware/auth');

router.get('/',authenticate,async(req,res,next)=>{try{const r=await query(`SELECT q.*,c.name AS category_name,COUNT(DISTINCT a.id)::int AS attempt_count FROM favorite_quizzes f JOIN quizzes q ON q.id=f.quiz_id LEFT JOIN categories c ON c.id=q.category_id LEFT JOIN attempts a ON a.quiz_id=q.id WHERE f.user_id=$1 GROUP BY q.id,c.name ORDER BY f.created_at DESC`,[req.user.id]);res.json({success:true,quizzes:r.rows});}catch(e){next(e)}});
router.post('/:quizId',authenticate,async(req,res,next)=>{try{await query('INSERT INTO favorite_quizzes(user_id,quiz_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.user.id,req.params.quizId]);res.json({success:true,favorite:true});}catch(e){next(e)}});
router.delete('/:quizId',authenticate,async(req,res,next)=>{try{await query('DELETE FROM favorite_quizzes WHERE user_id=$1 AND quiz_id=$2',[req.user.id,req.params.quizId]);res.json({success:true,favorite:false});}catch(e){next(e)}});
router.get('/status/:quizId',authenticate,async(req,res,next)=>{try{const r=await query('SELECT 1 FROM favorite_quizzes WHERE user_id=$1 AND quiz_id=$2',[req.user.id,req.params.quizId]);res.json({success:true,favorite:r.rows.length>0});}catch(e){next(e)}});
module.exports=router;
