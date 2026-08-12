import { useEffect, useMemo, useState } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/quiz.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import { getErrorMessage } from '../../utils/helpers';

const DOMAIN_STORAGE_KEY = 'quiz_platform_admin_domains_v1';

const DEFAULT_ENGINEERING = {
  id: 'engineering',
  name: 'Engineering',
  description: 'Engineering, technology and computer-science related quizzes.',
};

function loadDomains() {
  try {
    const saved = JSON.parse(localStorage.getItem(DOMAIN_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [DEFAULT_ENGINEERING];
    const hasEngineering = saved.some((d) => String(d.id) === 'engineering');
    return hasEngineering ? saved : [DEFAULT_ENGINEERING, ...saved];
  } catch {
    return [DEFAULT_ENGINEERING];
  }
}

function saveDomains(domains) {
  localStorage.setItem(DOMAIN_STORAGE_KEY, JSON.stringify(domains));
}

function DomainModal({ domain, onSave, onClose }) {
  const [name, setName] = useState(domain?.name || '');
  const [description, setDescription] = useState(domain?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Domain name is required');

    setSaving(true);
    try {
      const domains = loadDomains();

      if (domain) {
        const next = domains.map((d) =>
          d.id === domain.id
            ? { ...d, name: name.trim(), description: description.trim() }
            : d
        );
        saveDomains(next);
      } else {
        const next = [
          ...domains,
          {
            id: `domain-${Date.now()}`,
            name: name.trim(),
            description: description.trim(),
          },
        ];
        saveDomains(next);
      }

      onSave();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {domain ? 'Edit Domain' : 'Create Domain'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              A domain contains related quiz categories.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900 text-xl">
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Domain name *</label>
            <input
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Medical, Law, Commerce"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input w-full"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional domain description"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? 'Saving…' : 'Save domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryModal({ category, domains, defaultDomainId, onSave, onClose }) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [domainId, setDomainId] = useState(
    category?.domain_id || defaultDomainId || 'engineering'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    if (!domainId) return setError('Select a domain');

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        domain_id: domainId,
        domain_name:
          domains.find((d) => String(d.id) === String(domainId))?.name || 'Engineering',
      };

      if (category) await updateCategory(category.id, payload);
      else await createCategory(payload);

      // Keep a browser-side mapping too. This makes the new hierarchy usable
      // immediately with older APIs that do not yet return domain_id.
      const map = JSON.parse(localStorage.getItem('quiz_platform_category_domains_v1') || '{}');
      if (category?.id) map[String(category.id)] = domainId;
      saveDomains(domains);
      localStorage.setItem('quiz_platform_category_domains_v1', JSON.stringify(map));

      onSave();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {category ? 'Edit Category' : 'Create Category'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Categories belong to one domain.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900 text-xl">
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Domain *</label>
            <select
              className="input w-full"
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Category name *</label>
            <input
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Structures"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input w-full"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? 'Saving…' : 'Save category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [domains, setDomains] = useState(loadDomains);
  const [loading, setLoading] = useState(true);
  const [selectedDomainId, setSelectedDomainId] = useState('all');
  const [domainModal, setDomainModal] = useState(null);
  const [categoryModal, setCategoryModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categoryDomainMap = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('quiz_platform_category_domains_v1') || '{}');
    } catch {
      return {};
    }
  }, [categories]);

  const refreshDomains = () => setDomains(loadDomains());

  const fetch = () => {
    setLoading(true);
    getCategories()
      .then((r) => {
        const incoming = r.data.categories || [];
        const map = JSON.parse(localStorage.getItem('quiz_platform_category_domains_v1') || '{}');

        // Legacy categories are automatically treated as Engineering.
        const normalized = incoming.map((c) => ({
          ...c,
          domain_id: c.domain_id || map[String(c.id)] || 'engineering',
          domain_name:
            c.domain_name ||
            loadDomains().find((d) => d.id === (c.domain_id || map[String(c.id)] || 'engineering'))?.name ||
            'Engineering',
        }));

        setCategories(normalized);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
  }, []);

  const visibleCategories =
    selectedDomainId === 'all'
      ? categories
      : categories.filter((c) => String(c.domain_id) === String(selectedDomainId));

  const domainCounts = domains.map((d) => ({
    ...d,
    count: categories.filter((c) => String(c.domain_id) === String(d.id)).length,
    quizzes: categories
      .filter((c) => String(c.domain_id) === String(d.id))
      .reduce((sum, c) => sum + Number(c.quiz_count || 0), 0),
  }));

  const handleDelete = async () => {
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      fetch();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const deleteDomain = (domain) => {
    if (domain.id === 'engineering') {
      alert('Engineering is the default domain and cannot be deleted.');
      return;
    }

    const hasCategories = categories.some((c) => String(c.domain_id) === String(domain.id));
    if (hasCategories) {
      alert('Move or delete the categories in this domain before deleting the domain.');
      return;
    }

    const next = domains.filter((d) => d.id !== domain.id);
    saveDomains(next);
    setDomains(next);
    if (selectedDomainId === domain.id) setSelectedDomainId('all');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-slate-900">Domains & Categories</h2>
            <p className="text-sm text-slate-500 mt-1">
              Organize quizzes as Domain → Category. Existing categories remain under Engineering.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <button
              onClick={() => setDomainModal('create')}
              className="btn-secondary w-full sm:w-auto"
            >
              + Add Domain
            </button>
            <button
              onClick={() => setCategoryModal('create')}
              className="btn-primary w-full sm:w-auto"
            >
              + New Category
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {domainCounts.map((domain) => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomainId(domain.id)}
              className={`text-left rounded-3xl border p-5 shadow-sm transition ${
                selectedDomainId === domain.id
                  ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Domain
                  </p>
                  <h3 className="mt-2 font-semibold text-slate-900 truncate">{domain.name}</h3>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm">
                  {domain.count}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                {domain.description || 'No description yet.'}
              </p>
              <p className="mt-4 text-xs text-slate-400">{domain.quizzes} quizzes</p>
            </button>
          ))}

          <button
            onClick={() => setSelectedDomainId('all')}
            className={`text-left rounded-3xl border p-5 shadow-sm transition ${
              selectedDomainId === 'all'
                ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">View</p>
            <h3 className="mt-2 font-semibold text-slate-900">All Categories</h3>
            <p className="mt-3 text-sm text-slate-600">Show categories from every domain.</p>
            <p className="mt-4 text-xs text-slate-400">{categories.length} categories</p>
          </button>
        </div>

        {selectedDomainId !== 'all' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Selected domain</p>
              <h3 className="text-lg font-semibold text-slate-900">
                {domains.find((d) => d.id === selectedDomainId)?.name}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDomainModal(domains.find((d) => d.id === selectedDomainId))}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs text-indigo-600 hover:bg-slate-50"
              >
                Edit domain
              </button>
              {selectedDomainId !== 'engineering' && (
                <button
                  onClick={() => deleteDomain(domains.find((d) => d.id === selectedDomainId))}
                  className="rounded-full border border-rose-200 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
                >
                  Delete domain
                </button>
              )}
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <LoadingSpinner className="py-16" />
            ) : visibleCategories.length === 0 ? (
              <EmptyState
                icon="🏷️"
                title="No categories in this view"
                description="Create a category for the selected domain."
              />
            ) : (
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Category', 'Domain', 'Description', 'Quizzes', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {visibleCategories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900">{c.name}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-medium">
                          {c.domain_name || 'Engineering'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 max-w-md">{c.description || '—'}</td>
                      <td className="px-4 py-4 text-slate-600">{c.quiz_count || 0}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setCategoryModal(c)}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-indigo-600 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50"
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
          </div>
        </div>
      </div>

      {domainModal && (
        <DomainModal
          domain={domainModal === 'create' ? null : domainModal}
          onSave={() => {
            setDomainModal(null);
            refreshDomains();
          }}
          onClose={() => setDomainModal(null)}
        />
      )}

      {categoryModal && (
        <CategoryModal
          category={categoryModal === 'create' ? null : categoryModal}
          domains={domains}
          defaultDomainId={selectedDomainId !== 'all' ? selectedDomainId : 'engineering'}
          onSave={() => {
            setCategoryModal(null);
            fetch();
          }}
          onClose={() => setCategoryModal(null)}
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