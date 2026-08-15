import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  getLiveQuizzes,
  getLiveQuizStats,
  getLiveRegistration,
  registerLiveQuiz,
} from "../../api/liveQuiz.api";

function countdown(value) {
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "Live now";
  const seconds = Math.floor(diff / 1000),
    days = Math.floor(seconds / 86400),
    hours = Math.floor((seconds % 86400) / 3600),
    minutes = Math.floor((seconds % 3600) / 60),
    secs = seconds % 60;
  if (days) return `${days}d ${hours}h ${minutes}m`;
  if (hours) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}

export default function LiveQuizzes() {
  const [quizzes, setQuizzes] = useState([]),
    [stats, setStats] = useState({}),
    [registrations, setRegistrations] = useState({}),
    [selected, setSelected] = useState(null),
    [now, setNow] = useState(Date.now()),
    [loading, setLoading] = useState(true);
  const navigate = useNavigate(),
    location = useLocation();
  const load = async () => {
    try {
      const [quizResponse, statsResponse] = await Promise.all([
        getLiveQuizzes(),
        getLiveQuizStats(),
      ]);
      const list = quizResponse.data.quizzes || [];
      setQuizzes(list);
      setStats(statsResponse.data.stats || {});
      const upcoming = list.filter((q) => q.live_state === "upcoming");
      const results = await Promise.all(
        upcoming.map(async (q) => {
          try {
            const r = await getLiveRegistration(q.id);
            return [q.id, r.data.registered];
          } catch {
            return [q.id, false];
          }
        }),
      );
      setRegistrations(Object.fromEntries(results));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      setNow(Date.now());
      load();
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  const liveNow = useMemo(
    () => quizzes.filter((q) => q.live_state === "live"),
    [quizzes, now],
  );
  const upcoming = useMemo(
    () => quizzes.filter((q) => q.live_state === "upcoming"),
    [quizzes, now],
  );
  const previous = useMemo(
    () => quizzes.filter((q) => q.live_state === "completed"),
    [quizzes, now],
  );
  const register = async (id) => {
    try {
      await registerLiveQuiz(id);
      setRegistrations((current) => ({ ...current, [id]: true }));
    } catch (error) {
      console.error(error);
    }
  };
  const showPreviousStats = async (quiz) => {
    try {
      const response = await getLiveQuizStats(quiz.id);
      setSelected(response.data.stats);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex items-center gap-3">
          <Link to="/student/quizzes" className="btn-secondary">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">🔴 Live Quizzes</h1>
            <p className="text-sm text-slate-500 mt-1">
              Competitive events are separate from normal quizzes, attempts and
              the normal leaderboard.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card">
            <p className="text-xs text-slate-500">Live attempted</p>
            <p className="mt-1 text-3xl font-bold text-indigo-600">
              {stats.attempted || 0}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-500">Total rating</p>
            <p className="mt-1 text-3xl font-bold text-amber-500">
              {Number(stats.rating || 0).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-500">Overall rank</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">
              #{stats.overall_rank || "—"}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-500">Upcoming</p>
            <p className="mt-1 text-3xl font-bold text-rose-600">
              {upcoming.length}
            </p>
          </div>
        </div>
        {location.state?.completed && (
          <div className="card border-emerald-200 bg-emerald-50">
            <b>🎉 Live quiz completed</b>
            <p className="mt-1 text-sm">
              Rating earned: <strong>{location.state.completed.rating}</strong>{" "}
              · Event rank: <strong>#{location.state.completed.rank}</strong>
            </p>
          </div>
        )}
        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : (
          <>
            {liveNow.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className="text-xl font-bold">🔴 Happening Now</h2>
                  <p className="text-sm text-slate-500">
                    The event stays available until the admin ends it; your own
                    attempt ends automatically after its final question.
                  </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {liveNow.map((q) => (
                    <div
                      key={q.id}
                      className="card border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">
                          LIVE QUIZ
                        </span>
                        <span className="text-xs text-rose-600 font-bold">
                          LIVE NOW
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold">{q.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {q.description || "Live quiz event"}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span>❓ {q.question_count || 0} questions</span>
                        <span>👥 {q.registration_count || 0} registered</span>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/student/live-quizzes/${q.id}/attempt`)
                        }
                        className="btn-primary mt-5 w-full"
                      >
                        🚀 Enter Live Quiz
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section>
              <div className="mb-3">
                <h2 className="text-xl font-bold">⏳ Upcoming Live Quizzes</h2>
                <p className="text-sm text-slate-500">
                  Register before the start time.
                </p>
              </div>
              {upcoming.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {upcoming.map((q) => (
                    <div
                      key={q.id}
                      className="card border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                            LIVE QUIZ
                          </span>
                          <h3 className="mt-3 text-lg font-bold">{q.title}</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {q.description ||
                              "Scheduled competitive quiz challenge."}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
                          <p className="text-[10px] uppercase text-slate-400">
                            Starts in
                          </p>
                          <p className="font-black text-indigo-600">
                            {countdown(q.live_start_at)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span>
                          📅{" "}
                          {new Date(q.live_start_at).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}{" "}
                          IST
                        </span>
                        <span>❓ {q.question_count || 0} questions</span>
                        <span>👥 {q.registration_count || 0} registered</span>
                      </div>
                      <div className="mt-5">
                        {registrations[q.id] ? (
                          <span className="btn-success block w-full text-center">
                            ✓ Registered
                          </span>
                        ) : (
                          <button
                            onClick={() => register(q.id)}
                            className="btn-primary w-full"
                          >
                            🔔 Register in advance
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-12 text-slate-500">
                  No upcoming live quizzes scheduled yet.
                </div>
              )}
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">
                🗓 Previous Live Quizzes
              </h2>
              {previous.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {previous.map((q) => (
                    <div
                      key={q.id}
                      className="card cursor-pointer hover:shadow-md transition"
                      onClick={() => showPreviousStats(q)}
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                            LIVE QUIZ
                          </span>
                          <h3 className="mt-2 font-bold">{q.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Started{" "}
                            {new Date(q.live_start_at).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            })}{" "}
                            IST
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Ended
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] text-slate-400">
                            Questions
                          </p>
                          <b>{q.question_count || 0}</b>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] text-slate-400">Attempts</p>
                          <b>{q.attempt_count || 0}</b>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] text-slate-400">
                            Registered
                          </p>
                          <b>{q.registration_count || 0}</b>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-indigo-600 font-semibold">
                        Click to view event rank & stats →
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-10 text-slate-500">
                  No previous live quizzes.
                </div>
              )}
            </section>
          </>
        )}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between">
              <div>
                <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700">
                  LIVE QUIZ
                </span>
                <h2 className="mt-2 text-xl font-bold">{selected.title}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="h-9 w-9 rounded-full bg-slate-100"
              >
                ×
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["Your rating", selected.rating],
                ["Your rank", `#${selected.rank || "—"}`],
                ["Participants", selected.students],
                ["Top rating", selected.top_rating],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-black">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Event average rating: <b>{selected.avg_rating}</b> · Total
              participants: <b>{selected.students}</b>
            </p>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
