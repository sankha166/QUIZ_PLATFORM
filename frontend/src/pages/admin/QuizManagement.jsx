import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, deleteQuiz, updateQuizStatus } from '../../api/quiz.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { statusColor, difficultyColor, formatDate, getErrorMessage } from '../../utils/helpers';

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = () => {
    setLoading(true);
    getQuizzes({ search, status: statusFilter || undefined })
      .then((r) => setQuizzes(r.data.quizzes))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetch, [search, statusFilter]);

  const handleToggleStatus = async (quiz) => {
    const newStatus = quiz.status === 'published' ? 'unpublished' : 'published';
    try {
      await updateQuizStatus(quiz.id, newStatus);
      fetch();
    } catch (err) { alert(getErrorMessage(err)); }
  };

  const handleDelete = async () => {
    try {
      await deleteQuiz(deleteTarget.id);
      setDeleteTarget(null);
      fetch();
    } catch (err) { alert(getErrorMessage(err)); }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Quiz Management</h2>
          <Link to="/admin/quizzes/create" className="btn-primary">+ New Quiz</Link>
        </div>

        <div className="card flex gap-4 flex-wrap">
          <input className="input max-w-xs" placeholder="Search quizzes…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : quizzes.length === 0 ? (
            <EmptyState icon="📝" title="No quizzes found" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Title', 'Category', 'Difficulty', 'Questions', 'Attempts', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{q.title}</td>
                    <td className="px-4 py-3 text-gray-500">{q.category_name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className={difficultyColor(q.difficulty)}>{q.difficulty}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{q.question_count}</td>
                    <td className="px-4 py-3 text-gray-600">{q.attempt_count}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusColor(q.status)}>{q.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/quizzes/${q.id}`} className="text-xs text-indigo-600 hover:underline">Manage</Link>
                        <Link to={`/admin/quizzes/${q.id}/edit`} className="text-xs text-gray-600 hover:underline">Edit</Link>
                        <button
                          onClick={() => handleToggleStatus(q)}
                          className={`text-xs px-2 py-1 rounded ${q.status === 'published' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}
                        >
                          {q.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={() => setDeleteTarget(q)} className="text-xs text-red-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Quiz"
        message={`Delete "${deleteTarget?.title}"? This will remove all questions and attempts.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </AdminLayout>
  );
}
