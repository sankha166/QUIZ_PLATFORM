const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const MAX_CHUNK_LENGTH = 10000;

async function extractText({ text, file }) {
  if (text && text.trim()) return normalizeText(text);
  if (!file?.buffer) {
    throw Object.assign(new Error('Paste content or upload a document.'), { status: 400 });
  }

  const type = (file.mimetype || '').toLowerCase();
  if (type.includes('pdf') || /\.pdf$/i.test(file.originalname || '')) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      return normalizeText((await parser.getText()).text);
    } finally {
      await parser.destroy();
    }
  }
  if (type.includes('word') || type.includes('officedocument.wordprocessingml')) {
    return normalizeText((await mammoth.extractRawText({ buffer: file.buffer })).value);
  }
  if (type.includes('text') || /\.(txt|md)$/i.test(file.originalname || '')) {
    return normalizeText(file.buffer.toString('utf8'));
  }
  throw Object.assign(new Error('Supported files: PDF, DOC, DOCX, TXT, MD.'), { status: 400 });
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitSource(source) {
  if (source.length <= MAX_CHUNK_LENGTH) return [source];
  const chunks = [];
  let remaining = source;
  while (remaining.length > MAX_CHUNK_LENGTH) {
    let cut = remaining.lastIndexOf('\n', MAX_CHUNK_LENGTH);
    if (cut < MAX_CHUNK_LENGTH * 0.55) cut = MAX_CHUNK_LENGTH;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function cleanJson(text) {
  let value = String(text || '').trim();
  value = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const first = value.indexOf('{');
  const last = value.lastIndexOf('}');
  if (first >= 0 && last > first) value = value.slice(first, last + 1);
  return value;
}

function truthyAnswer(value) {
  return value === true || ['true', 'yes', 'correct', 'right', '1'].includes(String(value || '').trim().toLowerCase());
}

function answerIndex(value, optionCount) {
  const text = String(value || '').trim().toUpperCase();
  if (!text) return -1;
  const letter = text.match(/\b(?:OPTION|ANSWER)?\s*([A-Z])\b/);
  if (letter) {
    const index = letter[1].charCodeAt(0) - 65;
    return index >= 0 && index < optionCount ? index : -1;
  }
  const numberMatch = text.match(/\b(?:OPTION|ANSWER)?\s*(\d+)\b/);
  const number = Number(numberMatch?.[1]);
  return Number.isInteger(number) && number >= 1 && number <= optionCount ? number - 1 : -1;
}

function normalizeQuestions(parsed) {
  const candidates = Array.isArray(parsed) ? parsed : parsed?.questions;
  if (!Array.isArray(candidates)) return [];
  return candidates
    .filter((q) => q && String(q.question_text || q.question || '').trim() && Array.isArray(q.options))
    .map((q) => ({
      question_text: String(q.question_text || q.question).trim(),
      marks: Number(q.marks) || 1,
      difficulty: q.difficulty ? String(q.difficulty).toLowerCase() : undefined,
      explanation: q.explanation ? String(q.explanation).trim() : '',
      question_image_url: String(q.question_image_url || q.questionImageUrl || '').trim(),
      explanation_image_url: String(q.explanation_image_url || q.explanationImageUrl || '').trim(),
      answer: q.correct_answer ?? q.answer ?? q.correctAnswer ?? '',
      options: q.options
        .map((o) => {
          const option = typeof o === 'string' ? { option_text: o } : (o || {});
          return {
          option_text: String(option.option_text || option.text || option.option || '').trim(),
          image_url: String(option.image_url || option.imageUrl || '').trim(),
          is_correct: truthyAnswer(option.is_correct ?? option.correct ?? option.isCorrect),
          };
        })
        .filter((o) => o.option_text),
    }))
    .filter((q) => q.options.length >= 2)
    .map((q) => {
      const explicitIndex = answerIndex(q.answer, q.options.length);
      if (explicitIndex >= 0) {
        q.options = q.options.map((option, index) => ({ ...option, is_correct: index === explicitIndex }));
      }
      delete q.answer;
      const correct = q.options.find((option) => option.is_correct);
      if (!q.explanation && correct) {
        q.explanation = `The correct answer is "${correct.option_text}". This is the option identified by the authoritative answer information in the supplied material.`;
      }
      return q;
    });
}

async function extractChunk({ source, sharedAnswerKey, key, model, chunkNumber, totalChunks, file }) {
  const prompt = `Extract every multiple-choice question from chunk ${chunkNumber} of ${totalChunks} of the supplied educational/PYQ document.
Return ONLY valid JSON in this exact shape:
{"questions":[{"question_text":"...","marks":1,"difficulty":"easy|medium|hard","correct_answer":"B","question_image_url":"","explanation_image_url":"","options":[{"option_text":"...","is_correct":false}],"explanation":"..."}]}

Rules:
- Preserve question order and wording as closely as possible.
- Include exactly the options visibly present in the source; do not invent options.
- A question is valid when it has at least two options. Keep four options when four are present.
- Determine the correct answer only from an explicit answer key, answer label, or explanation in the supplied content. Never guess.
- If a PDF is attached, inspect its visual formatting as well as its extracted text. A green-highlighted, green-filled, or otherwise visibly marked option is an authoritative correct answer when it is clearly associated with that question.
- Return the answer label in correct_answer (for example A, B, C, or D) as well as marking that option is_correct=true. If the source has no authoritative answer, leave correct_answer empty and mark all options false.
- If no authoritative answer is present, keep the question and set every is_correct value to false so an administrator can verify it before saving.
- An explanation is REQUIRED for every question. If the source includes an explanation, preserve its meaning. Otherwise, write a concise, self-contained explanation (one to three sentences) that explains why the explicitly correct option is correct and, when useful, why the other options are not. Base it only on the question, its options, and the authoritative answer; never invent facts.
- Never return an empty, null, or placeholder explanation such as "N/A", "not provided", or "the correct answer is the option above".
- If the source explicitly provides an image/diagram URL, put it in question_image_url or explanation_image_url. Do not invent URLs. For embedded PDF images, describe the image in the explanation but leave the URL empty unless a usable URL is supplied.
- Do not put answer keys or explanations in question_text.
- Do not omit questions because the answer key is in another chunk.

SHARED ANSWER KEY (use it when matching numbered questions):
${sharedAnswerKey || 'No separate answer key was detected in the supplied text.'}

SOURCE CHUNK:
${source}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            ...(file?.buffer && (
              (file.mimetype || '').toLowerCase().includes('pdf') ||
              /\.pdf$/i.test(file.originalname || '')
            )
              ? [{
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: file.buffer.toString('base64'),
                  },
                }]
              : []),
            { text: prompt },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          maxOutputTokens: 32768,
        },
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

  const raw = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!raw) return [];
  try {
    return normalizeQuestions(JSON.parse(cleanJson(raw)));
  } catch (_) {
    return [];
  }
}

function deduplicateQuestions(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    const key = question.question_text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parsePlainTextQuestions(source) {
  const lines = String(source || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const questions = [];
  let current = null;
  let currentOption = null;
  for (const line of lines) {
    const questionMatch = line.match(/^(?:question\s*)?(\d{1,4})[.)]\s*(.+)$/i);
    const optionMatch = line.match(/^(?:[([{]\s*)?([A-D])(?:\s*[\])}.:-]|\s{2,})\s*(.+)$/i);
    if (questionMatch) {
      if (current && current.options.length >= 2) questions.push(current);
      current = {
        question_text: questionMatch[2].trim(),
        marks: 1,
        explanation: '',
        options: [],
      };
      currentOption = null;
    } else if (current && optionMatch) {
      currentOption = {
        option_text: optionMatch[2].trim(),
        is_correct: false,
      };
      current.options.push(currentOption);
    } else if (current && currentOption) {
      currentOption.option_text = `${currentOption.option_text} ${line}`.trim();
    } else if (current) {
      current.question_text = `${current.question_text} ${line}`.trim();
    }
  }
  if (current && current.options.length >= 2) questions.push(current);
  return questions;
}

async function importQuestions({ text, file }) {
  const source = await extractText({ text, file });
  const isPdf = Boolean(file?.buffer && (
    (file.mimetype || '').toLowerCase().includes('pdf') ||
    /\.pdf$/i.test(file.originalname || '')
  ));
  if (!source && !isPdf) {
    const message = 'No readable text found.';
    throw Object.assign(new Error(message), { status: 422 });
  }

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    throw Object.assign(new Error('Set GEMINI_API_KEY in the backend Railway service environment variables.'), { status: 503 });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const chunks = splitSource(source || '[The PDF has no selectable text. Inspect the attached PDF pages visually.]');
  const answerKeyMatch = source.match(/(?:answer\s*key|answers?|correct\s*answers?|solutions?)\s*[:\-]([\s\S]{0,16000})/i);
  const sharedAnswerKey = answerKeyMatch ? answerKeyMatch[1].trim() : '';
  const extracted = [];
  for (let index = 0; index < chunks.length; index += 1) {
    extracted.push(...await extractChunk({
      source: chunks[index],
      sharedAnswerKey,
      key,
      model,
      chunkNumber: index + 1,
      totalChunks: chunks.length,
      file,
    }));
  }

  const questions = deduplicateQuestions(extracted.length ? extracted : parsePlainTextQuestions(source));
  if (!questions.length) {
    throw Object.assign(new Error(
      isPdf
        ? 'The PDF was received, but AI could not identify its questions. This usually means the deployed backend is using an old build or the PDF is image-only. Restart/redeploy the backend and try again; if it still fails, paste one page of the PDF text here to verify the format.'
        : 'No multiple-choice questions were detected. Use numbered questions with visible options such as A. Option, B. Option, C. Option, D. Option.',
    ), { status: 422 });
  }
  const incomplete_count = questions.filter((question) => (
    question.options.filter((option) => option.is_correct).length !== 1 ||
    !question.explanation.trim()
  )).length;
  return {
    questions,
    source_length: source.length,
    detected: questions.length,
    chunks_processed: chunks.length,
    incomplete_count,
  };
}

module.exports = { importQuestions };
