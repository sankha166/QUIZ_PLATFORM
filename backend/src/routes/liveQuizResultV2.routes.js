const router = require('express').Router();
const { query } = require('../config/db');
const authenticate = require('../middleware/auth');

const ratingSql = (attemptRef) => `COALESCE((SELECT SUM(CASE
  WHEN COALESCE(ans.is_correct,opt.is_correct,FALSE) = TRUE THEN COALESCE(q.marks,1) * CASE
    WHEN COALESCE(ans.time_taken,0) <= GREATEST(COALESCE(q.time_limit_seconds,30),5) * 0.25 THEN COALESCE(z.live_score_025,2.00)
    WHEN COALESCE(ans.time_taken,0) <= GREATEST(COALESCE(q.time_limit_seconds,30),5) * 0.50 THEN COALESCE(z.live_score_050,1.50)
    WHEN COALESCE(ans.time_taken,0) <= GREATEST(COALESCE(q.time_limit_seconds,30),5) * 0.75 THEN COALESCE(z.live_score_075,1.25)
    ELSE COALESCE(z.live_score_100,1.00) END
  WHEN ans.selected_option_id IS NULL THEN 0
  ELSE COALESCE(q.marks,1) * COALESCE(z.live_score_wrong,-0.50)
END) FROM answers ans JOIN questions q ON q.id=ans.question_id JOIN quizzes z ON z.id=q.quiz_id LEFT JOIN options opt ON opt.id=ans.selected_option_id WHERE ans.attempt_id=${attemptRef} AND z.is_live_quiz=true),0)`;

router.get('/:quizId', authenticate, async (req,res,next) => {
  try {
    const quiz = await query(`SELECT q.id,q.title,q.status,q.live_start_at,q.live_end_at,COUNT(DISTINCT qs.id)::int question_count FROM quizzes q LEFT JOIN questions qs ON qs.quiz_id=q.id WHERE q.id=$1 AND q.is_live_quiz=true GROUP BY q.id`, [req.params.quizId]);
    if (!quiz.rows.length) return res.status(404).json({success:false,message:'Live quiz not found'});
    const q = quiz.rows[0];
    await query(`UPDATE attempts a SET live_rating=${ratingSql('a.id')}, score=ROUND(${ratingSql('a.id')})::int WHERE a.quiz_id=$1 AND a.status!='in_progress'`, [q.id]);
    const event = await query(`SELECT COUNT(*)::int attempts,COUNT(DISTINCT user_id)::int participants,COALESCE(AVG(live_rating),0)::numeric(10,2) avg_rating,COALESCE(MAX(live_rating),0)::numeric(10,2) top_rating FROM attempts WHERE quiz_id=$1 AND status!='in_progress'`, [q.id]);
    let mine={attempted:false,rating:0,rank:null,answered:0,correct:0,wrong:0,unanswered:Number(q.question_count||0)};
    if(req.user.role==='STUDENT'){
      const attempt=await query(`SELECT id,COALESCE(live_rating,0)::numeric(10,2) rating FROM attempts WHERE quiz_id=$1 AND user_id=$2 AND status!='in_progress' ORDER BY completed_at DESC NULLS LAST,id DESC LIMIT 1`,[q.id,req.user.id]);
      if(attempt.rows.length){
        const a=attempt.rows[0];
        const counts=await query(`SELECT COUNT(*) FILTER(WHERE ans.selected_option_id IS NOT NULL)::int answered,COUNT(*) FILTER(WHERE ans.selected_option_id IS NOT NULL AND COALESCE(ans.is_correct,opt.is_correct,FALSE)=true)::int correct,COUNT(*) FILTER(WHERE ans.selected_option_id IS NOT NULL AND COALESCE(ans.is_correct,opt.is_correct,FALSE)=false)::int wrong FROM answers ans LEFT JOIN options opt ON opt.id=ans.selected_option_id WHERE ans.attempt_id=$1`,[a.id]);
        const c=counts.rows[0]||{}; const answered=Number(c.answered||0),correct=Number(c.correct||0),wrong=Number(c.wrong||0),unanswered=Math.max(0,Number(q.question_count||0)-answered);
        const rank=await query(`WITH scores AS(SELECT user_id,MAX(live_rating) rating FROM attempts WHERE quiz_id=$1 AND status!='in_progress' GROUP BY user_id) SELECT COUNT(*)::int+1 rank FROM scores WHERE rating>$2`,[q.id,a.rating]);
        mine={attempted:true,rating:Number(a.rating||0),rank:Number(rank.rows[0]?.rank||1),answered,correct,wrong,unanswered};
      }
    }
    res.json({success:true,result:{id:q.id,title:q.title,status:q.status,live_start_at:q.live_start_at,live_end_at:q.live_end_at,question_count:Number(q.question_count||0),questions:Number(q.question_count||0),attempts:Number(event.rows[0]?.attempts||0),students:Number(event.rows[0]?.participants||0),participants:Number(event.rows[0]?.participants||0),avg_rating:Number(event.rows[0]?.avg_rating||0),top_rating:Number(event.rows[0]?.top_rating||0),...mine}});
  } catch(e){next(e);}
});
module.exports=router;
