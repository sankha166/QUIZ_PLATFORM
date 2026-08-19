const router = require('express').Router();
const { query } = require('../config/db');
const authenticate = require('../middleware/auth');

const liveRatingSql = (attemptPlaceholder = '$1') => `COALESCE((SELECT SUM(CASE WHEN ans.is_correct=TRUE THEN COALESCE(q.marks,1)*CASE WHEN COALESCE(ans.time_taken,0)<=GREATEST(COALESCE(q.time_limit_seconds,30),5)*0.25 THEN COALESCE(z.live_score_025,2.00) WHEN COALESCE(ans.time_taken,0)<=GREATEST(COALESCE(q.time_limit_seconds,30),5)*0.50 THEN COALESCE(z.live_score_050,1.50) WHEN COALESCE(ans.time_taken,0)<=GREATEST(COALESCE(q.time_limit_seconds,30),5)*0.75 THEN COALESCE(z.live_score_075,1.25) ELSE COALESCE(z.live_score_100,1.00) END WHEN ans.selected_option_id IS NULL THEN 0 ELSE COALESCE(q.marks,1)*COALESCE(z.live_score_wrong,-0.50) END) FROM answers ans JOIN questions q ON q.id=ans.question_id JOIN quizzes z ON z.id=q.quiz_id WHERE ans.attempt_id=${attemptPlaceholder} AND z.is_live_quiz=TRUE),0)`;

router.get('/:quizId', authenticate, async (req, res, next) => {
  try {
    const quizResult = await query(`SELECT q.id,q.title,q.status,q.live_start_at,q.live_end_at,COUNT(DISTINCT questions.id)::int AS question_count FROM quizzes q LEFT JOIN questions ON questions.quiz_id=q.id WHERE q.id=$1 AND q.is_live_quiz=true GROUP BY q.id`, [req.params.quizId]);
    if (!quizResult.rows.length) return res.status(404).json({ success:false, message:'Live quiz not found' });
    const quiz = quizResult.rows[0];

    // Keep live ratings authoritative from answer rows, while the attempt summary
    // fields remain the fallback for older attempts whose answer rows are incomplete.
    await query(`UPDATE attempts a SET live_rating=${liveRatingSql('a.id')},score=ROUND(${liveRatingSql('a.id')})::int WHERE a.quiz_id=$1 AND a.status!='in_progress' AND EXISTS(SELECT 1 FROM answers ans WHERE ans.attempt_id=a.id)`, [quiz.id]);

    const eventResult = await query(`SELECT COUNT(*)::int AS attempts,COUNT(DISTINCT user_id)::int AS students,COALESCE(AVG(live_rating),0)::numeric(10,2) AS avg_rating FROM attempts WHERE quiz_id=$1 AND status!='in_progress'`, [quiz.id]);

    let mine={attempted:false,rating:0,rank:null,answered:0,correct:0,wrong:0,unanswered:Number(quiz.question_count||0)};
    if(req.user.role==='STUDENT'){
      const attemptResult=await query(`SELECT id,COALESCE(live_rating,0)::numeric(10,2) rating,COALESCE(correct_answers,0)::int correct_answers,COALESCE(incorrect_answers,0)::int incorrect_answers,COALESCE(unanswered,0)::int unanswered FROM attempts WHERE quiz_id=$1 AND user_id=$2 AND status!='in_progress' ORDER BY completed_at DESC NULLS LAST,id DESC LIMIT 1`,[quiz.id,req.user.id]);
      if(attemptResult.rows.length){
        const attempt=attemptResult.rows[0];
        const answerResult=await query(`SELECT COUNT(*) FILTER(WHERE selected_option_id IS NOT NULL)::int answered,COUNT(*) FILTER(WHERE selected_option_id IS NOT NULL AND is_correct=true)::int correct,COUNT(*) FILTER(WHERE selected_option_id IS NOT NULL AND is_correct=false)::int wrong FROM answers WHERE attempt_id=$1`,[attempt.id]);
        const answerRows=answerResult.rows[0]||{};
        const storedCorrect=Number(attempt.correct_answers||0),storedWrong=Number(attempt.incorrect_answers||0),storedUnanswered=Number(attempt.unanswered||0);
        const hasAnswerRows=Number(answerRows.answered||0)>0;
        const correct=hasAnswerRows?Number(answerRows.correct||0):storedCorrect;
        const wrong=hasAnswerRows?Number(answerRows.wrong||0):storedWrong;
        const answered=hasAnswerRows?Number(answerRows.answered||0):correct+wrong;
        const questionCount=Number(quiz.question_count||0);
        const unanswered=hasAnswerRows?Math.max(0,questionCount-answered):Math.max(0,storedUnanswered || questionCount-answered);
        const rankResult=await query(`WITH totals AS(SELECT user_id,MAX(live_rating) rating FROM attempts WHERE quiz_id=$1 AND status!='in_progress' GROUP BY user_id) SELECT COUNT(*)::int+1 rank FROM totals WHERE rating>$2`,[quiz.id,attempt.rating]);
        mine={attempted:true,rating:Number(attempt.rating||0),rank:Number(rankResult.rows[0]?.rank||1),answered,correct,wrong,unanswered};
      }
    }
    res.json({success:true,result:{id:quiz.id,title:quiz.title,status:quiz.status,live_start_at:quiz.live_start_at,live_end_at:quiz.live_end_at,question_count:Number(quiz.question_count||0),attempts:Number(eventResult.rows[0]?.attempts||0),students:Number(eventResult.rows[0]?.students||0),avg_rating:Number(eventResult.rows[0]?.avg_rating||0),...mine}});
  }catch(e){next(e);}
});
module.exports=router;
