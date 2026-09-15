'use client';

import { useEffect, useState } from 'react';
import { parseApiDate } from '@/lib/date';
import type { ScheduledInstance } from '@/services/client/types.gen';

export function getWorkbookSessionAvailability(session?: ScheduledInstance, now = Date.now()) {
  const start = parseApiDate(session?.start_time)?.valueOf();
  const end = parseApiDate(session?.end_time)?.valueOf();
  const started = Boolean(session?.started_at || session?.status === 'ONGOING');
  const closed = Boolean(
    session?.concluded_at ||
      (session?.status && ['COMPLETED', 'CANCELLED', 'BLOCKED'].includes(session.status))
  );
  const canAdmit = Boolean(
    session?.uuid &&
      start !== undefined &&
      end !== undefined &&
      end > start &&
      now >= start - 15 * 60_000 &&
      now < end &&
      !closed
  );

  return { canAdmit, canStart: canAdmit && !started, started };
}

export function useWorkbookSessionAvailability(session?: ScheduledInstance) {
  const [now, setNow] = useState(Date.now);
  const start = parseApiDate(session?.start_time)?.valueOf();
  const end = parseApiDate(session?.end_time)?.valueOf();

  useEffect(() => {
    if (start === undefined || end === undefined) return;
    const refresh = () => setNow(Date.now());
    const current = Date.now();
    const nextBoundary = [start - 15 * 60_000, end].find(time => time > current);
    // Refresh at the boundary, and after a background tab regains focus.
    const timer = window.setTimeout(
      refresh,
      Math.min(60_000, Math.max(0, (nextBoundary ?? current + 60_000) - current))
    );
    window.addEventListener('focus', refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [start, end, now]);

  return getWorkbookSessionAvailability(session, Math.max(now, Date.now()));
}
