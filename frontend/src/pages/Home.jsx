import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200">
              <span>🎯</span>
              <span>QuizPlatform — Professional assessment for tomorrow's teams</span>
            </div>
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-white">
              Serious quiz performance, built for structured learning.
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300 text-lg">
              Measure progress, surface insights, and empower students with result-driven quiz workflows,
              notifications, profile management, and ranked leaderboards.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link to="/student/dashboard" className="btn-primary">
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-primary">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-secondary">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="space-y-4">
              <div className="text-slate-300 text-sm uppercase tracking-[0.24em]">Insights you need</div>
              <div className="text-2xl font-semibold">Fully managed quiz lifecycle</div>
              <p className="text-slate-400">From quiz creation and timed attempts to score review and category leaderboards, everything is built to work for real classroom and enterprise workflows.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                  <p className="text-sm text-slate-400">Result accuracy</p>
                  <p className="mt-2 text-xl font-semibold text-white">Detailed score breakdown</p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                  <p className="text-sm text-slate-400">Student engagement</p>
                  <p className="mt-2 text-xl font-semibold text-white">Notifications and progress alerts</p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                  <p className="text-sm text-slate-400">Account control</p>
                  <p className="mt-2 text-xl font-semibold text-white">Profile with avatar and preferences</p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                  <p className="text-sm text-slate-400">Ranked visibility</p>
                  <p className="mt-2 text-xl font-semibold text-white">Overall and category leaderboards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-900/10">
            <h2 className="text-3xl font-semibold text-white">Built for serious evaluation</h2>
            <p className="mt-4 text-slate-300">The new QuizPlatform experience makes student assessment reliable, secure, and clear. No clutter, no gimmicks — just precise quiz tracking and insights.</p>
            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl bg-slate-950/90 p-5 border border-slate-800">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Quiz flow</p>
                <p className="mt-2 text-white">Timed attempts, answer tracking, and automated result analysis on submit.</p>
              </div>
              <div className="rounded-2xl bg-slate-950/90 p-5 border border-slate-800">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Visibility</p>
                <p className="mt-2 text-white">Notification bell, result summaries, and clear performance dashboards.</p>
              </div>
              <div className="rounded-2xl bg-slate-950/90 p-5 border border-slate-800">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Rank progress</p>
                <p className="mt-2 text-white">See where you rank overall and by category to keep improvement measurable.</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8">
              <div className="text-sm uppercase tracking-[0.3em] text-indigo-300">A polished student journey</div>
              <h3 className="mt-4 text-2xl font-semibold text-white">From landing page to exam review</h3>
              <ul className="mt-6 space-y-4 text-slate-300">
                <li>• Student landing page with modern homepage and clear CTAs</li>
                <li>• Profile management including avatar and details</li>
                <li>• Notification bell with read/unread support</li>
                <li>• Result detail page with score, status, and review</li>
                <li>• Category-based leaderboard ranking</li>
              </ul>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl bg-white/5 p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white">Quick start</h4>
                <p className="mt-2 text-slate-400">Use the navigation links to explore quizzes, view your attempts, and update your profile.</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white">Trusted by students</h4>
                <p className="mt-2 text-slate-400">Professional interface designed for serious study and assessment across categories.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
