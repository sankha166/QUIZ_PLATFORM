import { useEffect, useMemo, useState } from "react";
import { getLeaderboard } from "../../api/admin.api";
import { getCategories as getCats } from "../../api/quiz.api";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import { formatPercent } from "../../utils/helpers";
const medals = ["🥇", "🥈", "🥉"];
function StudentAvatar({ entry, size = "h-10 w-10" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [entry.avatar_url]);
  const url = entry.avatar_url;
  if (url && !failed)
    return (
      <img
        src={url}
        alt={entry.name || "Student"}
        onError={() => setFailed(true)}
        className={`${size} rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700`}
      />
    );
  return (
    <div
      className={`${size} rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white grid place-items-center font-bold shrink-0`}
    >
      {entry.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}
export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard] = useState([]),
    [categories, setCategories] = useState([]),
    [loading, setLoading] = useState(true),
    [type, setType] = useState("overall"),
    [period, setPeriod] = useState("all"),
    [categoryId, setCategoryId] = useState("");
  useEffect(() => {
    getCats()
      .then((r) => setCategories(r.data.categories || []))
      .catch(console.error);
  }, []);
  useEffect(() => {
    setLoading(true);
    getLeaderboard({
      type,
      period,
      categoryId: type === "category" ? categoryId : undefined,
    })
      .then((r) => setBoard(r.data.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, period, categoryId]);
  const currentRank = useMemo(
    () => board.find((e) => e.id === user?.id)?.rank,
    [board, user],
  );
  return (
    <StudentLayout>
      <div className="space-y-6 min-w-0">
        <div className="rounded-3xl border bg-white p-5 sm:p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Leaderboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Compare your performance with other learners.
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300 font-semibold text-center">
              {currentRank ? `Your rank: #${currentRank}` : "Not ranked yet"}
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <p className="label text-xs">Leaderboard type</p>
            <select
              className="input w-full"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="overall">Overall</option>
              <option value="category">By Category</option>
            </select>
          </div>
          {type === "category" && (
            <div>
              <p className="label text-xs">Category</p>
              <select
                className="input w-full"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <p className="label text-xs">Time period</p>
            <select
              className="input w-full"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="all">All time</option>
              <option value="monthly">This month</option>
              <option value="weekly">This week</option>
            </select>
          </div>
        </div>
        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : board.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="No leaderboard data"
            message="Complete quizzes to appear here."
          />
        ) : (
          <>
            <div className="hidden md:block card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b dark:border-slate-700">
                    <tr>
                      {[
                        "Rank",
                        "Student",
                        "Quizzes",
                        "Avg score",
                        "Highest",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white dark:bg-slate-900 dark:divide-slate-800">
                    {board.map((e) => (
                      <tr
                        key={e.id}
                        className={`${e.id === user?.id ? "bg-indigo-50/70 dark:bg-indigo-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}
                      >
                        <td className="px-4 py-4 text-lg">
                          {medals[e.rank - 1] || `#${e.rank}`}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar entry={e} size="h-10 w-10" />
                            <div className="min-w-0">
                              <p className="text-slate-900 dark:text-slate-100 truncate font-medium">
                                {e.name}
                              </p>
                              {e.id === user?.id && (
                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                  Your profile
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                          {e.quizzes_completed}
                        </td>
                        <td className="px-4 py-4 font-semibold text-indigo-700 dark:text-indigo-300">
                          {formatPercent(e.average_score)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatPercent(e.highest_score)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="md:hidden space-y-3">
              {board.map((e) => (
                <div
                  key={e.id}
                  className={`rounded-2xl border p-4 shadow-sm ${e.id === user?.id ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/30" : "bg-white dark:bg-slate-900 dark:border-slate-800"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl w-8 text-center">
                      {medals[e.rank - 1] || `#${e.rank}`}
                    </div>
                    <StudentAvatar entry={e} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {e.name}
                      </p>
                      {e.id === user?.id && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                          Your profile
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2">
                      <p className="text-[10px] text-slate-400">Quizzes</p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {e.quizzes_completed}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2">
                      <p className="text-[10px] text-slate-400">Average</p>
                      <p className="font-bold text-indigo-700 dark:text-indigo-300">
                        {formatPercent(e.average_score)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2">
                      <p className="text-[10px] text-slate-400">Highest</p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatPercent(e.highest_score)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
