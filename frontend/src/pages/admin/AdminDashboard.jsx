import { useEffect, useState } from 'react';
import { getAdminAnalytics } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  FilePenLine, 
  HelpCircle, 
  Target, 
  BarChart3, 
  Trophy, 
  XCircle 
} from 'lucide-react';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6'];

function StatCard({ icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalytics()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  const { stats, charts } = data || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <StatCard icon={<Users className="w-5 h-5" />} label="Total Students" value={stats?.totalStudents} color="indigo" />
  <StatCard icon={<FileText className="w-5 h-5" />} label="Total Quizzes" value={stats?.totalQuizzes} color="purple" />
  <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Published Quizzes" value={stats?.publishedQuizzes} color="green" />
  <StatCard icon={<FilePenLine className="w-5 h-5" />} label="Draft Quizzes" value={stats?.draftQuizzes} color="yellow" />
  <StatCard icon={<HelpCircle className="w-5 h-5" />} label="Total Questions" value={stats?.totalQuestions} color="blue" />
  <StatCard icon={<Target className="w-5 h-5" />} label="Total Attempts" value={stats?.totalAttempts} color="indigo" />
  <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Avg Score" value={stats?.averageScore ? `${stats.averageScore}%` : '—'} color="purple" />
  <StatCard icon={<Trophy className="w-5 h-5" />} label="Passed" value={stats?.passedAttempts} color="green" />
  <StatCard icon={<XCircle className="w-5 h-5" />} label="Failed" value={stats?.failedAttempts} color="red" />
</div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Quiz Attempts (Last 30 Days)</h3>
            {charts?.attemptsOverTime?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={charts.attemptsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Pass / Fail Ratio</h3>
            {((charts?.passFail?.[0]?.value ?? 0) + (charts?.passFail?.[1]?.value ?? 0)) > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={charts.passFail} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {charts.passFail.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#ef4444'} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm text-center py-8">No attempts yet</p>}
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Popular Quizzes</h3>
            {charts?.popularQuizzes?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.popularQuizzes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="attempts" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Avg Score Per Quiz</h3>
            {charts?.avgScorePerQuiz?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.avgScorePerQuiz} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="avg_score" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
