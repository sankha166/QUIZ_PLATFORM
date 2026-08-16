import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, ChevronLeft, ChevronRight, FileQuestion, FolderKanban, LayoutDashboard, LogOut, Menu, Radio, Search, Users, X } from 'lucide-react';
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
  const current = navItems.find(([path]) => location.pathname.startsWith(path));
  const logoutUser = () => { logout(); navigate('/login'); };

  const linkClass = (active, compact = false) => `flex items-center gap-3 rounded-lg ${compact ? 'px-3 py-2.5' : 'px-2.5 py-2.5'} text-[13px] font-medium transition-colors ${active ? 'bg-white/[.09] text-white' : 'text-slate-400 hover:bg-white/[.05] hover:text-slate-100'}`;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950">
      <aside className={`${sidebarOpen ? 'w-[240px]' : 'w-[72px]'} hidden shrink-0 flex-col bg-[#111827] text-slate-100 lg:flex`}>
        <div className="flex h-[68px] items-center justify-between border-b border-white/[.07] px-3.5">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src="/logo1.png" alt="Quizora" className="h-9 w-9 rounded-[10px] object-cover" />
            {sidebarOpen && <div className="min-w-0"><p className="truncate text-sm font-semibold tracking-[-.01em]">Quizora</p><p className="text-[10px] font-medium text-slate-500">Admin console</p></div>}
          </Link>
          <button type="button" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(v => !v)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[.06] hover:text-white">
            {sidebarOpen ? <ChevronLeft size={17} strokeWidth={1.8} /> : <ChevronRight size={17} strokeWidth={1.8} />}
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-4">
          {navItems.map(([path, label, Icon]) => {
            const active = location.pathname.startsWith(path);
            return <Link key={path} to={path} title={!sidebarOpen ? label : undefined} className={linkClass(active)}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-white/[.08]' : ''}`}><Icon size={17} strokeWidth={1.8} /></span>
              {sidebarOpen && <span>{label}</span>}
            </Link>;
          })}
        </nav>
        <div className="border-t border-white/[.07] p-3">
          <button type="button" onClick={logoutUser} className={linkClass(false)}><span className="flex h-8 w-8 shrink-0 items-center justify-center"><LogOut size={17} strokeWidth={1.8} /></span>{sidebarOpen && <span>Logout</span>}</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="glass-header sticky top-0 z-40">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-3 sm:h-[68px] sm:px-6 lg:px-7">
            <button type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileOpen(v => !v)} className="btn-icon lg:hidden">
              {mobileOpen ? <X size={18} strokeWidth={1.8} /> : <Menu size={18} strokeWidth={1.8} />}
            </button>
            <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Admin</p><h1 className="truncate text-[15px] font-semibold tracking-[-.01em] text-slate-800 sm:text-base">{current?.[1] || 'Dashboard'}</h1></div>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <label className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 lg:flex"><Search size={15} className="text-slate-400" strokeWidth={1.8} /><input type="search" placeholder="Search" className="w-40 bg-transparent text-[13px] outline-none placeholder:text-slate-400" /></label>
              <button type="button" aria-label="Notifications" className="btn-icon"><span className="text-[15px]">◌</span></button>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 shadow-sm sm:px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{user?.name?.charAt(0)?.toUpperCase()}</div>
                <div className="hidden sm:block"><p className="max-w-36 truncate text-xs font-semibold text-slate-800">{user?.name}</p><p className="max-w-36 truncate text-[10px] text-slate-500">{user?.email}</p></div>
              </div>
            </div>
          </div>
          {mobileOpen && <>
            <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 top-16 z-40 bg-slate-950/25 lg:hidden" />
            <div className="absolute left-0 right-0 top-full z-50 border-t border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,.10)] dark:border-slate-800 dark:bg-slate-900 lg:hidden">
              <nav className="space-y-0.5 p-3">{navItems.map(([path, label, Icon]) => <Link key={path} to={path} onClick={() => setMobileOpen(false)} className={linkClass(location.pathname.startsWith(path), true).replace('text-slate-400', 'text-slate-600').replace('hover:text-slate-100', 'hover:text-slate-900')}><Icon size={17} strokeWidth={1.8} />{label}</Link>)}<button type="button" onClick={logoutUser} className="mt-2 flex w-full items-center gap-3 border-t border-slate-100 px-3 py-3 text-left text-[13px] font-medium text-rose-600"><LogOut size={17} /> Logout</button></nav>
            </div>
          </>}
        </header>
        <main className="mx-auto w-full max-w-[1400px] p-3 sm:p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
