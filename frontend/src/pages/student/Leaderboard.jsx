import { useEffect, useState } from 'react';
import { getLeaderboard } from '../../api/admin.api';
import { getCategories as getCats } from '../../api/quiz.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { formatPercent } from '../../utils/helpers';

const medals = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('overall');
  const [period, setPeriod] = useState('all');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => { getCats().then((r) => setCategories(r.data.categories)); }, []);

  useEffect(() => {
    setLoading(true);
    getLeaderboard({ type, period, categoryId: type === 'category' ? categoryId : undefined })
      .then((r) => setBoard(r.data.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, period, categoryId]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1>

        {/* Filters */}
        <div className="card flex flex-wrap gap-3">
          <div>
            <label className="label text-xs">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="overall">Overall</option>
              <option value="category">By Category</option>
            </select>
          </div>
          {type === 'category' && (
            <div>
              <label className="label text-xs">Category</label>
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">All</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label text-xs">Period</label>
            <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="all">All Time</option>
              <option value="monthly">This Month</option>
              <option value="weekly">This Week</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : board.length === 0 ? (
          <EmptyState icon="🏆" title="No data yet" message="Be the first to complete quizzes!" />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Quizzes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Avg Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Highest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {board.map((entry) => (
                  <tr key={entry.id} className={`${entry.id === user?.id ? 'bg-indigo-50 font-semibold' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 text-lg">{medals[entry.rank - 1] || `#${entry.rank}`}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{entry.name}</span>
                      {entry.id === user?.id && <span className="ml-2 text-xs text-indigo-500">(You)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{entry.quizzes_completed}</td>
                    <td className="px-4 py-3 font-bold text-indigo-700">{formatPercent(entry.average_score)}</td>
                    <td className="px-4 py-3 text-green-700">{formatPercent(entry.highest_score)}</td>
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
