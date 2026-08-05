import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, changePassword } from '../../api/profile.api';
import { useAuth } from '../../hooks/useAuth';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { getErrorMessage } from '../../utils/helpers';

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500">Update your name, bio, and profile avatar.</p>
          </div>
          <Badge className="text-sm px-3 py-2 bg-indigo-100 text-indigo-700">{profile?.role || 'Student'}</Badge>
        </div>

        {message && <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800">{message}</div>}
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account details</h2>
              <p className="text-sm text-gray-500">Your profile information appears across the student experience.</p>
            </div>

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
                <label className="label">Email address</label>
                <input className="input bg-gray-100 cursor-not-allowed" value={profile?.email || ''} readOnly />
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
              {form.avatar_url && (
                <div className="rounded-2xl overflow-hidden border border-gray-200 w-32 h-32">
                  <img src={form.avatar_url} alt="Avatar preview" className="w-full h-full object-cover" />
                </div>
              )}
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </div>

          <div className="card space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-500">Change your password securely.</p>
            </div>

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
              <button type="submit" disabled={saving} className="btn-secondary">
                {saving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
