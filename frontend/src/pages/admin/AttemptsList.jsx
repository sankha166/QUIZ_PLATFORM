import { useEffect, useState } from 'react';
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
      .then((r) => { setAttempts(r.data.attempts); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">All Attempts</h2>
          <span className="text-sm text-gray-500">{total} total</span>
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : attempts.length === 0 ? (
            <EmptyState icon="📋" title="No attempts yet" />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Student', 'Quiz', 'Score', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attempts.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{a.student_name}</p>
                        <p className="text-xs text-gray-400">{a.student_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{a.quiz_title}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatPercent(a.percentage)}</td>
                      <td className="px-4 py-3">
                        <Badge className={statusColor(a.status)}>{a.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(a.completed_at)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/attempts/${a.id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
                      </td>
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
