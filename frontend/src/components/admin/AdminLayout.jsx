import { useState } from 'react';
import { Bell, BarChart3, ChevronLeft, ChevronRight, FileQuestion, FolderKanban, LayoutDashboard, LogOut, Menu, Radio, Search, Users, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  ['/admin/dashboard', 'Dashboard', LayoutDashboard],
  ['/admin/users', 'Users', Users],
  ['/admin/categories', 'Categories', FolderKanban],
  ['/admin/quizzes', 'Quizzes', FileQuestion],
  ['/admin/live-quizzes', 'Live Quizzes', Radio],
  ['/admin/attempts', 'Attempts', BarChart3],
  ['/admin/analytics', 'Analytics', BarChart3],
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = navItems.find(([path]) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const logoutUser = () => { logout(); navigate('/login', { replace: true }); };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950">
      <aside
        aria-label="Admin navigation"
        className={`${sidebarOpen ? 'w-[240px]' : 'w-[72px]'} fixed inset-y-0 left-0 z-50 hidden flex-col overflow-hidden lg:flex`}
        style={{ backgroundColor: '#111827', color: '#f8fafc', boxShadow: '8px 0 28px rgba(15,23,42,.08)' }}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[.08] px-3.5">
          <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-3">
            <img src="/logo1.png" alt="Quizora" className="h-9 w-9 shrink-0 rounded-[10px] object-cover" />
            {sidebarOpen && <div className="min-w-0"><p className="truncate text-sm font-semibold tracking-[-.01em] text-slate-100">Quizora</p><p className="text-[10px] font-medium text-slate-500">Admin console</p></div>}
          </Link>
          <button type="button" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(v => !v)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[.07] hover:text-white">
            {sidebarOpen ? <ChevronLeft size={17} strokeWidth={1.8} /> : <ChevronRight size={17} strokeWidth={1.8} />}
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map(([path, label, Icon]) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                title={!sidebarOpen ? label : undefined}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-colors ${active ? 'bg-white/[.10] text-white' : 'text-slate-400 hover:bg-white/[.055] hover:text-slate-100'}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-white/[.09]' : ''}`}>
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                {sidebarOpen && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-white/[.08] p-3">
          <button type="button" onClick={logoutUser} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-medium text-slate-400 transition hover:bg-white/[.055] hover:text-white">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center"><LogOut size={17} strokeWidth={1.8} /></span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[240px]" style={{ paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (sidebarOpen ? 240 : 72) : 0 }}>
        <header className="glass-header sticky top-0 z-40">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-3 sm:h-[68px] sm:px-6 lg:px-7">
            <button type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileOpen(v => !v)} className="btn-icon lg:hidden">
              {mobileOpen ? <X size={18} strokeWidth={1.8} /> : <Menu size={18} strokeWidth={1.8} />}
            </button>
            <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Admin</p><h1 className="truncate text-[15px] font-semibold tracking-[-.01em] text-slate-800 sm:text-base">{current?.[1] || 'Dashboard'}</h1></div>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <label className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 lg:flex"><Search size={15} className="text-slate-400" strokeWidth={1.8} /><input type="search" placeholder="Search" className="w-40 bg-transparent text-[13px] outline-none placeholder:text-slate-400" /></label>
              <button type="button" aria-label="Notifications" className="btn-icon"><Bell size={17} strokeWidth={1.8} /></button>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 shadow-sm sm:px-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{user?.name?.charAt(0)?.toUpperCase()}</div><div className="hidden sm:block"><p className="max-w-36 truncate text-xs font-semibold text-slate-800">{user?.name}</p><p className="max-w-36 truncate text-[10px] text-slate-500">{user?.email}</p></div></div>
            </div>
          </div>

          {mobileOpen && (
            <>
              <button aria-label="Close navigation" onClick={closeMobile} className="fixed inset-0 top-16 z-40 bg-slate-950/30 lg:hidden" />
              <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col border-r border-slate-200 bg-white shadow-2xl lg:hidden dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                  <Link to="/admin/dashboard" onClick={closeMobile} className="flex items-center gap-3"><img src="/logo1.png" alt="Quizora" className="h-9 w-9 rounded-[10px] object-cover" /><div><p className="text-sm font-semibold text-slate-900 dark:text-white">Quizora</p><p className="text-[10px] text-slate-400">Admin console</p></div></Link>
                  <button type="button" aria-label="Close navigation" onClick={closeMobile} className="btn-icon"><X size={18} strokeWidth={1.8} /></button>
                </div>
                <nav className="min-h-0 flex-1 overflow-y-auto p-3">
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Navigation</p>
                  <div className="space-y-1">
                    {navItems.map(([path, label, Icon]) => {
                      const active = isActive(path);
                      return <Link key={path} to={path} onClick={closeMobile} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium ${active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}><Icon size={18} strokeWidth={1.8} /></span><span>{label}</span></Link>;
                    })}
                  </div>
                </nav>
                <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800"><button type="button" onClick={logoutUser} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10"><LogOut size={18} strokeWidth={1.8} /></span>Logout</button></div>
              </aside>
            </>
          )}
        </header>
        <main className="mx-auto w-full max-w-[1400px] p-3 sm:p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
