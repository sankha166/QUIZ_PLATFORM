import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';
import PreferredDomainSelector from './PreferredDomainSelector';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const close = (event) => { if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => { setMobileOpen(false); setProfileOpen(false); logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isProfile = location.pathname.startsWith('/student/profile');

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center gap-2 sm:gap-4">
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen}>
              {mobileOpen ? <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg> : <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
            <Link to="/student/dashboard" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <img src="/logo1.png" alt="Quizora" className="h-9 w-9 rounded-xl object-cover sm:h-10 sm:w-10" />
              <div className="hidden min-w-0 sm:block"><p className="truncate text-sm font-semibold text-slate-900">Quizora</p><p className="hidden text-xs text-slate-500 sm:block">Student Portal</p></div>
            </Link>
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex lg:gap-2">
              {navItems.map((item) => <Link key={item.path} to={item.path} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition lg:px-4 ${isActive(item.path) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>{item.label}</Link>)}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell />
              <div className="relative" ref={profileRef}>
                <button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm sm:h-11 sm:w-11" aria-label="Open profile menu" aria-expanded={profileOpen}>
                  {user?.avatar_url ? <img src={user.avatar_url} alt={user?.name || 'Profile'} className="h-full w-full object-cover" /> : <span className="text-sm font-semibold">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</span>}
                </button>
                {profileOpen && <div className="absolute right-0 top-full mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"><div className="border-b border-slate-100 px-3 pb-3"><p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div><Link to="/student/profile#profile-settings" className="mt-2 block rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Update profile</Link><button type="button" onClick={handleLogout} className="mt-1 w-full rounded-xl bg-slate-900 px-3 py-2.5 text-left text-sm font-semibold text-white hover:bg-slate-800">Logout</button></div>}
              </div>
            </div>
          </div>
        </div>
        {mobileOpen && <div className="border-t border-slate-200 bg-white md:hidden"><div className="mx-auto max-w-7xl space-y-1 px-3 py-3 sm:px-6">{navItems.map((item) => <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={`block rounded-xl px-4 py-3 text-sm font-semibold ${isActive(item.path) ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>{item.label}</Link>)}<Link to="/student/profile" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">My Profile</Link><div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div><button type="button" onClick={handleLogout} className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Logout</button></div></div></div>}
      </nav>
      <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        {isProfile && <div className="mb-5"><PreferredDomainSelector /></div>}
        {children}
      </main>
    </div>
  );
}
