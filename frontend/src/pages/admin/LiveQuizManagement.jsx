import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  getLiveQuizzes,
  getLiveQuizStats,
  getAdminLiveQuizStats,
} from "../../api/liveQuiz.api";

export default function LiveQuizManagement() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([getLiveQuizzes(), getLiveQuizStats()])
      .then(async ([a, b]) => {
        const list = a.data.quizzes || [];
        setItems(list);
        setStats(b.data.stats || {});

        if (selected) {
          const r = await getAdminLiveQuizStats(selected.id);
          setSelected(r.data.stats);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  const status = (quiz) => {
    const now = Date.now();
    const start = new Date(quiz.live_start_at).getTime();
    const end = new Date(
      quiz.computed_end_at || quiz.live_end_at || 0,
    ).getTime();

    if (quiz.status === "draft") return "Draft";
    if (start > now) return "Upcoming";
    if (end > now) return "Live now";
    return "Completed";
  };

  const grouped = useMemo(
    () => ({
      draft: items.filter((quiz) => status(quiz) === "Draft"),
      live: items.filter((quiz) => status(quiz) === "Live now"),
      upcoming: items.filter((quiz) => status(quiz) === "Upcoming"),
      completed: items.filter((quiz) => status(quiz) === "Completed"),
    }),
    [items],
  );

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" className="py-20" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                Live Quizzes
              </h1>
              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                🔴 LIVE CENTER
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Create, schedule, control and analyse live events only.
            </p>
          </div>
          <Link
            to="/admin/quizzes/create?live=1"
            className="btn-primary text-center"
          >
            ＋ Create Live Quiz
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Created", stats.total || items.length, "text-indigo-600"],
            ["Draft", stats.drafts ?? grouped.draft.length, "text-slate-600"],
            [
              "Live now",
              stats.live_now ?? grouped.live.length,
              "text-rose-600",
            ],
            [
              "Upcoming",
              stats.upcoming ?? grouped.upcoming.length,
              "text-amber-600",
            ],
            [
              "Completed",
              stats.completed ?? grouped.completed.length,
              "text-emerald-600",
            ],
          ].map(([label, value, className]) => (
            <div key={label} className="card">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`mt-1 text-2xl font-black ${className}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="card">
            <p className="text-xs text-slate-500">Total attempts</p>
            <p className="mt-1 text-2xl font-bold">{stats.attempts || 0}</p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-500">Average rating</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">
              {Number(stats.avg_rating || 0).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-500">Events</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {items.length}
            </p>
          </div>
        </div>

        <section className="card">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Live Event Management</h2>
            <p className="text-sm text-slate-500">
              Normal quizzes are intentionally excluded.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="p-3">Quiz</th>
                  <th className="p-3">Domain</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Start (IST)</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">Registered</th>
                  <th className="p-3">Control</th>
                </tr>
              </thead>
              <tbody>
                {items.map((quiz) => {
                  const currentStatus = status(quiz);

                  return (
                    <tr
                      key={quiz.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-2">
                          {quiz.title}
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            LIVE QUIZ
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        {quiz.live_all_domains
                          ? "All Domains"
                          : quiz.domain_name || "—"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            currentStatus === "Live now"
                              ? "bg-rose-100 text-rose-700"
                              : currentStatus === "Upcoming"
                                ? "bg-amber-100 text-amber-700"
                                : currentStatus === "Completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        {quiz.live_start_at
                          ? new Date(quiz.live_start_at).toLocaleString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" },
                            )
                          : "—"}
                      </td>
                      <td className="p-3">{quiz.attempt_count || 0}</td>
                      <td className="p-3">{quiz.registration_count || 0}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/admin/live-quizzes/${quiz.id}`}
                            className="btn-secondary text-xs"
                          >
                            Manage
                          </Link>
                          <Link
                            to={`/admin/live-quizzes/${quiz.id}/edit`}
                            className="btn-secondary text-xs"
                          >
                            Edit
                          </Link>
                          <button
                            className="btn-secondary text-xs"
                            onClick={async () => {
                              const response = await getAdminLiveQuizStats(
                                quiz.id,
                              );
                              setSelected(response.data.stats);
                            }}
                          >
                            Stats
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 sm:p-6">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700">
                      LIVE QUIZ
                    </span>
                    <h2 className="text-xl font-bold sm:text-2xl">
                      {selected.title}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500">Event analytics</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="h-9 w-9 rounded-full bg-slate-100"
                  aria-label="Close statistics"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ["Attempts", selected.attempts],
                  ["Registered", selected.registrations],
                  ["Students", selected.students],
                  ["Avg rating", selected.avg_rating],
                  ["Top rating", selected.top_rating],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 text-sm text-slate-600">
                <p>
                  Start: {selected.live_start_at
                    ? new Date(selected.live_start_at).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })
                    : "—"} IST
                </p>
                <p>
                  Automatic end: {selected.computed_end_at
                    ? new Date(selected.computed_end_at).toLocaleString(
                        "en-IN",
                        { timeZone: "Asia/Kolkata" },
                      )
                    : "After final question"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
