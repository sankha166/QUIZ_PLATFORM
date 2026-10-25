import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizById } from '../../api/quiz.api';
import { getMyAttempts, startQuiz } from '../../api/attempt.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { difficultyColor, getErrorMessage } from '../../utils/helpers';
import { localizedValue, useLanguage } from '../../context/LanguageContext';

export default function QuizDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [quiz, setQuiz] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('long');
  const [customSeconds, setCustomSeconds] = useState('');
  const [tourOpen, setTourOpen] = useState(false);
  const [startGuideOpen, setStartGuideOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const tourSteps = [
    ['Choose a format', 'Short quiz gives instant feedback with a fixed per-question timer. Long test keeps the full paper workflow and final review.'],
    ['Read the assessment panel', 'The top timer shows remaining time, the question number shows progress, and the question navigator shows answered and unanswered items.'],
    ['Finish and review', 'Submit before time expires. Your result includes accuracy, response time, rank, topper comparison, and question explanations.'],
  ];

  useEffect(() => {
    Promise.all([getQuizById(id), getMyAttempts()])
      .then(([qr, ar]) => {
        const q = qr.data.quiz;
        setQuiz(q);
        const completed = (ar.data.attempts || []).filter((a) => String(a.quiz_id) === String(id) && a.status !== 'in_progress');
        setAttemptsLeft(Math.max(0, q.max_attempts - completed.length));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleStart = async () => {
    setStartGuideOpen(true);
  };
  const confirmStart = async () => {
    setStarting(true);
    setError('');
    try {
      const r = await startQuiz(id, {
        mode,
        ...(mode === 'short' && customSeconds ? { perQuestionSeconds: Number(customSeconds) } : {}),
      });
      navigate(`/student/quiz/${id}/attempt`, { state: { attemptData: r.data } });
    } catch (err) {
      setError(getErrorMessage(err));
      setStarting(false);
    }
  };

  if (loading) return <StudentLayout><LoadingSpinner size="lg" className="py-20" /></StudentLayout>;
  if (!quiz) return <StudentLayout><p className="text-center text-red-600 py-20">Quiz not found.</p></StudentLayout>;
  const questionMarks = Number(quiz.default_question_marks) || 1;
  const negativePercent = Math.min(100, Math.max(0, Number(quiz.negative_marking_percent) || 0));
  const negativeMarks = questionMarks * negativePercent / 100;
  const totalMarks = Number(quiz.total_marks) || questionMarks * (Number(quiz.question_count) || 0);

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {quiz.thumbnail_url && (
            <img src={quiz.thumbnail_url} alt={quiz.title} className="w-full h-64 object-cover" />
          )}
          <div className="p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{localizedValue(quiz, 'title', language)}</h1>
                <p className="mt-2 text-sm text-slate-500">{localizedValue(quiz, 'description', language) || 'No description available for this quiz.'}</p>
              </div>
              <Badge className={difficultyColor(quiz.difficulty)}>{quiz.difficulty}</Badge>
            </div>

            <div className="grid gap-4 mt-8 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('Category')}</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{quiz.category_name || 'Uncategorized'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('Duration')}</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{quiz.duration} min</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('Questions')}</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{quiz.question_count}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('Passing score')}</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{quiz.passing_score}%</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Marks of each question</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{questionMarks.toFixed(2)} marks</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total marks</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{totalMarks.toFixed(2)} marks</p>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
              <h2 className="font-bold text-emerald-950">Scoring rules for this quiz</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Correct answer</p>
                  <p className="mt-1 text-lg font-bold text-emerald-900">+{questionMarks.toFixed(2)} marks</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Unanswered</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">0 marks</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Wrong answer</p>
                  <p className="mt-1 text-lg font-bold text-rose-900">{negativePercent ? `−${negativeMarks.toFixed(2)} marks` : "No negative marking"}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-emerald-900">
                Total available marks: <strong>{totalMarks.toFixed(2)}</strong>. {negativePercent ? `Negative marking is ${negativePercent.toFixed(2)}% of the marks for that question.` : "Wrong answers do not reduce your score."}
              </p>
            </div>
            <div className="grid gap-4 mt-6 sm:grid-cols-2">
              <div className="rounded-3xl bg-white border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Attempts available</p>
                <p className={`mt-2 text-2xl font-bold ${attemptsLeft === 0 ? 'text-red-600' : 'text-emerald-600'}`}>{attemptsLeft}</p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Quiz status</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{quiz.status || 'Published'}</p>
              </div>
            </div>

            {error && <div className="rounded-3xl bg-rose-50 border border-rose-200 px-4 py-3 mt-6 text-sm text-rose-700">{error}</div>}

            <div className="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5">
              <div>
                <p className="font-semibold text-indigo-950">Choose your test format</p>
                <p className="mt-1 text-sm text-indigo-800">Short quiz gives instant feedback after each answer. Long test keeps the current full-assessment experience and shows the complete result at the end.</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setMode('short')} className={`rounded-2xl border p-4 text-left ${mode === 'short' ? 'border-indigo-500 bg-white ring-2 ring-indigo-200' : 'border-indigo-100 bg-white/60'}`}>
                  <p className="font-semibold">⚡ Short quiz</p>
                  <p className="mt-1 text-xs text-slate-500">Per-question timer and instant answer feedback.</p>
                </button>
                <button type="button" onClick={() => setMode('long')} className={`rounded-2xl border p-4 text-left ${mode === 'long' ? 'border-indigo-500 bg-white ring-2 ring-indigo-200' : 'border-indigo-100 bg-white/60'}`}>
                  <p className="font-semibold">📘 Long test</p>
                  <p className="mt-1 text-xs text-slate-500">Answer all questions, then review and submit once.</p>
                </button>
              </div>
              {mode === 'short' && (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="text-sm font-medium text-indigo-950">Seconds per question
                    <input className="input mt-1 w-40" type="number" min="5" max="600" placeholder={`Standard: ${Math.max(5, Math.round((quiz.duration * 60) / Math.max(1, quiz.question_count)))}`} value={customSeconds} onChange={(e) => setCustomSeconds(e.target.value)} />
                  </label>
                  <p className="max-w-md text-xs text-indigo-800">Leave blank to use the standard duration divided by the number of questions.</p>
                </div>
              )}
              <button type="button" onClick={() => { setTourStep(0); setTourOpen(true); }} className="mt-4 text-sm font-semibold text-indigo-700 hover:underline">How this mode works</button>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Ready to test your knowledge? Start the selected format.</div>
              {attemptsLeft === 0 ? (
                <div className="rounded-3xl bg-red-50 border border-red-200 px-5 py-3 text-sm font-medium text-red-700">No attempts remaining</div>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="btn-primary w-full sm:w-auto py-3 text-base"
                >
                  {starting ? 'Starting…' : '🚀 Start Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {startGuideOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Before you begin</p>
            <h2 className="mt-2 text-2xl font-bold">Rules and screen guide</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-indigo-50 p-4"><b>⏱ Time</b><p className="mt-1 text-sm text-slate-600">{mode === 'short' ? `You have ${customSeconds || Math.max(5, Math.round((quiz.duration * 60) / Math.max(1, quiz.question_count)))} seconds per question.` : `You have ${quiz.duration} minutes for the complete test.`}</p></div>
              <div className="rounded-2xl bg-emerald-50 p-4"><b>🟢 Answered</b><p className="mt-1 text-sm text-slate-600">Green question numbers mean an answer is selected.</p></div>
              <div className="rounded-2xl bg-slate-100 p-4"><b>⚪ Unanswered</b><p className="mt-1 text-sm text-slate-600">Gray question numbers have no selected answer.</p></div>
              <div className="rounded-2xl bg-amber-50 p-4"><b>🟡 Marked</b><p className="mt-1 text-sm text-slate-600">In long test mode, mark questions to review later.</p></div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              <b className="text-slate-900">Submission rules</b>
              <ul className="mt-2 list-disc space-y-1 pl-5"><li>{mode === 'short' ? 'Short mode moves forward only; answers cannot be changed and there is no Back button.' : 'Long mode lets you move between questions until you submit.'}</li><li>Time expiry submits the attempt automatically.</li><li>After submission, review answers, explanations, timing, rank, and topper comparison.</li></ul>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <b className="text-emerald-950">How marks are calculated</b>
              <div className="mt-2 grid gap-2 text-sm text-emerald-900 sm:grid-cols-3">
                <span>Correct: <strong>+{questionMarks.toFixed(2)}</strong></span>
                <span>Unanswered: <strong>0</strong></span>
                <span>Wrong: <strong>{negativePercent ? `−${negativeMarks.toFixed(2)}` : "No deduction"}</strong></span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setStartGuideOpen(false)}>Cancel</button><button className="btn-primary" onClick={confirmStart}>{starting ? 'Starting…' : 'I understand, start quiz'}</button></div>
          </div>
        </div>
      )}
      {tourOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Quick guide {tourStep + 1}/{tourSteps.length}</p>
            <h2 className="mt-2 text-2xl font-bold">{tourSteps[tourStep][0]}</h2>
            <p className="mt-5 text-sm leading-6 text-slate-600">{tourSteps[tourStep][1]}</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="btn-primary" onClick={() => tourStep < tourSteps.length - 1 ? setTourStep((step) => step + 1) : setTourOpen(false)}>{tourStep < tourSteps.length - 1 ? 'Next' : 'Got it, start when ready'}</button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
