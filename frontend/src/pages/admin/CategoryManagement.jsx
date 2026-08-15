import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/quiz.api";
import {
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
} from "../../api/domain.api";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getErrorMessage } from "../../utils/helpers";

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selected, setSelected] = useState("all");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domainId, setDomainId] = useState("");
  const [kind, setKind] = useState("category");

  const load = async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([getDomains(), getCategories()]);
      setDomains(d.data.domains || []);
      setCategories(c.data.categories || []);
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDomain = (d = null) => {
    setKind("domain");
    setModal(d || {});
    setName(d?.name || "");
    setDescription(d?.description || "");
    setDomainId("");
  };

  const openCategory = (c = null) => {
    setKind("category");
    setModal(c || {});
    setName(c?.name || "");
    setDescription(c?.description || "");
    // For a new category use the currently selected domain; when "All" is
    // selected, default to the first available domain instead of an empty ID.
    const defaultDomain =
      selected !== "all"
        ? selected
        : domains[0]?.id != null
          ? String(domains[0].id)
          : "";
    setDomainId(c?.domain_id != null ? String(c.domain_id) : defaultDomain);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const cleanName = name.trim();
      if (!cleanName) throw new Error("Name is required");

      if (kind === "domain") {
        const p = { name: cleanName, description: description.trim() || null };
        if (modal.id) await updateDomain(modal.id, p);
        else await createDomain(p);
      } else {
        const numericDomainId = Number(domainId);
        if (!Number.isInteger(numericDomainId) || numericDomainId < 1) {
          throw new Error(
            "Please select a valid domain before creating the category",
          );
        }
        const p = {
          name: cleanName,
          description: description.trim() || null,
          domain_id: numericDomainId,
        };
        if (modal.id) await updateCategory(modal.id, p);
        else await createCategory(p);
      }
      setModal(null);
      await load();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  const delDomain = async (id) => {
    if (!confirm("Delete this domain?")) return;
    try {
      await deleteDomain(id);
      await load();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  const delCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      await load();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  const visible =
    selected === "all"
      ? categories
      : categories.filter((c) => String(c.domain_id) === String(selected));

  return (
    <AdminLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Domains & Categories</h2>
            <p className="text-sm text-slate-500 mt-1">
              Database-backed Domain → Category hierarchy.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button className="btn-secondary" onClick={() => openDomain()}>
              + Add Domain
            </button>
            <button className="btn-primary" onClick={() => openCategory()}>
              + New Category
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelected("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${selected === "all" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
          >
            All ({categories.length})
          </button>
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(String(d.id))}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${String(selected) === String(d.id) ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
            >
              {d.name} (
              {
                categories.filter((c) => String(c.domain_id) === String(d.id))
                  .length
              }
              )
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
              <h3 className="font-semibold">
                {selected === "all"
                  ? "All Categories"
                  : `${domains.find((d) => String(d.id) === String(selected))?.name || "Domain"} Categories`}
              </h3>
              <span className="text-sm text-slate-500">{visible.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Domain</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3">Quizzes</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs">
                          {c.domain_name || "Unassigned"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        {c.description || "—"}
                      </td>
                      <td className="p-3 text-center">{c.quiz_count || 0}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            className="text-indigo-600"
                            onClick={() => openCategory(c)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600"
                            onClick={() => delCategory(c.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modal && (
          <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between mb-5">
                <h3 className="text-xl font-semibold">
                  {kind === "domain"
                    ? modal.id
                      ? "Edit Domain"
                      : "Create Domain"
                    : modal.id
                      ? "Edit Category"
                      : "Create Category"}
                </h3>
                <button onClick={() => setModal(null)}>✕</button>
              </div>
              <form onSubmit={save} className="space-y-4">
                {kind === "category" && (
                  <div>
                    <label className="label">Domain *</label>
                    <select
                      className="input w-full"
                      value={domainId}
                      onChange={(e) => setDomainId(e.target.value)}
                      required
                    >
                      <option value="">Select domain</option>
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <input
                  className="input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    kind === "domain" ? "Domain name" : "Category name"
                  }
                  required
                />
                <textarea
                  className="input w-full"
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                />
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    disabled={kind === "category" && !domainId}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
