import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuizById, getQuestions, addQuestion, updateQuestion, deleteQuestion, updateQuizStatus } from '../../api/quiz.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import { difficultyColor, statusColor, getErrorMessage } from '../../utils/helpers';

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
    const valid = options.filter((o) => o.text.trim());
    if (valid.length < 2) return setError('At least 2 options required');
    if (!valid.some((o) => o.correct)) return setError('Mark one option as correct');
    setSaving(true);
    const payload = {
      question_text: text,
      marks: parseInt(marks, 10),
      explanation,
      options: valid.map((o) => ({ option_text: o.text, is_correct: o.correct })),
    };
    try {
      if (question) await updateQuestion(question.id, payload);
      else await addQuestion(quizId, payload);
      onSave();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{question ? 'Edit Question' : 'Add Question'}</h3>
            <p className="text-sm text-slate-500">Build a question and choose the correct answer.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
        {error && <div className="rounded-3xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Question text *</label>
            <textarea className="input" rows={4} value={text} onChange={(e) => setText(e.target.value)} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Marks</label>
              <input type="number" min={1} className="input" value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
            <div>
              <label className="label">Explanation</label>
              <input className="input" placeholder="Optional hint for students" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Options (select correct answer)</label>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="radio" name="correct" checked={opt.correct} onChange={() => setCorrect(i)} className="text-indigo-600" />
                  <input
                    className="input flex-1"
                    placeholder={`Option ${i + 1}`}
                    value={opt.text}
                    onChange={(e) => updateOpt(i, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOpt(i)} className="text-rose-500 hover:text-rose-700 text-lg leading-none">×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addOpt} className="text-sm text-indigo-600 mt-2 hover:underline">+ Add option</button>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save question'}</button>
          </div>
        </form>
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
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [qr, qs] = await Promise.all([getQuizById(id), getQuestions(id)]);
      setQuiz(qr.data.quiz);
      setQuestions(qs.data.questions);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleDeleteQuestion = async () => {
    try {
      await deleteQuestion(deleteTarget.id);
      setDeleteTarget(null);
      fetchAll();
    } catch (err) { alert(getErrorMessage(err)); }
  };

  const toggleStatus = async () => {
    const newStatus = quiz.status === 'published' ? 'unpublished' : 'published';
    try {
      await updateQuizStatus(id, newStatus);
      fetchAll();
    } catch (err) { alert(getErrorMessage(err)); }
  };

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/admin/quizzes" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{quiz?.title}</h2>
            <p className="text-sm text-slate-500 mt-1">Manage questions, status, and quiz details.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/admin/quizzes/${id}/edit`} className="btn-secondary text-sm">Edit Quiz</Link>
            <button onClick={toggleStatus} className={`btn text-sm ${quiz?.status === 'published' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'btn-success'}`}>
              {quiz?.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <Badge className={statusColor(quiz?.status)}>{quiz?.status}</Badge>
            <Badge className={difficultyColor(quiz?.difficulty)}>{quiz?.difficulty}</Badge>
            <span className="text-slate-500">⏱ {quiz?.duration} min</span>
            <span className="text-slate-500">🎯 Pass: {quiz?.passing_score}%</span>
            <span className="text-slate-500">🔁 Max attempts: {quiz?.max_attempts}</span>
            <span className="text-slate-500">❓ {questions.length} questions</span>
          </div>
          {quiz?.description && <p className="text-slate-600 text-sm mt-4">{quiz.description}</p>}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-900">Questions ({questions.length})</h3>
            <button onClick={() => setQuestionModal('new')} className="btn-primary text-sm">+ Add Question</button>
          </div>

          {questions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No questions yet. Add your first question to build this quiz.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900"><span className="text-slate-500">Q{idx + 1}.</span> {q.question_text}</p>
                      {q.explanation && <p className="mt-2 text-sm text-slate-600">💡 {q.explanation}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setQuestionModal(q)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-indigo-600 hover:bg-slate-100">Edit</button>
                      <button onClick={() => setDeleteTarget(q)} className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50">Delete</button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {q.options?.map((o) => (
                      <div key={o.id} className={`rounded-2xl border p-3 text-sm ${o.is_correct ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}>
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
