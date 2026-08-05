import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markRead(notif.id);
    if (notif.data?.attemptId) {
      navigate(`/student/results/${notif.data.attemptId}`);
      setOpen(false);
    } else if (notif.data?.quizId) {
      navigate(`/student/quizzes/${notif.data.quizId}`);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-indigo-50/40' : ''}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="text-slate-300 hover:text-red-400 text-lg leading-none flex-shrink-0 mt-0.5"
                  >×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
