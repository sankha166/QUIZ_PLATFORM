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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex">
      {/* Left Panel — Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'var(--brand-gradient)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent)]" />

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold">Q</div>
            <span className="font-extrabold text-white text-xl">Quizora</span>
          </Link>

          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Welcome back to your learning journey
          </h2>
          <p className="text-lg text-white/70 leading-relaxed max-w-md">
            Access your quizzes, track your progress, and climb the leaderboard. Your knowledge adventure continues here.
          </p>

          {/* Floating cards */}
          <div className="mt-12 space-y-4">
            <div className="rounded-3xl bg-white/10 border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">📝</div>
                <div>
                  <p className="text-sm font-semibold text-white">Quiz Progress</p>
                  <p className="text-xs text-white/70">JavaScript Fundamentals</p>
                </div>
              </div>
              <div className="rounded-full bg-white/15 h-2 overflow-hidden">
                <div className="h-2 rounded-full bg-emerald-400" style={{ width: '72%' }} />
              </div>
              <div className="mt-4 text-sm text-white/70 flex items-center justify-between">
                <span>15 questions</span>
                <span className="font-semibold">72% complete</span>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">🏆</div>
                <div>
                  <p className="text-sm font-semibold text-white">Leaderboard</p>
                  <p className="text-xs text-white/70">Stay competitive every week</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-white/80">
                <div className="flex items-center justify-between rounded-3xl bg-white/10 p-3">
                  <span>Alex M.</span>
                  <span className="font-semibold text-white">98%</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-white/10 p-3">
                  <span>Sarah K.</span>
                  <span className="font-semibold text-white">95%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Link to="/" className="flex items-center gap-2">
              <img
              src="/logo1.png"
              alt="Quizora logo"
              className="w-10 h-10 rounded-2x1 object-cover"
              />
              <span className="font-extrabold text-slate-900 text-lg">Quizora</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sign in</h1>
            <p className="text-slate-500 mt-2">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6 animate-shake">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                </div>
                <input
                  className="input pl-12"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                </div>
                <input
                  className="input pl-12 pr-12"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
