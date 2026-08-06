import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';

const navItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/quizzes', label: 'Quizzes' },
  { path: '/student/attempts', label: 'My Attempts' },
  { path: '/student/leaderboard', label: 'Leaderboard' },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
                aria-label="Open navigation menu"
              >
                <span className="sr-only">Open navigation menu</span>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="flex items-center gap-3">
                <img
              src="/logo1.png"
              alt="Quizora logo"
              className="w-10 h-10 rounded-2x1 object-cover"
              />
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">Quizora</p>
                  <p className="text-xs text-slate-500">Student Portal</p>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-2 shadow-sm">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium px-4 py-2 rounded-2xl transition ${location.pathname.startsWith(item.path) ? 'text-brand-700 border-b-2 border-brand-500 pb-1' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm text-slate-700"
                  aria-label="Open profile menu"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user?.name} className="h-full w-full object-cover rounded-2xl" />
                  ) : (
                    <span className="text-sm font-semibold">{user?.name?.charAt(0)}</span>
                  )}
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 z-20 mt-3 w-64 rounded-3xl border border-slate-200 bg-white shadow-xl p-4">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <div className="space-y-2">
                      <Link
                        to="/student/profile#profile-settings"
                        className="block rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Update profile
                      </Link>
                      <Link
                        to="/student/profile#security"
                        className="block rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Change password
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="md:hidden relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm text-slate-700"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user?.name} className="h-full w-full object-cover rounded-2xl" />
                  ) : (
                    <span className="text-sm font-semibold">{user?.name?.charAt(0)}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden animate-slide-down border-t border-slate-200 bg-white/95 shadow-sm">
            <div className="space-y-1 px-4 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${location.pathname.startsWith(item.path) ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <button onClick={handleLogout} className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
