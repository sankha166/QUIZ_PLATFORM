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
    for (const q of questions) {
      const marks = Number(q.marks);
      if (!Number.isFinite(marks) || marks < 0) throw new Error(`Invalid marks configured for question ${q.question_id}`);
      correctMap[q.question_id] = { correctOptionId: q.correct_option_id, marks };
      totalMarks += marks;
    }
    const submittedMap = {};
    for (const a of (submittedAnswers || [])) submittedMap[a.questionId]={optionId:a.selectedOptionId,timeTaken:Math.max(0,Number(a.timeTaken)||0),marked:Boolean(a.marked)};
    let correct=0,incorrect=0,unanswered=0,obtainedMarks=0,negativeMarks=0;
    const negativePercent = Math.min(100, Math.max(0, Number(quiz.negative_marking_percent) || 0));
    for (const q of questions) {
      const marks = correctMap[q.question_id].marks;
      const submitted=submittedMap[q.question_id];
      const selectedOptionId=submitted?.optionId || null;
      const timeTaken=submitted?.timeTaken || 0;
      let isCorrect=null;
      if (selectedOptionId===null) unanswered++;
      else if (String(selectedOptionId) === String(q.correct_option_id)) {isCorrect=true;correct++;}
      else {isCorrect=false;incorrect++; negativeMarks += marks * negativePercent / 100; }
      const marksAwarded = isCorrect === true ? marks : isCorrect === false ? -(marks * negativePercent / 100) : 0;
      obtainedMarks += marksAwarded;
      await client.query(`INSERT INTO answers (attempt_id,question_id,selected_option_id,is_correct,time_taken,marked,marks_awarded) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (attempt_id,question_id) DO UPDATE SET selected_option_id=EXCLUDED.selected_option_id,is_correct=EXCLUDED.is_correct,time_taken=EXCLUDED.time_taken,marked=EXCLUDED.marked,marks_awarded=EXCLUDED.marks_awarded`,[attemptId,q.question_id,selectedOptionId,isCorrect,timeTaken,Boolean(submitted?.marked),marksAwarded]);
    }
    const safeTotalMarks = Number(totalMarks.toFixed(2));
    const safeObtainedMarks = Number(obtainedMarks.toFixed(2));
    const percentage = safeTotalMarks > 0 ? Number(((safeObtainedMarks / safeTotalMarks) * 100).toFixed(2)) : 0;
    const passingScore = Number(quiz.passing_score) || 0;
    const status=percentage>=passingScore?'passed':'failed';
    const attemptResult=await client.query('SELECT started_at FROM attempts WHERE id=$1',[attemptId]);
    const timeTaken=Math.round((Date.now()-new Date(attemptResult.rows[0].started_at).getTime())/1000);
    await client.query(`UPDATE attempts SET score=$1,percentage=$2,correct_answers=$3,incorrect_answers=$4,unanswered=$5,time_taken=$6,status=$7,completed_at=NOW() WHERE id=$8`,[safeObtainedMarks,percentage,correct,incorrect,unanswered,timeTaken,status,attemptId]);
    await client.query('COMMIT');
    return {attemptId,score:safeObtainedMarks,totalMarks:safeTotalMarks,negativeMarks:Number(negativeMarks.toFixed(2)),percentage,correctAnswers:correct,incorrectAnswers:incorrect,unanswered,timeTaken,status};
  } catch(err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
};
module.exports={calculateResult};
