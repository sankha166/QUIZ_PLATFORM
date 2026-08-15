import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getLiveQuizzes, getLiveQuizStats, getLiveRanking, getLiveRegistration, registerLiveQuiz } from "../../api/liveQuiz.api";

function countdown(value) {
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "Live now";
  const seconds = Math.floor(diff / 1000), days = Math.floor(seconds / 86400), hours = Math.floor((seconds % 86400) / 3600), minutes = Math.floor((seconds % 3600) / 60), secs = seconds % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m ${secs}s`;
}

function Avatar({ user, size = "h-11 w-11" }) {
  const initials = (user?.name || "Student").trim().split(/\s+/).map(x => x[0]).slice(0, 2).join("").toUpperCase();
  return user?.avatar_url ? <img src={user.avatar_url} alt="" className={`${size} rounded-full object-cover border border-white/30 shadow-sm`} /> : <div className={`${size} rounded-full grid place-items-center bg-slate-800 text-white font-bold text-sm border border-white/20`}>{initials}</div>;
}

function RankBadge({ rank }) {
  return <span className="h-8 w-8 shrink-0 rounded-full bg-slate-800 text-white grid place-items-center text-xs font-black">{rank}</span>;
}

export default function LiveQuizzes() {
  const [quizzes, setQuizzes] = useState([]), [stats, setStats] = useState({}), [ranking, setRanking] = useState([]), [me, setMe] = useState(null), [registrations, setRegistrations] = useState({}), [selected, setSelected] = useState(null), [now, setNow] = useState(Date.now()), [loading, setLoading] = useState(true);
  const navigate = useNavigate(), location = useLocation();

  const load = async () => {
    try {
      const [quizResponse, statsResponse, rankingResponse] = await Promise.all([getLiveQuizzes(), getLiveQuizStats(), getLiveRanking()]);
      const list = quizResponse.data.quizzes || [];
      setQuizzes(list); setStats(statsResponse.data.stats || {}); setRanking(rankingResponse.data.ranking || []); setMe(rankingResponse.data.me || null);
      const upcoming = list.filter(q => q.live_state === "upcoming");
      const results = await Promise.all(upcoming.map(async q => { try { const r = await getLiveRegistration(q.id); return [q.id, r.data.registered]; } catch { return [q.id, false]; } }));
      setRegistrations(Object.fromEntries(results));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { load(); const timer = setInterval(() => { setNow(Date.now()); load(); }, 15000); return () => clearInterval(timer); }, []);

  const liveNow = useMemo(() => quizzes.filter(q => q.live_state === "live"), [quizzes, now]);
  const upcoming = useMemo(() => quizzes.filter(q => q.live_state === "upcoming"), [quizzes, now]);
  const previous = useMemo(() => quizzes.filter(q => q.live_state === "completed"), [quizzes, now]);
  const register = async id => { try { await registerLiveQuiz(id); setRegistrations(current => ({ ...current, [id]: true })); } catch (error) { console.error(error); } };
  const showPreviousStats = async quiz => { try { const response = await getLiveQuizStats(quiz.id); setSelected(response.data.stats); } catch (error) { console.error(error); } };
  const topThree = ranking.slice(0, 3), rest = ranking.slice(3);

  return <StudentLayout><div className="space-y-7 min-w-0">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Live Arena</h1><span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">🔴 LIVE QUIZ</span></div><p className="text-sm text-slate-500 mt-1">Timed competitions, speed ratings and a dedicated live ranking.</p></div>
      <Link to="/student/quizzes" className="btn-secondary">← All Quizzes</Link>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="card border-indigo-100 bg-gradient-to-br from-indigo-50 to-white"><p className="text-xs text-slate-500">Live attempted</p><p className="mt-1 text-2xl sm:text-3xl font-black text-indigo-600">{stats.attempted || 0}</p></div>
      <div className="card border-amber-100 bg-gradient-to-br from-amber-50 to-white"><p className="text-xs text-slate-500">Total rating</p><p className="mt-1 text-2xl sm:text-3xl font-black text-amber-600">{Number(stats.rating || 0).toFixed(2)}</p></div>
      <div className="card border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"><p className="text-xs text-slate-500">Global rank</p><p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-600">#{stats.overall_rank || "—"}</p></div>
      <div className="card border-rose-100 bg-gradient-to-br from-rose-50 to-white"><p className="text-xs text-slate-500">Upcoming</p><p className="mt-1 text-2xl sm:text-3xl font-black text-rose-600">{upcoming.length}</p></div>
    </div>

    {location.state?.completed && <div className="card border-emerald-200 bg-emerald-50"><b>🎉 Live quiz completed</b><p className="mt-1 text-sm">Rating earned: <strong>{location.state.completed.rating}</strong> · Event rank: <strong>#{location.state.completed.rank}</strong></p></div>}

    {loading ? <LoadingSpinner size="lg" className="py-16" /> : <>
      {liveNow.length > 0 && <section><div className="mb-3"><h2 className="text-xl font-bold">🔴 Happening Now</h2><p className="text-sm text-slate-500">Enter while the event is active. Each question has its own timer.</p></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{liveNow.map(q => <div key={q.id} className="card border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white">LIVE QUIZ</span><span className="text-xs text-rose-600 font-black">LIVE NOW</span></div><h3 className="mt-3 text-xl font-bold">{q.title}</h3><p className="mt-1 text-sm text-slate-500">{q.description || "Live quiz event"}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600"><span>❓ {q.question_count || 0} questions</span><span>👥 {q.registration_count || 0} registered</span></div><button onClick={() => navigate(`/student/live-quizzes/${q.id}/attempt`)} className="btn-primary mt-5 w-full">🚀 Enter Live Quiz</button></div>)}</div></section>}

      <section><div className="mb-3"><h2 className="text-xl font-bold">⏳ Upcoming Live Quizzes</h2><p className="text-sm text-slate-500">Register in advance so the event stays on your radar.</p></div>{upcoming.length ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{upcoming.map(q => <div key={q.id} className="card border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-black text-white">LIVE QUIZ</span><h3 className="mt-3 text-lg font-bold">{q.title}</h3><p className="text-sm text-slate-500 mt-1">{q.description || "Scheduled competitive quiz challenge."}</p></div><div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm shrink-0"><p className="text-[10px] uppercase text-slate-400">Starts in</p><p className="font-black text-indigo-600">{countdown(q.live_start_at)}</p></div></div><div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600"><span>📅 {new Date(q.live_start_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</span><span>❓ {q.question_count || 0} questions</span><span>👥 {q.registration_count || 0} registered</span></div><div className="mt-5">{registrations[q.id] ? <span className="btn-success block w-full text-center">✓ Registered</span> : <button onClick={() => register(q.id)} className="btn-primary w-full">🔔 Register in advance</button>}</div></div>)}</div> : <div className="card text-center py-12 text-slate-500">No upcoming live quizzes scheduled yet.</div>}</section>

      <section className="card overflow-hidden border-slate-800 bg-slate-950 text-white">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/10 pb-5"><div><span className="text-[10px] font-black tracking-[0.18em] text-indigo-300">LIVE RATING</span><h2 className="mt-1 text-xl sm:text-2xl font-extrabold">Global Live Ranking</h2><p className="mt-1 text-xs sm:text-sm text-slate-400">Total live rating across completed live quizzes only.</p></div>{me && <div className="rounded-2xl bg-white/10 px-4 py-3 text-right"><p className="text-[10px] text-slate-400">YOUR POSITION</p><p className="text-xl font-black">#{me.rank} <span className="text-sm text-amber-300">{Number(me.total_rating).toFixed(2)}</span></p></div>}</div>
        {topThree.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">{topThree.map((user,index)=><div key={user.id} className={`rounded-3xl p-4 text-center border ${index===0?"bg-gradient-to-b from-amber-400/20 to-white/5 border-amber-400/30":"bg-white/5 border-white/10"}`}><div className="mx-auto mb-2 w-fit relative"><Avatar user={user} size={index===0?"h-16 w-16":"h-14 w-14"}/><span className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-slate-800 border border-white/20 grid place-items-center text-xs font-black">{user.rank}</span></div><p className="font-bold truncate">{user.name}</p><p className="mt-1 text-lg font-black text-amber-300">{Number(user.total_rating).toFixed(2)}</p><p className="text-[11px] text-slate-400">{user.attended} live {user.attended===1?"quiz":"quizzes"}</p></div>)}</div> : <div className="py-10 text-center text-slate-400">Complete a live quiz to enter the ranking.</div>}
        {rest.length > 0 && <div className="mt-4 space-y-2">{rest.map(user=><div key={user.id} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 sm:px-4 ${me?.id===user.id?"border-indigo-400/60 bg-indigo-500/10":"border-white/10 bg-white/[0.03]"}`}><RankBadge rank={user.rank}/><Avatar user={user} size="h-10 w-10"/><div className="min-w-0 flex-1"><p className="font-semibold truncate">{user.name}</p><p className="text-[11px] text-slate-500">Attended {user.attended} · Best {Number(user.best_rating).toFixed(2)}</p></div><div className="text-right"><p className="font-black text-amber-300">{Number(user.total_rating).toFixed(2)}</p><p className="text-[10px] text-slate-500">RATING</p></div></div>)}</div>}
      </section>

      <section><div className="flex items-end justify-between gap-3 mb-3"><div><h2 className="text-xl font-bold">🗓 Past Live Quizzes</h2><p className="text-sm text-slate-500">Every completed event remains here whether you attended or not.</p></div><span className="text-xs font-bold text-slate-500">{previous.length} events</span></div>{previous.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{previous.map(q => <div key={q.id} className="card cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition" onClick={() => showPreviousStats(q)}><div className="flex justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">LIVE QUIZ</span><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">ENDED</span></div><h3 className="mt-2 font-bold truncate">{q.title}</h3><p className="text-xs text-slate-500 mt-1">{new Date(q.live_start_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p></div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-2"><p className="text-[10px] text-slate-400">Questions</p><b>{q.question_count || 0}</b></div><div className="rounded-xl bg-slate-50 p-2"><p className="text-[10px] text-slate-400">Attempts</p><b>{q.attempt_count || 0}</b></div><div className="rounded-xl bg-slate-50 p-2"><p className="text-[10px] text-slate-400">{q.attempt_count ? "Participants" : "Registered"}</p><b>{q.attempt_count || q.registration_count || 0}</b></div></div><p className="mt-3 text-xs text-indigo-600 font-semibold">View event stats & your result →</p></div>)}</div> : <div className="card text-center py-10 text-slate-500">No previous live quizzes.</div>}</section>
    </>}
  </div>{selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3" onClick={() => setSelected(null)}><div className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-3xl bg-white p-5 sm:p-7 shadow-2xl" onClick={event => event.stopPropagation()}><div className="flex justify-between gap-3"><div><span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-700">LIVE QUIZ</span><h2 className="mt-2 text-xl font-bold">{selected.title}</h2></div><button onClick={() => setSelected(null)} className="h-9 w-9 rounded-full bg-slate-100">×</button></div><div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">{[["Your rating",selected.rating],["Your rank",`#${selected.rank || "—"}`],["Participants",selected.students],["Top rating",selected.top_rating]].map(([label,value])=><div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}</div><p className="mt-5 text-sm text-slate-500">Event average rating: <b>{selected.avg_rating}</b> · Total participants: <b>{selected.students}</b></p></div></div>}
  </StudentLayout>;
}
