import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { forgotPassword } from '../../api/auth.api';
import { getErrorMessage } from '../../utils/helpers';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setError('');
    try {
      await forgotPassword(data);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <p className="text-gray-700 mb-6">If that email exists, a reset link has been sent. Check your inbox.</p>
            <Link to="/login" className="btn-primary px-6">Back to Login</Link>
          </div>
        ) : (
          <>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
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
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-indigo-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
