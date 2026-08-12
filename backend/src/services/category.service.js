const { query } = require('../config/db');

const getAll = async ({domain_id=null}={}) => {
  const params=[]; let where='';
  if(domain_id && domain_id!=='all'){params.push(domain_id);where='WHERE c.domain_id=$1';}
  const result=await query(`SELECT c.*,d.name AS domain_name,COUNT(q.id)::int AS quiz_count FROM categories c JOIN domains d ON d.id=c.domain_id LEFT JOIN quizzes q ON q.category_id=c.id ${where} GROUP BY c.id,d.name ORDER BY d.name,c.name`,params);
  return result.rows;
};
const getById=async(id)=>{const result=await query(`SELECT c.*,d.name AS domain_name,COUNT(q.id)::int AS quiz_count FROM categories c JOIN domains d ON d.id=c.domain_id LEFT JOIN quizzes q ON q.category_id=c.id WHERE c.id=$1 GROUP BY c.id,d.name`,[id]);if(!result.rows.length){const e=new Error('Category not found');e.status=404;throw e;}return result.rows[0];};
const create=async({name,description,domain_id})=>{if(!domain_id){const e=new Error('Domain is required');e.status=400;throw e;}const result=await query(`INSERT INTO categories(name,description,domain_id) VALUES($1,$2,$3) RETURNING *`,[name,description||null,domain_id]);return result.rows[0];};
const update=async(id,{name,description,domain_id})=>{const result=await query(`UPDATE categories SET name=$1,description=$2,domain_id=$3 WHERE id=$4 RETURNING *`,[name,description||null,domain_id,id]);if(!result.rows.length){const e=new Error('Category not found');e.status=404;throw e;}return result.rows[0];};
const remove=async(id)=>{const quizCheck=await query('SELECT id FROM quizzes WHERE category_id=$1 LIMIT 1',[id]);if(quizCheck.rows.length){const e=new Error('Cannot delete category with associated quizzes');e.status=400;throw e;}const result=await query('DELETE FROM categories WHERE id=$1 RETURNING id',[id]);if(!result.rows.length){const e=new Error('Category not found');e.status=404;throw e;}return {message:'Category deleted successfully'};};
module.exports={getAll,getById,create,update,remove};
