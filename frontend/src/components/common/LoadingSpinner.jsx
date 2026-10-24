export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: { dot: 'h-1.5 w-1.5', gap: 'gap-1' },
    md: { dot: 'h-2.5 w-2.5', gap: 'gap-1.5' },
    lg: { dot: 'h-3 w-3', gap: 'gap-2' },
  };
  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div className={`flex items-end ${currentSize.gap}`} aria-hidden="true">
        <span className={`${currentSize.dot} animate-bounce rounded-full bg-indigo-500 [animation-delay:-.3s]`} />
        <span className={`${currentSize.dot} animate-bounce rounded-full bg-violet-500 [animation-delay:-.15s]`} />
        <span className={`${currentSize.dot} animate-bounce rounded-full bg-fuchsia-500`} />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
