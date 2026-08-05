import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyAttempts } from '../../api/attempt.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatDate, formatPercent, statusColor } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAttempts().then((r) => setAttempts(r.data.attempts || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const completed = attempts.filter((a) => a.status !== 'in_progress');
  const passed = completed.filter((a) => a.status === 'passed').length;
  const failed = completed.filter((a) => a.status === 'failed').length;
  const avgScore = completed.length ? (completed.reduce((s, a) => s + parseFloat(a.percentage || 0), 0) / completed.length).toFixed(1) : null;
  const highestScore = completed.length ? Math.max(...completed.map((a) => parseFloat(a.percentage || 0))).toFixed(1) : null;
  const recent = completed.slice(0, 5);
  const chartData = completed.slice(-10).reverse().map((a, i) => ({ name: `#${i + 1}`, score: parseFloat(a.percentage || 0) }));

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Track your quiz progress and performance.</p>
        </div>

        {loading ? <LoadingSpinner size="lg" className="py-16" /> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon="🎯" label="Attempted" value={completed.length} />
              <StatCard icon="✅" label="Passed" value={passed} />
              <StatCard icon="❌" label="Failed" value={failed} />
              <StatCard icon="📊" label="Avg Score" value={avgScore ? `${avgScore}%` : '—'} />
              <StatCard icon="🏆" label="Highest" value={highestScore ? `${highestScore}%` : '—'} />
              <StatCard icon="❓" label="Questions" value={completed.reduce((s, a) => s + (a.correct_answers || 0) + (a.incorrect_answers || 0), 0)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Attempts</h3>
                {recent.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No quizzes attempted yet.</p>
                    <Link to="/student/quizzes" className="btn-primary text-sm">Browse Quizzes</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recent.map((a) => (
                      <Link key={a.id} to={`/student/results/${a.id}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{a.quiz_title}</p>
                          <p className="text-xs text-gray-400">{formatDate(a.completed_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{formatPercent(a.percentage)}</span>
                          <Badge className={statusColor(a.status)}>{a.status}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">Score Trend</h3>
                {chartData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">Take at least 2 quizzes to see your score trend.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
