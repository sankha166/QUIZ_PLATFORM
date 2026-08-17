import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { startLiveQuiz, answerLiveQuestion, finishLiveQuiz } from "../../api/liveQuiz.api";

const clampSeconds = (value) => Math.max(5, Number(value) || 30);
const nowFromServer = (offset) => Date.now() + offset;

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
  const transition = useRef(false);
  const autoAdvance = useRef(null);
  const syncTimer = useRef(null);

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
    return () => { active = false; if (autoAdvance.current) clearTimeout(autoAdvance.current); if (syncTimer.current) clearInterval(syncTimer.current); };
  }, [id, navigate]);

  const questions = data?.questions || [];
  const q = questions[index];
  const previousAnswer = useMemo(() => {
    if (!q) return null;
    return (data?.answers || []).find((a) => String(a.question_id) === String(q.id)) || null;
  }, [data?.answers, q]);

  const goToScheduledNext = () => {
    if (transition.current) return;
    transition.current = true;
    const next = index + 1;
    if (next >= questions.length) {
      setFinishing(true);
      finishLiveQuiz(id, { attemptId: data.attemptId }).then((r) => {
        navigate("/student/live-quizzes", { state: { completed: r.data } });
      }).catch((e) => {
        console.error(e);
        setFinishing(false);
        transition.current = false;
      });
      return;
    }
    setIndex(next);
    setSelected("");
    setReveal(null);
    setWaitingForNext(false);
    setSubmitting(false);
    transition.current = false;
  };

  useEffect(() => {
    if (!q) return;
    const end = new Date(q.question_end_at).getTime();
    const start = new Date(q.question_start_at).getTime();
    const current = nowFromServer(serverOffset);
    const remaining = Math.max(0, end - current);
    setSeconds(Math.ceil(remaining / 1000));
    setSelected(previousAnswer?.selected_option_id == null ? "" : String(previousAnswer.selected_option_id));
    setReveal(null);
    setWaitingForNext(false);
    setSubmitting(false);
    transition.current = false;
    if (previousAnswer) {
      setWaitingForNext(current < end);
    }
    if (autoAdvance.current) clearTimeout(autoAdvance.current);
    if (current >= end) {
      goToScheduledNext();
      return;
    }
    if (current < start) {
      setSeconds(Math.ceil((start - current) / 1000));
    }
    autoAdvance.current = setTimeout(() => {
      if (!transition.current) {
        if (!reveal && !previousAnswer) submitAnswer(null, true);
        else goToScheduledNext();
      }
    }, remaining + 80);
    return () => { if (autoAdvance.current) clearTimeout(autoAdvance.current); };
    // q identity intentionally controls the event window; the server offset is stable for the attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id, serverOffset]);

  useEffect(() => {
    if (!q) return;
    const tick = () => {
      const start = new Date(q.question_start_at).getTime();
      const end = new Date(q.question_end_at).getTime();
      const current = nowFromServer(serverOffset);
      if (current < start) {
        setSeconds(Math.ceil((start - current) / 1000));
        return;
      }
      const left = Math.max(0, end - current);
      setSeconds(Math.ceil(left / 1000));
      if (left <= 0 && !transition.current) {
        if (reveal || previousAnswer) goToScheduledNext();
        else submitAnswer(null, true);
      }
    };
    tick();
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [q?.id, serverOffset, reveal, previousAnswer]);

  const submitAnswer = async (optionId, expired = false) => {
    if (!q || transition.current || submitting || reveal || previousAnswer) return;
    const current = nowFromServer(serverOffset);
    const start = new Date(q.question_start_at).getTime();
    const end = new Date(q.question_end_at).getTime();
    if (current < start || current >= end) return;
    transition.current = true;
    setSubmitting(true);
    setSelected(optionId == null ? "" : String(optionId));
    try {
      const r = await answerLiveQuestion(id, { attemptId: data.attemptId, questionId: q.id, optionId: optionId ?? null });
      const serverMs = new Date(r.data.serverNow || Date.now()).getTime();
      setServerOffset(serverMs - Date.now());
      setReveal(r.data);
      setSubmitting(false);
      setData((currentData) => ({ ...currentData, answers: [...(currentData.answers || []).filter((a) => String(a.question_id) !== String(q.id)), { question_id: q.id, selected_option_id: optionId ?? null, is_correct: r.data.correct, time_taken: 0 }] }));
      const remaining = Math.max(0, end - serverMs);
      if (remaining <= 0 || expired) goToScheduledNext();
      else {
        setWaitingForNext(true);
        autoAdvance.current = setTimeout(goToScheduledNext, remaining + 80);
      }
    } catch (e) {
      console.error(e);
      setSubmitting(false);
      transition.current = false;
      if (expired) goToScheduledNext();
    }
  };

  if (loading || !data) return <StudentLayout><LoadingSpinner size="lg" className="py-20" /></StudentLayout>;
  if (finishing) return <StudentLayout><div className="min-h-[60vh] grid place-items-center text-center"><div><LoadingSpinner size="lg"/><p className="mt-4 text-sm">Finalizing your live result…</p></div></div></StudentLayout>;
  if (!q) return <StudentLayout><div className="py-20 text-center text-slate-500">No live questions found.</div></StudentLayout>;

  const distribution = reveal?.distribution || [];
  const total = distribution.reduce((sum, item) => sum + Number(item.chosen || 0), 0);
  const limit = clampSeconds(q.time_limit_seconds);
  const expiredReveal = reveal && !selected;
  const isBeforeQuestion = nowFromServer(serverOffset) < new Date(q.question_start_at).getTime();

  return <StudentLayout><div className="mx-auto min-w-0 max-w-4xl">
    <div className="mb-4 flex items-center justify-between gap-3"><div className="min-w-0"><span className="live-badge">Live quiz</span><h1 className="mt-2 break-words text-xl font-semibold sm:text-2xl">{data.quiz?.title}</h1><p className="text-xs text-slate-500">Question {index + 1} of {questions.length}</p></div><div className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ${seconds <= 5 && !isBeforeQuestion ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"}`}>{isBeforeQuestion ? "Starting" : `${seconds}s`}</div></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
      <div className="h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-500 transition-[width] duration-100" style={{ width: `${((index + 1) / questions.length) * 100}%` }}/></div>
      <div className="mt-3 flex justify-between text-xs text-slate-400"><span>{limit}s answer window</span><span>{waitingForNext ? "Next question starts with the live event" : "Answers are locked after submission"}</span></div>
      <h2 className="mt-6 text-lg font-medium leading-8 sm:text-xl">{q.question_text}</h2>
      <div className="mt-6 space-y-2.5">{(q.options || []).map((o, i) => { const dist = distribution.find((x) => String(x.id) === String(o.id)); const pct = total ? Math.round((Number(dist?.chosen || 0) / total) * 100) : 0; const correct = String(reveal?.correctOptionId) === String(o.id); const mine = String(selected) === String(o.id); return <button disabled={Boolean(reveal) || submitting || Boolean(previousAnswer) || isBeforeQuestion} key={o.id} onClick={() => submitAnswer(o.id)} className={`w-full rounded-xl border p-4 text-left transition ${reveal ? correct ? "border-emerald-400 bg-emerald-50" : mine ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50" : mine ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`}><div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-xs">{String.fromCharCode(65 + i)}</span><span className="min-w-0 flex-1 text-sm sm:text-base">{o.option_text}</span>{reveal && <span className={`shrink-0 text-xs ${correct ? "text-emerald-700" : "text-slate-500"}`}>{pct}%{correct ? " · Correct" : ""}</span>}</div>{reveal && <div className="mt-3 h-1 overflow-hidden rounded-full bg-white"><div className={`h-full ${correct ? "bg-emerald-500" : "bg-indigo-400"}`} style={{ width: `${pct}%` }}/></div>}</button>; })}</div>
      {reveal && <div className={`mt-5 rounded-xl border p-4 ${reveal.correct ? "border-emerald-200 bg-emerald-50 text-emerald-800" : expiredReveal ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{reveal.correct ? "Correct answer" : expiredReveal ? "Time expired — correct answer" : "Incorrect answer"}</span><span className="rounded-full bg-white/80 px-2.5 py-1 text-xs">{reveal.multiplier}× · {Number(reveal.rating) > 0 ? "+" : ""}{reveal.rating} rating</span></div><p className="mt-1 text-sm">The correct option is highlighted. The next question follows the shared event schedule.</p></div>}
    </div>
  </div></StudentLayout>;
}
