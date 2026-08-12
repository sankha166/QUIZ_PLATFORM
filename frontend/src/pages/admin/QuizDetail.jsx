import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuizById, getQuestions, addQuestion, updateQuestion, deleteQuestion, updateQuizStatus } from '../../api/quiz.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import { statusColor, getErrorMessage } from '../../utils/helpers';

const AI_IMPORT_URL = import.meta.env.VITE_AI_QUIZ_IMPORT_URL || '/api/admin/import-questions';

function QuestionFormModal({ question, quizId, onSave, onClose }) {
  const [text, setText] = useState(question?.question_text || '');
  const [marks, setMarks] = useState(question?.marks || 1);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [options, setOptions] = useState(question?.options?.length ? question.options.map((o) => ({ text: o.option_text, correct: o.is_correct })) : [{ text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }]);
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const valid = options.filter((o) => o.text.trim());
    if (!text.trim()) return setError('Question text is required');
    if (valid.length < 2) return setError('At least 2 options required');
    if (!valid.some((o) => o.correct)) return setError('Mark one option as correct');
    setSaving(true); setError('');
    try {
      const payload = { question_text: text.trim(), marks: Number(marks) || 1, explanation: explanation.trim(), options: valid.map((o) => ({ option_text: o.text.trim(), is_correct: o.correct })) };
      if (question) await updateQuestion(question.id, payload); else await addQuestion(quizId, payload);
      onSave();
    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4"><div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
    <div className="mb-4 flex items-center justify-between"><div><h3 className="text-xl font-semibold">{question ? 'Edit Question' : 'Add Question'}</h3><p className="text-sm text-slate-500">Build a question and choose the correct answer.</p></div><button onClick={onClose} className="text-xl text-slate-500">✕</button></div>
    {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    <form onSubmit={submit} className="space-y-4"><div><label className="label">Question text *</label><textarea className="input w-full" rows={4} value={text} onChange={(e) => setText(e.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Marks</label><input type="number" min="1" className="input w-full" value={marks} onChange={(e) => setMarks(e.target.value)} /></div><div><label className="label">Explanation</label><input className="input w-full" value={explanation} onChange={(e) => setExplanation(e.target.value)} /></div></div><div><label className="label">Options</label><div className="space-y-2">{options.map((o, i) => <div key={i} className="flex gap-2"><input type="radio" checked={o.correct} onChange={() => setOptions((x) => x.map((v, j) => ({ ...v, correct: j === i })))} /><input className="input min-w-0 flex-1" placeholder={`Option ${i + 1}`} value={o.text} onChange={(e) => setOptions((x) => x.map((v, j) => j === i ? { ...v, text: e.target.value } : v))} />{options.length > 2 && <button type="button" onClick={() => setOptions((x) => x.filter((_, j) => j !== i))} className="text-lg text-rose-500">×</button>}</div>)}</div><button type="button" onClick={() => setOptions((x) => [...x, { text: '', correct: false }])} className="mt-2 text-sm text-indigo-600">+ Add option</button></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save question'}</button></div></form>
  </div></div>;
}

function AiImportModal({ quizId, onImported, onClose }) {
  const fileRef = useRef(null); const [text, setText] = useState(''); const [file, setFile] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [preview, setPreview] = useState(null);
  const importQuestions = async () => {
    if (!text.trim() && !file) return setError('Paste content or choose a document first.');
    setLoading(true); setError('');
    try {
      const formData = new FormData(); formData.append('quiz_id', String(quizId)); if (text.trim()) formData.append('text', text.trim()); if (file) formData.append('file', file);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(AI_IMPORT_URL, { method: 'POST', headers, body: formData });
      const raw = await response.text(); let result = {}; try { result = raw ? JSON.parse(raw) : {}; } catch (_) { result = {}; }
      if (!response.ok) throw new Error(result.detail || result.message || `AI import failed (${response.status})`);
      const questions = result.questions || result.data?.questions || [];
      if (!questions.length) throw new Error('Gemini returned no questions. Include the question, options and answer key in the pasted content/document.');
      setPreview(questions);
    } catch (err) { setError(err.message || 'Unable to import questions.'); } finally { setLoading(false); }
  };
  const saveImported = async () => {
    if (!preview?.length) return;
    setLoading(true); setError(''); let saved = 0;
    try {
      for (const item of preview) {
        const options = (item.options || []).map((o) => ({ option_text: String(o.option_text ?? o.text ?? '').trim(), is_correct: Boolean(o.is_correct ?? o.correct) })).filter((o) => o.option_text);
        if (!item.question_text?.trim() || options.length < 2 || !options.some((o) => o.is_correct)) continue;
        await addQuestion(quizId, { question_text: item.question_text.trim(), marks: Number(item.marks) || 1, explanation: item.explanation || '', options }); saved += 1;
      }
      if (!saved) throw new Error('No valid extracted questions could be saved.');
      onImported();
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4"><div className="w-full max-w-4xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">AI Question Import</h3><p className="mt-1 text-sm text-slate-500">Gemini extracts questions, options, correct answers and explanations from pasted PYQs or documents.</p></div><button onClick={onClose} className="text-xl text-slate-500">✕</button></div>
    {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    {!preview ? <div className="mt-5 space-y-4"><div><label className="label">Paste PYQ/content</label><textarea className="input w-full" rows={11} value={text} onChange={(e) => setText(e.target.value)} placeholder={'1. What is 2 + 2?\nA. 3\nB. 4\nC. 5\nD. 6\nAnswer: B\nExplanation: 2 + 2 equals 4.'} /></div><div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center"><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} /><button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">{file ? 'Change document' : 'Choose PDF / Document'}</button>{file && <p className="mt-2 break-all text-sm text-slate-600">{file.name}</p>}<p className="mt-2 text-xs text-slate-400">PDF, DOC, DOCX, TXT or MD</p></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={importQuestions} disabled={loading} className="btn-primary">{loading ? 'Extracting…' : 'Extract with AI'}</button></div></div> : <div className="mt-5 space-y-4"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Found {preview.length} question{preview.length === 1 ? '' : 's'}. Review before saving.</div><div className="max-h-[52vh] space-y-3 overflow-y-auto">{preview.map((q, i) => <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold">Q{i + 1}. {q.question_text}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{(q.options || []).map((o, j) => <div key={j} className={`rounded-xl border p-2 text-sm ${o.is_correct || o.correct ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'bg-white text-slate-700'}`}>{o.is_correct || o.correct ? '✓ ' : ''}{o.option_text || o.text}</div>)}</div>{q.explanation && <p className="mt-3 text-sm text-slate-600"><b>Explanation:</b> {q.explanation}</p>}</div>)}</div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => setPreview(null)} className="btn-secondary">Back</button><button onClick={saveImported} disabled={loading} className="btn-primary">{loading ? 'Saving…' : `Save ${preview.length} Questions`}</button></div></div>}
  </div></div>;
}

export default function QuizDetail() {
  const { id } = useParams(); const [quiz, setQuiz] = useState(null); const [questions, setQuestions] = useState([]); const [loading, setLoading] = useState(true); const [questionModal, setQuestionModal] = useState(null); const [aiOpen, setAiOpen] = useState(false); const [deleteTarget, setDeleteTarget] = useState(null);
  const fetchAll = async () => { setLoading(true); try { const [q, qs] = await Promise.all([getQuizById(id), getQuestions(id)]); setQuiz(q.data.quiz); setQuestions(qs.data.questions || []); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchAll(); }, [id]);
  const toggleStatus = async () => { try { await updateQuizStatus(id, quiz.status === 'published' ? 'unpublished' : 'published'); fetchAll(); } catch (e) { alert(getErrorMessage(e)); } };
  const removeQuestion = async () => { try { await deleteQuestion(deleteTarget.id); setDeleteTarget(null); fetchAll(); } catch (e) { alert(getErrorMessage(e)); } };
  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;
  return <AdminLayout><div className="min-w-0 space-y-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><Link to="/admin/quizzes" className="text-sm text-slate-500">← Back</Link><h2 className="mt-3 break-words text-2xl font-bold sm:text-3xl">{quiz?.title}</h2><p className="mt-1 text-sm text-slate-500">Manage questions, status and quiz details.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setAiOpen(true)} className="btn-primary">AI Import</button><button onClick={() => setQuestionModal({})} className="btn-secondary">+ Add Question</button><button onClick={toggleStatus} className="btn-secondary">{quiz?.status === 'published' ? 'Unpublish' : 'Publish'}</button></div></div><div className="card"><div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><div><p className="text-xs text-slate-500">Category</p><p className="mt-1 font-semibold">{quiz?.category_name || '—'}</p></div><div><p className="text-xs text-slate-500">Domain</p><p className="mt-1 font-semibold">{quiz?.domain_name || '—'}</p></div><div><p className="text-xs text-slate-500">Questions</p><p className="mt-1 font-semibold">{questions.length}</p></div><div><p className="text-xs text-slate-500">Status</p><Badge className={statusColor(quiz?.status)}>{quiz?.status}</Badge></div></div></div><div className="card overflow-hidden p-0"><div className="border-b p-4"><h3 className="font-semibold">Questions ({questions.length})</h3></div>{questions.length === 0 ? <div className="p-8 text-center text-slate-500">No questions yet. Add manually or use AI Import.</div> : <div className="divide-y">{questions.map((q, i) => <div key={q.id} className="p-4"><div className="flex flex-col gap-3 sm:flex-row"><span className="font-semibold text-indigo-600">Q{i + 1}</span><div className="min-w-0 flex-1"><p className="whitespace-pre-wrap font-medium">{q.question_text}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{q.options?.map((o) => <div key={o.id} className={`rounded-xl border p-2 text-sm ${o.is_correct ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}`}>{o.is_correct ? '✓ ' : ''}{o.option_text}</div>)}</div>{q.explanation && <p className="mt-3 text-sm text-slate-500"><b>Explanation:</b> {q.explanation}</p>}</div><div className="flex shrink-0 gap-3 sm:self-start"><button onClick={() => setQuestionModal(q)} className="text-sm text-indigo-600">Edit</button><button onClick={() => setDeleteTarget(q)} className="text-sm text-red-600">Delete</button></div></div></div>)}</div>}</div></div>{questionModal && <QuestionFormModal question={questionModal.id ? questionModal : null} quizId={id} onSave={() => { setQuestionModal(null); fetchAll(); }} onClose={() => setQuestionModal(null)} />}{aiOpen && <AiImportModal quizId={id} onImported={() => { setAiOpen(false); fetchAll(); }} onClose={() => setAiOpen(false)} />}<ConfirmModal isOpen={!!deleteTarget} title="Delete Question" message="Delete this question?" onConfirm={removeQuestion} onCancel={() => setDeleteTarget(null)} confirmText="Delete" /></AdminLayout>;
}
