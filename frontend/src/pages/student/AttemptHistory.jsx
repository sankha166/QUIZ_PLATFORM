import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyAttempts } from '../../api/attempt.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatPercent, formatTime, statusColor } from '../../utils/helpers';

export default function AttemptHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAttempts()
      .then((r) => setAttempts(r.data.attempts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const completed = attempts.filter((a) => a.status !== 'in_progress');
    const passed = completed.filter((a) => a.status === 'passed').length;
    const failed = completed.filter((a) => a.status === 'failed').length;
    const avg = completed.length ? (completed.reduce((sum, a) => sum + parseFloat(a.percentage || 0), 0) / completed.length).toFixed(1) : '0.0';
    return { total: attempts.length, passed, failed, avg };
  }, [attempts]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Attempt History</h1>
            <p className="text-sm text-slate-500">Review your quiz performance and discover trends in your progress.</p>
          </div>
          <Link to="/student/quizzes" className="btn-primary">Browse new quizzes</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total attempts</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Passed</p>
            <p className="mt-3 text-3xl font-bold text-emerald-600">{stats.passed}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Failed</p>
            <p className="mt-3 text-3xl font-bold text-rose-600">{stats.failed}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg score</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.avg}%</p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : attempts.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No attempts yet"
            message="Take a quiz to see your history and score breakdowns here."
            action={<Link to="/student/quizzes" className="btn-primary">Browse Quizzes</Link>}
          />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Quiz', 'Category', 'Score', 'Status', 'Time', 'Date', 'Review'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">{a.quiz_title}</td>
                    <td className="px-4 py-4 text-slate-500">{a.category_name || '—'}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{formatPercent(a.percentage)}</td>
                    <td className="px-4 py-4"><Badge className={statusColor(a.status)}>{a.status}</Badge></td>
                    <td className="px-4 py-4 text-slate-500">{formatTime(a.time_taken)}</td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(a.completed_at)}</td>
                    <td className="px-4 py-4">
                      <Link to={`/student/results/${a.id}`} className="rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-600">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
