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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">{category ? 'Edit Category' : 'New Category'}</h3>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. JavaScript" />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
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
    getCategories().then((r) => setCategories(r.data.categories)).catch(console.error).finally(() => setLoading(false));
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Categories</h2>
          <button onClick={() => setModal('create')} className="btn-primary">+ New Category</button>
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : categories.length === 0 ? (
            <EmptyState icon="🏷️" title="No categories yet" message="Create your first category to organize quizzes." />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Name', 'Description', 'Quizzes', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.quiz_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(c)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                        <button onClick={() => setDeleteTarget(c)} className="text-xs text-red-600 hover:underline">Delete</button>
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
        message={`Delete "${deleteTarget?.name}"? This cannot be undone if no quizzes are linked.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </AdminLayout>
  );
}
