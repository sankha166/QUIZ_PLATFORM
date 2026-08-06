const intensityClasses = [
  'bg-slate-100 border-slate-200 text-slate-500',
  'bg-emerald-100 border-emerald-100 text-emerald-700',
  'bg-emerald-300 border-emerald-300 text-emerald-800',
  'bg-emerald-600 border-emerald-600 text-white',
];

export default function StreakTracker({ activity = [], range = '30d', selectedCategory = 'all', currentStreak = 0, maxStreak = 0, attemptCount = 0, activeDays = 0 }) {
  const display = activity.map((item, index) => {
    const count = item.count || 0;
    const intensity = Math.min(3, count === 0 ? 0 : count >= 4 ? 3 : count);
    const label = range === 'year' ? item.label : item.label;
    return {
      ...item,
      count,
      intensity,
      label,
      index,
      active: count > 0,
    };
  });

  const heading = range === 'year' ? 'Yearly activity' : range === 'month' ? 'Month activity' : '30-Day streak';

  return (
    <div className="card space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{heading}</h3>
          <p className="text-sm text-slate-500">Tracked by {selectedCategory === 'all' ? 'all categories' : selectedCategory}.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm text-slate-700">
          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current streak</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{currentStreak}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Max streak</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{maxStreak}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Active days</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{activeDays}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {display.map((day) => (
          <div
            key={`${day.label}-${day.index}`}
            className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-center text-[10px] font-semibold ${intensityClasses[day.intensity]}`}
            title={`${range === 'year' ? day.label : `Day ${day.label}`} — ${day.count} attempt${day.count === 1 ? '' : 's'}`}
          >
            <span className="text-[11px] leading-none">{range === 'year' ? day.label : day.label}</span>
            {day.active && <span className="mt-1 text-xs">{day.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
