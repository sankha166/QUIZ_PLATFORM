import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getLiveQuizzes, getLiveQuizStats } from "../../api/liveQuiz.api";
import { publishLiveQuiz, unpublishLiveQuiz, deleteLiveQuiz } from "../../api/adminLiveQuiz.api";

const getStatus = (quiz) => {
  if (quiz.status === "draft") return "Draft";
  if (quiz.live_state === "live") return "Live now";
  if (quiz.live_state === "upcoming") return "Upcoming";
  return "Completed";
};

const displayIst = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(d)} IST`;
};

const countdown = (value, now) => {
  const diff = new Date(value).getTime() - now;
  if (!Number.isFinite(diff)) return "—";
  if (diff <= 0) return "Starting now";
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days) return `${days}d ${hours}h ${minutes}m`;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
};

const remaining = (value, now) => countdown(value, now);

export default function LiveQuizManagement() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [now, setNow] = useState(Date.now());

  const load = async () => {
    try {
      const [listResponse, statsResponse] = await Promise.all([getLiveQuizzes(), getLiveQuizStats()]);
      setItems(listResponse.data.quizzes || []);
      setStats(statsResponse.data.stats || {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const refresh = setInterval(load, 15000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(refresh); clearInterval(clock); };
  }, []);

  const grouped = useMemo(() => ({
    draft: items.filter((q) => getStatus(q) === "Draft"),
    live: items.filter((q) => getStatus(q) === "Live now"),
    upcoming: items.filter((q) => getStatus(q) === "Upcoming"),
    completed: items.filter((q) => getStatus(q) === "Completed"),
  }), [items]);

  const togglePublish = async (quiz) => {
    setBusy(quiz.id);
    try {
      if (quiz.status === "published") await unpublishLiveQuiz(quiz.id);
      else await publishLiveQuiz(quiz.id);
      await load();
    } catch (error) {
      alert(error?.response?.data?.message || "Unable to change live quiz status.");
    } finally { setBusy(null); }
  };

  const remove = async (quiz) => {
    if (!window.confirm(`Delete live quiz "${quiz.title}" permanently?`)) return;
    setBusy(quiz.id);
    try {
      await deleteLiveQuiz(quiz.id);
      await load();
    } catch (error) {
      alert(error?.response?.data?.message || "Unable to delete live quiz.");
    } finally { setBusy(null); }
  };

  const openStats = async (quiz) => {
    try {
      const response = await getLiveQuizStats(quiz.id);
      setSelected(response.data.stats);
    } catch (error) {
      alert(error?.response?.data?.message || "Unable to load statistics.");
    }
  };

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  const statusPill = (status) => {
    const cls = status === "Live now" ? "bg-rose-50 text-rose-700" : status === "Upcoming" ? "bg-amber-50 text-amber-700" : status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";
    return <span className={`rounded-full px-2.5 py-1 text-xs ${cls}`}>{status}</span>;
  };

  const controls = (quiz, status) => (
    <div className="flex flex-wrap gap-2">
      <Link to={`/admin/live-quizzes/${quiz.id}`} className="btn-secondary text-xs">Manage</Link>
      <Link to={`/admin/live-quizzes/${quiz.id}/edit`} className="btn-secondary text-xs">Edit</Link>
      <button onClick={() => openStats(quiz)} className="btn-secondary text-xs">Stats</button>
      {status !== "Live now" && status !== "Completed" && <button disabled={busy === quiz.id} onClick={() => togglePublish(quiz)} className="btn-primary text-xs">{busy === quiz.id ? "Saving…" : quiz.status === "published" ? "Unpublish" : "Publish"}</button>}
      {status !== "Live now" && <button disabled={busy === quiz.id} onClick={() => remove(quiz)} className="btn-secondary text-xs text-rose-600">Delete</button>}
    </div>
  );

  return (
    <AdminLayout>
      <div className="min-w-0 space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Live events</p>
            <h1 className="page-title mt-1">Live Quizzes</h1>
            <p className="page-subtitle">One absolute IST schedule is shared by admin and students.</p>
          </div>
          <Link to="/admin/quizzes/create?live=1" className="btn-primary">Create live quiz</Link>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[["Created", stats.total ?? items.length], ["Draft", stats.drafts ?? grouped.draft.length], ["Live now", stats.live_now ?? grouped.live.length], ["Upcoming", stats.upcoming ?? grouped.upcoming.length], ["Completed", stats.completed ?? grouped.completed.length]].map(([label, value]) => (
            <div className="stat-card" key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl text-slate-900">{value}</p></div>
          ))}
        </div>

        <section className="card overflow-hidden p-0">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-lg">Live Event Management</h2>
            <p className="mt-1 text-sm text-slate-500">Countdowns update every second. Schedules are shown in IST.</p>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="p-3 font-medium">Quiz</th><th className="p-3 font-medium">Domain</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Start</th><th className="p-3 font-medium">Time left</th><th className="p-3 font-medium">Questions</th><th className="p-3 font-medium">Attempts</th><th className="p-3 font-medium">Controls</th></tr></thead>
              <tbody>
                {items.map((quiz) => {
                  const status = getStatus(quiz);
                  return <tr key={quiz.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"><td className="p-3"><p className="text-slate-900">{quiz.title}</p><p className="mt-1 text-[11px] text-slate-400">Live quiz</p></td><td className="p-3 text-slate-600">{quiz.live_all_domains ? "All Domains" : quiz.domain_name || "—"}</td><td className="p-3">{statusPill(status)}</td><td className="p-3 text-slate-600">{displayIst(quiz.live_start_at)}</td><td className="p-3">{status === "Upcoming" ? <span className="text-indigo-700">{countdown(quiz.live_start_at, now)}</span> : status === "Live now" ? <span className="text-rose-700">{remaining(quiz.computed_end_at, now)} left</span> : <span className="text-slate-400">—</span>}</td><td className="p-3 text-slate-600">{quiz.question_count || 0}</td><td className="p-3 text-slate-600">{quiz.attempt_count || 0}</td><td className="p-3">{controls(quiz, status)}</td></tr>;
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {items.map((quiz) => {
              const status = getStatus(quiz);
              return <article key={quiz.id} className="p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-base text-slate-900">{quiz.title}</p><p className="mt-1 text-xs text-slate-500">{quiz.live_all_domains ? "All Domains" : quiz.domain_name || "—"}</p></div>{statusPill(status)}</div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">Start</dt><dd className="mt-1 text-slate-700">{displayIst(quiz.live_start_at)}</dd></div><div><dt className="text-slate-400">Time</dt><dd className="mt-1 text-slate-700">{status === "Upcoming" ? countdown(quiz.live_start_at, now) : status === "Live now" ? `${remaining(quiz.computed_end_at, now)} left` : "—"}</dd></div><div><dt className="text-slate-400">Questions</dt><dd className="mt-1 text-slate-700">{quiz.question_count || 0}</dd></div><div><dt className="text-slate-400">Attempts</dt><dd className="mt-1 text-slate-700">{quiz.attempt_count || 0}</dd></div></dl>
                <div className="mt-4">{controls(quiz, status)}</div>
              </article>;
            })}
          </div>
        </section>

        {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-3" onClick={() => setSelected(null)}><div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7" onClick={(e) => e.stopPropagation()}><div className="flex justify-between gap-3"><div><p className="eyebrow text-rose-600">Live quiz</p><h2 className="mt-1 text-xl">{selected.title}</h2><p className="text-sm text-slate-500">Event statistics</p></div><button onClick={() => setSelected(null)} className="btn-icon">×</button></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{[["Attempts", selected.attempts], ["Registered", selected.registrations], ["Students", selected.students], ["Avg rating", selected.avg_rating], ["Top rating", selected.top_rating]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg text-slate-900">{value}</p></div>)}</div><div className="mt-5 space-y-1 text-sm text-slate-600"><p>Start: {displayIst(selected.live_start_at)}</p><p>Automatic end: {displayIst(selected.computed_end_at)}</p></div></div></div>}
      </div>
    </AdminLayout>
  );
}
