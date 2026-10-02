'use client';

import { useEffect, useState } from 'react';

/** The marketing nav's height on desktop; on phones it wraps and is measured. */
const PUBLIC_NAV_HEIGHT = 73;

/**
 * How far a sticky tab bar must sit below the pinned public nav. Off (0) on dashboard
 * pages, which scroll inside their own container under the top bar.
 */
export function usePinnedNavHeight(enabled: boolean) {
  const [height, setHeight] = useState(PUBLIC_NAV_HEIGHT);
  useEffect(() => {
    if (!enabled) return;
    const nav = document.querySelector<HTMLElement>('nav.sticky');
    if (!nav || typeof ResizeObserver === 'undefined') return;
    const update = () => setHeight(Math.round(nav.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [enabled]);
  return enabled ? height : 0;
}
