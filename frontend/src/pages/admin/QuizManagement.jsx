import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, deleteQuiz, updateQuizStatus, getCategories } from '../../api/quiz.api';
import { getDomains } from '../../api/domain.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { statusColor, difficultyColor, getErrorMessage } from '../../utils/helpers';

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quizResponse, categoryResponse, domainResponse] = await Promise.all([
        getQuizzes({
          search: search || undefined,
          status: statusFilter || undefined,
          domain_id: domainFilter === 'all' ? undefined : domainFilter,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
        }),
        getCategories(),
        getDomains(),
      ]);
      setCategories(categoryResponse.data.categories || []);
      setDomains(domainResponse.data.domains || []);
      setQuizzes(quizResponse.data.quizzes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, statusFilter, domainFilter, categoryFilter]);

  const visibleCategories = useMemo(() => (
    domainFilter === 'all'
      ? categories
      : categories.filter((c) => String(c.domain_id) === String(domainFilter))
  ), [categories, domainFilter]);

  const filteredQuizzes = useMemo(() => quizzes
    .map((q) => ({
      ...q,
      resolved_domain_id: q.domain_id ?? q.resolved_domain_id ?? null,
      resolved_domain_name: q.domain_name ?? q.resolved_domain_name ?? 'Unknown',
    }))
    .sort((a, b) => {
      const domainCompare = (a.resolved_domain_name || '').localeCompare(b.resolved_domain_name || '');
      if (domainCompare !== 0) return domainCompare;
      const categoryCompare = (a.category_name || '').localeCompare(b.category_name || '');
      if (categoryCompare !== 0) return categoryCompare;
      return (a.title || '').localeCompare(b.title || '');
    }), [quizzes]);

  const handleToggleStatus = async (quiz) => {
    const newStatus = quiz.status === 'published' ? 'unpublished' : 'published';
    try { await updateQuizStatus(quiz.id, newStatus); fetchData(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  const handleDelete = async () => {
    try { await deleteQuiz(deleteTarget.id); setDeleteTarget(null); fetchData(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quiz Management</h2>
            <p className="text-sm text-gray-500 mt-1">Find quizzes quickly using Domain → Category → Quiz.</p>
          </div>
          <Link to="/admin/quizzes/create" className="btn-primary w-full sm:w-auto text-center">+ New Quiz</Link>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <input className="input w-full" placeholder="Search quizzes…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input w-full" value={domainFilter} onChange={(e) => { setDomainFilter(e.target.value); setCategoryFilter('all'); }}>
              <option value="all">All domains</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="input w-full" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {visibleCategories.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? <LoadingSpinner className="py-16" /> : filteredQuizzes.length === 0 ? <EmptyState icon="📝" title="No quizzes found" /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-gray-50 border-b"><tr>
                  {['Domain', 'Category', 'Title', 'Difficulty', 'Questions', 'Attempts', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredQuizzes.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><span className="inline-flex rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-1 text-xs font-medium whitespace-nowrap">{q.resolved_domain_name}</span></td>
                      <td className="px-4 py-3 text-gray-500">{q.category_name || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs"><div className="truncate" title={q.title}>{q.title}</div></td>
                      <td className="px-4 py-3"><Badge className={difficultyColor(q.difficulty)}>{q.difficulty}</Badge></td>
                      <td className="px-4 py-3 text-gray-600">{q.question_count}</td>
                      <td className="px-4 py-3 text-gray-600">{q.attempt_count}</td>
                      <td className="px-4 py-3"><Badge className={statusColor(q.status)}>{q.status}</Badge></td>
                      <td className="px-4 py-3"><div className="flex flex-wrap gap-2 min-w-[230px]"><Link to={`/admin/quizzes/${q.id}`} className="rounded-lg px-2.5 py-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Manage</Link><Link to={`/admin/quizzes/${q.id}/edit`} className="rounded-lg px-2.5 py-1.5 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">Edit</Link><button onClick={() => handleToggleStatus(q)} className={`rounded-lg px-2.5 py-1.5 text-xs ${q.status === 'published' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{q.status === 'published' ? 'Unpublish' : 'Publish'}</button><button onClick={() => setDeleteTarget(q)} className="rounded-lg px-2.5 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal isOpen={!!deleteTarget} title="Delete Quiz" message={`Delete "${deleteTarget?.title}"? This will remove all questions and attempts.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} confirmText="Delete" />
    </AdminLayout>
  );
}
