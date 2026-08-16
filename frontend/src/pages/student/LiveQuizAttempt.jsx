import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { startLiveQuiz, answerLiveQuestion, finishLiveQuiz } from "../../api/liveQuiz.api";

const clampSeconds = (value) => Math.max(5, Number(value) || 30);

export default function LiveQuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [reveal, setReveal] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(0);
  const deadlineAt = useRef(0);
  const transition = useRef(false);
  const revealTimer = useRef(null);

  useEffect(() => {
    let active = true;
    startLiveQuiz(id)
      .then((r) => active && setData(r.data))
      .catch((e) => {
        if (!active) return;
        alert(e?.response?.data?.message || "This live quiz is not available right now");
        navigate("/student/live-quizzes");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, [id, navigate]);

  const questions = data?.questions || [];
  const q = questions[index];

  const goNext = async () => {
    if (transition.current) return;
    transition.current = true;
    if (index < questions.length - 1) {
      setIndex((current) => current + 1);
      transition.current = false;
      return;
    }
    setFinishing(true);
    try {
      const r = await finishLiveQuiz(id, { attemptId: data.attemptId });
      navigate("/student/live-quizzes", { state: { completed: r.data } });
    } catch (e) {
      console.error(e);
      setFinishing(false);
      transition.current = false;
    }
  };

  useEffect(() => {
    if (!q) return;
    const limit = clampSeconds(q.time_limit_seconds);
    const now = Date.now();
    startedAt.current = now;
    deadlineAt.current = now + limit * 1000;
    setSeconds(limit);
    setSelected("");
    setReveal(null);
    setSubmitting(false);
    transition.current = false;
  }, [index, q]);

  // Use a monotonic deadline + requestAnimationFrame rather than decrementing
  // React state once per second. This keeps the visible timer smooth and avoids
  // drift when the browser throttles interval callbacks.
  useEffect(() => {
    if (!q || reveal || finishing) return;
    let frame;
    const tick = () => {
      const remaining = Math.max(0, deadlineAt.current - Date.now());
      setSeconds(Math.ceil(remaining / 1000));
      if (remaining > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [q, reveal, finishing]);

  const submitAnswer = async (optionId, expired = false) => {
    if (!q || reveal || transition.current || submitting) return;
    const limit = clampSeconds(q.time_limit_seconds);
    const elapsed = Math.min(limit, Math.max(0, Math.ceil((Date.now() - startedAt.current) / 1000)));
    transition.current = true;
    setSubmitting(true);
    setSelected(optionId == null ? "" : String(optionId));
    try {
      const r = await answerLiveQuestion(id, {
        attemptId: data.attemptId,
        questionId: q.id,
        optionId: optionId ?? null,
        timeTaken: expired ? limit : elapsed,
      });
      setReveal(r.data);
      setSubmitting(false);
      // Show the correct answer/result briefly, including timeout reveals,
      // before automatically advancing. No Next button is required.
      revealTimer.current = setTimeout(() => {
        transition.current = false;
        goNext();
      }, 1200);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
      transition.current = false;
      if (expired) goNext();
    }
  };

  useEffect(() => {
    if (q && seconds === 0 && !reveal && !transition.current && !submitting) {
      submitAnswer(null, true);
    }
  }, [seconds, q, reveal, submitting]);

  if (loading || !data) {
    return <StudentLayout><LoadingSpinner size="lg" className="py-20" /></StudentLayout>;
  }
  if (finishing) {
    return <StudentLayout><div className="min-h-[60vh] grid place-items-center text-center"><div><LoadingSpinner size="lg" /><p className="mt-4 text-sm font-medium">Calculating your live rating…</p></div></div></StudentLayout>;
  }
  if (!q) {
    return <StudentLayout><div className="py-20 text-center text-slate-500">No live questions found.</div></StudentLayout>;
  }

  const total = (reveal?.distribution || []).reduce((sum, item) => sum + Number(item.chosen || 0), 0);
  const limit = clampSeconds(q.time_limit_seconds);
  const expiredReveal = reveal && !selected;

  return (
    <StudentLayout>
      <div className="mx-auto min-w-0 max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="live-badge">Live quiz</span>
            <h1 className="mt-2 break-words text-xl font-semibold sm:text-2xl">{data.quiz?.title}</h1>
            <p className="text-xs text-slate-500">Question {index + 1} of {questions.length}</p>
          </div>
          <div className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ${seconds <= 5 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"}`}>
            {seconds}s
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
          <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-[width] duration-200" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-400">
            <span>{limit}s for this question</span>
            <span>Answers advance automatically</span>
          </div>

          <h2 className="mt-6 text-lg font-medium leading-8 sm:text-xl">{q.question_text}</h2>
          <div className="mt-6 space-y-2.5">
            {(q.options || []).map((o, i) => {
              const dist = (reveal?.distribution || []).find((x) => String(x.id) === String(o.id));
              const pct = total ? Math.round((Number(dist?.chosen || 0) / total) * 100) : 0;
              const correct = String(reveal?.correctOptionId) === String(o.id);
              const mine = String(selected) === String(o.id);
              return (
                <button
                  disabled={Boolean(reveal) || submitting}
                  key={o.id}
                  onClick={() => submitAnswer(o.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${reveal ? correct ? "border-emerald-400 bg-emerald-50" : mine ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50" : mine ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-xs font-medium">{String.fromCharCode(65 + i)}</span>
                    <span className="min-w-0 flex-1 text-sm sm:text-base">{o.option_text}</span>
                    {reveal && <span className={`shrink-0 text-xs font-semibold ${correct ? "text-emerald-700" : "text-slate-500"}`}>{correct ? "Correct" : `${pct}%`}</span>}
                  </div>
                  {reveal && <div className="mt-3 h-1 rounded-full bg-white overflow-hidden"><div className={`h-full ${correct ? "bg-emerald-500" : "bg-indigo-400"}`} style={{ width: `${pct}%` }} /></div>}
                </button>
              );
            })}
          </div>

          {reveal && (
            <div className={`mt-5 rounded-xl border p-4 ${reveal.correct ? "border-emerald-200 bg-emerald-50 text-emerald-800" : expiredReveal ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{reveal.correct ? "Correct answer" : expiredReveal ? "Time expired — correct answer" : "Incorrect answer"}</span>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold">{reveal.multiplier}× · {Number(reveal.rating) > 0 ? "+" : ""}{reveal.rating} rating</span>
              </div>
              <p className="mt-1 text-sm">The correct option is highlighted. Moving to the next question…</p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
