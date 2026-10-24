export default function SkeletonCard({ variant = 'card', className = '' }) {
  if (variant === 'stat') {
    return (
      <div className={`card min-h-[112px] animate-pulse ${className}`} aria-hidden="true">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="h-7 w-16 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card animate-pulse ${className}`} aria-hidden="true">
      <div className="h-36 rounded-lg bg-slate-200" />
      <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
      <div className="mt-5 h-3 w-full rounded bg-slate-200" />
      <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
    </div>
  );
}
