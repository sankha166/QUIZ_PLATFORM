import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAttemptById } from "../../api/attempt.api";
import { getQuizReview, submitQuizReview } from "../../api/reviews.api";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import { formatTime, formatDate, statusColor } from "../../utils/helpers";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
function qt(s) {
  s = Number(s) || 0;
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}
const moods = [
  ["love", "😍", "Amazing!"],
  ["happy", "😊", "Great!"],
  ["okay", "🙂", "Good"],
  ["sad", "😐", "Could be better"],
  ["angry", "😞", "Not satisfied"],
];
export default function QuizResult() {
  const { attemptId } = useParams(),
    [attempt, setAttempt] = useState(null),
    [loading, setLoading] = useState(true),
    [reviewOpen, setReviewOpen] = useState(false),
    [mood, setMood] = useState(""),
    [review, setReview] = useState(""),
    [sending, setSending] = useState(false),
    [filter, setFilter] = useState("all"),
    [jump, setJump] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getAttemptById(attemptId)
      .then((a) => {
        if (active) setAttempt(a.data.attempt);
        return getQuizReview(attemptId).catch(() => ({
          data: { review: null },
        }));
      })
      .then((r) => {
        if (active && r?.data && !r.data.review) setReviewOpen(true);
      })
      .catch((e) => {
        if (active)
          setError(
            e?.response?.data?.message || "Unable to load this attempt result.",
          );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [attemptId]);
  const answers = attempt?.answers || [];
  const stats = useMemo(() => {
    const t = answers.map((a) => Number(a.time_taken) || 0);
    return {
      avg: t.length ? Math.round(t.reduce((a, b) => a + b, 0) / t.length) : 0,
      fastest: t.length ? Math.min(...t) : 0,
    };
  }, [answers]);
  const analysis = attempt?.analysis;
  const comparison = analysis?.comparison || {};
  const topper = analysis?.topper;
  const questionStats = analysis?.questionStats || [];
  const distribution = [
    { name: "Correct", value: Number(attempt?.correct_answers) || 0, color: "#10b981" },
    { name: "Incorrect", value: Number(attempt?.incorrect_answers) || 0, color: "#f43f5e" },
    { name: "Skipped", value: Number(attempt?.unanswered) || 0, color: "#94a3b8" },
  ].filter((item) => item.value > 0);
  const questionChart = answers.map((answer, index) => {
    const benchmark = questionStats.find((item) => String(item.question_id) === String(answer.question_id));
    return {
      name: `Q${index + 1}`,
      time: Number(answer.time_taken) || 0,
      average: Number(benchmark?.average_time) || 0,
      result: answer.is_correct ? "Correct" : answer.selected_option_id ? "Incorrect" : "Skipped",
    };
  });
  const rank = comparison.completed_attempts
    ? Number(comparison.attempts_ahead || 0) + 1
    : null;
  const scoreDelta = Number(attempt?.percentage || 0) - Number(comparison.average_percentage || 0);
  const timeDelta = Number(attempt?.time_taken || 0) - Number(comparison.average_time || 0);
  const filtered = useMemo(
    () =>
      answers
        .map((a, i) => ({ ...a, _number: i + 1 }))
        .filter(
          (a) =>
            filter === "all" ||
            (filter === "correct" && a.is_correct) ||
            (filter === "wrong" && !a.is_correct && a.selected_option_id) ||
            (filter === "unattempted" && !a.selected_option_id),
        ),
    [answers, filter],
  );
  const [current, setCurrent] = useState(0);
  useEffect(() => setCurrent(0), [filter]);
  const currentAnswer = filtered[current];
  const sendReview = async () => {
    if (!mood) return;
    setSending(true);
    try {
      await submitQuizReview({ attemptId: Number(attemptId), mood, review });
      setReviewOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };
  const goToNumber = () => {
    const n = Number(jump);
    if (n >= 1 && n <= answers.length) {
      const idx = filtered.findIndex((a) => a._number === n);
      if (idx >= 0) setCurrent(idx);
      else {
        setFilter("all");
        setCurrent(n - 1);
      }
      setJump("");
    }
  };
  if (loading)
    return (
      <StudentLayout>
        <LoadingSpinner size="lg" className="py-20" />
      </StudentLayout>
    );
  if (!attempt)
    return (
      <StudentLayout>
        <div className="max-w-xl mx-auto py-16 text-center">
          <div className="text-5xl">📄</div>
          <h2 className="mt-4 text-xl font-bold">Unable to load result</h2>
          <p className="mt-2 text-sm text-slate-500">
            {error || "This attempt could not be found."}
          </p>
          <Link
            to="/student/attempts"
            className="btn-primary inline-block mt-5"
          >
            ← Back
          </Link>
        </div>
      </StudentLayout>
    );
  const passed = attempt.status === "passed";
  return (
    <StudentLayout>
      <div className="relative max-w-5xl mx-auto space-y-6 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <Link to="/student/attempts" className="btn-secondary">
            ← Back
          </Link>
          <Link
            to="/student/quizzes"
            className="text-sm font-semibold text-indigo-600"
          >
            All Quizzes
          </Link>
        </div>
        <div
          className={`rounded-3xl border p-5 sm:p-8 ${passed ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50" : "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50"}`}
        >
          <div className="text-center">
            <div className="text-5xl">{passed ? "🏆" : "📚"}</div>
            <p className="mt-3 text-xs uppercase tracking-[.25em] font-semibold text-indigo-600">
              Assessment complete
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold break-words">
              {attempt.quiz_title}
            </h1>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge className={`px-4 py-2 ${statusColor(attempt.status)}`}>
                {passed ? "✓ PASSED" : "✕ FAILED"}
              </Badge>
              <span className="rounded-full bg-white/80 border px-4 py-2 text-sm text-slate-600">
                {formatDate(attempt.completed_at)}
              </span>
            </div>
            <p
              className={`mt-6 text-5xl sm:text-7xl font-black ${passed ? "text-emerald-600" : "text-rose-600"}`}
            >
              {parseFloat(attempt.percentage).toFixed(1)}
              <span className="text-2xl">%</span>
            </p>
          </div>
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Correct", attempt.correct_answers, "text-emerald-600"],
              ["Incorrect", attempt.incorrect_answers, "text-rose-600"],
              ["Unanswered", attempt.unanswered, "text-slate-700"],
              ["Total time", formatTime(attempt.time_taken), "text-indigo-600"],
            ].map(([l, v, c]) => (
              <div key={l} className="rounded-2xl bg-white/90 border p-4">
                <p className="text-xs text-slate-500">{l}</p>
                <p className={`mt-1 text-2xl font-bold ${c}`}>{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-indigo-50 border p-4">
              <p className="text-xs text-indigo-600">Avg. per question</p>
              <p className="font-bold text-indigo-800">{qt(stats.avg)}</p>
            </div>
            <div className="rounded-2xl bg-cyan-50 border p-4">
              <p className="text-xs text-cyan-700">Fastest question</p>
              <p className="font-bold text-cyan-800">{qt(stats.fastest)}</p>
            </div>
          </div>
        </div>
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-indigo-600">Performance dashboard</p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">Your complete analysis</h2>
              <p className="mt-1 text-sm text-slate-500">See accuracy, pace, question-level performance, and how you compare with everyone who attempted this quiz.</p>
            </div>
            {rank && <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-center dark:bg-indigo-500/10"><p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Your rank</p><p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">#{rank}<span className="text-sm font-medium text-slate-500"> / {comparison.completed_attempts}</span></p></div>}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Quiz average", `${Number(comparison.average_percentage || 0).toFixed(1)}%`, scoreDelta >= 0 ? `+${scoreDelta.toFixed(1)}% above average` : `${Math.abs(scoreDelta).toFixed(1)}% below average`, scoreDelta >= 0 ? "text-emerald-600" : "text-rose-600"],
              ["Top score", `${Number(comparison.topper_percentage || 0).toFixed(1)}%`, topper?.name ? `By ${topper.name}` : "Best recorded score", "text-amber-600"],
              ["Your pace", formatTime(attempt.time_taken), timeDelta <= 0 ? "Faster than quiz average" : `${formatTime(timeDelta)} slower than average`, timeDelta <= 0 ? "text-emerald-600" : "text-amber-600"],
              ["Avg. response", qt(stats.avg), `${answers.length} questions analysed`, "text-indigo-600"],
            ].map(([label, value, detail, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-xl font-black ${color}`}>{value}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</p></div>)}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <h3 className="font-semibold">Answer distribution</h3>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-40 w-40 shrink-0">
                  {distribution.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={3}>{distribution.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-xs text-slate-400">No answers recorded</div>}
                </div>
                <div className="space-y-2 text-sm">{distribution.map((item) => <div key={item.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-slate-500">{item.name}</span><strong className="ml-auto">{item.value}</strong></div>)}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Response time by question</h3><p className="text-xs text-slate-500">Your time compared with the quiz average</p></div><span className="text-[11px] text-slate-400">seconds</span></div>
              <div className="mt-3 h-40 min-w-0">
                {questionChart.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={questionChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => [`${value}s`]} /><Bar dataKey="time" name="Your time" fill="#6366f1" radius={[4, 4, 0, 0]} /><Bar dataKey="average" name="Quiz average" fill="#cbd5e1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-xs text-slate-400">Timing data will appear here</div>}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <h3 className="font-semibold">Personal recommendations</h3>
            <ul className="mt-2 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <li>• {attempt.incorrect_answers ? `Review the ${attempt.incorrect_answers} missed question${attempt.incorrect_answers === 1 ? "" : "s"} and read each explanation.` : "Excellent accuracy — challenge yourself with a harder quiz next."}</li>
              <li>• {attempt.unanswered ? `Try to answer every question; ${attempt.unanswered} were left unanswered this time.` : "You attempted every question — keep this level of completion."}</li>
              <li>• {stats.avg > 0 && comparison.average_time ? (timeDelta <= 0 ? "Your pace is strong. Preserve accuracy while answering quickly." : "Leave a little more time for difficult questions before submitting.") : "Your response-time insights will improve as more attempts are recorded."}</li>
              <li>• {rank === 1 ? "You are currently the topper for this quiz — outstanding work!" : topper ? `The current topper is ${topper.name}; use the question review below to close the gap.` : "Complete more attempts to unlock richer peer comparisons."}</li>
            </ul>
          </div>
        </section>
        <section className="card">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Question Review</h2>
              <p className="text-sm text-slate-500 mt-1">
                Review every option one question at a time.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                className="input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All questions ({answers.length})</option>
                <option value="correct">
                  ✓ Correct ({attempt.correct_answers})
                </option>
                <option value="wrong">
                  ✕ Wrong ({attempt.incorrect_answers})
                </option>
                <option value="unattempted">
                  — Unattempted ({attempt.unanswered})
                </option>
              </select>
              <div className="flex gap-2">
                <input
                  className="input"
                  type="number"
                  min="1"
                  max={answers.length}
                  value={jump}
                  onChange={(e) => setJump(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goToNumber()}
                  placeholder="Q no."
                />
                <button
                  className="btn-secondary whitespace-nowrap"
                  onClick={goToNumber}
                >
                  Go
                </button>
              </div>
            </div>
            {currentAnswer ? (
              <div className="rounded-2xl border bg-white p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
                    Question {currentAnswer._number} / {answers.length}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                    ⏱ {qt(currentAnswer.time_taken)}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold leading-7">
                  {currentAnswer.question_text}
                </h3>
                {currentAnswer.question_image_url && (
                  <img src={currentAnswer.question_image_url} alt="Question diagram" className="mt-4 max-h-80 w-full rounded-2xl border border-slate-200 object-contain" />
                )}
                <div className="mt-5 space-y-2">
                  {(currentAnswer.options || []).map((o, i) => {
                    const selected =
                        String(o.id) ===
                        String(currentAnswer.selected_option_id),
                      correct = Boolean(o.is_correct);
                    return (
                      <div
                        key={o.id || i}
                        className={`rounded-xl border p-3 ${correct ? "border-emerald-300 bg-emerald-50" : selected ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold border">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1 text-sm font-medium">
                            {o.option_text}
                          </span>
                          {selected && (
                            <span
                              className={`text-xs font-bold ${correct ? "text-emerald-700" : "text-rose-700"}`}
                            >
                              {correct ? "Your answer ✓" : "Your answer ✕"}
                            </span>
                          )}
                          {correct && (
                            <span className="text-xs font-bold text-emerald-700">
                              Correct answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(currentAnswer.explanation || currentAnswer.explanation_image_url) && (
                  <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                    <b className="text-indigo-700">💡 Explanation</b>
                    {currentAnswer.explanation && (
                      <p className="mt-1 text-sm text-slate-600">
                        {currentAnswer.explanation}
                      </p>
                    )}
                    {currentAnswer.explanation_image_url && (
                      <img src={currentAnswer.explanation_image_url} alt="Explanation diagram" className="mt-3 max-h-72 w-full rounded-xl border border-indigo-100 object-contain" />
                    )}
                  </div>
                )}
                <div className="mt-6 flex gap-2">
                  <button
                    className="btn-secondary flex-1"
                    disabled={current === 0}
                    onClick={() => setCurrent((c) => c - 1)}
                  >
                    ← Previous
                  </button>
                  <button
                    className="btn-primary flex-1"
                    disabled={current === filtered.length - 1}
                    onClick={() => setCurrent((c) => c + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                No questions match this filter.
              </div>
            )}
          </div>
        </section>
        <section className="card">
          <h2 className="text-xl font-bold">📊 Performance Insights</h2>
          <p className="mt-1 text-sm text-slate-500">
            Personalized guidance based on this attempt.
          </p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-indigo-50 p-4">
              <p className="text-xs text-indigo-600">Score strength</p>
              <p className="mt-1 font-bold text-indigo-900">
                {parseFloat(attempt.percentage).toFixed(1)}%
              </p>
              <p className="mt-2 text-xs text-slate-600">
                {passed
                  ? "You cleared the passing target. Keep building consistency."
                  : "Focus on the questions you missed and retry similar topics."}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs text-amber-700">Improvement focus</p>
              <p className="mt-1 font-bold text-amber-900">
                {attempt.incorrect_answers > attempt.correct_answers
                  ? "Accuracy"
                  : "Speed + accuracy"}
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Review incorrect explanations and practice weak concepts before
                your next attempt.
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">Completion</p>
              <p className="mt-1 font-bold text-emerald-900">
                {answers.length
                  ? Math.round(
                      ((attempt.correct_answers + attempt.incorrect_answers) /
                        answers.length) *
                        100,
                    )
                  : 0}
                % answered
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Try to reduce unanswered questions while keeping your answer
                quality high.
              </p>
            </div>
          </div>
        </section>
        {reviewOpen && (
          <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-3 sm:p-4 backdrop-blur-sm">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-8 shadow-2xl">
              <div className="text-center">
                <div className="text-4xl">💬</div>
                <h2 className="mt-2 text-2xl font-bold">Quick review</h2>
                <p className="mt-1 text-sm text-slate-500">
                  How did this quiz feel for you?
                </p>
              </div>
              <div className="mt-6 grid grid-cols-5 gap-1">
                {moods.map(([id, emoji, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMood(id)}
                    className={`rounded-2xl p-2 transition ${mood === id ? "bg-indigo-100 ring-2 ring-indigo-500" : "hover:bg-slate-50"}`}
                  >
                    <span className="block text-3xl">{emoji}</span>
                    <span className="mt-1 block text-[10px] font-semibold text-slate-500">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                maxLength={1000}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell us what you liked or what we can improve…"
                className="input mt-5 h-28 resize-none"
              />
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Skip
                </button>
                <button
                  type="button"
                  disabled={!mood || sending}
                  onClick={sendReview}
                  className="btn-primary flex-1"
                >
                  {sending ? "Sending…" : "Submit review"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
