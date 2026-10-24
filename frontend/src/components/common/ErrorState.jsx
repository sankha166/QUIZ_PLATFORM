export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center" role="alert">
      <p className="font-medium text-rose-800">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4 border-rose-200 text-rose-700 hover:bg-white">
          Try again
        </button>
      )}
    </div>
  );
}
