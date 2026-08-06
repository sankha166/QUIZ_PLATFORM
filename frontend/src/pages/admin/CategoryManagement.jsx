import { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/quiz.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import { getErrorMessage } from '../../utils/helpers';

function CategoryModal({ category, onSave, onClose }) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    setSaving(true);
    try {
      if (category) await updateCategory(category.id, { name, description });
      else await createCategory({ name, description });
      onSave();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-xl font-semibold text-slate-900">{category ? 'Edit Category' : 'Create Category'}</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
        {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. JavaScript" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save category'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | category object
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetch = () => {
    setLoading(true);
    getCategories()
      .then((r) => setCategories(r.data.categories || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const handleDelete = async () => {
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      fetch();
    } catch (err) { alert(getErrorMessage(err)); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Categories</h2>
            <p className="text-sm text-slate-500">Organize your quizzes with categories and labels.</p>
          </div>
          <button onClick={() => setModal('create')} className="btn-primary">+ New Category</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {categories.slice(0, 3).map((category) => (
            <div key={category.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">{category.name}</p>
              <p className="mt-3 text-sm text-slate-600">{category.description || 'No description yet.'}</p>
              <p className="mt-4 text-xs text-slate-400">{category.quiz_count || 0} quizzes</p>
            </div>
          ))}
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : categories.length === 0 ? (
            <EmptyState icon="🏷️" title="No categories yet" message="Create your first category to keep quizzes organized." />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Name', 'Description', 'Quizzes', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-4 text-slate-500">{c.description || '—'}</td>
                    <td className="px-4 py-4 text-slate-600">{c.quiz_count || 0}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setModal(c)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-indigo-600 hover:bg-slate-100">Edit</button>
                        <button onClick={() => setDeleteTarget(c)} className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <CategoryModal
          category={modal === 'create' ? null : modal}
          onSave={() => { setModal(null); fetch(); }}
          onClose={() => setModal(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </AdminLayout>
  );
}
