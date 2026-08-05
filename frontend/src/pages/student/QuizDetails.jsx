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
      <div className="max-w-2xl mx-auto space-y-6">
        {quiz.thumbnail_url && (
          <img src={quiz.thumbnail_url} alt="" className="w-full h-48 object-cover rounded-xl" />
        )}

        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <Badge className={difficultyColor(quiz.difficulty)}>{quiz.difficulty}</Badge>
          </div>

          {quiz.description && <p className="text-gray-600 mb-6">{quiz.description}</p>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><span>🏷️</span><span>{quiz.category_name || 'Uncategorized'}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><span>❓</span><span>{quiz.question_count} Questions</span></div>
            <div className="flex items-center gap-2 text-gray-600"><span>⏱️</span><span>{quiz.duration} Minutes</span></div>
            <div className="flex items-center gap-2 text-gray-600"><span>🎯</span><span>Pass: {quiz.passing_score}%</span></div>
            <div className="flex items-center gap-2 text-gray-600"><span>🔁</span><span>Max Attempts: {quiz.max_attempts}</span></div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>📊</span>
              <span>Attempts left: <strong className={attemptsLeft === 0 ? 'text-red-600' : 'text-green-600'}>{attemptsLeft}</strong></span>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

          <div className="mt-6">
            {attemptsLeft === 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 font-medium">You have used all attempts for this quiz.</p>
              </div>
            ) : (
              <button
                onClick={handleStart}
                disabled={starting}
                className="btn-primary w-full py-3 text-base"
              >
                {starting ? 'Starting…' : '🚀 Start Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
