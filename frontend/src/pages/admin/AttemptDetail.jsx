import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminAttemptById } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatDate, formatPercent, formatTime, statusColor } from '../../utils/helpers';

export default function AttemptDetail() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAttemptById(id)
      .then((r) => setAttempt(r.data.attempt))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;
  if (!attempt) return <AdminLayout><p className="text-center text-red-600 py-20">Attempt not found.</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/admin/attempts" className="text-sm text-slate-500 hover:text-slate-700">← Back to attempts</Link>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Attempt detail</h2>
            <p className="text-sm text-slate-500 mt-1">A complete breakdown of this student's quiz attempt.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{attempt.quiz_title}</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="min-w-[140px]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Student</p>
                <p className="font-semibold text-slate-900">{attempt.student_name}</p>
                <p className="text-xs text-slate-500">{attempt.student_email}</p>
              </div>
              <div className="min-w-[120px]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Score</p>
                <p className="font-semibold text-slate-900">{formatPercent(attempt.percentage)}</p>
              </div>
              <div className="min-w-[120px]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                <Badge className={statusColor(attempt.status)}>{attempt.status}</Badge>
              </div>
              <div className="min-w-[120px]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Time</p>
                <p className="font-semibold text-slate-900">{formatTime(attempt.time_taken)}</p>
              </div>
              <div className="min-w-[120px]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completed</p>
                <p className="font-semibold text-slate-900">{formatDate(attempt.completed_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="rounded-3xl bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-500">Correct</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{attempt.correct_answers}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-500">Incorrect</p>
                <p className="mt-2 text-3xl font-bold text-rose-600">{attempt.incorrect_answers}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-500">Unanswered</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{attempt.unanswered}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Summary</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Quiz</span>
                <span className="font-medium text-slate-900">{attempt.quiz_title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Question count</span>
                <span className="font-medium text-slate-900">{attempt.total_questions || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span className="font-medium text-slate-900">{attempt.duration || '—'} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pass threshold</span>
                <span className="font-medium text-slate-900">{attempt.passing_score ? `${attempt.passing_score}%` : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900">Answer review</h3>
          {attempt.answers?.map((answer, index) => (
            <div key={answer.id} className={`rounded-3xl border p-5 ${answer.is_correct ? 'border-emerald-200 bg-emerald-50' : answer.selected_option_id ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="font-semibold text-slate-900"><span className="text-slate-500">Q{index + 1}.</span> {answer.question_text}</p>
                <Badge className={answer.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{answer.is_correct ? 'Correct' : 'Incorrect'}</Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
                <div>
                  <p className="text-slate-500">Selected answer</p>
                  <p className={`mt-1 font-medium ${answer.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>{answer.selected_option_text || 'Not answered'}</p>
                </div>
                {!answer.is_correct && (
                  <div>
                    <p className="text-slate-500">Correct answer</p>
                    <p className="mt-1 font-medium text-emerald-700">{answer.correct_option_text}</p>
                  </div>
                )}
              </div>
              {answer.explanation && (
                <div className="mt-4 rounded-3xl bg-white border border-slate-200 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Explanation</p>
                  <p className="mt-2">{answer.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
