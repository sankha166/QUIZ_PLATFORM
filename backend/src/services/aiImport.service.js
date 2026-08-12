const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

async function extractText({ text, file }) {
  if (text && text.trim()) return text.trim();
  if (!file?.buffer) throw Object.assign(new Error('Paste content or upload a document.'), { status: 400 });

  const type = (file.mimetype || '').toLowerCase();
  if (type.includes('pdf')) {
    const parser = new PDFParse({ data: file.buffer });
    try { return (await parser.getText()).text.trim(); } finally { await parser.destroy(); }
  }
  if (type.includes('word') || type.includes('officedocument.wordprocessingml')) {
    return (await mammoth.extractRawText({ buffer: file.buffer })).value.trim();
  }
  if (type.includes('text') || /\.(txt|md)$/i.test(file.originalname || '')) {
    return file.buffer.toString('utf8').trim();
  }
  throw Object.assign(new Error('Supported files: PDF, DOC, DOCX, TXT, MD.'), { status: 400 });
}

function cleanJson(text) {
  let value = String(text || '').trim();
  value = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const first = value.indexOf('{');
  const last = value.lastIndexOf('}');
  if (first >= 0 && last > first) value = value.slice(first, last + 1);
  return value;
}

async function importQuestions({ text, file }) {
  const source = await extractText({ text, file });
  if (!source) throw Object.assign(new Error('No readable text found.'), { status: 400 });

  // GEMINI_API_KEY is preferred. OPENAI_API_KEY is accepted as a backwards-
  // compatible fallback because earlier versions of this project documented
  // that variable even when the value is actually a Gemini API key.
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) throw Object.assign(new Error('Set GEMINI_API_KEY in the backend Railway service environment variables.'), { status: 503 });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = `Extract every multiple-choice question from the educational/PYQ content below.\nReturn ONLY JSON in this exact shape: {"questions":[{"question_text":"...","marks":1,"options":[{"option_text":"...","is_correct":false}],"explanation":"..."}]}.\nPreserve the original order and wording as closely as possible. Include every option. Determine the correct answer only from an explicit answer key, answer label, or explanation in the supplied content; never invent an answer. If the source has no determinable answer, keep the question and set every option is_correct=false. Copy the explanation when present; otherwise use an empty string. Never put answer labels or explanations into question_text.\n\nSOURCE:\n${source}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    });
  } catch (err) {
    throw Object.assign(new Error(`Unable to reach Gemini: ${err.message}`), { status: 502 });
  }

  const rawResponse = await response.text();
  let data = {};
  try { data = rawResponse ? JSON.parse(rawResponse) : {}; } catch (_) {}
  if (!response.ok) {
    const detail = data?.error?.message || rawResponse.slice(0, 300);
    throw Object.assign(new Error(`Gemini request failed (${response.status}): ${detail}`), { status: 502 });
  }

  const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!raw) throw Object.assign(new Error('Gemini returned no question data. Check that GEMINI_API_KEY is valid and the selected model is available.'), { status: 502 });

  let parsed;
  try { parsed = JSON.parse(cleanJson(raw)); } catch (_) {
    throw Object.assign(new Error('Gemini returned invalid JSON. Try a smaller document or clearer question/answer format.'), { status: 502 });
  }

  const candidates = Array.isArray(parsed) ? parsed : parsed.questions;
  const questions = (Array.isArray(candidates) ? candidates : [])
    .filter((q) => q && String(q.question_text || '').trim() && Array.isArray(q.options))
    .map((q) => ({
      question_text: String(q.question_text).trim(),
      marks: Number(q.marks) || 1,
      explanation: q.explanation ? String(q.explanation).trim() : '',
      options: q.options
        .map((o) => ({ option_text: String(o.option_text || o.text || '').trim(), is_correct: Boolean(o.is_correct ?? o.correct) }))
        .filter((o) => o.option_text),
    }))
    .filter((q) => q.options.length >= 2);

  if (!questions.length) throw Object.assign(new Error('No multiple-choice questions were detected in the supplied content.'), { status: 422 });
  return { questions, source_length: source.length, detected: questions.length };
}

module.exports = { importQuestions };
