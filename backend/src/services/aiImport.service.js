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

  if (
    type.includes('word') ||
    type.includes('officedocument.wordprocessingml')
  ) {
    return (await mammoth.extractRawText({ buffer: file.buffer })).value.trim();
  }

  if (type.includes('text') || /\.(txt|md)$/i.test(file.originalname || '')) {
    return file.buffer.toString('utf8').trim();
  }

  throw Object.assign(
    new Error('Supported files: PDF, DOCX, TXT, MD'),
    { status: 400 }
  );
}

const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question_text: {
            type: 'string',
            description: 'The complete question text without answer-key or explanation text.',
          },
          marks: {
            type: 'integer',
            description: 'Marks assigned to the question if explicitly available; otherwise 1.',
          },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard', 'unknown'],
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                option_text: { type: 'string' },
                is_correct: { type: 'boolean' },
              },
              required: ['option_text', 'is_correct'],
            },
          },
          explanation: {
            type: 'string',
            description: 'The explanation supplied by the source, or an empty string if none is present.',
          },
        },
        required: [
          'question_text',
          'marks',
          'difficulty',
          'options',
          'explanation',
        ],
      },
    },
  },
  required: ['questions'],
};

async function importQuestions({ text, file }) {
  const source = await extractText({ text, file });

  if (!source) {
    throw Object.assign(new Error('No readable text found'), { status: 400 });
  }

  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw Object.assign(
      new Error('GEMINI_API_KEY is not configured on the backend'),
      { status: 503 }
    );
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const prompt = `You are a highly accurate exam-question extraction system.

Extract EVERY multiple-choice question from the supplied educational/PYQ document.

Rules:
1. Preserve the original question wording as closely as possible.
2. Extract every available option.
3. Identify the correct answer only when the source provides enough evidence, such as an answer key, marked answer, or unambiguous answer information in the supplied document.
4. Do NOT guess a correct answer.
5. Do NOT invent an explanation.
6. Preserve the explanation when the source provides one.
7. Remove answer-key labels and explanation text from question_text.
8. Include every question for which a single correct answer can be determined.
9. If a question has no determinable correct answer, omit it rather than guessing.
10. If marks are not explicitly present, use 1.
11. If difficulty is not explicitly present or cannot be reasonably inferred from the question, use "unknown".
12. Return structured JSON only.

DOCUMENT:
${source}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: QUESTION_SCHEMA,
          temperature: 0,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw Object.assign(
      new Error(`Gemini AI import failed (${response.status})${errorText ? `: ${errorText.slice(0, 500)}` : ''}`),
      { status: 502 }
    );
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('') || '';

  if (!raw) {
    throw Object.assign(new Error('Gemini returned an empty response'), {
      status: 502,
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw Object.assign(
      new Error('Gemini returned invalid structured data'),
      { status: 502 }
    );
  }

  const questions = (parsed.questions || [])
    .filter(
      (q) =>
        q &&
        typeof q.question_text === 'string' &&
        q.question_text.trim() &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.every(
          (o) =>
            o &&
            typeof o.option_text === 'string' &&
            o.option_text.trim() &&
            typeof o.is_correct === 'boolean'
        ) &&
        q.options.filter((o) => o.is_correct).length === 1
    )
    .map((q) => ({
      question_text: q.question_text.trim(),
      marks: Number.isInteger(q.marks) && q.marks > 0 ? q.marks : 1,
      difficulty:
        ['easy', 'medium', 'hard'].includes(q.difficulty)
          ? q.difficulty
          : null,
      options: q.options.map((o) => ({
        option_text: o.option_text.trim(),
        is_correct: o.is_correct,
      })),
      explanation: q.explanation?.trim() || null,
    }));

  return {
    questions,
    source_length: source.length,
    detected: questions.length,
  };
}

module.exports = { importQuestions };
