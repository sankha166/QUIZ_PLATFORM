import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { startQuiz, submitQuiz } from "../../api/attempt.api";
import { getShortFeedback } from "../../api/reviews.api";
import { useTimer } from "../../hooks/useTimer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import LoadingScreen from "../../components/common/LoadingScreen";
import ConfirmModal from "../../components/common/ConfirmModal";
function formatQuestionTime(seconds) {
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
export default function QuizAttempt() {
  const { id } = useParams(),
    location = useLocation(),
    navigate = useNavigate();
  const [attemptData, setAttemptData] = useState(
      location.state?.attemptData || null,
    ),
    [loading, setLoading] = useState(!attemptData),
    [current, setCurrent] = useState(0),
    [answers, setAnswers] = useState({}),
    [submitting, setSubmitting] = useState(false),
    [showConfirm, setShowConfirm] = useState(false),
    [autoSubmitting, setAutoSubmitting] = useState(false),
    [questionTimes, setQuestionTimes] = useState({}),
    [submitError, setSubmitError] = useState(""),
    [shortSecondsLeft, setShortSecondsLeft] = useState(null),
    [shortFeedback, setShortFeedback] = useState(null),
    [shortResults, setShortResults] = useState({}),
    [shortScore, setShortScore] = useState(0),
    [scoreFlash, setScoreFlash] = useState(false),
    [scoreFlashType, setScoreFlashType] = useState("neutral"),
    [shortElapsed, setShortElapsed] = useState(0),
    [markedQuestions, setMarkedQuestions] = useState({}),
    questionStarted = useRef(Date.now()),
    shortDeadline = useRef(null),
    feedbackTimer = useRef(null),
    feedbackInFlight = useRef(false),
    submittingRef = useRef(false),
    questionsRef = useRef([]),
    answersRef = useRef({});
  useEffect(() => {
    if (!attemptData) {
      startQuiz(id)
        .then((r) => setAttemptData(r.data))
        .catch((e) =>
          setSubmitError(e?.response?.data?.message || "Unable to start quiz."),
        )
        .finally(() => setLoading(false));
    }
  }, [id]);
  useEffect(() => {
    questionStarted.current = Date.now();
    if (attemptData?.mode === "short") {
      const seconds = Number(attemptData.perQuestionSeconds) || 30;
      shortDeadline.current = Date.now() + seconds * 1000;
      setShortSecondsLeft(seconds);
      setShortFeedback(null);
    }
  }, [current, attemptData]);
  useEffect(() => {
    if (attemptData?.mode !== "short") return undefined;
    const started = new Date(attemptData.startedAt || 0).getTime();
    const expiry = new Date(attemptData.expiryTime || 0).getTime();
    const total = (Number(attemptData.perQuestionSeconds) || 30) * Math.max(1, questionsRef.current.length || 1);
    const startedAt = Number.isFinite(started) && started > 0
      ? started
      : Number.isFinite(expiry) && expiry > 0
        ? expiry - total * 1000
        : Date.now();
    const update = () => setShortElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    update();
    const timer = window.setInterval(update, 500);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [attemptData]);
  useEffect(() => () => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
  }, []);
  useEffect(() => {
    const block = (e) => e.preventDefault(),
      key = (e) => {
        if (
          (e.ctrlKey || e.metaKey) &&
          ["c", "x", "s", "p", "u"].includes(e.key.toLowerCase())
        )
          e.preventDefault();
        if (e.key === "PrintScreen") e.preventDefault();
      },
      context = (e) => e.preventDefault();
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", context);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", context);
      document.removeEventListener("keydown", key);
    };
  }, []);
  const questions = attemptData?.questions || [];
  questionsRef.current = questions;
  answersRef.current = answers;
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submittingRef.current || !attemptData) return;
      submittingRef.current = true;
      setSubmitting(true);
      setSubmitError("");
      if (auto) setAutoSubmitting(true);
      const elapsed = Math.max(
        0,
        Math.round((Date.now() - questionStarted.current) / 1000),
      );
      const finalTimes = {
        ...questionTimes,
        [current]: (questionTimes[current] || 0) + elapsed,
      };
      const submittedAnswers = Object.entries(answersRef.current).map(
        ([questionId, selectedOptionId]) => ({
          questionId: Number(questionId),
          selectedOptionId: Number(selectedOptionId),
          timeTaken:
            finalTimes[
              questionsRef.current.findIndex(
                (q) => String(q.id) === String(questionId),
              )
            ] || 0,
          marked: Boolean(markedQuestions[questionId]),
        }),
      );
      try {
        const r = await submitQuiz(id, {
          attemptId: attemptData.attemptId,
          answers: submittedAnswers,
        });
        sessionStorage.removeItem("quizExpiryTime");
        navigate(`/student/results/${attemptData.attemptId}`, {
          state: { result: r.data.result },
        });
      } catch (err) {
        console.error(err);
        submittingRef.current = false;
        setSubmitting(false);
        setAutoSubmitting(false);
        setSubmitError(
          err?.response?.data?.message ||
            "Submission failed. Please try again.",
        );
      }
    },
    [answers, attemptData, id, navigate, questionTimes, current, markedQuestions],
  );
  const { minutes, seconds, secondsLeft } = useTimer(
    attemptData?.mode === "short" ? null : attemptData?.expiryTime,
    () => handleSubmit(true),
  );
  if (loading || !attemptData)
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  if (autoSubmitting)
    return (
      <LoadingScreen message="Time's up! Submitting your answers..." />
    );
  if (!questions.length)
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <p className="font-semibold">No questions available.</p>
          <button
            className="btn-secondary mt-4"
            onClick={() => navigate("/student/quizzes")}
          >
            Back
          </button>
        </div>
      </div>
    );
  const question = questions[current],
    answered = Object.keys(answers).length,
    unanswered = questions.length - answered;
  const optionStats = (attemptData.optionStats || []).filter((item) => String(item.question_id) === String(question?.id));
  const revealShortFeedback = async (optionId = null) => {
    if (shortFeedback || submitting || feedbackInFlight.current) return;
    feedbackInFlight.current = true;
    try {
      const response = await getShortFeedback({
        attemptId: attemptData.attemptId,
        questionId: question.id,
        selectedOptionId: optionId,
      });
      const data = response.data;
      const limit = Number(attemptData.perQuestionSeconds) || 30;
      const timeTaken = optionId === null
        ? limit
        : Math.min(limit, Math.max(0, Math.ceil((Date.now() - questionStarted.current) / 1000)));
      setShortFeedback({
        selected: optionId,
        timeTaken,
        withinTime: optionId !== null && timeTaken <= limit,
        marksAwarded: Number(data.scoreDelta || 0),
        ...data,
      });
      setShortResults((previous) => ({
        ...previous,
        [question.id]: {
          isCorrect: data.isCorrect === true,
          answered: optionId !== null,
        },
      }));
      const delta = Number(data.scoreDelta || 0);
      setShortScore((value) => value + delta);
      setScoreFlashType(delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral");
      setScoreFlash(true);
      window.setTimeout(() => setScoreFlash(false), 900);
      feedbackTimer.current = window.setTimeout(() => {
        if (current < questions.length - 1) goTo(current + 1);
        else handleSubmit(true);
      }, 4000);
    } catch (error) {
      setSubmitError(error?.response?.data?.message || "Unable to load question feedback.");
    } finally {
      feedbackInFlight.current = false;
    }
  };
  const selectAnswer = (optionId) => {
    if (attemptData.mode === "short" && shortFeedback) return;
    const nextAnswers = { ...answersRef.current, [question.id]: optionId };
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    if (attemptData.mode === "short") revealShortFeedback(optionId);
  };
  const toggleMarked = () => {
    if (attemptData.mode === "short") return;
    setMarkedQuestions((previous) => ({ ...previous, [question.id]: !previous[question.id] }));
  };
  const advanceShort = () => {
    if (shortFeedback) return;
    revealShortFeedback(answers[question.id] || null);
  };
  const goTo = (next) => {
    const elapsed = Math.max(
      0,
      Math.round((Date.now() - questionStarted.current) / 1000),
    );
    setQuestionTimes((prev) => ({
      ...prev,
      [current]: (prev[current] || 0) + elapsed,
    }));
    setCurrent(next);
  };
  useEffect(() => {
    if (attemptData.mode !== "short" || shortSecondsLeft === null || shortFeedback) return undefined;
    if (shortSecondsLeft <= 0) {
      revealShortFeedback();
      return undefined;
    }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((shortDeadline.current - Date.now()) / 1000));
      setShortSecondsLeft(remaining);
      if (remaining <= 0) revealShortFeedback();
    };
    update();
    const timer = window.setInterval(update, 250);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [attemptData.mode, shortSecondsLeft, shortFeedback, current, questions.length]);
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-slate-50 select-none"
      onDragStart={(e) => e.preventDefault()}
    >
      <header className="fixed inset-x-0 top-0 z-40 border-b bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:px-5">
        <div className="mx-auto flex min-h-12 max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[.18em] text-indigo-500 font-semibold">
              Secure Assessment
            </p>
            <h1 className="font-bold text-slate-900 truncate text-sm">
              {attemptData.quiz?.title}
            </h1>
            <p className="text-[11px] text-slate-500">
              Q {current + 1}/{questions.length}
            </p>
          </div>
          <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
          {attemptData.mode === "short" && <><span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">⚡ Short</span><span className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${scoreFlash ? scoreFlashType === "positive" ? "bg-emerald-500 text-white ring-4 ring-emerald-200 scale-105" : scoreFlashType === "negative" ? "bg-rose-500 text-white ring-4 ring-rose-200 scale-105" : "bg-slate-500 text-white ring-4 ring-slate-200 scale-105" : "bg-indigo-50 text-indigo-700"}`}>Score: {shortScore.toFixed(2)} {scoreFlash && (scoreFlashType === "positive" ? "↑" : scoreFlashType === "negative" ? "↓" : "•")}</span><span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">Total: {formatQuestionTime(shortElapsed)}</span></>}
          {attemptData.mode !== "short" && <div
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold ${secondsLeft !== null && secondsLeft < 60 ? "bg-red-100 text-red-600" : "bg-indigo-50 text-indigo-700"}`}
          >
            ⏱ {String(minutes ?? 0).padStart(2, "0")}:
            {String(seconds ?? 0).padStart(2, "0")}
          </div>}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-3 pb-28 pt-24 sm:px-5 sm:pb-6 sm:pt-24">
        <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs sm:text-sm text-indigo-800">
          🔒 <strong>Fair assessment mode:</strong> copying, selection, context
          menus and common save/print shortcuts are disabled during this quiz.
        </div>
        {submitError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <b>Submission issue:</b> {submitError}
            <button
              className="ml-3 font-bold underline"
              onClick={() => handleSubmit(false)}
            >
              Retry
            </button>
          </div>
        )}
        <div className="grid lg:grid-cols-[1fr_260px] gap-4 sm:gap-6">
          <main className="min-w-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Question {current + 1}
                </span>
                {attemptData.mode === "long" && (
                  <button type="button" onClick={toggleMarked} className={`rounded-full px-3 py-1 text-xs font-bold ${markedQuestions[question.id] ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-500"}`}>
                    {markedQuestions[question.id] ? "★ Marked for review" : "☆ Mark for review"}
                  </button>
                )}
                <span className="text-xs text-slate-400">
                  Time:{" "}
                  {formatQuestionTime(
                    questionTimes[current] ||
                      Math.max(
                        0,
                        Math.round(
                          (Date.now() - questionStarted.current) / 1000,
                        ),
                      ),
                  )}
                </span>
                {attemptData.mode === "short" && <span className={`rounded-full px-2 py-1 text-xs font-bold ${shortSecondsLeft !== null && shortSecondsLeft <= 5 ? "bg-red-100 text-red-700" : "bg-amber-50 text-amber-700"}`}>Question timer: {shortSecondsLeft}s</span>}
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{
                    width: `${((current + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-base sm:text-xl font-semibold leading-8 text-slate-900 break-words">
                {question?.question_text}
              </p>
              {question?.question_image_url && (
                <img src={question.question_image_url} alt="Question diagram" className="mt-5 max-h-80 w-full rounded-2xl border border-slate-200 object-contain" />
              )}
              <div className="mt-5 space-y-2 sm:mt-7 sm:space-y-3">
                {question?.options?.map((opt, index) => (
                  <label
                    key={opt.id}
                    className={`flex min-w-0 items-start gap-2 rounded-2xl border-2 p-2.5 sm:p-4 cursor-pointer transition-all ${
                      shortFeedback
                        ? String(opt.id) === String(shortFeedback.correctOptionId)
                          ? "border-emerald-500 bg-emerald-50"
                          : String(opt.id) === String(shortFeedback.selected)
                            ? "border-rose-500 bg-rose-50"
                            : "border-slate-200 bg-slate-50"
                        : answers[question.id] == opt.id ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-7 w-7 shrink-0 rounded-lg grid place-items-center text-xs font-bold ${shortFeedback && String(opt.id) === String(shortFeedback.correctOptionId) ? "bg-emerald-600 text-white" : shortFeedback && String(opt.id) === String(shortFeedback.selected) ? "bg-rose-600 text-white" : answers[question.id] == opt.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <input
                      type="radio"
                      name={`q_${question.id}`}
                      value={opt.id}
                      checked={answers[question.id] == opt.id}
                      onChange={() => selectAnswer(opt.id)}
                      disabled={attemptData.mode === "short" && Boolean(shortFeedback)}
                      className="sr-only"
                    />
                    <span className="min-w-0 break-words text-sm sm:text-base text-slate-800 leading-6">
                      <span className="break-words">{opt.option_text}</span>
                      {opt.image_url && <img src={opt.image_url} alt="" className="mt-2 max-h-24 max-w-full rounded-lg object-contain" />}
                      {shortFeedback && (() => {
                        const stat = shortFeedback.options?.find((entry) => String(entry.option_id) === String(opt.id));
                        const total = Number(stat?.total_selections) || 0;
                        return <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                          <span className="rounded-full bg-white/80 px-2 py-1">{total ? Math.round((Number(stat.selections) / total) * 100) : 0}% chose this</span>
                          {String(opt.id) === String(shortFeedback.correctOptionId) && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Correct answer</span>}
                          {String(opt.id) === String(shortFeedback.selected) && <span className={`rounded-full px-2 py-1 ${shortFeedback.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{shortFeedback.isCorrect ? "Your answer · Correct" : "Your answer · Wrong"}</span>}
                        </span>;
                      })()}
                    </span>
                  </label>
                ))}
              </div>
              {attemptData.mode === "short" && shortFeedback && <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${shortFeedback.isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><div className="flex flex-wrap items-center gap-2"><strong>{shortFeedback.isCorrect ? "Correct answer" : shortFeedback.selected ? "Incorrect answer" : "Time expired — not attempted"}</strong><span className="text-xs font-semibold">Question result</span></div><div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold"><span>Obtained: <strong>{shortFeedback.marksAwarded >= 0 ? "+" : ""}{shortFeedback.marksAwarded.toFixed(2)} marks</strong></span><span>Time taken: <strong>{formatQuestionTime(shortFeedback.timeTaken)}</strong></span><span>{shortFeedback.withinTime ? "Answered within time" : "No marks — time expired"}</span></div></div>}
              <div className="fixed inset-x-3 bottom-3 z-30 flex flex-col-reverse gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur sm:static sm:flex-row sm:justify-between sm:border-0 sm:bg-transparent sm:p-0 sm:pt-7 sm:shadow-none sm:backdrop-blur-none">
                {attemptData.mode === "long" && <button
                  type="button"
                  onClick={() => goTo(Math.max(0, current - 1))}
                  disabled={current === 0 || submitting}
                  className="btn-secondary disabled:opacity-40 w-full sm:w-auto"
                >
                  ← Previous
                </button>}
                {attemptData.mode === "short" ? (
                  <button
                    type="button"
                    onClick={advanceShort}
                    disabled={submitting || Boolean(shortFeedback)}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {answers[question.id] ? "Show answer & continue →" : "Continue →"}
                  </button>
                ) : current < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => goTo(current + 1)}
                    disabled={submitting}
                    className="btn-primary w-full sm:w-auto"
                  >
                    Next →
                  </button>
                ) : attemptData.mode === "long" ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowConfirm(true)}
                    className="btn-success w-full sm:w-auto"
                  >
                    {submitting ? <span className="inline-flex items-center gap-2"><LoadingSpinner size="sm" />Submitting…</span> : "Submit Quiz"}
                  </button>
                ) : null}
              </div>
            </div>
          </main>
          <aside>
            <div className="rounded-3xl border bg-white p-4 shadow-sm lg:sticky lg:top-20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Questions
                </p>
                <span className="text-xs text-slate-400">
                  {answered}/{questions.length}
                </span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 gap-2">
                {questions.map((q, i) => (
                  <button
                    type="button"
                    key={q.id}
                    onClick={() => goTo(i)}
                    disabled={submitting || attemptData.mode === "short"}
                    className={`aspect-square text-xs rounded-xl font-semibold ${i === current ? "bg-indigo-600 text-white" : attemptData.mode === "short" && shortResults[q.id] ? shortResults[q.id].isCorrect ? "bg-emerald-500 text-white" : shortResults[q.id].answered ? "bg-rose-500 text-white" : "bg-slate-500 text-white" : markedQuestions[q.id] ? "bg-amber-400 text-amber-950" : answers[q.id] ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 space-y-2 mt-4">
                <div>🟢 Answered ({answered})</div>
                <div>⚪ Unanswered ({unanswered})</div>
                {attemptData.mode === "short" && <><div>✅ Correct answer</div><div>🔴 Wrong answer</div><div>⚫ Time expired</div></>}
                {attemptData.mode === "long" && <div>🟡 Marked for review ({Object.values(markedQuestions).filter(Boolean).length})</div>}
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
                className="btn-success w-full mt-5"
              >
                {submitting ? <span className="inline-flex items-center gap-2"><LoadingSpinner size="sm" />Submitting…</span> : "Submit Quiz"}
              </button>
            </div>
          </aside>
        </div>
      </div>
      <ConfirmModal
        isOpen={showConfirm}
        title="Submit Quiz?"
        message={
          unanswered > 0
            ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
            : "Ready to submit your quiz?"
        }
        onConfirm={() => {
          setShowConfirm(false);
          handleSubmit(false);
        }}
        onCancel={() => setShowConfirm(false)}
        confirmText="Submit"
        danger={false}
      />
    </div>
  );
}
