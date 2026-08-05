import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserById } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatDate, formatPercent, formatTime, statusColor } from '../../utils/helpers';

export default function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserById(id)
      .then((r) => setUser(r.data.user))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;
  if (!user) return <AdminLayout><p className="text-center text-red-600 py-20">User not found.</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/users" className="text-gray-500 hover:text-gray-700 text-sm">← Back</Link>
          <h2 className="text-xl font-bold text-gray-900">Student Profile</h2>
        </div>

        <div className="card">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {user.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-400 mt-1">Joined {formatDate(user.created_at)}</p>
            </div>
            <Badge className={user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
              {user.status}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{user.quizzes_attempted}</p>
              <p className="text-sm text-gray-500">Attempts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatPercent(user.average_score)}</p>
              <p className="text-sm text-gray-500">Avg Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{formatPercent(user.highest_score)}</p>
              <p className="text-sm text-gray-500">Highest Score</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Attempts</h3>
          {user.attempts?.length === 0 ? (
            <p className="text-gray-400 text-sm">No attempts yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Quiz</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Score</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {user.attempts.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 font-medium text-gray-800">{a.quiz_title}</td>
                    <td className="py-2 text-gray-600">{formatPercent(a.percentage)}</td>
                    <td className="py-2">
                      <Badge className={statusColor(a.status)}>{a.status}</Badge>
                    </td>
                    <td className="py-2 text-gray-400">{formatDate(a.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
