import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { register as registerApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/helpers';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const password = watch('password');

  const onSubmit = async (data) => {
    setError('');
    try {
      const res = await registerApi({ name: data.name, email: data.email, password: data.password });
      login(res.data.token, res.data.user);
      navigate('/student/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the quiz platform</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              placeholder="John Doe"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
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
              placeholder="Min. 8 characters"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input
              className="input"
              type="password"
              placeholder="Repeat password"
              {...register('confirm', {
                required: 'Please confirm your password',
                validate: (v) => v === password || 'Passwords do not match',
              })}
            />
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
