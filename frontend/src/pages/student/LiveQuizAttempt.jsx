import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  startLiveQuiz,
  answerLiveQuestion,
  finishLiveQuiz,
} from "../../api/liveQuiz.api";

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
  const started = useRef(Date.now());
  const transition = useRef(false);

  useEffect(() => {
    startLiveQuiz(id)
      .then((r) => setData(r.data))
      .catch((e) => {
        alert(
          e?.response?.data?.message ||
            "This live quiz is not available right now",
        );
        navigate("/student/live-quizzes");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const questions = data?.questions || [];
  const q = questions[index];

  const goNext = async () => {
    if (transition.current) return;
    transition.current = true;

    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
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
    started.current = Date.now();
    setSeconds(Math.max(5, Number(q.time_limit_seconds) || 30));
    setSelected("");
    setReveal(null);
    transition.current = false;
  }, [index, q]);

  useEffect(() => {
    if (!q || reveal || finishing) return;
    const timer = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [q, reveal, finishing]);

  const submitAnswer = async (optionId, expired = false) => {
    if (!q || reveal || transition.current) return;

    const limit = Math.max(5, Number(q.time_limit_seconds) || 30);
    const elapsed = Math.min(
      Math.max(0, Math.round((Date.now() - started.current) / 1000)),
      limit,
    );

    transition.current = true;
    setSelected(optionId ? String(optionId) : "");

    try {
      const r = await answerLiveQuestion(id, {
        attemptId: data.attemptId,
        questionId: q.id,
        optionId,
        timeTaken: elapsed,
      });
      setReveal(r.data);
      setTimeout(() => {
        transition.current = false;
        goNext();
      }, 1800);
    } catch (e) {
      console.error(e);
      transition.current = false;
      if (expired) goNext();
    }
  };

  useEffect(() => {
    if (q && seconds === 0 && !reveal && !transition.current) {
      submitAnswer(null, true);
    }
  }, [seconds, q, reveal]);

  const choose = (optionId) => submitAnswer(optionId, false);

  if (loading || !data) {
    return (
      <StudentLayout>
        <LoadingSpinner size="lg" className="py-20" />
      </StudentLayout>
    );
  }

  if (finishing) {
    return (
      <StudentLayout>
        <div className="min-h-[60vh] grid place-items-center text-center">
          <div>
            <LoadingSpinner size="lg" />
            <p className="mt-4 font-semibold">Calculating your live rating…</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!q) {
    return (
      <StudentLayout>
        <div className="py-20 text-center">No live questions found.</div>
      </StudentLayout>
    );
  }

  const total = (reveal?.distribution || []).reduce(
    (sum, item) => sum + Number(item.chosen || 0),
    0,
  );
  const limit = Math.max(5, Number(q.time_limit_seconds) || 30);
  const expiredReveal = reveal && !selected;

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">
              🔴 LIVE QUIZ
            </span>
            <h1 className="mt-2 text-xl sm:text-2xl font-extrabold break-words">
              {data.quiz?.title}
            </h1>
            <p className="text-xs text-slate-500">
              Question {index + 1} of {questions.length}
            </p>
          </div>
          <div
            className={`shrink-0 rounded-xl px-3 py-1.5 text-sm sm:text-base font-black ${
              seconds <= 5
                ? "bg-rose-100 text-rose-600"
                : "bg-indigo-50 text-indigo-700"
            }`}
          >
            ⏱ {seconds}s
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-4 sm:p-8 shadow-sm">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="mt-4 flex justify-between text-xs text-slate-400">
            <span>Question timer: {limit}s</span>
            <span>Auto advances</span>
          </div>

          <h2 className="mt-6 text-lg sm:text-2xl font-bold leading-8">
            {q.question_text}
          </h2>

          <div className="mt-6 space-y-3">
            {(q.options || []).map((o, i) => {
              const dist = (reveal?.distribution || []).find(
                (x) => String(x.id) === String(o.id),
              );
              const pct = total
                ? Math.round((Number(dist?.chosen || 0) / total) * 100)
                : 0;
              const correct = String(reveal?.correctOptionId) === String(o.id);
              const mine = String(selected) === String(o.id);

              return (
                <button
                  disabled={Boolean(reveal)}
                  key={o.id}
                  onClick={() => choose(o.id)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                    reveal
                      ? correct
                        ? "border-emerald-400 bg-emerald-50"
                        : mine
                          ? "border-rose-300 bg-rose-50"
                          : "border-slate-200 bg-slate-50"
                      : mine
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 shrink-0 rounded-lg bg-white border grid place-items-center text-xs font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 text-sm sm:text-base font-medium">
                      {o.option_text}
                    </span>
                    {reveal && (
                      <span className="text-xs font-bold">
                        {correct ? "✓ Correct" : `${pct}%`}
                      </span>
                    )}
                  </div>

                  {reveal && (
                    <div className="mt-3 h-1.5 rounded-full bg-white overflow-hidden">
                      <div
                        className={`h-full ${
                          correct ? "bg-emerald-500" : "bg-indigo-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {reveal && (
            <div
              className={`mt-5 rounded-2xl p-4 ${
                reveal.correct
                  ? "bg-emerald-50 text-emerald-800"
                  : expiredReveal
                    ? "bg-amber-50 text-amber-800"
                    : "bg-rose-50 text-rose-800"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>
                  {reveal.correct
                    ? "🎉 Correct!"
                    : expiredReveal
                      ? "⏰ Time expired"
                      : "❌ Incorrect"}
                </b>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">
                  {reveal.multiplier}× rating ·{" "}
                  {Number(reveal.rating) > 0 ? "+" : ""}
                  {reveal.rating}
                </span>
              </div>
              <p className="mt-1 text-sm">
                {expiredReveal
                  ? "No answer was recorded."
                  : "Your answer has been recorded."}{" "}
                The next question starts automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
