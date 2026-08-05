import { useEffect, useState } from 'react';
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
      .then((r) => { setUsers(r.data.users); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { fetchUsers(); }, [page, debouncedSearch]);

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <span className="text-sm text-gray-500">{total} students</span>
        </div>

        <div className="card">
          <input
            className="input max-w-sm"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : users.length === 0 ? (
            <EmptyState icon="👥" title="No students found" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Email', 'Registered', 'Status', 'Attempts', 'Avg Score', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge className={u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.quizzes_attempted}</td>
                    <td className="px-4 py-3 text-gray-600">{formatPercent(u.average_score)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/users/${u.id}`} className="text-indigo-600 hover:underline text-xs">View</Link>
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`text-xs px-2 py-1 rounded ${u.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
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
