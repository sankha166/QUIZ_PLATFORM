import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, updateUserStatus, deleteUser } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, formatPercent, getErrorMessage } from '../../utils/helpers';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const limit = 10;

  const fetchUsers = () => {
    setLoading(true);
    getUsers({ page, limit, search: debouncedSearch })
      .then((r) => { setUsers(r.data.users || []); setTotal(r.data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { fetchUsers(); }, [page, debouncedSearch]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length;
    const inactive = users.filter((u) => u.status !== 'active').length;
    const avgScore = users.length ? (users.reduce((sum, u) => sum + parseFloat(u.average_score || 0), 0) / users.length).toFixed(1) : '0.0';
    return { active, inactive, avgScore };
  }, [users]);

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(user.id, newStatus);
      fetchUsers();
    } catch (err) { alert(getErrorMessage(err)); }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) { alert(getErrorMessage(err)); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Students</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{total}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Active</p>
            <p className="mt-3 text-3xl font-bold text-emerald-600">{stats.active}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Inactive</p>
            <p className="mt-3 text-3xl font-bold text-rose-600">{stats.inactive}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
            <p className="text-sm text-slate-500">Search and manage student accounts.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">Average score: {stats.avgScore}%</div>
        </div>

        <div className="card p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
            <div>
              <label className="label text-xs">Search students</label>
              <input
                className="input w-full"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={() => setSearch('')} className="btn-secondary h-12 w-full sm:w-auto">Clear</button>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : users.length === 0 ? (
            <EmptyState icon="👥" title="No students found" description="Try a different query or add new student accounts." />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Name', 'Email', 'Registered', 'Status', 'Attempts', 'Avg Score', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-4 text-slate-600">{u.email}</td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-4"><Badge className={u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{u.status}</Badge></td>
                    <td className="px-4 py-4 text-slate-600">{u.quizzes_attempted}</td>
                    <td className="px-4 py-4 text-slate-600">{formatPercent(u.average_score)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/users/${u.id}`} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">View</Link>
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`rounded-full px-3 py-1 text-xs ${u.status === 'active' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && total > limit && (
            <div className="px-4 pb-4">
              <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This will remove all their attempts.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </AdminLayout>
  );
}
