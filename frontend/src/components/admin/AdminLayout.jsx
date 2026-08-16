import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  ['/admin/dashboard','Dashboard','M3 3h18v4H3V3zm0 14h18v4H3v-4zm0-7h18v4H3v-4z'],
  ['/admin/users','Users','M17 20h5v-1a4 4 0 00-4-4h-1M9 20H4v-1a4 4 0 014-4h1m0-6a4 4 0 118 0 4 4 0 01-8 0zm-7 0a4 4 0 118 0 4 4 0 01-8 0z'],
  ['/admin/categories','Categories','M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3z'],
  ['/admin/quizzes','Quizzes','M12 4.5l2.05 4.155 4.594.667-3.323 3.237.784 4.575L12 15.771l-4.105 2.159.784-4.575L5.356 9.322l4.594-.667L12 4.5z'],
  ['/admin/live-quizzes','Live Quizzes','M12 3a9 9 0 100 18 9 9 0 000-18zm0 3v6l4 2'],
  ['/admin/attempts','Attempts','M4 6h16M4 12h16M4 18h16'],
  ['/admin/analytics','Analytics','M3 17h18M7 12l4 4 8-8'],
];
const Icon = ({ d }) => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const Menu = ({ open }) => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">{open ? <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}</svg>;

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = navItems.find(([path]) => location.pathname.startsWith(path));
  const logoutUser = () => { logout(); navigate('/login'); };

  return <div className="flex min-h-screen bg-[#f7f8fc] text-slate-900">
    <aside className={`${sidebarOpen ? 'w-[248px]' : 'w-[76px]'} hidden shrink-0 flex-col bg-slate-950 text-slate-100 shadow-xl transition-all duration-200 lg:flex`}>
      <div className="flex h-[68px] items-center justify-between border-b border-slate-800 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-3"><img src="/logo1.png" alt="Quizora" className="h-9 w-9 rounded-[10px] object-cover"/>{sidebarOpen && <div><p className="text-sm font-semibold">Quizora</p><p className="text-[10px] text-slate-400">Admin console</p></div>}</Link>
        <button type="button" onClick={() => setSidebarOpen(v => !v)} className="btn-icon border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800">{sidebarOpen ? '‹' : '›'}</button>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">{navItems.map(([path,label,d]) => { const active = location.pathname.startsWith(path); return <Link key={path} to={path} title={!sidebarOpen ? label : undefined} className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] transition ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-white/10' : 'bg-slate-900'}`}><Icon d={d}/></span>{sidebarOpen && <span className="font-medium">{label}</span>}</Link>; })}</nav>
      <div className="border-t border-slate-800 p-3"><button type="button" onClick={logoutUser} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] text-slate-300 hover:bg-slate-900 hover:text-white"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">↪</span>{sidebarOpen && <span className="font-medium">Logout</span>}</button></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="glass-header sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-3 sm:h-[68px] sm:px-6">
          <button type="button" aria-label="Toggle navigation" onClick={() => setMobileOpen(v => !v)} className="btn-icon lg:hidden"><Menu open={mobileOpen}/></button>
          <div className="min-w-0"><p className="text-[11px] font-medium text-slate-400">Admin</p><h1 className="truncate text-sm font-semibold text-slate-800 sm:text-base">{current?.[1] || 'Dashboard'}</h1></div>
          <div className="ml-auto flex items-center gap-2"><div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex"><span className="text-slate-400">⌕</span><input type="search" placeholder="Search..." className="w-44 bg-transparent text-sm outline-none"/></div><button type="button" className="btn-icon">♢</button><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 shadow-sm sm:px-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{user?.name?.charAt(0)?.toUpperCase()}</div><div className="hidden sm:block"><p className="max-w-36 truncate text-xs font-semibold">{user?.name}</p><p className="max-w-36 truncate text-[10px] text-slate-500">{user?.email}</p></div></div></div>
        </div>
        {mobileOpen && <><button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 top-16 z-40 bg-slate-950/30 lg:hidden"/><div className="absolute left-0 right-0 top-full z-50 border-t border-slate-200 bg-white shadow-lg lg:hidden"><nav className="space-y-1 p-3">{navItems.map(([path,label,d]) => <Link key={path} to={path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-medium ${location.pathname.startsWith(path) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon d={d}/>{label}</Link>)}<button type="button" onClick={logoutUser} className="mt-2 w-full rounded-lg border-t border-slate-100 px-3 py-3 text-left text-[13px] font-semibold text-rose-600">Logout</button></nav></div></>}
      </header>
      <main className="mx-auto w-full max-w-[1400px] p-3 sm:p-5 lg:p-7">{children}</main>
    </div>
  </div>;
}
