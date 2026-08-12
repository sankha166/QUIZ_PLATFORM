import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getQuizById,
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  updateQuizStatus,
} from '../../api/quiz.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import { difficultyColor, statusColor, getErrorMessage } from '../../utils/helpers';

const AI_IMPORT_URL =
  import.meta.env.VITE_AI_QUIZ_IMPORT_URL || '/api/admin/quizzes/import-questions';

function QuestionFormModal({ question, quizId, onSave, onClose }) {
  const [text, setText] = useState(question?.question_text || '');
  const [marks, setMarks] = useState(question?.marks || 1);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [options, setOptions] = useState(
    question?.options?.length
      ? question.options.map((o) => ({ text: o.option_text, correct: o.is_correct }))
      : [{ text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setCorrect = (idx) => setOptions((opts) => opts.map((o, i) => ({ ...o, correct: i === idx })));
  const updateOpt = (idx, val) => setOptions((opts) => opts.map((o, i) => i === idx ? { ...o, text: val } : o));
  const addOpt = () => setOptions((opts) => [...opts, { text: '', correct: false }]);
  const removeOpt = (idx) => setOptions((opts) => opts.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return setError('Question text is required');

    const valid = options.filter((o) => o.text.trim());
    if (valid.length < 2) return setError('At least 2 options required');
    if (!valid.some((o) => o.correct)) return setError('Mark one option as correct');

    setSaving(true);
    const payload = {
      question_text: text.trim(),
      marks: parseInt(marks, 10),
      explanation: explanation.trim(),
      options: valid.map((o) => ({ option_text: o.text.trim(), is_correct: o.correct })),
    };

    try {
      if (question) await updateQuestion(question.id, payload);
      else await addQuestion(quizId, payload);
      onSave();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {question ? 'Edit Question' : 'Add Question'}
            </h3>
            <p className="text-sm text-slate-500">Build a question and choose the correct answer.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900 text-xl">✕</button>
        </div>

        {error && <div className="rounded-3xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Question text *</label>
            <textarea className="input w-full" rows={4} value={text} onChange={(e) => setText(e.target.value)} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Marks</label>
              <input type="number" min={1} className="input w-full" value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
            <div>
              <label className="label">Explanation</label>
              <input className="input w-full" placeholder="Optional explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Options (select correct answer)</label>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3">
                  <input type="radio" name="correct" checked={opt.correct} onChange={() => setCorrect(i)} className="text-indigo-600 shrink-0" />
                  <input
                    className="input flex-1 min-w-0"
                    placeholder={`Option ${i + 1}`}
                    value={opt.text}
                    onChange={(e) => updateOpt(i, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOpt(i)} className="text-rose-500 hover:text-rose-700 text-lg leading-none shrink-0">×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addOpt} className="text-sm text-indigo-600 mt-2 hover:underline">+ Add option</button>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? 'Saving…' : 'Save question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AiImportModal({ quizId, onImported, onClose }) {
  const fileRef = useRef(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const importQuestions = async () => {
    if (!text.trim() && !file) {
      setError('Paste the PYQ/content or choose a PDF/document first.');
      return;
    }

    setImporting(true);
    setError('');
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append('quiz_id', quizId);
      if (text.trim()) formData.append('text', text.trim());
      if (file) formData.append('file', file);

      const response = await fetch(AI_IMPORT_URL, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.detail || result.message || 'AI import failed.');
      }

      const questions = result.questions || result.data?.questions || [];
      if (!questions.length) {
        throw new Error('The AI service returned no questions. Check the document format.');
      }

      setPreview(questions);
    } catch (err) {
      setError(err.message || 'Unable to import questions.');
    } finally {
      setImporting(false);
    }
  };

  const saveImported = async () => {
    if (!preview?.length) return;

    setImporting(true);
    setError('');

    try {
      for (const item of preview) {
        const options = (item.options || []).map((o) => ({
          option_text: o.option_text ?? o.text ?? '',
          is_correct: Boolean(o.is_correct ?? o.correct),
        })).filter((o) => o.option_text.trim());

        if (!item.question_text?.trim() || options.length < 2 || !options.some((o) => o.is_correct)) {
          continue;
        }

        await addQuestion(quizId, {
          question_text: item.question_text.trim(),
          marks: Number(item.marks || 1),
          explanation: item.explanation || '',
          options,
        });
      }

      onImported();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">AI Question Import</h3>
            <p className="text-sm text-slate-500 mt-1">
              Paste a complete PYQ or upload a PDF/document. The AI service should extract every question,
              option, correct answer and explanation.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900 text-xl">✕</button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!preview ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="label">Paste content</label>
              <textarea
                className="input w-full"
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Example:
1. What is ...?
A. ...
B. ...
C. ...
D. ...
Answer: B
Explanation: ...`}
              />
            </div>

            <div className="rounded-3xl border-2 border-dashed border-slate-200 p-5 sm:p-8 text-center">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-secondary"
              >
                {file ? 'Change document' : 'Choose PDF / Document'}
              </button>
              {file && <p className="mt-3 text-sm text-slate-600 break-all">{file.name}</p>}
              <p className="mt-2 text-xs text-slate-400">PDF, DOC, DOCX, TXT or Markdown</p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">Cancel</button>
              <button type="button" onClick={importQuestions} disabled={importing} className="btn-primary w-full sm:w-auto">
                {importing ? 'Extracting questions…' : 'Extract with AI'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              Found {preview.length} question{preview.length === 1 ? '' : 's'}. Review the extraction before saving.
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {preview.map((q, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Q{index + 1}. {q.question_text}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(q.options || []).map((o, i) => (
                      <div key={i} className={`rounded-xl border p-2.5 text-sm ${o.is_correct || o.correct ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                        {(o.is_correct || o.correct) ? '✔ ' : ''}{o.option_text || o.text}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="mt-3 text-sm text-slate-600"><span className="font-medium">Explanation:</span> {q.explanation}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button type="button" onClick={() => setPreview(null)} className="btn-secondary w-full sm:w-auto">
                Back / Re-extract
              </button>
              <button type="button" onClick={saveImported} disabled={importing} className="btn-primary w-full sm:w-auto">
                {importing ? 'Saving questions…' : `Save ${preview.length} Questions`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizDetail() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionModal, setQuestionModal] = useState(null);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [qr, qs] = await Promise.all([getQuizById(id), getQuestions(id)]);
      setQuiz(qr.data.quiz);
      setQuestions(qs.data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleDeleteQuestion = async () => {
    try {
      await deleteQuestion(deleteTarget.id);
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const toggleStatus = async () => {
    const newStatus = quiz.status === 'published' ? 'unpublished' : 'published';
    try {
      await updateQuizStatus(id, newStatus);
      fetchAll();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link to="/admin/quizzes" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 break-words">{quiz?.title}</h2>
            <p className="text-sm text-slate-500 mt-1">Manage questions, status, and quiz details.</p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
            <Link to={`/admin/quizzes/${id}/edit`} className="btn-secondary text-sm w-full sm:w-auto text-center">
              Edit Quiz
            </Link>
            <button
              onClick={() => setAiImportOpen(true)}
              className="btn-primary text-sm w-full sm:w-auto"
            >
              ✨ AI Import Questions
            </button>
            <button
              onClick={toggleStatus}
              className={`btn text-sm w-full sm:w-auto ${quiz?.status === 'published' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'btn-success'}`}
            >
              {quiz?.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-slate-600">
            <Badge className={statusColor(quiz?.status)}>{quiz?.status}</Badge>
            <Badge className={difficultyColor(quiz?.difficulty)}>{quiz?.difficulty}</Badge>
            <span>⏱ {quiz?.duration} min</span>
            <span>🎯 Pass: {quiz?.passing_score}%</span>
            <span>🔁 Max attempts: {quiz?.max_attempts}</span>
            <span>❓ {questions.length} questions</span>
          </div>

          {(quiz?.domain_name || quiz?.category_name) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {quiz?.domain_name && (
                <span className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-medium">
                  Domain: {quiz.domain_name}
                </span>
              )}
              {quiz?.category_name && (
                <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-medium">
                  Category: {quiz.category_name}
                </span>
              )}
            </div>
          )}

          {quiz?.description && <p className="text-slate-600 text-sm mt-4">{quiz.description}</p>}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Questions ({questions.length})</h3>
              <p className="text-sm text-slate-500 mt-1">Add manually or import a complete PYQ using AI.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button onClick={() => setAiImportOpen(true)} className="btn-secondary text-sm w-full sm:w-auto">
                ✨ AI Import
              </button>
              <button onClick={() => setQuestionModal('new')} className="btn-primary text-sm w-full sm:w-auto">
                + Add Question
              </button>
            </div>
          </div>

          {questions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No questions yet. Add your first question or use AI Import.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 break-words">
                        <span className="text-slate-500">Q{idx + 1}.</span> {q.question_text}
                      </p>
                      {q.explanation && <p className="mt-2 text-sm text-slate-600 break-words">💡 {q.explanation}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap shrink-0">
                      <button onClick={() => setQuestionModal(q)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-indigo-600 hover:bg-slate-100">Edit</button>
                      <button onClick={() => setDeleteTarget(q)} className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50">Delete</button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {q.options?.map((o) => (
                      <div key={o.id} className={`rounded-2xl border p-3 text-sm break-words ${o.is_correct ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                        {o.is_correct ? '✔ ' : ''}{o.option_text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {questionModal && (
        <QuestionFormModal
          quizId={id}
          question={questionModal === 'new' ? null : questionModal}
          onSave={() => { setQuestionModal(null); fetchAll(); }}
          onClose={() => setQuestionModal(null)}
        />
      )}

      {aiImportOpen && (
        <AiImportModal
          quizId={id}
          onImported={() => { setAiImportOpen(false); fetchAll(); }}
          onClose={() => setAiImportOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Question"
        message="Delete this question and all its options?"
        onConfirm={handleDeleteQuestion}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </AdminLayout>
  );
}