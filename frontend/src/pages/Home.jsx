import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getQuizzes } from '../api/quiz.api';

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const duration = 2000;
          const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Quiz Carousel Card ─── */
function QuizCard({ quiz }) {
  const diffColors = {
    easy: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex-shrink-0 w-72 sm:w-80 bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      <div className="h-2 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          {quiz.category_name && (
            <span className="badge-brand text-[11px]">{quiz.category_name}</span>
          )}
          {quiz.difficulty && (
            <span className={`badge text-[11px] ${diffColors[quiz.difficulty] || 'bg-slate-100 text-slate-600'}`}>
              {quiz.difficulty}
            </span>
          )}
        </div>
        <h3 className="font-bold text-slate-900 text-lg leading-snug mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
          {quiz.title}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-2 mb-4">
          {quiz.description || 'Test your knowledge with this quiz.'}
        </p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {quiz.question_count || 0} questions
          </span>
          {quiz.time_limit && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {quiz.time_limit} min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, desc, delay = 0 }) {
  return (
    <div className="card-hover p-8 text-center group animate-slide-up opacity-0" style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}>
      <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:scale-110 group-hover:bg-brand-100 transition-all duration-300">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Step Card ─── */
function StepCard({ number, title, desc }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-glow">
        {number}
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm">{desc}</p>
    </div>
  );
}

/* ─── Icons (inline SVGs) ─── */
const Icons = {
  timer: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  trophy: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0019.875 10.875h.375a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-.375A3.375 3.375 0 0016.5 9.75v9zM7.5 14.25v4.5m0-4.5A3.375 3.375 0 014.125 10.875H3.75a1.5 1.5 0 01-1.5-1.5v-1.5a1.5 1.5 0 011.5-1.5h.375A3.375 3.375 0 017.5 9.75v4.5z" /></svg>,
  chart: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  shield: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  users: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  bolt: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
};

/* ═══════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════ */
export default function Home() {
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const carouselRef = useRef(null);
  const profileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    getQuizzes({ status: 'published', limit: 12 })
      .then((r) => setQuizzes(r.data.quizzes || r.data || []))
      .catch(() => {});
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (!quizzes.length || !carouselRef.current) return;
    const el = carouselRef.current;
    const interval = setInterval(() => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [quizzes]);

  const dashboardLink = isAdmin ? '/admin/dashboard' : '/student/dashboard';

  const navItems = isAuthenticated
    ? isAdmin
      ? [
          { label: 'Dashboard', to: dashboardLink },
          { label: 'Quizzes', to: '/admin/quizzes' },
          { label: 'Users', to: '/admin/users' },
          { label: 'Analytics', to: '/admin/analytics' },
        ]
      : [
          { label: 'Dashboard', to: dashboardLink },
          { label: 'Quizzes', to: '/student/quizzes' },
          { label: 'My Attempts', to: '/student/attempts' },
          { label: 'Leaderboard', to: '/student/leaderboard' },
        ]
    : [
          { label: 'Features', href: '#features' },
          { label: 'How It Works', href: '#how-it-works' },
          { label: 'Quizzes', href: '#quizzes' },
      ];

  return (
    <div className="min-h-screen bg-white">

      {/* ═══ NAVBAR ═══ */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img
              src="/logo1.png"
              alt="Quizora logo"
              className="w-10 h-10 rounded-2x1 object-cover"
              />
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">Quizora</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-4">
              {navItems.map((item) =>
                item.to ? (
                  <Link key={item.label} to={item.to} className="nav-link">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="nav-link">
                    {item.label}
                  </a>
                )
              )}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-300"
                    aria-label="Open profile menu"
                  >
                    <span className="text-sm font-semibold">{user?.name?.charAt(0) || 'U'}</span>
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 rounded-3xl border border-slate-200 bg-white shadow-xl p-4">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      <div className="space-y-2">
                        <Link
                          to={dashboardLink}
                          className="block rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        {!isAdmin && (
                          <>
                            <Link
                              to="/student/profile#profile-settings"
                              className="block rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => setProfileMenuOpen(false)}
                            >
                              Update profile
                            </Link>
                            <Link
                              to="/student/profile#security"
                              className="block rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => setProfileMenuOpen(false)}
                            >
                              Change password
                            </Link>
                          </>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin/dashboard"
                            className="block rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            Admin dashboard
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost">Sign in</Link>
                  <Link to="/register" className="btn-primary">Get Started</Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden btn-icon text-slate-600">
              {mobileMenu ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              )}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenu && (
            <div className="md:hidden pb-4 border-t border-slate-100 animate-slide-down">
              <div className="flex flex-col gap-1 pt-3">
                {navItems.map((item) =>
                  item.to ? (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setMobileMenu(false)}
                      className="nav-link"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenu(false)}
                      className="nav-link"
                    >
                      {item.label}
                    </a>
                  )
                )}
                <div className="border-t border-slate-100 mt-2 pt-3 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <>
                      <Link to={dashboardLink} className="btn-primary w-full">Dashboard</Link>
                      <Link to="/student/profile" className="btn-secondary w-full">Profile settings</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="btn-secondary w-full">Sign in</Link>
                      <Link to="/register" className="btn-primary w-full">Get Started</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-brand-100/40 via-purple-100/30 to-pink-100/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-brand-200/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-60 left-10 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-brand-50 rounded-full px-4 py-1.5 text-sm font-semibold text-brand-700 mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-soft" />
                Professional Assessment Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900 text-balance">
                Master Your Knowledge with{' '}
                <span className="gradient-text">Smart Quizzes</span>
              </h1>
              <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl">
                Create, manage, and take quizzes with real-time scoring, detailed analytics, category leaderboards, and progress tracking — all in one platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link to={dashboardLink} className="btn-primary text-base px-8 py-3">
                    Go to Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary text-base px-8 py-3">
                      Start Free →
                    </Link>
                    <Link to="/login" className="btn-secondary text-base px-8 py-3">
                      Sign in
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-8 grid gap-4 text-sm text-slate-500 sm:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Real-time scoring</p>
                  <p className="mt-2">Instant feedback after each quiz attempt.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Category leaderboards</p>
                  <p className="mt-2">Track rankings across topics and peers.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Track progress</p>
                  <p className="mt-2">See your growth over time with analytics.</p>
                </div>
              </div>
            </div>

            {/* Hero Visual — quiz overview cards */}
            <div className="hidden lg:block">
              <div className="grid gap-5">
                <div className="rounded-[32px] bg-white border border-slate-200 p-7 shadow-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Weekly challenge</p>
                      <h3 className="mt-3 text-2xl font-semibold text-slate-900">JavaScript Fundamentals</h3>
                    </div>
                    <div className="rounded-3xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">20 min</div>
                  </div>
                  <div className="mt-6 rounded-full bg-slate-100 h-3 overflow-hidden">
                    <div className="h-3 rounded-full bg-brand-500 w-3/4" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span>15 questions</span>
                    <span>72% complete</span>
                  </div>
                </div>
                <div className="rounded-[32px] bg-slate-950 text-white p-7 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">🏆</div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Leaderboard</p>
                      <p className="mt-2 text-2xl font-semibold">Top students</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-3xl bg-white/10 p-3">
                      <span>Alex M.</span>
                      <span className="font-semibold">98%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-3xl bg-white/10 p-3">
                      <span>Sarah K.</span>
                      <span className="font-semibold">95%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="bg-slate-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 5000, suffix: '+', label: 'Active Students' },
              { value: 200, suffix: '+', label: 'Quizzes Created' },
              { value: 15000, suffix: '+', label: 'Attempts Taken' },
              { value: 98, suffix: '%', label: 'Satisfaction Rate' },
            ].map((s, i) => (
              <div key={i} className="animate-slide-up opacity-0" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'forwards' }}>
                <p className="text-3xl sm:text-4xl font-extrabold text-white">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm text-slate-400 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ QUIZ CAROUSEL ═══ */}
      {quizzes.length > 0 && (
        <section id="quizzes" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="section-title">Recently Added Quizzes</h2>
              <p className="section-subtitle mx-auto mt-3">Browse the latest quizzes and test your knowledge across different categories.</p>
            </div>
            <div ref={carouselRef} className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar scroll-smooth">
              {quizzes.map((q) => (
                <QuizCard key={q.id} quiz={q} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to={isAuthenticated ? '/student/quizzes' : '/register'} className="btn-secondary">
                Browse All Quizzes →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle mx-auto mt-3">A complete assessment platform with powerful features for students and administrators.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={Icons.timer} title="Timed Assessments" desc="Take quizzes with configurable time limits. The timer keeps you focused and simulates real exam conditions." delay={0} />
            <FeatureCard icon={Icons.trophy} title="Leaderboards" desc="Compete with peers on overall and category-specific leaderboards. Track your ranking progress over time." delay={100} />
            <FeatureCard icon={Icons.chart} title="Detailed Analytics" desc="Get comprehensive score breakdowns, performance trends, and insights into your strengths and weaknesses." delay={200} />
            <FeatureCard icon={Icons.shield} title="Secure & Reliable" desc="Industry-grade security with encrypted data, rate limiting, and robust authentication to keep your data safe." delay={300} />
            <FeatureCard icon={Icons.users} title="Multi-Role Support" desc="Separate dashboards for students and administrators with role-based access control and permissions." delay={400} />
            <FeatureCard icon={Icons.bolt} title="Instant Results" desc="Get your scores immediately after submission with detailed answer review and explanations." delay={500} />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle mx-auto mt-3">Get started in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            <StepCard number="1" title="Create Account" desc="Sign up in seconds with your email. No credit card required." />
            <StepCard number="2" title="Take Quizzes" desc="Browse quizzes by category, start a timed attempt, and answer questions." />
            <StepCard number="3" title="Track Results" desc="View detailed scores, climb the leaderboard, and track your progress." />
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center" style={{ background: 'var(--brand-gradient)' }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 relative">
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto relative">
              Join thousands of students who are already improving their skills with Quizora.
            </p>
            <div className="flex flex-wrap justify-center gap-3 relative">
              {isAuthenticated ? (
                <Link to={dashboardLink} className="btn bg-white text-brand-700 hover:bg-slate-50 shadow-lg px-8 py-3 text-base font-bold">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn bg-white text-brand-700 hover:bg-slate-50 shadow-lg px-8 py-3 text-base font-bold">
                    Get Started Free →
                  </Link>
                  <Link to="/login" className="btn border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3 text-base font-bold">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-slate-800">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
              src="/logo1.png"
              alt="Quizora logo"
              className="w-10 h-10 rounded-2x1 object-cover"
              />
                <span className="font-extrabold text-white text-lg">Quizora</span>
              </div>
              <p className="text-sm leading-relaxed">
                Professional online assessment and quiz management platform for students and educators.
              </p>
            </div>
            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#quizzes" className="hover:text-white transition-colors">Browse Quizzes</a></li>
                <li><Link to="/student/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>support@quizplatform.com</li>
                <li>Built with ❤️ for education</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Quizora. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
