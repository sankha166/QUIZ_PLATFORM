const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

async function extractText({ text, file }) {
  if (text && text.trim()) return text.trim();
  if (!file?.buffer) {
    throw Object.assign(new Error('Paste text or upload a document'), { status: 400 });
  }

  const type = (file.mimetype || '').toLowerCase();
  if (type.includes('pdf')) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      return (await parser.getText()).text.trim();
    } finally {
      await parser.destroy();
    }
  }
  if (type.includes('word') || type.includes('officedocument.wordprocessingml')) {
    return (await mammoth.extractRawText({ buffer: file.buffer })).value.trim();
  }
  if (type.includes('text') || /\.(txt|md)$/i.test(file.originalname || '')) {
    return file.buffer.toString('utf8').trim();
  }
  throw Object.assign(new Error('Supported files: PDF, DOCX, TXT, MD'), { status: 400 });
}

const QUESTION_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      question_text: { type: 'STRING' },
      marks: { type: 'NUMBER' },
      difficulty: { type: 'STRING', nullable: true },
      options: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            option_text: { type: 'STRING' },
            is_correct: { type: 'BOOLEAN' },
          },
          required: ['option_text', 'is_correct'],
        },
      },
      explanation: { type: 'STRING', nullable: true },
    },
    required: ['question_text', 'options'],
  },
};

async function importQuestions({ text, file }) {
  const source = await extractText({ text, file });
  if (!source) {
    throw Object.assign(new Error('No readable text found'), { status: 400 });
  }

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured on the backend'), { status: 503 });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = `Extract EVERY multiple-choice question from the supplied educational/PYQ document.
Preserve the exact question wording as much as possible, every option, the correct answer, and the explanation when present.
Do not invent missing answers or explanations.
Return one object per question in the JSON array.
Exactly one option must have is_correct=true when the answer can be determined.
If a question's correct answer cannot be determined from the supplied document, omit that question rather than guessing.
Do not include answer-key labels or explanation text inside question_text.
Keep the original order and include every extractable question.
For difficulty, use only easy, medium, hard, or null. Marks should be the stated marks when available, otherwise 1.

DOCUMENT:\n${source}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: QUESTION_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errorBody = await response.json();
      detail = errorBody?.error?.message ? `: ${errorBody.error.message}` : '';
    } catch (_) {}
    throw Object.assign(new Error(`Gemini AI import failed (${response.status})${detail}`), { status: 502 });
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!raw) {
    throw Object.assign(new Error('Gemini returned no structured question data'), { status: 502 });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    throw Object.assign(new Error('Gemini returned invalid structured data'), { status: 502 });
  }

  const candidates = Array.isArray(parsed) ? parsed : parsed.questions;
  const questions = (Array.isArray(candidates) ? candidates : [])
    .filter((q) => q?.question_text && Array.isArray(q.options) && q.options.length >= 2)
    .map((q) => ({
      ...q,
      marks: Number(q.marks) || 1,
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : null,
      explanation: q.explanation || null,
      options: q.options.map((o) => ({
        option_text: String(o.option_text || '').trim(),
        is_correct: Boolean(o.is_correct),
      })),
    }))
    .filter((q) => q.options.filter((o) => o.is_correct).length === 1 && q.options.every((o) => o.option_text));

  return { questions, source_length: source.length, detected: questions.length };
}

module.exports = { importQuestions };
