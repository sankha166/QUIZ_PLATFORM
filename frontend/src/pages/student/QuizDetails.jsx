import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizById } from '../../api/quiz.api';
import { getMyAttempts, startQuiz } from '../../api/attempt.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { difficultyColor, getErrorMessage } from '../../utils/helpers';

export default function QuizDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getQuizById(id), getMyAttempts()])
      .then(([qr, ar]) => {
        const q = qr.data.quiz;
        setQuiz(q);
        const completed = (ar.data.attempts || []).filter((a) => String(a.quiz_id) === String(id) && a.status !== 'in_progress');
        setAttemptsLeft(Math.max(0, q.max_attempts - completed.length));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const r = await startQuiz(id);
      navigate(`/student/quiz/${id}/attempt`, { state: { attemptData: r.data } });
    } catch (err) {
      setError(getErrorMessage(err));
      setStarting(false);
    }
  };

  if (loading) return <StudentLayout><LoadingSpinner size="lg" className="py-20" /></StudentLayout>;
  if (!quiz) return <StudentLayout><p className="text-center text-red-600 py-20">Quiz not found.</p></StudentLayout>;

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {quiz.thumbnail_url && (
            <img src={quiz.thumbnail_url} alt={quiz.title} className="w-full h-64 object-cover" />
          )}
          <div className="p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{quiz.title}</h1>
                <p className="mt-2 text-sm text-slate-500">{quiz.description || 'No description available for this quiz.'}</p>
              </div>
              <Badge className={difficultyColor(quiz.difficulty)}>{quiz.difficulty}</Badge>
            </div>

            <div className="grid gap-4 mt-8 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Category</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{quiz.category_name || 'Uncategorized'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Duration</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{quiz.duration} min</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Questions</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{quiz.question_count}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Passing score</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{quiz.passing_score}%</p>
              </div>
            </div>

            <div className="grid gap-4 mt-6 sm:grid-cols-2">
              <div className="rounded-3xl bg-white border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Attempts available</p>
                <p className={`mt-2 text-2xl font-bold ${attemptsLeft === 0 ? 'text-red-600' : 'text-emerald-600'}`}>{attemptsLeft}</p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Quiz status</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{quiz.status || 'Published'}</p>
              </div>
            </div>

            {error && <div className="rounded-3xl bg-rose-50 border border-rose-200 px-4 py-3 mt-6 text-sm text-rose-700">{error}</div>}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Ready to test your knowledge? Start the quiz and see your results instantly.</div>
              {attemptsLeft === 0 ? (
                <div className="rounded-3xl bg-red-50 border border-red-200 px-5 py-3 text-sm font-medium text-red-700">No attempts remaining</div>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="btn-primary w-full sm:w-auto py-3 text-base"
                >
                  {starting ? 'Starting…' : '🚀 Start Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
