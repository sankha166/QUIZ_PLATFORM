export default function LoadingScreen({ message = 'Preparing your quiz experience...' }) {
  return (
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-white via-indigo-50/70 to-violet-100/80 px-6 text-center"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />
      <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
      <div className="relative flex max-w-sm flex-col items-center">
        <div className="rounded-[2rem] bg-white/90 p-3 shadow-[0_20px_60px_rgba(79,70,229,.16)] ring-1 ring-white">
          <img src="/logo1.png" alt="Quizora" className="h-20 w-20 rounded-[1.5rem] object-cover sm:h-24 sm:w-24" />
        </div>
        <h1 className="mt-6 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          Quizora
        </h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-7 flex items-center gap-2" role="status" aria-label="Loading">
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-.3s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-.15s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-fuchsia-500" />
          <span className="sr-only">Loading</span>
        </div>
      </div>
    </main>
  );
}
