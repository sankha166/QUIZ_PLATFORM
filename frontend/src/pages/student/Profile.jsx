import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, changePassword } from '../../api/profile.api';
import { useAuth } from '../../hooks/useAuth';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { getErrorMessage } from '../../utils/helpers';

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

export default function Profile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatar_url: reader.result }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await updateProfile(form);
      setProfile(res.data.profile);
      setMessage('Profile saved successfully.');
      login(localStorage.getItem('token'), { ...user, ...res.data.profile });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    if (password.newPassword !== password.confirmPassword) {
      setError('New password and confirmation do not match.');
      setSaving(false);
      return;
    }

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
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500">Update your account, choose an avatar, and manage security.</p>
          </div>
          <Badge className="text-sm px-3 py-2 bg-indigo-100 text-indigo-700">{profile?.role || 'Student'}</Badge>
        </div>

        {message && <div className="rounded-3xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-emerald-700">{message}</div>}
        {error && <div className="rounded-3xl bg-rose-50 border border-rose-200 px-5 py-4 text-rose-700">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="card p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {form.avatar_url ? (
                      <img src={form.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-slate-200 flex items-center justify-center text-3xl text-slate-500">{profile?.name?.charAt(0)}</div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg border-2 border-white">
                    <span className="text-xl">📷</span>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{profile?.name}</p>
                  <p className="text-sm text-slate-500">{profile?.email}</p>
                  <p className="text-sm text-slate-500">Member since {new Date(profile?.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Choose a default avatar</h2>
              <div className="grid grid-cols-4 gap-3">
                {DEFAULT_AVATARS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, avatar_url: url }))}
                    className="overflow-hidden rounded-2xl border border-slate-200 hover:border-brand-500"
                  >
                    <img src={url} alt="Avatar option" className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload from device</h2>
              <p className="text-sm text-slate-500 mb-4">Upload a small image and it will be saved as your profile avatar.</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              />
              <p className="mt-3 text-xs text-slate-400">Images are stored as base64 data URLs in your profile.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-8" id="profile-settings">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit profile</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="label">Display name</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea
                    className="input h-24"
                    value={form.bio}
                    onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Avatar URL</label>
                  <input
                    className="input"
                    value={form.avatar_url}
                    placeholder="https://example.com/avatar.jpg"
                    onChange={(e) => setForm((prev) => ({ ...prev, avatar_url: e.target.value }))}
                  />
                </div>
                <button type="submit" disabled={saving} className="btn-primary w-full">
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </form>
            </div>

            <div className="card p-8 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Account stats</h2>
                <p className="text-sm text-slate-500">Your performance summary.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Quizzes taken</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{profile?.quizzes_attempted ?? 0}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Average score</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{profile?.average_score ?? '0.00'}%</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Highest score</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{profile?.highest_score ?? '0.00'}%</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Passed quizzes</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{profile?.quizzes_passed ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="card p-8" id="security">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Security</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="label">Current password</label>
                  <input
                    className="input"
                    type="password"
                    value={password.currentPassword}
                    onChange={(e) => setPassword((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">New password</label>
                  <input
                    className="input"
                    type="password"
                    value={password.newPassword}
                    onChange={(e) => setPassword((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Confirm new password</label>
                  <input
                    className="input"
                    type="password"
                    value={password.confirmPassword}
                    onChange={(e) => setPassword((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <button type="submit" disabled={saving} className="btn-secondary w-full">
                  {saving ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
