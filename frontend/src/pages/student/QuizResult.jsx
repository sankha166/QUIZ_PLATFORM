import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAttemptById } from '../../api/attempt.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatTime, formatDate, statusColor } from '../../utils/helpers';

export default function QuizResult() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAttemptById(attemptId)
      .then((r) => setAttempt(r.data.attempt))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <StudentLayout><LoadingSpinner size="lg" className="py-20" /></StudentLayout>;
  if (!attempt) return <StudentLayout><p className="text-center text-red-600 py-20">Result not found.</p></StudentLayout>;

  const passed = attempt.status === 'passed';

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={`rounded-3xl border p-8 ${passed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">{passed ? '🎉' : '😔'}</div>
            <h2 className="text-3xl font-bold text-slate-900">{attempt.quiz_title}</h2>
            <Badge className={`text-base px-4 py-2 ${statusColor(attempt.status)}`}>
              {passed ? '✅ PASSED' : '❌ FAILED'}
            </Badge>
            <p className={`text-6xl font-extrabold ${passed ? 'text-emerald-700' : 'text-rose-700'}`}>
              {parseFloat(attempt.percentage).toFixed(1)}%
            </p>
            <p className="text-sm text-slate-600">Time taken: {formatTime(attempt.time_taken)} · {formatDate(attempt.completed_at)}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mt-10">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Correct answers</p>
              <p className="mt-3 text-3xl font-bold text-emerald-700">{attempt.correct_answers}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Incorrect answers</p>
              <p className="mt-3 text-3xl font-bold text-rose-600">{attempt.incorrect_answers}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Unanswered</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{attempt.unanswered}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link to="/student/quizzes" className="btn-secondary w-full text-center">Browse more quizzes</Link>
            <Link to="/student/attempts" className="btn-primary w-full text-center">Review attempts</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Answer Review</h3>
          {attempt.answers?.map((a, i) => (
            <div key={a.id} className={`rounded-3xl border-l-4 bg-white p-6 shadow-sm ${a.is_correct ? 'border-l-emerald-500' : a.selected_option_id ? 'border-l-rose-500' : 'border-l-slate-200'}`}>
              <p className="font-semibold text-slate-900 mb-3"><span className="text-slate-400 mr-2">Q{i + 1}.</span>{a.question_text}</p>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <span className="w-28 text-slate-500">Your answer:</span>
                  <span className={`font-medium ${a.is_correct ? 'text-emerald-700' : 'text-rose-600'}`}>{a.selected_option_text || <em className="text-slate-400">Not answered</em>}{a.is_correct && ' ✓'}</span>
                </div>
                {!a.is_correct && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <span className="w-28 text-slate-500">Correct answer:</span>
                    <span className="text-emerald-700 font-medium">{a.correct_option_text}</span>
                  </div>
                )}
                {a.explanation && (
                  <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">💡 Explanation</div>
                    <p>{a.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
