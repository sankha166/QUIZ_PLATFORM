import { useEffect, useMemo, useState } from 'react';
import { getAdminAnalytics } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Users, FileText, CheckCircle2, FilePenLine, HelpCircle,
  Target, BarChart3, Trophy, XCircle
} from 'lucide-react';

const DOMAIN_STORAGE_KEY = 'quiz_platform_admin_domains_v1';
const ENGINEERING = { id: 'engineering', name: 'Engineering' };

function getDomains() {
  try {
    const saved = JSON.parse(localStorage.getItem(DOMAIN_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [ENGINEERING];
    return saved.some((d) => d.id === 'engineering') ? saved : [ENGINEERING, ...saved];
  } catch {
    return [ENGINEERING];
  }
}

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
    <div className="card flex items-center gap-4 min-w-0">
      <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 truncate">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('all');
  const domains = useMemo(getDomains, []);

  useEffect(() => {
    getAdminAnalytics({ domain_id: domain === 'all' ? undefined : domain })
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [domain]);

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  const { stats, charts } = data || {};
  const selectedDomainName =
    domain === 'all'
      ? 'All Domains'
      : domains.find((d) => d.id === domain)?.name || 'Selected Domain';

  return (
    <AdminLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing analytics for <span className="font-semibold text-indigo-600">{selectedDomainName}</span>.
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <label className="label text-xs">Analytics Domain</label>
            <select
              className="input w-full sm:min-w-[240px]"
              value={domain}
              onChange={(e) => {
                setLoading(true);
                setDomain(e.target.value);
              }}
            >
              <option value="all">All Domains</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Students" value={stats?.totalStudents} />
          <StatCard icon={<FileText className="w-5 h-5" />} label="Total Quizzes" value={stats?.totalQuizzes} color="purple" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Published Quizzes" value={stats?.publishedQuizzes} color="green" />
          <StatCard icon={<FilePenLine className="w-5 h-5" />} label="Draft Quizzes" value={stats?.draftQuizzes} color="yellow" />
          <StatCard icon={<HelpCircle className="w-5 h-5" />} label="Total Questions" value={stats?.totalQuestions} color="blue" />
          <StatCard icon={<Target className="w-5 h-5" />} label="Total Attempts" value={stats?.totalAttempts} />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Avg Score" value={stats?.averageScore ? `${stats.averageScore}%` : '—'} color="purple" />
          <StatCard icon={<Trophy className="w-5 h-5" />} label="Passed" value={stats?.passedAttempts} color="green" />
          <StatCard icon={<XCircle className="w-5 h-5" />} label="Failed" value={stats?.failedAttempts} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card min-w-0">
            <h3 className="font-semibold text-gray-800 mb-4">Quiz Attempts — Last 30 Days</h3>
            {charts?.attemptsOverTime?.length ? (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.attemptsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
          </div>

          <div className="card min-w-0">
            <h3 className="font-semibold text-gray-800 mb-4">Pass / Fail Ratio</h3>
            {((charts?.passFail?.[0]?.value ?? 0) + (charts?.passFail?.[1]?.value ?? 0)) > 0 ? (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.passFail}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {charts.passFail.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-gray-400 text-sm text-center py-8">No attempts yet</p>}
          </div>

          <div className="card min-w-0">
            <h3 className="font-semibold text-gray-800 mb-4">Popular Quizzes</h3>
            {charts?.popularQuizzes?.length ? (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.popularQuizzes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="title" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="attempts" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
          </div>

          <div className="card min-w-0">
            <h3 className="font-semibold text-gray-800 mb-4">Average Score Per Quiz</h3>
            {charts?.avgScorePerQuiz?.length ? (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.avgScorePerQuiz} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="title" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="avg_score" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}