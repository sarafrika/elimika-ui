import { useEffect, useState } from 'react';

export function useCountdown(expiry?: string | Date | null) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiry) return;

    // Convert expiry to timestamp (ms)
    const targetTime = new Date(expiry).getTime();

    const tick = () => {
      const now = Date.now(); // current time in ms
      const diff = Math.floor((targetTime - now) / 1000); // seconds left
      setSecondsLeft(diff > 0 ? diff : 0);
    };

    tick(); // run immediately
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [expiry]);

  if (secondsLeft === null) return null;

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  return { expired: secondsLeft <= 0, hours, minutes, seconds };
}
