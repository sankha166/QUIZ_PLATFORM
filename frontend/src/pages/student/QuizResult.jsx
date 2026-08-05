import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAttemptById } from '../../api/attempt.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatTime, formatDate, statusColor } from '../../utils/helpers';

export default function QuizResult() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAttemptById(attemptId)
      .then((r) => setAttempt(r.data.attempt))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <StudentLayout><LoadingSpinner size="lg" className="py-20" /></StudentLayout>;
  if (!attempt) return <StudentLayout><p className="text-center text-red-600 py-20">Result not found.</p></StudentLayout>;

  const passed = attempt.status === 'passed';

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Result summary */}
        <div className={`card text-center ${passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="text-5xl mb-3">{passed ? '🎉' : '😔'}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{attempt.quiz_title}</h2>
          <div className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(attempt.percentage).toFixed(1)}%
          </div>
          <Badge className={`text-base px-4 py-1 ${statusColor(attempt.status)}`}>
            {passed ? '✅ PASSED' : '❌ FAILED'}
          </Badge>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div><p className="text-2xl font-bold text-green-600">{attempt.correct_answers}</p><p className="text-sm text-gray-500">Correct</p></div>
            <div><p className="text-2xl font-bold text-red-600">{attempt.incorrect_answers}</p><p className="text-sm text-gray-500">Incorrect</p></div>
            <div><p className="text-2xl font-bold text-gray-500">{attempt.unanswered}</p><p className="text-sm text-gray-500">Unanswered</p></div>
          </div>

          <p className="text-sm text-gray-500 mt-4">Time taken: {formatTime(attempt.time_taken)} · {formatDate(attempt.completed_at)}</p>

          <div className="flex gap-3 justify-center mt-6">
            <Link to="/student/quizzes" className="btn-secondary">Browse Quizzes</Link>
            <Link to="/student/attempts" className="btn-primary">My Attempts</Link>
          </div>
        </div>

        {/* Answer review */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Answer Review</h3>
          {attempt.answers?.map((a, i) => (
            <div key={a.id} className={`card border-l-4 ${a.is_correct ? 'border-l-green-500' : a.selected_option_id ? 'border-l-red-500' : 'border-l-gray-300'}`}>
              <p className="font-medium text-gray-900 mb-3">
                <span className="text-gray-400 mr-2">Q{i + 1}.</span>{a.question_text}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-28 flex-shrink-0">Your answer:</span>
                  <span className={`font-medium ${a.is_correct ? 'text-green-700' : 'text-red-600'}`}>
                    {a.selected_option_text || <em className="text-gray-400">Not answered</em>}
                    {a.is_correct && ' ✓'}
                  </span>
                </div>
                {!a.is_correct && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 w-28 flex-shrink-0">Correct answer:</span>
                    <span className="text-green-700 font-medium">{a.correct_option_text}</span>
                  </div>
                )}
                {a.explanation && (
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
                    <span className="text-blue-500">💡</span>
                    <span className="text-blue-700 text-xs">{a.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
