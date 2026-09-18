'use client';

import { useEffect, useState } from 'react';

/** The current time, refreshed each minute and on focus so "Closes in" and closed states stay true. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, intervalMs);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [intervalMs]);
  return now;
}
