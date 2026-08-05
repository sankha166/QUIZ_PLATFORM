import { useEffect, useState } from 'react';
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

  return (
    <StudentLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">My Attempts</h1>

        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : attempts.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No attempts yet"
            message="Start a quiz to see your history here."
            action={<Link to="/student/quizzes" className="btn-primary">Browse Quizzes</Link>}
          />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Quiz', 'Category', 'Score', 'Status', 'Time Taken', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.quiz_title}</td>
                    <td className="px-4 py-3 text-gray-500">{a.category_name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatPercent(a.percentage)}</td>
                    <td className="px-4 py-3"><Badge className={statusColor(a.status)}>{a.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{formatTime(a.time_taken)}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(a.completed_at)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/student/results/${a.id}`} className="text-xs text-indigo-600 hover:underline">Review</Link>
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
