import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'M3 3h18v4H3V3zm0 14h18v4H3v-4zm0-7h18v4H3v-4z' },
  { path: '/admin/users', label: 'Users', icon: 'M17 20h5v-1a4 4 0 00-4-4h-1M9 20H4v-1a4 4 0 014-4h1m0-6a4 4 0 118 0 4 4 0 01-8 0zm-7 0a4 4 0 118 0 4 4 0 01-8 0z' },
  { path: '/admin/categories', label: 'Categories', icon: 'M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3z' },
  { path: '/admin/quizzes', label: 'Quizzes', icon: 'M12 4.5l2.05 4.155 4.594.667-3.323 3.237.784 4.575L12 15.771l-4.105 2.159.784-4.575L5.356 9.322l4.594-.667L12 4.5z' },
  { path: '/admin/attempts', label: 'Attempts', icon: 'M4 6h16M4 12h16M4 18h16' },
  { path: '/admin/analytics', label: 'Analytics', icon: 'M3 17h18M7 12l4 4 8-8' },
];

const iconPath = (d) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentItem = navItems.find((item) => location.pathname.startsWith(item.path));
  const breadcrumbs = location.pathname.replace('/admin', '').split('/').filter(Boolean).map((segment) => segment.replace(/-/g, ' '));

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-slate-950 text-slate-100 flex flex-col transition-all duration-300 shadow-xl`}>
        <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/logo1.png"
              alt="Quizora logo"
              className="w-10 h-10 rounded-2x1 object-cover"
              />
            {sidebarOpen && (
              <div>
                <p className="text-base font-semibold">Quizora</p>
                <p className="text-xs text-slate-400">Admin console</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-full border border-slate-800 p-2 text-slate-300 hover:bg-slate-800 transition-colors"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : ''}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-200 ${
                  active ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-slate-700' : 'bg-slate-900/70'} text-slate-200`}>{iconPath(item.icon)}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-sm text-slate-200 bg-slate-900/70 hover:bg-slate-900 transition-colors">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">⏻</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-slate-400">Admin</span>
                <span>•</span>
                <span className="font-medium text-slate-700">{currentItem?.label || 'Dashboard'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="text-slate-400">Home</span>
                {breadcrumbs.map((crumb, idx) => (
                  <span key={crumb} className="flex items-center gap-2">
                    <span>›</span>
                    <span>{crumb}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21l-4.35-4.35"/><path d="M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
                <input type="search" placeholder="Search quizzes, users..." className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400" />
              </div>
              <button className="btn-icon bg-slate-100 text-slate-600 hover:bg-slate-200">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              </button>
              <div className="relative inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-semibold">
                  {user?.name?.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
