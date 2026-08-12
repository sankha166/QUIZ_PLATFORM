import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyAttempts } from '../../api/attempt.api';
import { getLeaderboard } from '../../api/admin.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatPercent, statusColor } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';

import {
  FaBullseye,
  FaCheckCircle,
  FaTimesCircle,
  FaFire,
  FaTrophy,
  FaMedal,
  FaBolt,
  FaStar,
  FaCrown,
  FaLock,
} from 'react-icons/fa';
import { HiChartBar } from 'react-icons/hi';

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

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

/** Circular progress ring (LeetCode-style "solved" ring, but our own look) */
function ProgressRing({ value = 0, size = 168, stroke = 12, children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

function timeAgo(dateString) {
  if (!dateString) return '';
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const toISODay = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ */
/* Activity heatmap (365 days, plain CSS grid — no extra dependency)   */
/* ------------------------------------------------------------------ */

const HEAT_LEVELS = [
  'bg-slate-100',
  'bg-indigo-200',
  'bg-indigo-400',
  'bg-indigo-600',
  'bg-indigo-800',
];

function ActivityHeatmap({ countsByDay }) {
  const { weeks, monthLabels, total } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start on the Sunday at least 52 weeks back so columns align to weeks.
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());

    const cells = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const iso = toISODay(cursor);
      cells.push({ iso, date: new Date(cursor), count: countsByDay[iso] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const grouped = [];
    for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7));

    const labels = [];
    let lastMonth = -1;
    grouped.forEach((week, index) => {
      const first = week[0];
      if (first && first.date.getMonth() !== lastMonth) {
        lastMonth = first.date.getMonth();
        labels.push({ index, label: first.date.toLocaleString('default', { month: 'short' }) });
      }
    });

    return {
      weeks: grouped,
      monthLabels: labels,
      total: cells.reduce((sum, c) => sum + c.count, 0),
    };
  }, [countsByDay]);

  const level = (count) => {
    if (!count) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  };

  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">
        {total} {total === 1 ? 'attempt' : 'attempts'} in the past year
      </p>
      <div className="mt-4 overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          <div className="flex gap-[3px] pl-[26px] text-[10px] text-slate-400">
            {weeks.map((_, index) => {
              const label = monthLabels.find((m) => m.index === index);
              return (
                <div key={index} className="w-[11px] shrink-0">
                  {label ? <span className="relative -left-[1px]">{label.label}</span> : null}
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-[3px]">
            <div className="flex w-[23px] shrink-0 flex-col gap-[3px] text-[10px] leading-[11px] text-slate-400">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <div key={i} className="h-[11px]">{d}</div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex shrink-0 flex-col gap-[3px]">
                {week.map((cell) => (
                  <div
                    key={cell.iso}
                    title={`${cell.count} ${cell.count === 1 ? 'attempt' : 'attempts'} on ${cell.date.toDateString()}`}
                    className={`h-[11px] w-[11px] rounded-[3px] ${HEAT_LEVELS[level(cell.count)]} transition-colors hover:ring-2 hover:ring-indigo-300`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-slate-400">
        <span>Less</span>
        {HEAT_LEVELS.map((c) => (
          <span key={c} className={`h-[11px] w-[11px] rounded-[3px] ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

function buildBadges({ completedCount, passed, avgScore, highestScore, maxStreak }) {
  return [
    { id: 'first', label: 'First Steps', hint: 'Complete your first quiz', icon: <FaBolt />, earned: completedCount >= 1 },
    { id: 'five', label: 'Getting Warm', hint: 'Complete 5 quizzes', icon: <FaFire />, earned: completedCount >= 5 },
    { id: 'ten', label: 'Double Digits', hint: 'Complete 10 quizzes', icon: <FaMedal />, earned: completedCount >= 10 },
    { id: 'twentyfive', label: 'Quiz Veteran', hint: 'Complete 25 quizzes', icon: <FaTrophy />, earned: completedCount >= 25 },
    { id: 'perfect', label: 'Flawless', hint: 'Score 100% on a quiz', icon: <FaStar />, earned: Number(highestScore) >= 100 },
    { id: 'streak', label: 'On Fire', hint: '7-day streak', icon: <FaFire />, earned: maxStreak >= 7 },
    { id: 'scholar', label: 'Scholar', hint: 'Average score above 80%', icon: <FaCrown />, earned: Number(avgScore) >= 80 },
    { id: 'consistent', label: 'Consistent', hint: 'Pass 10 quizzes', icon: <FaCheckCircle />, earned: passed >= 10 },
  ];
}

function BadgeChip({ badge }) {
  return (
    <div
      title={badge.hint}
      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all ${
        badge.earned
          ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm'
          : 'border-slate-200 bg-slate-50 text-slate-400'
      }`}
    >
      <span className="text-sm">{badge.earned ? badge.icon : <FaLock />}</span>
      <span>{badge.label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

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

  const [rankInfo, setRankInfo] = useState({ rank: null, total: 0 });

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

  // Leaderboard rank — isolated so a failure never breaks the dashboard.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    getLeaderboard({ type: 'overall', period: 'all' })
      .then((r) => {
        if (cancelled) return;
        const board = r.data.leaderboard || [];
        const mine = board.find((entry) => entry.id === user.id);
        setRankInfo({ rank: mine?.rank ?? null, total: board.length });
      })
      .catch(() => {
        if (!cancelled) setRankInfo({ rank: null, total: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
  const passRate = useMemo(() => (completed.length ? (passed / completed.length) * 100 : 0), [completed, passed]);
  const recent = useMemo(() => completed.slice(0, 8), [completed]);

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
      if (selectedCategory !== 'all' && selectedCategory !== 'All categories' && a.category_name !== selectedCategory) return false;
      const d = new Date(a.completed_at);
      return d >= start && d <= end;
    });
  }, [completed, selectedCategory, selectedMonth, selectedYear, range]);

  const scoreTrendData = useMemo(() => {
    return [...filteredAttempts]
      .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
      .slice(-10)
      .map((a) => ({ name: formatDate(a.completed_at), score: Number(a.percentage || 0) }));
  }, [filteredAttempts]);

  /* --- streaks + heatmap source ---------------------------------- */

  const countsByDay = useMemo(() => {
    const counts = {};
    completed.forEach((a) => {
      if (!a.completed_at) return;
      const iso = toISODay(a.completed_at);
      counts[iso] = (counts[iso] || 0) + 1;
    });
    return counts;
  }, [completed]);

  const completedDays = useMemo(() => Object.keys(countsByDay).sort(), [countsByDay]);

  const currentStreak = useMemo(() => {
    if (!completedDays.length) return 0;
    const daySet = new Set(completedDays);
    let streak = 0;
    const today = new Date();
    const cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Allow the streak to still count if today has no attempt yet.
    if (!daySet.has(toISODay(cur))) cur.setDate(cur.getDate() - 1);
    while (daySet.has(toISODay(cur))) {
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }, [completedDays]);

  const maxStreak = useMemo(() => {
    if (!completedDays.length) return 0;
    let max = 0;
    let streak = 0;
    let prev = null;
    completedDays.forEach((d) => {
      const c = new Date(d);
      if (prev && Math.round((c - prev) / 86400000) === 1) streak += 1;
      else streak = 1;
      prev = c;
      max = Math.max(max, streak);
    });
    return max;
  }, [completedDays]);

  const activeDaysYear = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 364);
    return completedDays.filter((d) => new Date(d) >= new Date(toISODay(cutoff))).length;
  }, [completedDays]);

  const badges = useMemo(
    () => buildBadges({ completedCount: completed.length, passed, avgScore, highestScore, maxStreak }),
    [completed.length, passed, avgScore, highestScore, maxStreak]
  );
  const earnedBadges = badges.filter((b) => b.earned).length;

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Welcome banner (streak tiles removed — they now live in the activity card) */}
        <div className="rounded-3xl bg-gradient-to-r from-brand-500 to-purple-600 p-8 text-white shadow-glow">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-brand-100">Welcome back</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Hello, {user?.name}</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">
                Keep your momentum going with quick access to quizzes, progress tracking, and personalized recommendations.
              </p>
            </div>
            <Link
              to="/student/quizzes"
              className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/25"
            >
              Start a quiz
            </Link>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : (
          <>
            {/* Identity + ring */}
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user?.name || 'Avatar'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-2xl font-bold text-slate-500">
                        {user?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-slate-900">{user?.name}</p>
                    <p className="truncate text-sm text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <Link
                  to="/student/leaderboard"
                  className="mt-5 flex items-center justify-between rounded-3xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 transition hover:border-indigo-300"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-indigo-400">Leaderboard rank</p>
                    <p className="mt-1 text-3xl font-extrabold text-indigo-700">
                      {rankInfo.rank ? `#${rankInfo.rank}` : 'Unranked'}
                    </p>
                    {rankInfo.total > 0 && (
                      <p className="text-xs text-indigo-500">out of {rankInfo.total} learners</p>
                    )}
                  </div>
                  <FaTrophy className="text-3xl text-amber-500" />
                </Link>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Badges</h2>
                    <span className="text-xs text-slate-400">
                      {earnedBadges}/{badges.length} earned
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((b) => (
                      <BadgeChip key={b.id} badge={b} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
                  <ProgressRing value={passRate}>
                    <p className="text-3xl font-extrabold text-slate-900">{completed.length}</p>
                    <p className="text-xs text-slate-400">completed</p>
                    <p className="mt-1 text-xs font-semibold text-indigo-600">{passRate.toFixed(0)}% pass rate</p>
                  </ProgressRing>

                  <div className="grid w-full grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Passed</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-700">{passed}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-rose-500">Failed</p>
                      <p className="mt-1 text-2xl font-bold text-rose-700">{failed}</p>
                    </div>
                    <div className="rounded-2xl bg-indigo-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-indigo-500">Avg score</p>
                      <p className="mt-1 text-2xl font-bold text-indigo-700">{avgScore ? `${avgScore}%` : '—'}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-amber-500">Best score</p>
                      <p className="mt-1 text-2xl font-bold text-amber-700">{highestScore ? `${highestScore}%` : '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Activity heatmap + streaks */}
            <div className="card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Activity</h3>
                  <p className="text-sm text-slate-500">Every quiz you complete lights up a day.</p>
                </div>
                <div className="flex flex-wrap gap-3 text-center">
                  <div className="rounded-2xl bg-orange-50 px-4 py-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-orange-500">Current streak</p>
                    <p className="text-xl font-bold text-orange-700">
                      {currentStreak} <span className="text-xs font-medium">days</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Max streak</p>
                    <p className="text-xl font-bold text-slate-800">
                      {maxStreak} <span className="text-xs font-medium">days</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Active days</p>
                    <p className="text-xl font-bold text-slate-800">{activeDaysYear}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <ActivityHeatmap countsByDay={countsByDay} />
              </div>
            </div>

            {/* Quick stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={<FaBullseye size={28} />} label="Attempted" value={completed.length} />
              <StatCard icon={<FaCheckCircle size={28} />} label="Passed" value={passed} tone="green" />
              <StatCard icon={<FaTimesCircle size={28} />} label="Failed" value={failed} tone="red" />
              <StatCard icon={<HiChartBar size={28} />} label="Avg Score" value={avgScore ? `${avgScore}%` : '—'} />
            </div>

            {/* Score trend (filters preserved) */}
            <div className="card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Score Trend</h3>
                  <p className="text-sm text-slate-500">Track your recent quiz scores.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 p-1">
                    {['30d', 'month', 'year'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRange(v)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          range === v ? 'bg-brand-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        {v === '30d' ? '30 days' : v === 'month' ? 'Month' : 'Year'}
                      </button>
                    ))}
                  </div>
                  {range !== '30d' && (
                    <select
                      value={range === 'month' ? selectedMonth : selectedYear}
                      onChange={(e) => {
                        if (range === 'month') setSelectedMonth(e.target.value);
                        else setSelectedYear(e.target.value);
                      }}
                      className="input min-w-[12rem]"
                    >
                      {range === 'month'
                        ? monthOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))
                        : yearOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                    </select>
                  )}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input min-w-[12rem]"
                  >
                    <option value="all">All categories</option>
                    {categoryOptions
                      .filter((c) => c !== 'All categories')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 h-72">
                {scoreTrendData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 12 }}
                        formatter={(v) => [`${v}%`, 'Score']}
                      />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-400">
                    No attempts in this range yet.
                  </div>
                )}
              </div>
            </div>

            {/* Recent attempts */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Recent Attempts</h3>
                  <p className="text-sm text-slate-500">Your latest submissions.</p>
                </div>
                <Link to="/student/attempts" className="text-sm font-semibold text-brand-600 hover:underline">
                  View all
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {recent.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No attempts yet — finish a quiz and it will show up here.
                  </p>
                )}
                {recent.map((a) => (
                  <Link
                    key={a.id}
                    to={`/student/attempts/${a.id}`}
                    className="flex flex-wrap items-center gap-3 py-4 transition hover:bg-slate-50/70 sm:flex-nowrap"
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        a.status === 'passed' ? 'bg-emerald-500' : a.status === 'failed' ? 'bg-rose-500' : 'bg-slate-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{a.quiz_title || a.title || 'Quiz'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {a.category_name && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{a.category_name}</span>
                        )}
                        <span>{formatDate(a.completed_at)}</span>
                        <span className="text-slate-300">•</span>
                        <span>{timeAgo(a.completed_at)}</span>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        typeof statusColor === 'function'
                          ? statusColor(a.status)
                          : a.status === 'passed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {a.status}
                    </span>
                    <span className="w-16 text-right text-sm font-bold text-slate-900">
                      {formatPercent(a.percentage)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
