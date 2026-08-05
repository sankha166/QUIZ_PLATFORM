import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markRead, markAllRead, deleteNotification } from '../api/notification.api';
import { useAuth } from '../hooks/useAuth';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (_) {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      intervalRef.current = setInterval(fetchNotifications, 30000); // poll every 30s
    }
    return () => clearInterval(intervalRef.current);
  }, [isAuthenticated, fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, fetchNotifications,
      markRead: handleMarkRead, markAllRead: handleMarkAllRead, deleteNotification: handleDelete,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
