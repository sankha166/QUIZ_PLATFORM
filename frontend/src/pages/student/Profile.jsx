import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../../api/profile.api";
import { getFavorites, removeFavorite } from "../../api/favorites.api";
import { useAuth } from "../../hooks/useAuth";
import StudentLayout from "../../components/student/StudentLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import { getErrorMessage } from "../../utils/helpers";
import {
  FaUser,
  FaImage,
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
const AVATARS = [
  "https://api.dicebear.com/6.x/identicon/svg?seed=learn1",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=learn2",
  "https://api.dicebear.com/6.x/bottts/svg?seed=learn3",
  "https://api.dicebear.com/6.x/pixel-art/svg?seed=learn4",
  "https://api.dicebear.com/6.x/adventurer/svg?seed=learn5",
  "https://api.dicebear.com/6.x/identicon/svg?seed=learn6",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=learn7",
  "https://api.dicebear.com/6.x/bottts/svg?seed=learn8",
  "https://api.dicebear.com/6.x/pixel-art/svg?seed=learn9",
  "https://api.dicebear.com/6.x/adventurer/svg?seed=learn10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlYlNHicTjk1uYmnJIUJBh9U1GMMH8PDO1qDrIw8tpdQ&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU8TFJ7iUwyhF0_LOmPpst5aFLBQUYvRcuREn63JTVvg&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7akOjBI95n5CWepEIzJ0gtQE6xVMLrUn8mnJAjkuypw&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOIzp2EOXMC3orJnhxRiAenLjTqzuicH-_Vby3ph7tJg&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBp0pLXlXflTnbcz_VcatnfPG1kUVuAD33mwuQ8Lm8aQ&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT3Ln8J4Q1GPF3CQ9WdaELBV8Q0qLfPDk8ubpMSQahCA&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTY_pf1cf_eaeOzqPPAIaC0j0my_Mho66ZbwpjMiwJ-jA&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiZTaROKITuewuYJaWGrL_FCOhWo_5prT6wVRjMHwizQ&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS91zVyenxyN3qP62boJheb4notS64SHJVPOgubtzynmA&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrOTJr036_NXVumyDroMHa_vSy1Q4DduNXULYYG9oP8Q&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6pL_YZCbmyWpa_aiok6gVZnGc9SYm2JmWIjJV2vI5jA&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRStnG2nVzuVO4cLSVf4sU_F_CFfMfHMK3hLB_Bf8-Uaw&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT046q71faCFoKHVBQ7rjrknlrgyXW40woftfVRX_D-CQ&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsqeyswCSY55kxnA1mlqk0KHml5-BscQaJGOr7Mr_Dug&s=10",
];
const TABS = [
  ["profile", "Profile", <FaUser />],
  ["favorites", "Favorites", "♥"],
  ["avatar", "Avatar", <FaImage />],
  ["security", "Security", <FaShieldAlt />],
];
function Alert({ ok, children }) {
  return children ? (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}
    >
      {children}
    </div>
  ) : null;
}
function Password({ label, value, onChange }) {
  const [v, setV] = useState(false);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className="input pr-12"
          type={v ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          onClick={() => setV(!v)}
        >
          {v ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}
export default function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null),
    [favorites, setFavorites] = useState([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [tab, setTab] = useState("profile"),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [form, setForm] = useState({ name: "", bio: "", avatar_url: "" }),
    [pw, setPw] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  useEffect(() => {
    let mounted = true;
    getProfile()
      .then((p) => {
        if (!mounted) return;
        const profileData = p.data.profile;
        setProfile(profileData);
        setForm({
          name: profileData?.name || "",
          bio: profileData?.bio || "",
          avatar_url: profileData?.avatar_url || "",
        });
      })
      .catch((e) => {
        if (mounted) setError(getErrorMessage(e));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    getFavorites()
      .then((f) => {
        if (mounted) setFavorites(f.data.quizzes || []);
      })
      .catch(() => {
        if (mounted) setFavorites([]);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const r = await updateProfile({ ...form, name: form.name.trim() });
      setProfile(r.data.profile);
      setForm((f) => ({
        ...f,
        name: r.data.profile.name || "",
        bio: r.data.profile.bio || "",
        avatar_url: r.data.profile.avatar_url || "",
      }));
      login(localStorage.getItem("token"), { ...user, ...r.data.profile });
      setMessage("Profile updated successfully.");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  const upload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setError("Please select an image.");
    if (file.size > 2 * 1024 * 1024)
      return setError("Please choose an image below 2 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, avatar_url: String(reader.result) }));
      setMessage("Photo selected. Click Save avatar to apply it.");
      setError("");
    };
    reader.readAsDataURL(file);
  };
  const changePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 8)
      return setError("New password must be at least 8 characters.");
    if (pw.newPassword !== pw.confirmPassword)
      return setError("Passwords do not match.");
    setSaving(true);
    setError("");
    try {
      const r = await changePassword(pw);
      setMessage(r.data.message || "Password updated.");
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <StudentLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <LoadingSpinner size="lg" />
        </div>
      </StudentLayout>
    );
  return (
    <StudentLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-brand-500 to-purple-600" />
          <div className="px-5 pb-5 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg">
                {form.avatar_url ? (
                  <img
                    src={form.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-3xl font-bold text-slate-500">
                    {profile?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold">
                  {profile?.name || "Student"}
                </h1>
                <p className="text-sm text-slate-500">{profile?.email || ""}</p>
              </div>
            </div>
            {profile?.bio && (
              <p className="mt-4 text-sm text-slate-600">{profile.bio}</p>
            )}
          </div>
          <div className="flex overflow-x-auto border-t border-slate-200 px-3 sm:px-6">
            {TABS.map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => {
                  setTab(id);
                  setMessage("");
                  setError("");
                }}
                className={`shrink-0 border-b-2 px-4 py-4 text-sm font-semibold ${tab === id ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500"}`}
              >
                {icon} <span className="ml-2">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <Alert ok={!!message}>{message || error}</Alert>
        {tab === "profile" && (
          <div className="card">
            <h2 className="text-lg font-semibold">Account details</h2>
            <form onSubmit={save} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Display name</label>
                  <input
                    className="input"
                    maxLength={100}
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input bg-slate-50"
                    value={profile?.email || ""}
                    disabled
                  />
                </div>
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea
                  className="input h-28"
                  maxLength={500}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                />
              </div>
              <button disabled={saving} className="btn-primary">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        )}
        {tab === "favorites" && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Favorite quizzes</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Your saved quizzes in one place.
                </p>
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                ♥ {favorites.length}
              </span>
            </div>
            {favorites.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No favorite quizzes yet.{" "}
                <Link
                  className="text-indigo-600 font-semibold"
                  to="/student/quizzes"
                >
                  Browse quizzes
                </Link>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {favorites.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <h3 className="font-semibold">{q.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {q.category_name || "General"} · {q.attempt_count || 0}{" "}
                      attempts
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/student/quizzes/${q.id}`}
                        className="btn-primary flex-1 text-center"
                      >
                        Open quiz
                      </Link>
                      <button
                        className="btn-secondary"
                        onClick={async () => {
                          await removeFavorite(q.id);
                          setFavorites((f) => f.filter((x) => x.id !== q.id));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "avatar" && (
          <div className="space-y-5">
            <div className="card">
              <h2 className="text-lg font-semibold">Choose an avatar</h2>
              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {AVATARS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avatar_url: url }))}
                    className={`rounded-2xl border-2 p-2 ${form.avatar_url === url ? "border-brand-500 ring-2 ring-brand-100" : "border-slate-200"}`}
                  >
                    <img
                      src={url}
                      alt="Avatar"
                      className="h-20 w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="card">
              <h2 className="text-lg font-semibold">Upload from device</h2>
              <p className="mt-1 text-sm text-slate-500">
                PNG/JPG/WebP up to 2 MB.
              </p>
              <input
                className="mt-4 w-full rounded-xl border p-3"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={upload}
              />
              <div className="mt-4 flex items-center gap-4">
                {form.avatar_url && (
                  <img
                    src={form.avatar_url}
                    alt="Preview"
                    className="h-16 w-16 rounded-xl object-cover border"
                  />
                )}
                <button
                  type="button"
                  onClick={() => save()}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? "Saving…" : "Save avatar"}
                </button>
              </div>
            </div>
          </div>
        )}
        {tab === "security" && (
          <div className="card">
            <h2 className="text-lg font-semibold">Change password</h2>
            <form onSubmit={changePw} className="mt-5 max-w-md space-y-4">
              <Password
                label="Current password"
                value={pw.currentPassword}
                onChange={(v) => setPw((p) => ({ ...p, currentPassword: v }))}
              />
              <Password
                label="New password"
                value={pw.newPassword}
                onChange={(v) => setPw((p) => ({ ...p, newPassword: v }))}
              />
              <Password
                label="Confirm password"
                value={pw.confirmPassword}
                onChange={(v) => setPw((p) => ({ ...p, confirmPassword: v }))}
              />
              <button disabled={saving} className="btn-primary w-full">
                {saving ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
