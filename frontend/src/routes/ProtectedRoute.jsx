import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
