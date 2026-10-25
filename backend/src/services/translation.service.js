const LANGUAGES = ['hi', 'bn'];

const getKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const canTranslate = () => Boolean(getKey());

const cleanJson = (value) => {
  const text = String(value || '').replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
};

const translate = async (texts) => {
  const missing = Object.entries(texts).filter(([, value]) => String(value || '').trim());
  if (!missing.length) return {};
  const key = getKey();
  if (!key) {
    throw Object.assign(new Error('Automatic Hindi/Bengali translation requires GEMINI_API_KEY or GOOGLE_API_KEY.'), { status: 503 });
  }
  const prompt = [
    'Translate each value into Hindi and Bengali. Preserve code, numbers, punctuation, HTML, and mathematical notation exactly.',
    'Return JSON only in this shape: {"hi":{"key":"translation"},"bn":{"key":"translation"}}.',
    JSON.stringify(Object.fromEntries(missing)),
  ].join('\n');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    }),
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Translation service failed with status ${response.status}.`), { status: 503 });
  }
  const payload = await response.json();
  const output = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  let parsed;
  try {
    parsed = JSON.parse(cleanJson(output));
  } catch {
    throw Object.assign(new Error('Translation service returned an invalid response.'), { status: 503 });
  }
  return Object.fromEntries(LANGUAGES.map((language) => [
    language,
    Object.fromEntries(missing.map(([name, original]) => [
      name,
      String(parsed?.[language]?.[name] || '').trim() || original,
    ])),
  ]));
};

const fillTranslations = async (source, current = {}) => {
  const translations = { ...(current || {}) };
  const missing = Object.fromEntries(Object.entries(source || {}).filter(([name, value]) => (
    String(value || '').trim() && (!translations.hi?.[name] || !translations.bn?.[name])
  )));
  if (!Object.keys(missing).length) return translations;
  const generated = await translate(missing);
  return {
    ...translations,
    hi: { ...(translations.hi || {}), ...(generated.hi || {}) },
    bn: { ...(translations.bn || {}), ...(generated.bn || {}) },
  };
};

const translateQuestion = async (question) => {
  const source = {
    question_text: question.question_text,
    explanation: question.explanation,
    ...Object.fromEntries((question.options || []).map((option, index) => [`option_${index}`, option.option_text])),
  };
  const existingByLanguage = (language) => ({
    question_text: question.question_text_translations?.[language],
    explanation: question.explanation_translations?.[language],
    ...Object.fromEntries((question.options || []).map((option, index) => [
      `option_${index}`,
      option.option_text_translations?.[language],
    ])),
  });
  const generated = await fillTranslations(source, {
    hi: existingByLanguage('hi'),
    bn: existingByLanguage('bn'),
  });
  return {
    question_text_translations: {
      en: question.question_text,
      hi: generated.hi.question_text,
      bn: generated.bn.question_text,
    },
    explanation_translations: {
      en: question.explanation || '',
      hi: generated.hi.explanation || '',
      bn: generated.bn.explanation || '',
    },
    options: (question.options || []).map((option, index) => ({
      ...option,
      option_text_translations: {
        en: option.option_text,
        hi: generated.hi[`option_${index}`],
        bn: generated.bn[`option_${index}`],
      },
    })),
  };
};

module.exports = { canTranslate, fillTranslations, translateQuestion };
