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
      marks: parseInt(marks),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-4">
        <h3 className="text-lg font-semibold mb-4">{question ? 'Edit Question' : 'Add Question'}</h3>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Question Text *</label>
            <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Marks</label>
              <input type="number" min={1} className="input" value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Options (select correct answer)</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" name="correct" checked={opt.correct} onChange={() => setCorrect(i)} className="text-indigo-600" />
                  <input
                    className="input flex-1"
                    placeholder={`Option ${i + 1}`}
                    value={opt.text}
                    onChange={(e) => updateOpt(i, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOpt(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addOpt} className="text-sm text-indigo-600 mt-2 hover:underline">+ Add option</button>
          </div>
          <div>
            <label className="label">Explanation (optional)</label>
            <textarea className="input" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
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
        <div className="flex items-center gap-4">
          <Link to="/admin/quizzes" className="text-gray-500 hover:text-gray-700 text-sm">← Back</Link>
          <h2 className="text-xl font-bold text-gray-900 flex-1">{quiz?.title}</h2>
          <Link to={`/admin/quizzes/${id}/edit`} className="btn-secondary text-sm">Edit Quiz</Link>
          <button onClick={toggleStatus} className={`btn text-sm ${quiz?.status === 'published' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'btn-success'}`}>
            {quiz?.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>

        {/* Quiz info */}
        <div className="card">
          <div className="flex flex-wrap gap-3">
            <Badge className={statusColor(quiz?.status)}>{quiz?.status}</Badge>
            <Badge className={difficultyColor(quiz?.difficulty)}>{quiz?.difficulty}</Badge>
            <span className="text-sm text-gray-500">⏱ {quiz?.duration} min</span>
            <span className="text-sm text-gray-500">🎯 Pass: {quiz?.passing_score}%</span>
            <span className="text-sm text-gray-500">🔁 Max attempts: {quiz?.max_attempts}</span>
            <span className="text-sm text-gray-500">❓ {questions.length} questions</span>
          </div>
          {quiz?.description && <p className="text-gray-600 text-sm mt-3">{quiz.description}</p>}
        </div>

        {/* Questions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Questions ({questions.length})</h3>
            <button onClick={() => setQuestionModal('new')} className="btn-primary text-sm">+ Add Question</button>
          </div>

          {questions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No questions yet. Add your first question.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-gray-900 text-sm flex-1">
                      <span className="text-gray-400 mr-2">Q{idx + 1}.</span>{q.question_text}
                    </p>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button onClick={() => setQuestionModal(q)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                      <button onClick={() => setDeleteTarget(q)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {q.options?.map((o) => (
                      <div key={o.id} className={`text-xs px-3 py-2 rounded-lg ${o.is_correct ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600'}`}>
                        {o.is_correct && '✓ '}{o.option_text}
                      </div>
                    ))}
                  </div>
                  {q.explanation && <p className="text-xs text-blue-600 mt-2">💡 {q.explanation}</p>}
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
