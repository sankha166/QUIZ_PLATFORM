import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';
import PreferredDomainSelector from './PreferredDomainSelector';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/attempts', label: 'My Attempts' },
  { path: '/student/leaderboard', label: 'Leaderboard' },
];

const NavLink = ({ to, active, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`inline-flex w-full lg:w-auto items-center justify-start rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
      active
        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`}
  >
    {children}
  </Link>
);

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
    const close = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (quizRef.current && !quizRef.current.contains(event.target)) setQuizOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setQuizOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isQuiz = isActive('/student/quizzes') || isActive('/student/live-quizzes');
  const logoutUser = () => { setMobileOpen(false); logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="glass-header sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:h-[68px] sm:px-6 lg:px-8">
          <button type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileOpen(v => !v)} className="btn-icon lg:hidden">
            {mobileOpen ? <X size={18} strokeWidth={1.8} /> : <Menu size={18} strokeWidth={1.8} />}
          </button>
          <Link to="/student/dashboard" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <img src="/logo1.png" alt="Quizora" className="h-9 w-9 rounded-[10px] object-cover sm:h-10 sm:w-10" />
            <div className="hidden min-w-0 sm:block"><div className="truncate text-[15px] font-semibold tracking-[-0.015em]">Quizora</div><div className="text-[11px] font-medium text-slate-400">Student Portal</div></div>
          </Link>
          <nav className="ml-5 hidden flex-1 items-center gap-0.5 lg:flex">
            <NavLink to="/student/dashboard" active={isActive('/student/dashboard')}>Dashboard</NavLink>
            <div ref={quizRef} className="relative">
              <button type="button" onClick={() => setQuizOpen(v => !v)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${isQuiz ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
                Quizzes <ChevronDown size={14} strokeWidth={1.8} className={`transition-transform ${quizOpen ? 'rotate-180' : ''}`} />
              </button>
              {quizOpen && <div className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,.10)] dark:border-slate-700 dark:bg-slate-900"><NavLink to="/student/quizzes" active={isActive('/student/quizzes')}>All Quizzes</NavLink><NavLink to="/student/live-quizzes" active={isActive('/student/live-quizzes')}><span className="mr-2 h-1.5 w-1.5 rounded-full bg-rose-500" /> Live Quizzes</NavLink></div>}
            </div>
            {navItems.slice(1).map(item => <NavLink key={item.path} to={item.path} active={isActive(item.path)}>{item.label}</NavLink>)}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <NotificationBell />
            <button type="button" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme} className="btn-icon border-transparent bg-transparent shadow-none hover:bg-slate-100 dark:hover:bg-slate-800">{theme === 'dark' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}</button>
            <div ref={profileRef} className="relative">
              <button type="button" aria-label="Open profile menu" onClick={() => setProfileOpen(v => !v)} className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 sm:h-10 sm:w-10">{user?.avatar_url ? <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : <span className="text-sm font-semibold text-slate-600 dark:text-slate-200">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</span>}</button>
              {profileOpen && <div className="absolute right-0 top-full mt-2 w-[260px] rounded-xl border border-slate-200 bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,.10)] dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 dark:bg-slate-800"><div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">{user?.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : <UserRound className="m-auto mt-2 text-slate-500" size={18} />}</div><div className="min-w-0"><p className="truncate text-[13px] font-semibold">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div></div><Link to="/student/profile" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><UserRound size={16} strokeWidth={1.8} /> My Profile</Link><button type="button" onClick={logoutUser} className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><LogOut size={16} strokeWidth={1.8} /> Logout</button></div>}
            </div>
          </div>
        </div>
      </header>
      {mobileOpen && <div className="fixed inset-0 z-[60] lg:hidden"><button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/25 backdrop-blur-[1px]" /><aside className="absolute left-0 top-0 flex h-full w-[min(86vw,340px)] flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"><div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800"><Link to="/student/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5"><img src="/logo1.png" alt="Quizora" className="h-9 w-9 rounded-[10px]" /><span className="text-[15px] font-semibold">Quizora</span></Link><button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="btn-icon"><X size={18} strokeWidth={1.8} /></button></div><nav className="flex-1 space-y-1 overflow-y-auto p-3"><NavLink to="/student/dashboard" active={isActive('/student/dashboard')} onClick={() => setMobileOpen(false)}>Dashboard</NavLink><NavLink to="/student/quizzes" active={isActive('/student/quizzes')} onClick={() => setMobileOpen(false)}>All Quizzes</NavLink><NavLink to="/student/live-quizzes" active={isActive('/student/live-quizzes')} onClick={() => setMobileOpen(false)}><span className="mr-2 h-1.5 w-1.5 rounded-full bg-rose-500" /> Live Quizzes</NavLink><NavLink to="/student/attempts" active={isActive('/student/attempts')} onClick={() => setMobileOpen(false)}>My Attempts</NavLink><NavLink to="/student/leaderboard" active={isActive('/student/leaderboard')} onClick={() => setMobileOpen(false)}>Leaderboard</NavLink><NavLink to="/student/profile" active={isActive('/student/profile')} onClick={() => setMobileOpen(false)}>My Profile</NavLink></nav><div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800"><div className="mb-2 flex items-center gap-2 px-2 py-2"><Bell size={15} className="text-slate-400" /><span className="truncate text-xs font-medium text-slate-500">{user?.name}</span></div><button type="button" onClick={logoutUser} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-[13px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><LogOut size={16} /> Logout</button></div></aside></div>}
      <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">{location.pathname.startsWith('/student/profile') && <div className="mb-5"><PreferredDomainSelector /></div>}{children}</main>
    </div>
  );
}
