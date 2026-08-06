import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminAttempts } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatPercent, statusColor } from '../../utils/helpers';

export default function AttemptsList() {
  const [attempts, setAttempts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 15;

  useEffect(() => {
    setLoading(true);
    getAdminAttempts({ page, limit })
      .then((r) => { setAttempts(r.data.attempts || []); setTotal(r.data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const stats = useMemo(() => ({
    completed: attempts.filter((a) => a.status === 'completed').length,
    passed: attempts.filter((a) => a.status === 'passed').length,
    failed: attempts.filter((a) => a.status === 'failed').length,
  }), [attempts]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total attempts</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{total}</p>
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
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Open attempts</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{total - stats.completed}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Quiz Attempts</h2>
            <p className="text-sm text-slate-500">Review individual student attempts and performance.</p>
          </div>
          <span className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">Showing page {page}</span>
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : attempts.length === 0 ? (
            <EmptyState icon="📋" title="No attempts yet" description="There are no quiz attempts to display." />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Student', 'Quiz', 'Score', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {attempts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{a.student_name}</p>
                        <p className="text-xs text-slate-500">{a.student_email}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{a.quiz_title}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{formatPercent(a.percentage)}</td>
                      <td className="px-4 py-4"><Badge className={statusColor(a.status)}>{a.status}</Badge></td>
                      <td className="px-4 py-4 text-slate-400">{formatDate(a.completed_at)}</td>
                      <td className="px-4 py-4"><Link to={`/admin/attempts/${a.id}`} className="text-xs text-indigo-600 hover:underline">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 pb-4">
                <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
