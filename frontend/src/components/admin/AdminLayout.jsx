import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { path: '/admin/quizzes', label: 'Quizzes', icon: '📝' },
  { path: '/admin/attempts', label: 'Attempts', icon: '📋' },
  { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-indigo-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="flex items-center justify-between p-4 border-b border-indigo-800">
          {sidebarOpen && <span className="font-bold text-lg">QuizPlatform</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-indigo-300 hover:text-white p-1">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                location.pathname.startsWith(item.path)
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          {sidebarOpen && (
            <div className="text-xs text-indigo-300 mb-2">
              <p className="font-medium text-white">{user?.name}</p>
              <p>{user?.email}</p>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm w-full">
            <span>🚪</span>{sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-gray-800">
            {navItems.find((n) => location.pathname.startsWith(n.path))?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Admin Panel</span>
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
