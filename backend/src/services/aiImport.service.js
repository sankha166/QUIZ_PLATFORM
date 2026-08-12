const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractText({ text, file }) {
  if (text && text.trim()) return text.trim();
  if (!file?.buffer) throw Object.assign(new Error('Paste text or upload a document'), {status:400});
  const type=(file.mimetype||'').toLowerCase();
  if(type.includes('pdf')) return (await pdfParse(file.buffer)).text.trim();
  if(type.includes('word') || type.includes('officedocument.wordprocessingml')) return (await mammoth.extractRawText({buffer:file.buffer})).value.trim();
  if(type.includes('text') || /\.(txt|md)$/i.test(file.originalname||'')) return file.buffer.toString('utf8').trim();
  throw Object.assign(new Error('Supported files: PDF, DOCX, TXT, MD'),{status:400});
}

async function importQuestions({text,file}) {
  const source=await extractText({text,file});
  if(!source) throw Object.assign(new Error('No readable text found'),{status:400});
  const key=process.env.OPENAI_API_KEY;
  if(!key) throw Object.assign(new Error('OPENAI_API_KEY is not configured on the backend'),{status:503});
  const model=process.env.OPENAI_MODEL||'gpt-4o-mini';
  const prompt=`Extract EVERY multiple-choice question from the supplied educational/PYQ document. Preserve wording, all options, the correct answer and explanation when present. Do not invent missing answers or explanations. Return ONLY JSON matching this schema: {"questions":[{"question_text":"string","marks":1,"difficulty":"easy|medium|hard|null","options":[{"option_text":"string","is_correct":true}],"explanation":"string|null"}]}. Exactly one option must be correct when an answer can be determined. If an answer is not present or cannot be determined, omit that question rather than guessing. Remove answer-key/explanation text from question_text. Include all questions, not only examples.\n\nDOCUMENT:\n${source}`;
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,input:prompt,text:{format:{type:'json_object'}}})});
  if(!response.ok) throw Object.assign(new Error(`AI import failed (${response.status})`),{status:502});
  const data=await response.json();
  const raw=data.output_text||data.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';
  let parsed;try{parsed=JSON.parse(raw);}catch{throw Object.assign(new Error('AI returned invalid structured data'),{status:502});}
  const questions=(parsed.questions||[]).filter(q=>q.question_text&&Array.isArray(q.options)&&q.options.length>=2&&q.options.filter(o=>o.is_correct).length===1).map(q=>({...q,marks:Number(q.marks)||1,explanation:q.explanation||null}));
  return {questions,source_length:source.length,detected:questions.length};
}
module.exports={importQuestions};
