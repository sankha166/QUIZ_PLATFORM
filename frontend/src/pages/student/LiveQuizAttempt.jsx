import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { startLiveQuiz, answerLiveQuestion, finishLiveQuiz } from "../../api/liveQuiz.api";

const clampSeconds = (value) => Math.max(5, Number(value) || 30);
const serverNow = (offset) => Date.now() + offset;

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
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [serverOffset, setServerOffset] = useState(0);
  const transitionRef = useRef(false);

  useEffect(() => {
    let active = true;
    startLiveQuiz(id).then((r) => {
      if (!active) return;
      const payload = r.data;
      const serverMs = new Date(payload.serverNow || payload.quiz?.server_now || Date.now()).getTime();
      setServerOffset(serverMs - Date.now());
      setData(payload);
      setIndex(Number.isInteger(payload.currentQuestionIndex) ? payload.currentQuestionIndex : 0);
    }).catch((e) => {
      if (!active) return;
      alert(e?.response?.data?.message || "This live quiz is not available right now");
      navigate("/student/live-quizzes");
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, navigate]);

  const questions = data?.questions || [];
  const q = questions[index];
  const previousAnswer = useMemo(() => q ? (data?.answers || []).find((a) => String(a.question_id) === String(q.id)) || null : null, [data?.answers, q]);

  const goNext = async () => {
    if (transitionRef.current) return;
    transitionRef.current = true;
    const next = index + 1;
    if (next >= questions.length) {
      setFinishing(true);
      try {
        const r = await finishLiveQuiz(id, { attemptId: data.attemptId });
        navigate("/student/live-quizzes", { state: { completed: r.data } });
      } catch (e) {
        console.error(e);
        setFinishing(false);
        transitionRef.current = false;
      }
      return;
    }
    setIndex(next);
    setSelected("");
    setReveal(null);
    setWaitingForNext(false);
    setSubmitting(false);
    transitionRef.current = false;
  };

  const submitAnswer = async (optionId, expired = false) => {
    if (!q || transitionRef.current || submitting || reveal || previousAnswer) return;
    const current = serverNow(serverOffset);
    const start = new Date(q.question_start_at).getTime();
    const end = new Date(q.question_end_at).getTime();
    if (!expired && (current < start || current >= end)) return;
    transitionRef.current = true;
    setSubmitting(true);
    setSelected(optionId == null ? "" : String(optionId));
    try {
      const r = await answerLiveQuestion(id, { attemptId: data.attemptId, questionId: q.id, optionId: optionId ?? null });
      const responseServerMs = new Date(r.data.serverNow || Date.now()).getTime();
      setServerOffset(responseServerMs - Date.now());
      setReveal(r.data);
      setSubmitting(false);
      setData((currentData) => ({
        ...currentData,
        answers: [...(currentData.answers || []).filter((a) => String(a.question_id) !== String(q.id)), { question_id: q.id, selected_option_id: optionId ?? null, is_correct: r.data.correct, time_taken: r.data.timeTaken }],
      }));
      if (expired) {
        setWaitingForNext(false);
      } else {
        setWaitingForNext(true);
      }
      transitionRef.current = false;
    } catch (e) {
      console.error(e);
      setSubmitting(false);
      transitionRef.current = false;
      if (expired) goNext();
    }
  };

  useEffect(() => {
    if (!q) return;
    transitionRef.current = false;
    setSelected(previousAnswer?.selected_option_id == null ? "" : String(previousAnswer.selected_option_id));
    setReveal(null);
    setWaitingForNext(Boolean(previousAnswer));
    setSubmitting(false);
  }, [q?.id, previousAnswer?.question_id]);

  useEffect(() => {
    if (!q) return;
    const tick = () => {
      const start = new Date(q.question_start_at).getTime();
      const end = new Date(q.question_end_at).getTime();
      const current = serverNow(serverOffset);
      if (current < start) {
        setSeconds(Math.ceil((start - current) / 1000));
        return;
      }
      const left = Math.max(0, end - current);
      setSeconds(Math.ceil(left / 1000));
      if (left <= 0 && !transitionRef.current) {
        if (previousAnswer || reveal) goNext();
        else submitAnswer(null, true);
      }
    };
    tick();
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [q?.id, q?.question_start_at, q?.question_end_at, serverOffset, previousAnswer?.question_id, reveal]);

  if (loading || !data) return <StudentLayout><LoadingSpinner size="lg" className="py-20" /></StudentLayout>;
  if (finishing) return <StudentLayout><div className="min-h-[60vh] grid place-items-center text-center"><div><LoadingSpinner size="lg"/><p className="mt-4 text-sm">Finalizing your live result…</p></div></div></StudentLayout>;
  if (!q) return <StudentLayout><div className="py-20 text-center text-slate-500">No live questions found.</div></StudentLayout>;

  const distribution = reveal?.distribution || [];
  const total = distribution.reduce((sum, item) => sum + Number(item.chosen || 0), 0);
  const limit = clampSeconds(q.time_limit_seconds);
  const expiredReveal = reveal && !selected;
  const isBeforeQuestion = serverNow(serverOffset) < new Date(q.question_start_at).getTime();

  return <StudentLayout><div className="mx-auto min-w-0 max-w-4xl">
    <div className="mb-4 flex items-center justify-between gap-3"><div className="min-w-0"><span className="live-badge">Live quiz</span><h1 className="mt-2 break-words text-xl font-semibold sm:text-2xl">{data.quiz?.title}</h1><p className="text-xs text-slate-500">Question {index + 1} of {questions.length}</p></div><div className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ${seconds <= 5 && !isBeforeQuestion ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"}`}>{isBeforeQuestion ? "Starting" : `${seconds}s`}</div></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
      <div className="h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-500 transition-[width] duration-100" style={{ width: `${((index + 1) / questions.length) * 100}%` }}/></div>
      <div className="mt-3 flex justify-between text-xs text-slate-400"><span>{limit}s answer window</span><span>{waitingForNext ? "Next question follows the shared event clock" : "Select one answer"}</span></div>
      <h2 className="mt-6 text-lg font-medium leading-8 sm:text-xl">{q.question_text}</h2>
      <div className="mt-6 space-y-2.5">{(q.options || []).map((o, i) => { const dist = distribution.find((x) => String(x.id) === String(o.id)); const pct = total ? Math.round((Number(dist?.chosen || 0) / total) * 100) : 0; const correct = String(reveal?.correctOptionId) === String(o.id); const mine = String(selected) === String(o.id); return <button disabled={Boolean(reveal) || submitting || Boolean(previousAnswer) || isBeforeQuestion} key={o.id} onClick={() => submitAnswer(o.id)} className={`w-full rounded-xl border p-4 text-left transition ${reveal ? correct ? "border-emerald-400 bg-emerald-50" : mine ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50" : mine ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`}><div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-xs">{String.fromCharCode(65 + i)}</span><span className="min-w-0 flex-1 text-sm sm:text-base">{o.option_text}</span>{reveal && <span className={`shrink-0 text-xs ${correct ? "text-emerald-700" : "text-slate-500"}`}>{pct}%{correct ? " · Correct" : ""}</span>}</div>{reveal && <div className="mt-3 h-1 overflow-hidden rounded-full bg-white"><div className={`h-full ${correct ? "bg-emerald-500" : "bg-indigo-400"}`} style={{ width: `${pct}%` }}/></div>}</button>; })}</div>
      {reveal && <div className={`mt-5 rounded-xl border p-4 ${reveal.correct ? "border-emerald-200 bg-emerald-50 text-emerald-800" : expiredReveal ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{reveal.correct ? "Correct answer" : expiredReveal ? "Time expired — correct answer" : "Incorrect answer"}</span><span className="rounded-full bg-white/80 px-2.5 py-1 text-xs">{reveal.multiplier}× · {Number(reveal.rating) > 0 ? "+" : ""}{reveal.rating} rating</span></div><p className="mt-1 text-sm">The correct option is highlighted. The next question follows the shared event schedule.</p></div>}
    </div>
  </div></StudentLayout>;
}
