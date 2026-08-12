const { query } = require('../config/db');

const getAllAttempts = async ({ page = 1, limit = 10 } = {}) => {
  const offset=(page-1)*limit;
  const result=await query(`SELECT a.*,u.name AS student_name,u.email AS student_email,q.title AS quiz_title FROM attempts a JOIN users u ON u.id=a.user_id JOIN quizzes q ON q.id=a.quiz_id WHERE a.status!='in_progress' ORDER BY a.completed_at DESC LIMIT $1 OFFSET $2`,[limit,offset]);
  const countResult=await query(`SELECT COUNT(*)::int AS total FROM attempts WHERE status!='in_progress'`);
  return {attempts:result.rows,total:countResult.rows[0].total,page:Number(page),limit:Number(limit)};
};

const getAttemptById=async(id)=>{
  const attemptResult=await query(`SELECT a.*,u.name AS student_name,u.email AS student_email,q.title AS quiz_title FROM attempts a JOIN users u ON u.id=a.user_id JOIN quizzes q ON q.id=a.quiz_id WHERE a.id=$1`,[id]);
  if(!attemptResult.rows.length){const err=new Error('Attempt not found');err.status=404;throw err;}
  const answersResult=await query(`SELECT ans.*,q.question_text,q.explanation,sel.option_text AS selected_option_text,cor.option_text AS correct_option_text FROM answers ans JOIN questions q ON q.id=ans.question_id LEFT JOIN options sel ON sel.id=ans.selected_option_id LEFT JOIN options cor ON cor.question_id=q.id AND cor.is_correct=TRUE WHERE ans.attempt_id=$1 ORDER BY q.id`,[id]);
  return {...attemptResult.rows[0],answers:answersResult.rows};
};

const getAnalytics=async({domain_id=null}={})=>{
  const scoped=domain_id!==null&&domain_id!==undefined&&domain_id!==''&&domain_id!=='all';
  const params=scoped?[domain_id]:[];
  const qJoin=`JOIN categories c ON c.id=q.category_id`;
  const filter=scoped?'AND c.domain_id=$1':'';
  const [totalStudents,totalQuizzes,publishedQuizzes,draftQuizzes,totalQuestions,totalAttempts,avgScore,passedAttempts,failedAttempts]=await Promise.all([
    scoped?query(`SELECT COUNT(DISTINCT a.user_id)::int AS cnt FROM attempts a JOIN quizzes q ON q.id=a.quiz_id ${qJoin} WHERE a.status!='in_progress' ${filter}`,params):query(`SELECT COUNT(*)::int AS cnt FROM users WHERE role='STUDENT'`),
    query(`SELECT COUNT(*)::int AS cnt FROM quizzes q ${qJoin} WHERE 1=1 ${filter}`,params),
    query(`SELECT COUNT(*)::int AS cnt FROM quizzes q ${qJoin} WHERE q.status='published' ${filter}`,params),
    query(`SELECT COUNT(*)::int AS cnt FROM quizzes q ${qJoin} WHERE q.status='draft' ${filter}`,params),
    query(`SELECT COUNT(*)::int AS cnt FROM questions qu JOIN quizzes q ON q.id=qu.quiz_id ${qJoin} WHERE 1=1 ${filter}`,params),
    query(`SELECT COUNT(*)::int AS cnt FROM attempts a JOIN quizzes q ON q.id=a.quiz_id ${qJoin} WHERE a.status!='in_progress' ${filter}`,params),
    query(`SELECT COALESCE(AVG(a.percentage),0)::numeric(5,2) AS avg FROM attempts a JOIN quizzes q ON q.id=a.quiz_id ${qJoin} WHERE a.status!='in_progress' ${filter}`,params),
    query(`SELECT COUNT(*)::int AS cnt FROM attempts a JOIN quizzes q ON q.id=a.quiz_id ${qJoin} WHERE a.status='passed' ${filter}`,params),
    query(`SELECT COUNT(*)::int AS cnt FROM attempts a JOIN quizzes q ON q.id=a.quiz_id ${qJoin} WHERE a.status='failed' ${filter}`,params)
  ]);
  const attemptsOverTime=await query(`SELECT DATE(a.completed_at) AS date,COUNT(*)::int AS count FROM attempts a JOIN quizzes q ON q.id=a.quiz_id ${qJoin} WHERE a.status!='in_progress' AND a.completed_at>=NOW()-INTERVAL '30 days' ${filter} GROUP BY DATE(a.completed_at) ORDER BY date ASC`,params);
  const registrations=scoped?await query(`SELECT DATE(a.completed_at) AS date,COUNT(DISTINCT a.user_id)::int AS count FROM attempts a JOIN quizzes q ON q.id=a.quiz_id ${qJoin} WHERE a.status!='in_progress' AND a.completed_at>=NOW()-INTERVAL '30 days' ${filter} GROUP BY DATE(a.completed_at) ORDER BY date ASC`,params):await query(`SELECT DATE(created_at) AS date,COUNT(*)::int AS count FROM users WHERE role='STUDENT' AND created_at>=NOW()-INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date ASC`);
  const popularQuizzes=await query(`SELECT q.title,COUNT(a.id)::int AS attempts FROM quizzes q ${qJoin} LEFT JOIN attempts a ON a.quiz_id=q.id AND a.status!='in_progress' WHERE 1=1 ${filter} GROUP BY q.id,q.title ORDER BY attempts DESC LIMIT 5`,params);
  const avgScorePerQuiz=await query(`SELECT q.title,COALESCE(AVG(a.percentage),0)::numeric(5,2) AS avg_score FROM quizzes q ${qJoin} LEFT JOIN attempts a ON a.quiz_id=q.id AND a.status!='in_progress' WHERE 1=1 ${filter} GROUP BY q.id,q.title ORDER BY avg_score DESC LIMIT 8`,params);
  const popularCategories=await query(`SELECT c.name,COUNT(a.id)::int AS attempts FROM categories c JOIN quizzes q ON q.category_id=c.id LEFT JOIN attempts a ON a.quiz_id=q.id AND a.status!='in_progress' ${scoped?'WHERE c.domain_id=$1':''} GROUP BY c.id,c.name ORDER BY attempts DESC LIMIT 6`,params);
  return {domain_id:scoped?domain_id:'all',stats:{totalStudents:totalStudents.rows[0].cnt,totalQuizzes:totalQuizzes.rows[0].cnt,publishedQuizzes:publishedQuizzes.rows[0].cnt,draftQuizzes:draftQuizzes.rows[0].cnt,totalQuestions:totalQuestions.rows[0].cnt,totalAttempts:totalAttempts.rows[0].cnt,averageScore:parseFloat(avgScore.rows[0].avg),passedAttempts:passedAttempts.rows[0].cnt,failedAttempts:failedAttempts.rows[0].cnt},charts:{attemptsOverTime:attemptsOverTime.rows,studentRegistrations:registrations.rows,popularQuizzes:popularQuizzes.rows,avgScorePerQuiz:avgScorePerQuiz.rows,popularCategories:popularCategories.rows,passFail:[{name:'Passed',value:passedAttempts.rows[0].cnt},{name:'Failed',value:failedAttempts.rows[0].cnt}]}};
};

module.exports={getAllAttempts,getAttemptById,getAnalytics};
