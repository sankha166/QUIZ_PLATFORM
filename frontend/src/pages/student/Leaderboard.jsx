import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => { getCats().then((r) => setCategories(r.data.categories || [])).catch(console.error); }, []);

  useEffect(() => {
    setLoading(true);
    getLeaderboard({ type, period, categoryId: type === 'category' ? categoryId : undefined })
      .then((r) => setBoard(r.data.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, period, categoryId]);

  const currentRank = useMemo(() => board.find((entry) => entry.id === user?.id)?.rank, [board, user]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
              <p className="text-sm text-slate-500">Compare your performance against other learners.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {currentRank ? `Your current rank: #${currentRank}` : 'Not ranked yet'}
            </div>
          </div>
        </div>

        <div className="card flex flex-wrap gap-3 p-6">
          <div className="flex-1 min-w-[200px]">
            <p className="label text-xs">Leaderboard type</p>
            <select className="input w-full" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="overall">Overall</option>
              <option value="category">By Category</option>
            </select>
          </div>
          {type === 'category' && (
            <div className="flex-1 min-w-[200px]">
              <p className="label text-xs">Category</p>
              <select className="input w-full" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex-1 min-w-[200px]">
            <p className="label text-xs">Time period</p>
            <select className="input w-full" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="all">All time</option>
              <option value="monthly">This month</option>
              <option value="weekly">This week</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : board.length === 0 ? (
          <EmptyState icon="🏆" title="No leaderboard data" message="Complete quizzes to appear here." />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Quizzes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Avg score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Highest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {board.map((entry) => (
                  <tr key={entry.id} className={`${entry.id === user?.id ? 'bg-indigo-50 font-semibold' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className="px-4 py-4 text-lg">{medals[entry.rank - 1] || `#${entry.rank}`}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-2xl bg-brand-500/10 text-brand-600 grid place-items-center font-semibold">{entry.name?.charAt(0)}</div>
                        <div>
                          <p className="text-slate-900">{entry.name}</p>
                          {entry.id === user?.id && <p className="text-xs text-brand-600">Your profile</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{entry.quizzes_completed}</td>
                    <td className="px-4 py-4 text-indigo-700">{formatPercent(entry.average_score)}</td>
                    <td className="px-4 py-4 text-emerald-700">{formatPercent(entry.highest_score)}</td>
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
