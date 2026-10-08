'use client';

import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';
import { flushRum, markShellPainted, notifyRouteChange, reportWebVital } from '@/lib/perf/rum';

// Module-level so useReportWebVitals subscribes once instead of on every re-render.
const onWebVital = (metric: { name: string; value: number }) =>
  reportWebVital(metric.name, metric.value);

/** Mounted once at the root: forwards web-vitals and times client-side route changes. */
export function RumReporter() {
  const pathname = usePathname();

  useReportWebVitals(onWebVital);

  useEffect(() => {
    if (pathname) notifyRouteChange();
  }, [pathname]);

  useEffect(() => flushRum, []);

  return null;
}

/** Rendered inside the dashboard shell; marks the first time the shell is on screen. */
export function RumShellMark() {
  useEffect(() => {
    markShellPainted();
  }, []);
  return null;
}
