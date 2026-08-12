import { useEffect, useMemo, useState } from 'react';
import { getCategories } from '../../api/quiz.api';
import { updateProfile } from '../../api/profile.api';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/helpers';

export default function PreferredDomainSelector({ compact = false }) {
  const { user, login } = useAuth();
  const [domains, setDomains] = useState([]);
  const [selected, setSelected] = useState(user?.preferred_domain_id ? String(user.preferred_domain_id) : '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then((res) => {
        const map = new Map();
        (res.data.categories || []).forEach((category) => {
          if (category.domain_id && category.domain_name) map.set(String(category.domain_id), { id: category.domain_id, name: category.domain_name });
        });
        setDomains([...map.values()].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.preferred_domain_id) setSelected(String(user.preferred_domain_id));
  }, [user?.preferred_domain_id]);

  const selectedName = useMemo(() => domains.find((d) => String(d.id) === selected)?.name || user?.preferred_domain_name, [domains, selected, user?.preferred_domain_name]);

  const save = async () => {
    if (!selected) return;
    setSaving(true); setMessage(''); setError('');
    try {
      const res = await updateProfile({ preferred_domain_id: Number(selected) });
      const updated = { ...user, ...res.data.profile };
      login(localStorage.getItem('token'), updated);
      setMessage('Domain updated. Your quizzes and dashboard now use this domain.');
      window.dispatchEvent(new CustomEvent('student-domain-changed', { detail: updated }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  return (
    <div className={compact ? 'rounded-2xl border border-slate-200 bg-white p-3 shadow-sm' : 'rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Your learning domain</p>
          <p className="mt-1 text-xs text-slate-500">Choose the domain you want Quizora to use for quizzes, attempts and dashboard data.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto sm:min-w-[18rem]">
          <select className="input min-w-0 flex-1 bg-white" value={selected} disabled={loading || saving} onChange={(e) => { setSelected(e.target.value); setMessage(''); setError(''); }}>
            <option value="">Select a domain</option>
            {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
          </select>
          <button type="button" onClick={save} disabled={!selected || saving || loading} className="btn-primary shrink-0 px-4">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      {selectedName && <p className="mt-2 text-xs font-medium text-indigo-700">Current domain: {selectedName}</p>}
      {message && <p className="mt-2 text-xs font-medium text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
}
