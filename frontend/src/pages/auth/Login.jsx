import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { login as loginApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/helpers';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setError('');
    try {
      const res = await loginApi(data);
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
