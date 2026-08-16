import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';
import PreferredDomainSelector from './PreferredDomainSelector';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/attempts', label: 'My Attempts' },
  { path: '/student/leaderboard', label: 'Leaderboard' },
];

const MenuIcon = ({ open }) => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">{open ? <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}</svg>;
const Chevron = () => <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const Moon = () => <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.2 15.1A8.4 8.4 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z"/></svg>;
const Sun = () => <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const profileRef = useRef(null);
  const quizRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (quizRef.current && !quizRef.current.contains(e.target)) setQuizOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  useEffect(() => { setMobileOpen(false); setProfileOpen(false); setQuizOpen(false); }, [location.pathname]);

  const isActive = (p) => location.pathname === p || location.pathname.startsWith(`${p}/`);
  const isQuiz = isActive('/student/quizzes') || isActive('/student/live-quizzes');
  const logoutUser = () => { setMobileOpen(false); logout(); navigate('/login'); };
  const navClass = (p) => `rounded-lg px-3 py-2 text-[13px] font-medium transition ${isActive(p) ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`;

  return <div className="min-h-screen bg-[#f7f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:h-[68px] sm:px-6 lg:px-8">
        <button type="button" aria-label="Toggle navigation" onClick={() => setMobileOpen(v => !v)} className="btn-icon lg:hidden"><MenuIcon open={mobileOpen}/></button>
        <Link to="/student/dashboard" className="flex min-w-0 items-center gap-2.5 sm:gap-3"><img src="/logo1.png" alt="Quizora" className="h-9 w-9 rounded-[10px] object-cover sm:h-10 sm:w-10"/><div className="hidden sm:block"><div className="text-[15px] font-semibold tracking-tight">Quizora</div><div className="text-[11px] text-slate-500 dark:text-slate-400">Student Portal</div></div></Link>
        <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
          <Link to="/student/dashboard" className={navClass('/student/dashboard')}>Dashboard</Link>
          <div ref={quizRef} className="relative"><button type="button" onClick={() => setQuizOpen(v => !v)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium ${isQuiz ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}>Quizzes <Chevron/></button>{quizOpen && <div className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"><Link to="/student/quizzes" className="block rounded-lg px-3 py-2.5 text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800">All Quizzes</Link><Link to="/student/live-quizzes" className="block rounded-lg px-3 py-2.5 text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800"><span className="mr-1.5 text-rose-500">●</span>Live Quizzes</Link></div>}</div>
          {navItems.slice(1).map(item => <Link key={item.path} to={item.path} className={navClass(item.path)}>{item.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5"><NotificationBell/><button type="button" aria-label="Toggle theme" onClick={toggleTheme} className="btn-icon border-transparent bg-transparent shadow-none">{theme === 'dark' ? <Sun/> : <Moon/>}</button><div ref={profileRef} className="relative"><button type="button" aria-label="Profile menu" onClick={() => setProfileOpen(v => !v)} className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">{user?.avatar_url ? <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover"/> : <span className="text-sm font-semibold">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</span>}</button>{profileOpen && <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"><div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800"><p className="truncate text-[13px] font-semibold">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div><Link to="/student/profile" className="mt-1 block rounded-lg px-3 py-2.5 text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800">My Profile</Link><button type="button" onClick={logoutUser} className="mt-1 w-full rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50">Logout</button></div>}</div></div>
      </div>
      {mobileOpen && <><button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 top-16 z-[55] bg-slate-950/30 lg:hidden"/><div className="absolute left-0 right-0 top-full z-[60] border-t border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950 lg:hidden"><nav className="mx-auto max-w-7xl px-3 py-3 sm:px-6"><p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">Navigation</p><div className="grid gap-1 sm:grid-cols-2"><Link to="/student/dashboard" className={navClass('/student/dashboard')}>Dashboard</Link><Link to="/student/quizzes" className={navClass('/student/quizzes')}>All Quizzes</Link><Link to="/student/live-quizzes" className={navClass('/student/live-quizzes')}><span className="mr-1.5 text-rose-500">●</span>Live Quizzes</Link><Link to="/student/attempts" className={navClass('/student/attempts')}>My Attempts</Link><Link to="/student/leaderboard" className={navClass('/student/leaderboard')}>Leaderboard</Link><Link to="/student/profile" className="rounded-lg px-3 py-2 text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800">My Profile</Link></div><div className="mt-3 flex items-center justify-between border-t border-slate-100 px-3 pt-3 dark:border-slate-800"><span className="text-xs font-semibold">{user?.name}</span><button type="button" onClick={logoutUser} className="text-xs font-semibold text-rose-600">Logout</button></div></nav></div></>}
    </header>
    <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">{location.pathname.startsWith('/student/profile') && <div className="mb-5"><PreferredDomainSelector/></div>}{children}</main>
  </div>;
}
