const router=require('express').Router();
const {query}=require('../config/db');
const authenticate=require('../middleware/auth');

// Idempotent safety net for deployments where the migration command was not run yet.
const ensureFavoritesTable=async()=>{await query(`CREATE TABLE IF NOT EXISTS favorite_quizzes (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,created_at TIMESTAMP DEFAULT NOW(),PRIMARY KEY(user_id,quiz_id))`);};

router.get('/',authenticate,async(req,res,next)=>{try{await ensureFavoritesTable();const r=await query(`SELECT q.*,c.name AS category_name,COUNT(DISTINCT a.id)::int AS attempt_count,f.created_at AS favorited_at FROM favorite_quizzes f JOIN quizzes q ON q.id=f.quiz_id LEFT JOIN categories c ON c.id=q.category_id LEFT JOIN attempts a ON a.quiz_id=q.id WHERE f.user_id=$1 GROUP BY q.id,c.name,f.created_at ORDER BY f.created_at DESC`,[req.user.id]);res.json({success:true,quizzes:r.rows});}catch(e){next(e)}});

router.get('/status/:quizId',authenticate,async(req,res,next)=>{try{await ensureFavoritesTable();const r=await query('SELECT 1 FROM favorite_quizzes WHERE user_id=$1 AND quiz_id=$2',[req.user.id,req.params.quizId]);res.json({success:true,favorite:r.rows.length>0});}catch(e){next(e)}});

router.post('/:quizId',authenticate,async(req,res,next)=>{try{await ensureFavoritesTable();const quiz=await query(`SELECT id FROM quizzes WHERE id=$1 AND status='published'`,[req.params.quizId]);if(!quiz.rows.length)return res.status(404).json({success:false,message:'Quiz not found or not available'});await query('INSERT INTO favorite_quizzes(user_id,quiz_id) VALUES($1,$2) ON CONFLICT(user_id,quiz_id) DO NOTHING',[req.user.id,req.params.quizId]);res.json({success:true,favorite:true,quiz_id:Number(req.params.quizId)});}catch(e){next(e)}});

router.delete('/:quizId',authenticate,async(req,res,next)=>{try{await ensureFavoritesTable();await query('DELETE FROM favorite_quizzes WHERE user_id=$1 AND quiz_id=$2',[req.user.id,req.params.quizId]);res.json({success:true,favorite:false,quiz_id:Number(req.params.quizId)});}catch(e){next(e)}});

module.exports=router;
