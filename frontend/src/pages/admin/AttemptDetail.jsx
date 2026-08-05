import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminAttemptById } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatDate, formatPercent, formatTime, statusColor } from '../../utils/helpers';

export default function AttemptDetail() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAttemptById(id).then((r) => setAttempt(r.data.attempt)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;
  if (!attempt) return <AdminLayout><p className="text-center text-red-600 py-20">Attempt not found.</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/attempts" className="text-gray-500 hover:text-gray-700 text-sm">← Back</Link>
          <h2 className="text-xl font-bold text-gray-900">Attempt Detail</h2>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-6">
            <div><p className="text-sm text-gray-500">Student</p><p className="font-semibold">{attempt.student_name}</p></div>
            <div><p className="text-sm text-gray-500">Quiz</p><p className="font-semibold">{attempt.quiz_title}</p></div>
            <div><p className="text-sm text-gray-500">Score</p><p className="font-semibold">{formatPercent(attempt.percentage)}</p></div>
            <div><p className="text-sm text-gray-500">Status</p><Badge className={statusColor(attempt.status)}>{attempt.status}</Badge></div>
            <div><p className="text-sm text-gray-500">Time</p><p className="font-semibold">{formatTime(attempt.time_taken)}</p></div>
            <div><p className="text-sm text-gray-500">Date</p><p className="font-semibold">{formatDate(attempt.completed_at)}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center"><p className="text-xl font-bold text-green-600">{attempt.correct_answers}</p><p className="text-xs text-gray-500">Correct</p></div>
            <div className="text-center"><p className="text-xl font-bold text-red-600">{attempt.incorrect_answers}</p><p className="text-xs text-gray-500">Incorrect</p></div>
            <div className="text-center"><p className="text-xl font-bold text-gray-500">{attempt.unanswered}</p><p className="text-xs text-gray-500">Unanswered</p></div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800">Answer Review</h3>
          {attempt.answers?.map((a, i) => (
            <div key={a.id} className={`border rounded-lg p-4 ${a.is_correct ? 'border-green-200 bg-green-50' : a.selected_option_id ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="font-medium text-gray-900 text-sm mb-2"><span className="text-gray-400 mr-1">Q{i + 1}.</span>{a.question_text}</p>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Selected:</span> <span className={a.is_correct ? 'text-green-700 font-medium' : 'text-red-700'}>{a.selected_option_text || 'Not answered'}</span></p>
                {!a.is_correct && <p><span className="text-gray-500">Correct:</span> <span className="text-green-700 font-medium">{a.correct_option_text}</span></p>}
                {a.explanation && <p className="text-blue-600 text-xs mt-1">💡 {a.explanation}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
