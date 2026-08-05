import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import UserDetail from './pages/admin/UserDetail';
import CategoryManagement from './pages/admin/CategoryManagement';
import QuizManagement from './pages/admin/QuizManagement';
import QuizForm from './pages/admin/QuizForm';
import QuizDetail from './pages/admin/QuizDetail';
import AttemptsList from './pages/admin/AttemptsList';
import AttemptDetail from './pages/admin/AttemptDetail';
import Analytics from './pages/admin/Analytics';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import QuizListing from './pages/student/QuizListing';
import QuizDetails from './pages/student/QuizDetails';
import QuizAttempt from './pages/student/QuizAttempt';
import QuizResult from './pages/student/QuizResult';
import AttemptHistory from './pages/student/AttemptHistory';
import Leaderboard from './pages/student/Leaderboard';
import Profile from './pages/student/Profile';
import Home from './pages/Home';

function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />

      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/redirect" element={<RootRedirect />} />

      {/* Admin routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/users/:id" element={<UserDetail />} />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="/admin/quizzes" element={<QuizManagement />} />
        <Route path="/admin/quizzes/create" element={<QuizForm />} />
        <Route path="/admin/quizzes/:id" element={<QuizDetail />} />
        <Route path="/admin/quizzes/:id/edit" element={<QuizForm />} />
        <Route path="/admin/attempts" element={<AttemptsList />} />
        <Route path="/admin/attempts/:id" element={<AttemptDetail />} />
        <Route path="/admin/analytics" element={<Analytics />} />
      </Route>

      {/* Student routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/quizzes" element={<QuizListing />} />
        <Route path="/student/quizzes/:id" element={<QuizDetails />} />
        <Route path="/student/quiz/:id/attempt" element={<QuizAttempt />} />
        <Route path="/student/results/:attemptId" element={<QuizResult />} />
        <Route path="/student/attempts" element={<AttemptHistory />} />
        <Route path="/student/leaderboard" element={<Leaderboard />} />
        <Route path="/student/profile" element={<Profile />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
}
