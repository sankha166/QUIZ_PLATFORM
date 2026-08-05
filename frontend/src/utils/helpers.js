export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatTime = (seconds) => {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

export const formatPercent = (val) => {
  if (val == null) return '—';
  return `${parseFloat(val).toFixed(1)}%`;
};

export const difficultyColor = (d) => {
  if (d === 'easy') return 'text-green-600 bg-green-100';
  if (d === 'medium') return 'text-yellow-600 bg-yellow-100';
  if (d === 'hard') return 'text-red-600 bg-red-100';
  return 'text-gray-600 bg-gray-100';
};

export const statusColor = (s) => {
  if (s === 'passed') return 'text-green-700 bg-green-100';
  if (s === 'failed') return 'text-red-700 bg-red-100';
  if (s === 'published') return 'text-green-700 bg-green-100';
  if (s === 'draft') return 'text-gray-700 bg-gray-100';
  if (s === 'unpublished') return 'text-yellow-700 bg-yellow-100';
  return 'text-gray-700 bg-gray-100';
};

export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong';
