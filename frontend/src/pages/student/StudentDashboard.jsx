import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyAttempts } from '../../api/attempt.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatDate, formatPercent, statusColor } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import StreakTracker from '../../components/student/StreakTracker';

function StatCard({ icon, label, value, sub, tone = 'indigo' }) {
  const theme = {
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-200">
      <div className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 text-lg font-semibold ${theme[tone]}`}>{icon}</div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value ?? '—'}</p>
      <p className="text-sm text-slate-500 mt-2">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    getMyAttempts()
      .then((r) => setAttempts(r.data.attempts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completed = useMemo(() => attempts.filter((a) => a.status !== 'in_progress'), [attempts]);
  const passed = useMemo(() => completed.filter((a) => a.status === 'passed').length, [completed]);
  const failed = useMemo(() => completed.filter((a) => a.status === 'failed').length, [completed]);
  const avgScore = useMemo(
    () => (completed.length ? (completed.reduce((s, a) => s + parseFloat(a.percentage || 0), 0) / completed.length).toFixed(1) : null),
    [completed]
  );
  const highestScore = useMemo(
    () => (completed.length ? Math.max(...completed.map((a) => parseFloat(a.percentage || 0))).toFixed(1) : null),
    [completed]
  );
  const recent = useMemo(() => completed.slice(0, 5), [completed]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - idx, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { value, label: d.toLocaleString('default', { month: 'long', year: 'numeric' }) };
    }).reverse();
  }, []);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2].map((y) => ({ value: String(y), label: String(y) }));
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(completed.map((a) => a.category_name).filter(Boolean)));
    return ['All categories', ...categories];
  }, [completed]);

  const filteredAttempts = useMemo(() => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    if (range === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 0, 23, 59, 59, 999);
    } else if (range === 'year') {
      const y = Number(selectedYear);
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31, 23, 59, 59, 999);
    } else {
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      end = new Date(now);
    }
    return completed.filter((a) => {
      if (selectedCategory !== 'all' && a.category_name !== selectedCategory) return false;
      const d = new Date(a.completed_at);
      return d >= start && d <= end;
    });
  }, [completed, selectedCategory, selectedMonth, selectedYear, range]);

  const activity = useMemo(() => {
    const counts = {};
    filteredAttempts.forEach((att) => {
      const d = new Date(att.completed_at);
      const label = range === 'year' ? d.toLocaleString('default', { month: 'short' }) : d.toISOString().slice(0, 10);
      counts[label] = (counts[label] || 0) + 1;
    });

    if (range === 'year') {
      return Array.from({ length: 12 }, (_, i) => {
        const m = new Date(Number(selectedYear), i, 1);
        const label = m.toLocaleString('default', { month: 'short' });
        return { label, count: counts[label] || 0 };
      });
    }

    const now = new Date();
    let start = new Date(now);
    if (range === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      start = new Date(y, m - 1, 1);
    } else {
      start.setDate(now.getDate() - 29);
    }
    const days = Math.round((new Date().setHours(0,0,0,0) - start.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)) + 1;
    const itemCount = days > 0 ? days : 30;
    return Array.from({ length: itemCount }, (_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      const iso = d.toISOString().slice(0, 10);
      return { label: range === 'month' ? d.getDate() : `${d.getDate()}`, count: counts[iso] || 0 };
    });
  }, [filteredAttempts, range, selectedMonth, selectedYear]);

  const scoreTrendData = useMemo(() => {
    return [...filteredAttempts]
      .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
      .slice(-10)
      .map((a) => ({ name: formatDate(a.completed_at), score: Number(a.percentage || 0) }));
  }, [filteredAttempts]);

  const activeDays = useMemo(() => activity.filter((i) => i.count > 0).length, [activity]);
  const rangeAttemptCount = filteredAttempts.length;

  const completedDays = useMemo(() => {
    const s = new Set(completed.map((a) => a.completed_at).filter(Boolean).map((d) => new Date(d).toISOString().slice(0, 10)));
    return Array.from(s).sort();
  }, [completed]);

  const currentStreak = useMemo(() => {
    if (!completedDays.length) return 0;
    const daySet = new Set(completedDays);
    let streak = 0;
    const today = new Date();
    let cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (daySet.has(cur.toISOString().slice(0, 10))) {
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }, [completedDays]);

  const maxStreak = useMemo(() => {
    if (!completedDays.length) return 0;
    let max = 0; let streak = 0; let prev = null;
    completedDays.forEach((d) => {
      const c = new Date(d);
      if (prev && c.getTime() - prev.getTime() === 24 * 60 * 60 * 1000) streak += 1; else streak = 1;
      prev = c; max = Math.max(max, streak);
    });
    return max;
  }, [completedDays]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-brand-500 to-purple-600 p-8 text-white shadow-glow">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-brand-100">Welcome back</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Hello, {user?.name}</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">Keep your momentum going with quick access to quizzes, progress tracking, and personalized recommendations.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-sm text-white/80">Current streak</p>
                <p className="mt-2 text-2xl font-bold">{currentStreak}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-sm text-white/80">Max streak</p>
                <p className="mt-2 text-2xl font-bold">{maxStreak}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-sm text-white/80">Quizzes completed</p>
                <p className="mt-2 text-2xl font-bold">{completed.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard icon="🎯" label="Attempted" value={completed.length} tone="indigo" />
            <StatCard icon="✅" label="Passed" value={passed} tone="green" />
            <StatCard icon="❌" label="Failed" value={failed} tone="red" />
            <StatCard icon="📊" label="Avg Score" value={avgScore ? `${avgScore}%` : '—'} tone="amber" />
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Theme</h2>
            <p className="text-sm text-slate-500">Quick theme toggle.</p>
            <div className="mt-4 flex gap-3">
              <button className={`btn ${theme === 'light' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`} onClick={() => setTheme('light')}>Light</button>
              <button className={`btn ${theme === 'dark' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`} onClick={() => setTheme('dark')}>Dark</button>
            </div>
          </div>
        </div>

        {loading ? <LoadingSpinner size="lg" className="py-16" /> : (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Score Trend</h3>
                    <p className="text-sm text-slate-500">Track your recent quiz scores.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 p-1">
                      {['30d', 'month', 'year'].map((v) => (
                        <button key={v} type="button" onClick={() => setRange(v)} className={`rounded-full px-4 py-2 text-sm font-semibold ${range === v ? 'bg-brand-600 text-white' : 'text-slate-600'}`}>
                          {v === '30d' ? '30 days' : v === 'month' ? 'Month' : 'Year'}
                        </button>
                      ))}
                    </div>
                    <select value={range === 'month' ? selectedMonth : selectedYear} onChange={(e) => { if (range === 'month') setSelectedMonth(e.target.value); else setSelectedYear(e.target.value); }} className="input min-w-[12rem]">
                      {range === 'month' ? monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>) : yearOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input min-w-[12rem]">
                      {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Average score</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{avgScore ? `${avgScore}%` : '—'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Highest score</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{highestScore ? `${highestScore}%` : '—'}</p>
                  </div>
                </div>

                <div className="mt-6">
                  {scoreTrendData.length ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={scoreTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400 text-sm text-center py-16">No score trend available for the selected timeframe.</p>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Recent Attempts</h3>
                    <p className="text-sm text-slate-500">Your latest quiz results at a glance.</p>
                  </div>
                  <Badge className="badge-brand">Top performer</Badge>
                </div>
                {recent.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-400 mb-4">No quizzes attempted yet.</p>
                    <Link to="/student/quizzes" className="btn-primary text-sm">Browse Quizzes</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recent.map((a) => (
                      <Link key={a.id} to={`/student/results/${a.id}`} className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-card-hover">
                        <div>
                          <p className="font-semibold text-slate-900">{a.quiz_title}</p>
                          <p className="text-sm text-slate-500">{formatDate(a.completed_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">{formatPercent(a.percentage)}</p>
                          <Badge className={statusColor(a.status)}>{a.status}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <StreakTracker
                activity={activity}
                range={range}
                selectedCategory={selectedCategory}
                currentStreak={currentStreak}
                maxStreak={maxStreak}
                attemptCount={rangeAttemptCount}
                activeDays={activeDays}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                monthOptions={monthOptions}
                yearOptions={yearOptions}
                onRangeChange={setRange}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
              />
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Theme controls</h3>
                <p className="text-sm text-slate-500">Toggle light and dark mode.</p>
                <div className="mt-6 grid gap-3">
                  <button type="button" onClick={() => setTheme('light')} className={`btn ${theme === 'light' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Light mode</button>
                  <button type="button" onClick={() => setTheme('dark')} className={`btn ${theme === 'dark' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Dark mode</button>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Continue where you left off</h3>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {attempts.find((a) => a.status === 'in_progress') ? (
                    <div>
                      <p className="font-medium text-slate-900">You have an active quiz attempt.</p>
                      <p>Return to the quiz to continue before time runs out.</p>
                      <Link to="/student/attempts" className="btn-secondary mt-4 inline-flex">Resume attempt</Link>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-slate-900">No active quiz in progress.</p>
                      <p>Start a new quiz to continue your learning streak.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
