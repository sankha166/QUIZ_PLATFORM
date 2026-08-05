import { useForm } from 'react-hook-form';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { resetPassword } from '../../api/auth.api';
import { getErrorMessage } from '../../utils/helpers';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const password = watch('password');

  const onSubmit = async (data) => {
    setError('');
    try {
      await resetPassword({ token, password: data.password });
      navigate('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Invalid reset link.</p>
          <Link to="/forgot-password" className="btn-primary">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              className="input"
              type="password"
              placeholder="Min. 8 characters"
              {...register('password', { required: true, minLength: { value: 8, message: 'Minimum 8 characters' } })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input
              className="input"
              type="password"
              {...register('confirm', { validate: (v) => v === password || 'Passwords do not match' })}
            />
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
            {isSubmitting ? 'Saving…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
