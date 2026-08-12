const { getClient } = require('../config/db');

/** Calculate and persist quiz result. Correctness is always determined server-side. */
const calculateResult = async (attemptId, submittedAnswers, quiz) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const questionsResult = await client.query(`SELECT q.id AS question_id,q.marks,(SELECT id FROM options WHERE question_id=q.id AND is_correct=TRUE LIMIT 1) AS correct_option_id FROM questions q WHERE q.quiz_id=$1`, [quiz.id]);
    const questions = questionsResult.rows;
    const correctMap = {};
    let totalMarks = 0;
    for (const q of questions) { correctMap[q.question_id]={correctOptionId:q.correct_option_id,marks:q.marks}; totalMarks += q.marks; }
    const submittedMap = {};
    for (const a of (submittedAnswers || [])) submittedMap[a.questionId]={optionId:a.selectedOptionId,timeTaken:Math.max(0,Number(a.timeTaken)||0)};
    let correct=0,incorrect=0,unanswered=0,obtainedMarks=0;
    for (const q of questions) {
      const submitted=submittedMap[q.question_id];
      const selectedOptionId=submitted?.optionId || null;
      const timeTaken=submitted?.timeTaken || 0;
      let isCorrect=null;
      if (selectedOptionId===null) unanswered++;
      else if (selectedOptionId===q.correct_option_id) {isCorrect=true;correct++;obtainedMarks+=q.marks;}
      else {isCorrect=false;incorrect++;}
      await client.query(`INSERT INTO answers (attempt_id,question_id,selected_option_id,is_correct,time_taken) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (attempt_id,question_id) DO UPDATE SET selected_option_id=EXCLUDED.selected_option_id,is_correct=EXCLUDED.is_correct,time_taken=EXCLUDED.time_taken`,[attemptId,q.question_id,selectedOptionId,isCorrect,timeTaken]);
    }
    const percentage=totalMarks>0?(obtainedMarks/totalMarks)*100:0;
    const status=percentage>=quiz.passing_score?'passed':'failed';
    const attemptResult=await client.query('SELECT started_at FROM attempts WHERE id=$1',[attemptId]);
    const timeTaken=Math.round((Date.now()-new Date(attemptResult.rows[0].started_at).getTime())/1000);
    await client.query(`UPDATE attempts SET score=$1,percentage=$2,correct_answers=$3,incorrect_answers=$4,unanswered=$5,time_taken=$6,status=$7,completed_at=NOW() WHERE id=$8`,[obtainedMarks,percentage.toFixed(2),correct,incorrect,unanswered,timeTaken,status,attemptId]);
    await client.query('COMMIT');
    return {attemptId,score:obtainedMarks,totalMarks,percentage:parseFloat(percentage.toFixed(2)),correctAnswers:correct,incorrectAnswers:incorrect,unanswered,timeTaken,status};
  } catch(err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
};
module.exports={calculateResult};
