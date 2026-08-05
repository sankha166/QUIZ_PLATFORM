import { useState, useEffect, useRef } from 'react';

/**
 * Countdown timer from a server-provided expiry timestamp.
 * Persists expiryTime in sessionStorage for page-refresh recovery.
 * Calls onExpire when time reaches 0.
 */
export function useTimer(expiryTime, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!expiryTime) return;

    // Persist for refresh recovery
    sessionStorage.setItem('quizExpiryTime', expiryTime);

    const calculate = () => {
      const diff = Math.max(0, Math.floor((new Date(expiryTime) - Date.now()) / 1000));
      setSecondsLeft(diff);
      return diff;
    };

    const remaining = calculate();
    if (remaining <= 0) {
      onExpireRef.current?.();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculate();
      if (remaining <= 0) {
        clearInterval(interval);
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime]);

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : null;

  return { secondsLeft, minutes, seconds };
}
