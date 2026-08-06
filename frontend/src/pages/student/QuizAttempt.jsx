import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { startQuiz, submitQuiz } from '../../api/attempt.api';
import { useTimer } from '../../hooks/useTimer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import QuizTimer from '../../components/student/QuizTimer';

function TimerDisplay({ minutes, seconds, secondsLeft }) {
  const urgent = secondsLeft !== null && secondsLeft < 60;
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${urgent ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-50 text-indigo-700'}`}>
      ⏱ {String(minutes ?? 0).padStart(2, '0')}:{String(seconds ?? 0).padStart(2, '0')}
    </div>
  );
}

export default function QuizAttempt() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [attemptData, setAttemptData] = useState(location.state?.attemptData || null);
  const [loading, setLoading] = useState(!attemptData);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  // Load attempt if not passed via state (page refresh)
  useEffect(() => {
    if (!attemptData) {
      const storedExpiry = sessionStorage.getItem('quizExpiryTime');
      startQuiz(id)
        .then((r) => {
          const data = r.data;
          if (storedExpiry && new Date(storedExpiry) > new Date()) {
            data.expiryTime = storedExpiry;
          }
          setAttemptData(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    if (auto) setAutoSubmitting(true);
    const submittedAnswers = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId: parseInt(questionId),
      selectedOptionId: parseInt(selectedOptionId),
    }));
    try {
      const r = await submitQuiz(id, { attemptId: attemptData.attemptId, answers: submittedAnswers });
      sessionStorage.removeItem('quizExpiryTime');
      navigate(`/student/results/${attemptData.attemptId}`, { state: { result: r.data.result } });
    } catch (err) {
      console.error(err);
      submittingRef.current = false;
      setSubmitting(false);
      setAutoSubmitting(false);
    }
  }, [answers, attemptData, id, navigate]);

  const { minutes, seconds, secondsLeft } = useTimer(
    attemptData?.expiryTime,
    () => handleSubmit(true)
  );

  if (loading || !attemptData) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );

  if (autoSubmitting) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-xl font-semibold text-gray-700">⏰ Time's up! Submitting…</p>
      <LoadingSpinner size="lg" />
    </div>
  );

  const questions = attemptData.questions || [];
  const question = questions[current];
  const answered = Object.keys(answers).length;
  const unanswered = questions.length - answered;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 px-6 py-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-bold text-gray-900">{attemptData.quiz?.title}</h1>
            <p className="text-sm text-gray-500">Question {current + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <QuizTimer secondsLeft={secondsLeft} maxSeconds={attemptData.quiz?.duration * 60 || 300} />
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Remaining</p>
              <p>{secondsLeft !== null ? `${minutes}:${String(seconds).padStart(2, '0')}` : '--:--'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 flex gap-6">
        {/* Main question area */}
        <div className="flex-1">
          <div className="card space-y-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Question {current + 1} of {questions.length}</p>
              <p className="text-lg font-medium text-gray-900">{question?.question_text}</p>
            </div>

            <div className="space-y-3">
              {question?.options?.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    answers[question.id] == opt.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q_${question.id}`}
                    value={opt.id}
                    checked={answers[question.id] == opt.id}
                    onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: opt.id }))}
                    className="text-indigo-600"
                  />
                  <span className="text-gray-800">{opt.option_text}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="btn-secondary disabled:opacity-40"
              >
                ← Previous
              </button>
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary">Next →</button>
              ) : (
                <button onClick={() => setShowConfirm(true)} className="btn-success">Submit Quiz</button>
              )}
            </div>
          </div>
        </div>

        {/* Question navigator sidebar */}
        <div className="w-48 flex-shrink-0">
          <div className="card sticky top-24">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">Questions</p>
            <div className="grid grid-cols-5 gap-1 mb-4">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrent(i)}
                  className={`w-8 h-8 text-xs rounded font-medium transition-colors ${
                    i === current ? 'bg-indigo-600 text-white'
                    : answers[q.id] ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Answered ({answered})</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block" />Unanswered ({unanswered})</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-600 inline-block" />Current</div>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="btn-success w-full mt-4 text-sm"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Submit Quiz?"
        message={unanswered > 0 ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit?` : 'Ready to submit your quiz?'}
        onConfirm={() => { setShowConfirm(false); handleSubmit(false); }}
        onCancel={() => setShowConfirm(false)}
        confirmText="Submit"
        danger={false}
      />
    </div>
  );
}
