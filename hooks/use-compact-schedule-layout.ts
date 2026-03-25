'use client';

import { useEffect, useState } from 'react';

export function useCompactScheduleLayout(breakpoint = 1550) {
  const [isCompactLayout, setIsCompactLayout] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const updateLayout = (event?: MediaQueryListEvent) => {
      setIsCompactLayout(event ? event.matches : mediaQuery.matches);
    };

    updateLayout();
    mediaQuery.addEventListener('change', updateLayout);
    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, [breakpoint]);

  return isCompactLayout;
}
