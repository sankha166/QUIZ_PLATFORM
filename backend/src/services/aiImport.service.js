const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

async function extractText({ text, file }) {
  if (text && text.trim()) return text.trim();
  if (!file?.buffer) throw Object.assign(new Error('Paste text or upload a document'), { status: 400 });
  const type = (file.mimetype || '').toLowerCase();
  if (type.includes('pdf')) {
    const parser = new PDFParse({ data: file.buffer });
    try { return (await parser.getText()).text.trim(); } finally { await parser.destroy(); }
  }
  if (type.includes('word') || type.includes('officedocument.wordprocessingml')) {
    return (await mammoth.extractRawText({ buffer: file.buffer })).value.trim();
  }
  if (type.includes('text') || /\.(txt|md)$/i.test(file.originalname || '')) return file.buffer.toString('utf8').trim();
  throw Object.assign(new Error('Supported files: PDF, DOCX, TXT, MD'), { status: 400 });
}

function cleanJson(text) {
  return String(text || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function importQuestions({ text, file }) {
  const source = await extractText({ text, file });
  if (!source) throw Object.assign(new Error('No readable text found'), { status: 400 });
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw Object.assign(new Error('GEMINI_API_KEY is not configured on the backend'), { status: 503 });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = `You are a reliable exam-question extraction engine. Extract EVERY multiple-choice question from the document below.\n\nReturn ONLY valid JSON, with this exact top-level shape: {"questions":[...]}. Each question must contain question_text, marks, options, explanation. Each option must contain option_text and is_correct. Preserve the original wording and order. Keep all options. Determine the correct answer from an explicit answer/key/explanation in the source. Do not guess. If the source does not provide a determinable correct answer, still extract the question but set all is_correct values to false. Use the explanation from the source when present; otherwise use an empty string. marks defaults to 1.\n\nDOCUMENT:\n${source}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
  });
  if (!response.ok) {
    let detail = '';
    try { const body = await response.json(); detail = body?.error?.message ? `: ${body.error.message}` : ''; } catch (_) {}
    throw Object.assign(new Error(`Gemini AI import failed (${response.status})${detail}`), { status: 502 });
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!raw) throw Object.assign(new Error('Gemini returned no question data'), { status: 502 });

  let parsed;
  try { parsed = JSON.parse(cleanJson(raw)); } catch (_) {
    throw Object.assign(new Error('Gemini returned invalid JSON. Try a smaller document or clearer answer key.'), { status: 502 });
  }

  const candidates = Array.isArray(parsed) ? parsed : parsed.questions;
  const questions = (Array.isArray(candidates) ? candidates : [])
    .filter((q) => q && q.question_text && Array.isArray(q.options))
    .map((q) => ({
      question_text: String(q.question_text).trim(),
      marks: Number(q.marks) || 1,
      explanation: q.explanation ? String(q.explanation).trim() : '',
      options: q.options.map((o) => ({ option_text: String(o.option_text || '').trim(), is_correct: Boolean(o.is_correct) })).filter((o) => o.option_text),
    }))
    .filter((q) => q.options.length >= 2);

  return { questions, source_length: source.length, detected: questions.length };
}

module.exports = { importQuestions };
