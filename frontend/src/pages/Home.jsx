import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getQuizzes } from '../api/quiz.api';

const icons = {
  quiz: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 3.75h10A2.25 2.25 0 0 1 19.25 6v12A2.25 2.25 0 0 1 17 20.25H7A2.25 2.25 0 0 1 4.75 18V6A2.25 2.25 0 0 1 7 3.75Z"/><path strokeLinecap="round" d="M8.5 8h7M8.5 12h7M8.5 16h4"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19.25V5.75M4 19.25h16"/><path strokeLinecap="round" strokeLinejoin="round" d="m7 15 3-4 3 2 5-6"/></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8v5a4 4 0 0 1-8 0V4Zm4 9v4m-4 3h8M5 5H3.75v2A4 4 0 0 0 8 11M19 5h1.25v2A4 4 0 0 1 16 11"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4"><circle cx="12" cy="12" r="8.75"/><path strokeLinecap="round" d="M12 7v5l3 2"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h13m-5-5 5 5-5 5"/></svg>,
};

function QuizCard({ quiz, onOpen }) {
  const difficulty = String(quiz.difficulty || '').toLowerCase();
  return (
    <button type="button" onClick={() => onOpen(quiz)} className="group flex w-[290px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,.04)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_28px_rgba(15,23,42,.08)] sm:w-[320px]">
      <div className="h-1 bg-indigo-500" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{quiz.category_name || 'General'}</span>
          {difficulty && <span className="text-xs capitalize text-slate-400">{difficulty}</span>}
        </div>
        <h3 className="mt-4 line-clamp-2 text-lg text-slate-900">{quiz.title}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-slate-500">{quiz.description || 'Test your knowledge with this quiz.'}</p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
          <span>{quiz.question_count || 0} questions</span>
          <span className="inline-flex items-center gap-1 text-slate-600">Open quiz {icons.arrow}</span>
        </div>
      </div>
    </button>
  );
}

function Feature({ icon, title, text }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">{icon}</div><h3 className="mt-5 text-base text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>;
}

export default function Home() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const carouselRef = useRef(null);

  useEffect(() => {
    getQuizzes({ status: 'published', limit: 12 }).then((r) => setQuizzes(r.data.quizzes || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const dashboard = isAdmin ? '/admin/dashboard' : '/student/dashboard';
  const openQuiz = (quiz) => {
    if (!isAuthenticated) {
      setNotice('Please sign in or create an account before opening a quiz.');
      return;
    }
    navigate(`/student/quizzes/${quiz.id}`);
  };

  const scrollQuizzes = (direction) => {
    carouselRef.current?.scrollBy({ left: direction * 340, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {notice && <div className="fixed inset-x-3 top-20 z-[70] mx-auto max-w-lg rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg">{notice} <span className="ml-2"><Link className="text-indigo-600" to="/login">Sign in</Link> or <Link className="text-indigo-600" to="/register">create account</Link>.</span></div>}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[68px] sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5"><img src="/logo1.png" alt="Quizora" className="h-9 w-9 rounded-xl object-cover"/><span className="text-[17px] text-slate-900">Quizora</span></Link>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#quizzes" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">Quizzes</a>
            <a href="#features" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">How it works</a>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? <Link to={dashboard} className="btn-primary">Dashboard</Link> : <><Link to="/login" className="btn-secondary">Sign in</Link><Link to="/register" className="btn-primary">Create account</Link></>}
          </div>
          <button type="button" onClick={() => setMobileOpen(v => !v)} className="btn-icon md:hidden" aria-label="Toggle navigation">{mobileOpen ? '×' : '☰'}</button>
        </div>
        {mobileOpen && <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden"><div className="flex flex-col gap-1"><a onClick={() => setMobileOpen(false)} href="#quizzes" className="rounded-lg px-3 py-3 text-sm text-slate-700">Quizzes</a><a onClick={() => setMobileOpen(false)} href="#features" className="rounded-lg px-3 py-3 text-sm text-slate-700">Features</a><a onClick={() => setMobileOpen(false)} href="#how-it-works" className="rounded-lg px-3 py-3 text-sm text-slate-700">How it works</a><div className="mt-2 border-t border-slate-100 pt-3">{isAuthenticated ? <Link onClick={() => setMobileOpen(false)} to={dashboard} className="btn-primary w-full">Dashboard</Link> : <div className="grid grid-cols-2 gap-2"><Link onClick={() => setMobileOpen(false)} to="/login" className="btn-secondary">Sign in</Link><Link onClick={() => setMobileOpen(false)} to="/register" className="btn-primary">Create account</Link></div>}</div></div></div>}
      </header>

      <main>
        <section className="border-b border-slate-100 bg-slate-50/70">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <p className="eyebrow text-indigo-600">Assessment, practice and progress</p>
              <h1 className="mt-4 max-w-3xl text-4xl tracking-[-.035em] text-slate-950 sm:text-5xl lg:text-6xl">A cleaner way to practice, compete and improve.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Quizora brings quizzes, timed assessments, live competitions and performance insights into one focused learning platform.</p>
              <div className="mt-8 flex flex-wrap gap-3">{isAuthenticated ? <Link to={dashboard} className="btn-primary px-5">Open dashboard {icons.arrow}</Link> : <><Link to="/register" className="btn-primary px-5">Get started {icons.arrow}</Link><Link to="#quizzes" className="btn-secondary px-5">Explore quizzes</Link></>}</div>
              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500"><span>Clear scoring</span><span>Live competitions</span><span>Progress tracking</span></div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.08)] sm:p-7">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5"><div><p className="text-xs text-slate-400">Performance overview</p><p className="mt-1 text-lg text-slate-900">Your learning snapshot</p></div><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">This month</span></div>
                <div className="grid grid-cols-3 gap-3 py-6"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Attempts</p><p className="mt-2 text-xl text-slate-900">24</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Accuracy</p><p className="mt-2 text-xl text-slate-900">86%</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Rank</p><p className="mt-2 text-xl text-slate-900">#18</p></div></div>
                <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-600">Weekly progress</span><span className="text-sm text-slate-900">72%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[72%] rounded-full bg-indigo-500"/></div><p className="mt-3 text-xs text-slate-400">Consistent practice builds stronger results.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="quizzes" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Explore</p><h2 className="mt-2 text-2xl text-slate-950 sm:text-3xl">Recently added quizzes</h2><p className="mt-2 text-sm text-slate-500">Open any quiz to see its details and start when you are ready.</p></div>{quizzes.length > 1 && <div className="flex gap-2"><button onClick={() => scrollQuizzes(-1)} className="btn-icon" aria-label="Previous quizzes">←</button><button onClick={() => scrollQuizzes(1)} className="btn-icon" aria-label="Next quizzes">→</button></div>}</div>
            {quizzes.length ? <div ref={carouselRef} className="mt-8 flex gap-4 overflow-x-auto pb-4 hide-scrollbar">{quizzes.map(q => <QuizCard key={q.id} quiz={q} onOpen={openQuiz}/>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">No published quizzes are available yet.</div>}
          </div>
        </section>

        <section id="features" className="border-y border-slate-100 bg-slate-50/60 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="eyebrow">Built for focused learning</p><h2 className="mt-2 text-2xl text-slate-950 sm:text-3xl">Everything important, without the clutter.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-3"><Feature icon={icons.quiz} title="Timed assessments" text="Practice under realistic time limits and review exactly where you can improve."/><Feature icon={icons.trophy} title="Leaderboards" text="Compare performance with peers through clean global and category rankings."/><Feature icon={icons.chart} title="Useful analytics" text="Understand attempts, accuracy and progress with focused performance insights."/></div></div>
        </section>

        <section id="how-it-works" className="py-16 sm:py-20"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><div className="text-center"><p className="eyebrow">Simple workflow</p><h2 className="mt-2 text-2xl text-slate-950 sm:text-3xl">Start in three steps.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{[['01','Create your account','Choose your profile domain and get your personal quiz space.'],['02','Practice or compete','Take regular quizzes or join a scheduled live competition.'],['03','Review and improve','Use results, ratings and analytics to guide your next attempt.']].map(([n,t,d]) => <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6"><span className="text-xs text-indigo-600">{n}</span><h3 className="mt-4 text-lg text-slate-900">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{d}</p></div>)}</div></div></section>

        <section className="pb-16 sm:pb-20"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><div className="rounded-3xl border border-slate-200 bg-slate-950 px-6 py-12 text-center sm:px-10"><p className="eyebrow text-slate-400">Ready when you are</p><h2 className="mt-3 text-3xl text-white sm:text-4xl">Make your next attempt count.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">Create an account, find a quiz and build a measurable practice routine.</p><div className="mt-7">{isAuthenticated ? <Link to={dashboard} className="btn bg-white text-slate-900 hover:bg-slate-100">Open dashboard {icons.arrow}</Link> : <Link to="/register" className="btn bg-white text-slate-900 hover:bg-slate-100">Create account {icons.arrow}</Link>}</div></div></div></section>
      </main>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div className="flex items-center gap-2"><img src="/logo1.png" alt="Quizora" className="h-7 w-7 rounded-lg"/><span>Quizora</span></div><p>Professional quiz and assessment platform.</p><div className="flex gap-5"><Link to="/login" className="hover:text-slate-900">Sign in</Link><Link to="/register" className="hover:text-slate-900">Create account</Link></div></div></footer>
    </div>
  );
}
