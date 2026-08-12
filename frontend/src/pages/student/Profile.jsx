import { useEffect, useMemo, useState } from 'react';
import { getProfile, updateProfile, changePassword } from '../../api/profile.api';
import { useAuth } from '../../hooks/useAuth';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { getErrorMessage } from '../../utils/helpers';
import { FaUser, FaImage, FaShieldAlt, FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/6.x/identicon/svg?seed=learn1',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=learn2',
  'https://api.dicebear.com/6.x/bottts/svg?seed=learn3',
  'https://api.dicebear.com/6.x/pixel-art/svg?seed=learn4',
  'https://api.dicebear.com/6.x/adventurer/svg?seed=learn5',
  'https://api.dicebear.com/6.x/identicon/svg?seed=learn6',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=learn7',
  'https://api.dicebear.com/6.x/bottts/svg?seed=learn8',
  'https://api.dicebear.com/6.x/pixel-art/svg?seed=learn9',
  'https://api.dicebear.com/6.x/adventurer/svg?seed=learn10',
];

const TABS = [
  { id: 'profile', label: 'Profile', icon: <FaUser /> },
  { id: 'avatar', label: 'Avatar', icon: <FaImage /> },
  { id: 'security', label: 'Security', icon: <FaShieldAlt /> },
];

function Alert({ tone, children }) {
  if (!children) return null;
  const styles =
    tone === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : 'bg-rose-50 border-rose-200 text-rose-700';
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

function PasswordField({ label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className="input pr-12"
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
        >
          {visible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}

function strengthOf(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

export default function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', bio: '', avatar_url: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    getProfile()
      .then((res) => {
        setProfile(res.data.profile);
        setForm({
          name: res.data.profile.name || '',
          bio: res.data.profile.bio || '',
          avatar_url: res.data.profile.avatar_url || '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const switchTab = (id) => {
    setTab(id);
    setMessage('');
    setError('');
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Please upload an image smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatar_url: reader.result }));
      setError('');
      setMessage('Avatar selected — remember to save it from the Profile tab.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Display name cannot be empty.');
      return;
    }
    if (form.name.trim().length > 100) {
      setError('Display name must be less than 100 characters.');
      return;
    }
    if (form.bio.length > 500) {
      setError('Bio must be less than 500 characters.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await updateProfile({ ...form, name: form.name.trim() });
      setProfile(res.data.profile);
      setMessage('Profile saved successfully.');
      login(localStorage.getItem('token'), { ...user, ...res.data.profile });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const pwStrength = useMemo(() => strengthOf(password.newPassword), [password.newPassword]);
  const pwMatch = password.confirmPassword.length > 0 && password.newPassword === password.confirmPassword;

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (password.newPassword === password.currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setSaving(true);
    try {
      const res = await changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      setMessage(res.data.message || 'Password updated successfully.');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-brand-500 to-purple-600" />
          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-3xl font-bold text-slate-500">
                      {profile?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="text-2xl font-bold text-slate-900">{profile?.name}</h1>
                  <p className="text-sm text-slate-500">{profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between w-full pb-1">
                <div>
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className='flex item-centre gap-3'>
                <Badge className="bg-indigo-100 px-3 py-1 text-sm text-indigo-700">{user?.role || 'Student'}</Badge>
                <span className="text-xs text-slate-400">
                  Member since {profile?.created_at ? new Date(user.created_at).toLocaleDateString('en-US',{
                    month:'short',
                    year:'numeric'
                  }) : '—'}
                </span>
                </div>
              </div>
            </div>

            {profile?.bio && <p className="mt-4 max-w-2xl text-sm text-slate-600">{profile.bio}</p>}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-t border-slate-200 px-4 sm:px-6">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition ${
                  tab === t.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="text-xs">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panels */}
        {tab === 'profile' && (
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Account details</h2>
            <p className="mt-1 text-sm text-slate-500">Update how your name and bio appear across Quizora.</p>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <Alert tone="success">{message}</Alert>
              <Alert tone="error">{error}</Alert>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Display name</label>
                  <input
                    className="input"
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input bg-slate-50 text-slate-500" value={profile?.email || ''} disabled readOnly />
                </div>
              </div>

              <div>
                <label className="label">Bio</label>
                <textarea
                  className="input h-28"
                  maxLength={500}
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                />
                <p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/500</p>
              </div>

              <div>
                <label className="label">Avatar URL</label>
                <input
                  className="input"
                  value={form.avatar_url}
                  placeholder="https://example.com/avatar.jpg"
                  onChange={(e) => setForm((prev) => ({ ...prev, avatar_url: e.target.value }))}
                />
                <p className="mt-1 text-xs text-slate-400">Or pick one from the Avatar tab.</p>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary px-8">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'avatar' && (
          <div className="space-y-6">
            <Alert tone="success">{message}</Alert>
            <Alert tone="error">{error}</Alert>

            <div className="card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Choose a default avatar</h2>
              <p className="mt-1 text-sm text-slate-500">Pick a look, then save it from the Profile tab.</p>
              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {DEFAULT_AVATARS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, avatar_url: url }))}
                    className={`overflow-hidden rounded-2xl border-2 bg-white transition ${
                      form.avatar_url === url ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200 hover:border-brand-400'
                    }`}
                  >
                    <img src={url} alt="Avatar option" className="h-20 w-full object-contain p-2" />
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Upload from device</h2>
              <p className="mt-1 text-sm text-slate-500">PNG or JPG up to 2 MB.</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              />
              <p className="mt-3 text-xs text-slate-400">Images are stored as base64 data URLs in your profile.</p>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-8">
                {saving ? 'Saving…' : 'Save avatar'}
              </button>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use at least 8 characters with a mix of letters, numbers, and symbols.
            </p>

            <form onSubmit={handleChangePassword} className="mt-6 max-w-md space-y-4">
              <Alert tone="success">{message}</Alert>
              <Alert tone="error">{error}</Alert>

              <PasswordField
                label="Current password"
                autoComplete="current-password"
                value={password.currentPassword}
                onChange={(v) => setPassword((p) => ({ ...p, currentPassword: v }))}
              />
              <PasswordField
                label="New password"
                autoComplete="new-password"
                value={password.newPassword}
                onChange={(v) => setPassword((p) => ({ ...p, newPassword: v }))}
              />

              {password.newPassword && (
                <div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < pwStrength
                            ? pwStrength <= 1
                              ? 'bg-rose-400'
                              : pwStrength === 2
                              ? 'bg-amber-400'
                              : pwStrength === 3
                              ? 'bg-lime-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength]}
                  </p>
                </div>
              )}

              <PasswordField
                label="Confirm new password"
                autoComplete="new-password"
                value={password.confirmPassword}
                onChange={(v) => setPassword((p) => ({ ...p, confirmPassword: v }))}
              />

              {password.confirmPassword && (
                <p className={`flex items-center gap-2 text-xs ${pwMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {pwMatch ? <FaCheck /> : <FaTimes />}
                  {pwMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}

              <button
                type="submit"
                disabled={saving || !password.currentPassword || !password.newPassword || !pwMatch}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
