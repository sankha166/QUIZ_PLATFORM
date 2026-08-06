import { useMemo } from 'react';

const gradientMap = {
  green: ['#22c55e', '#16a34a'],
  yellow: ['#f59e0b', '#ea580c'],
  red: ['#ef4444', '#dc2626'],
};

export default function QuizTimer({ secondsLeft, maxSeconds = 300 }) {
  const progress = useMemo(() => {
    if (secondsLeft === null) return 0;
    return Math.max(0, Math.min(1, secondsLeft / maxSeconds));
  }, [secondsLeft, maxSeconds]);

  const gradient = useMemo(() => {
    if (secondsLeft === null) return gradientMap.green;
    if (secondsLeft <= 30) return gradientMap.red;
    if (secondsLeft <= 90) return gradientMap.yellow;
    return gradientMap.green;
  }, [secondsLeft]);

  const pulse = secondsLeft !== null && secondsLeft <= 30 ? 'animate-pulse-soft' : '';
  const circumference = Math.PI * 2 * 52;

  return (
    <div className={`relative w-40 h-40 mx-auto ${pulse}`}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="url(#timerGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm text-slate-500">Time left</span>
        <span className="text-2xl font-bold text-slate-900">{secondsLeft !== null ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}` : '--:--'}</span>
      </div>
    </div>
  );
}
