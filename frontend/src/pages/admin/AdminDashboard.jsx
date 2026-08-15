import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminAnalytics } from "../../api/admin.api";
import { getDomains } from "../../api/domain.api";
import { getLiveQuizStats } from "../../api/liveQuiz.api";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  Users,
  FileText,
  CheckCircle2,
  FilePenLine,
  HelpCircle,
  Target,
  BarChart3,
  Trophy,
  XCircle,
  Radio,
} from "lucide-react";
const statStyles = {
  Students: ["bg-blue-50", "text-blue-600", "ring-blue-100"],
  Quizzes: ["bg-violet-50", "text-violet-600", "ring-violet-100"],
  Published: ["bg-emerald-50", "text-emerald-600", "ring-emerald-100"],
  Drafts: ["bg-amber-50", "text-amber-600", "ring-amber-100"],
  Questions: ["bg-cyan-50", "text-cyan-600", "ring-cyan-100"],
  Attempts: ["bg-indigo-50", "text-indigo-600", "ring-indigo-100"],
  "Average Score": ["bg-fuchsia-50", "text-fuchsia-600", "ring-fuchsia-100"],
  Passed: ["bg-green-50", "text-green-600", "ring-green-100"],
  Failed: ["bg-rose-50", "text-rose-600", "ring-rose-100"],
};
function StatCard({ icon, label, value }) {
  const [bg, text, ring] = statStyles[label] || statStyles.Students;
  return (
    <div className="card group flex min-h-[112px] items-center gap-4 overflow-hidden border border-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg} ${text} ring-1 ${ring}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 truncate">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}
export default function AdminDashboard() {
  const [data, setData] = useState(null),
    [live, setLive] = useState({}),
    [domains, setDomains] = useState([]),
    [domain, setDomain] = useState("all"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    getDomains()
      .then((r) => setDomains(r.data.domains || []))
      .catch(() => {});
    getLiveQuizStats()
      .then((r) => setLive(r.data.stats || {}))
      .catch(() => {});
  }, []);
  useEffect(() => {
    setLoading(true);
    getAdminAnalytics({ domain_id: domain === "all" ? undefined : domain })
      .then((r) => setData(r.data))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load analytics"),
      )
      .finally(() => setLoading(false));
  }, [domain]);
  if (loading)
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" className="py-20" />
      </AdminLayout>
    );
  const s = data?.stats || {};
  return (
    <AdminLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Live statistics for{" "}
              {domain === "all"
                ? "all domains"
                : domains.find((d) => String(d.id) === String(domain))?.name ||
                  "selected domain"}
              .
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <label className="label text-xs">Domain</label>
            <select
              className="input w-full sm:min-w-[240px]"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              <option value="all">All Domains</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard icon={<Users />} label="Students" value={s.totalStudents} />
          <StatCard
            icon={<FileText />}
            label="Quizzes"
            value={s.totalQuizzes}
          />
          <StatCard
            icon={<CheckCircle2 />}
            label="Published"
            value={s.publishedQuizzes}
          />
          <StatCard
            icon={<FilePenLine />}
            label="Drafts"
            value={s.draftQuizzes}
          />
          <StatCard
            icon={<HelpCircle />}
            label="Questions"
            value={s.totalQuestions}
          />
          <StatCard
            icon={<Target />}
            label="Attempts"
            value={s.totalAttempts}
          />
          <StatCard
            icon={<BarChart3 />}
            label="Average Score"
            value={s.averageScore != null ? `${s.averageScore}%` : "—"}
          />
          <StatCard icon={<Trophy />} label="Passed" value={s.passedAttempts} />
          <StatCard
            icon={<XCircle />}
            label="Failed"
            value={s.failedAttempts}
          />
        </div>
        <Link
          to="/admin/live-quizzes"
          className="block card border-rose-200 bg-gradient-to-r from-rose-50 via-white to-orange-50 hover:shadow-md transition"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 grid place-items-center">
                <Radio />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">Live Quiz Center</h3>
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">
                    🔴 LIVE
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Create and manage live events separately from normal quizzes.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/80 border p-2">
                <p className="text-[10px] text-slate-400">Created</p>
                <b>{live.total || 0}</b>
              </div>
              <div className="rounded-xl bg-white/80 border p-2">
                <p className="text-[10px] text-slate-400">Live now</p>
                <b className="text-rose-600">{live.live_now || 0}</b>
              </div>
              <div className="rounded-xl bg-white/80 border p-2">
                <p className="text-[10px] text-slate-400">Upcoming</p>
                <b className="text-amber-600">{live.upcoming || 0}</b>
              </div>
            </div>
          </div>
        </Link>
        <div className="card">
          <h3 className="font-semibold mb-3">Domain scope</h3>
          <p className="text-sm text-gray-500">
            Every statistic above is returned by the backend using the selected
            domain's categories and quizzes. Switch domains to refresh the
            complete dataset.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
