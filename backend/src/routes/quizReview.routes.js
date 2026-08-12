const router=require('express').Router();
const {query}=require('../config/db');
const authenticate=require('../middleware/auth');
router.post('/',authenticate,async(req,res,next)=>{try{const {attemptId,mood,review}=req.body;if(!attemptId||!['love','happy','okay','sad','angry'].includes(mood)){const e=new Error('A valid review mood is required');e.status=400;throw e;}const a=await query('SELECT quiz_id FROM attempts WHERE id=$1 AND user_id=$2 AND status!=\'in_progress\'',[attemptId,req.user.id]);if(!a.rows.length){const e=new Error('Completed attempt not found');e.status=404;throw e;}const r=await query(`INSERT INTO quiz_reviews(attempt_id,user_id,quiz_id,mood,review) VALUES($1,$2,$3,$4,$5) ON CONFLICT(attempt_id) DO UPDATE SET mood=EXCLUDED.mood,review=EXCLUDED.review,updated_at=NOW() RETURNING *`,[attemptId,req.user.id,a.rows[0].quiz_id,mood,(review||'').trim().slice(0,1000)]);res.status(201).json({success:true,review:r.rows[0]});}catch(e){next(e)}});
module.exports=router;
