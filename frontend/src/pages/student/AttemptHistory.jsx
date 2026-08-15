import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyAttempts } from "../../api/attempt.api";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import EmptyState from "../../components/common/EmptyState";
import {
  formatDate,
  formatPercent,
  formatTime,
  statusColor,
} from "../../utils/helpers";

export default function AttemptHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getMyAttempts()
      .then((r) => setAttempts(r.data.attempts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  const stats = useMemo(() => {
    const completed = attempts.filter((a) => a.status !== "in_progress");
    const passed = completed.filter((a) => a.status === "passed").length;
    const failed = completed.filter((a) => a.status === "failed").length;
    const avg = completed.length
      ? (
          completed.reduce((sum, a) => sum + parseFloat(a.percentage || 0), 0) /
          completed.length
        ).toFixed(1)
      : "0.0";
    return { total: attempts.length, passed, failed, avg };
  }, [attempts]);
  return (
    <StudentLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              My Attempt History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review your performance and track your progress.
            </p>
          </div>
          <Link
            to="/student/quizzes"
            className="btn-primary w-full sm:w-auto text-center"
          >
            Browse new quizzes
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400">
              Total attempts
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-2xl border bg-emerald-50/50 p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-600">
              Passed
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-600">
              {stats.passed}
            </p>
          </div>
          <div className="rounded-2xl border bg-rose-50/50 p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-rose-600">
              Failed
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-rose-600">
              {stats.failed}
            </p>
          </div>
          <div className="rounded-2xl border bg-indigo-50/50 p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-indigo-600">
              Avg score
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-indigo-700">
              {stats.avg}%
            </p>
          </div>
        </div>
        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : attempts.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No attempts yet"
            message="Take a quiz to see your history here."
            action={
              <Link to="/student/quizzes" className="btn-primary">
                Browse Quizzes
              </Link>
            }
          />
        ) : (
          <>
            <div className="hidden md:block card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      {[
                        "Quiz",
                        "Category",
                        "Score",
                        "Status",
                        "Time",
                        "Date",
                        "Review",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {attempts.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {a.quiz_title}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {a.category_name || "—"}
                        </td>
                        <td className="px-4 py-4 font-semibold">
                          {formatPercent(a.percentage)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={statusColor(a.status)}>
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {formatTime(a.time_taken)}
                        </td>
                        <td className="px-4 py-4 text-slate-400">
                          {formatDate(a.completed_at)}
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            to={`/student/results/${a.id}`}
                            className="rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="md:hidden space-y-3">
              {attempts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {a.quiz_title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {a.category_name || "General"} ·{" "}
                        {formatDate(a.completed_at)}
                      </p>
                    </div>
                    <Badge className={statusColor(a.status)}>{a.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-[10px] text-slate-400">Score</p>
                      <p className="font-bold">{formatPercent(a.percentage)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-[10px] text-slate-400">Time</p>
                      <p className="font-bold text-xs sm:text-sm">
                        {formatTime(a.time_taken)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-[10px] text-slate-400">Pass mark</p>
                      <p className="font-bold">{a.passing_score}%</p>
                    </div>
                  </div>
                  <Link
                    to={`/student/results/${a.id}`}
                    className="mt-3 block w-full rounded-xl bg-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Review Result
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
