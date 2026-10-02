'use client';

import { useEffect, useState } from 'react';

/** The public nav's height on desktop; on phones it wraps to two rows and is measured. */
const PUBLIC_NAV_HEIGHT = 73;

/**
 * Tracks the pinned public nav's height so a sticky bar (`SectionTabs`' `sticky.top`) sits
 * just under it. Public pages only: dashboards scroll an inner pane below their top bar, so
 * a dashboard bar pins at `0`.
 */
export function usePinnedNavHeight(fallback = PUBLIC_NAV_HEIGHT) {
  const [height, setHeight] = useState(fallback);
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('nav.sticky');
    if (!nav || typeof ResizeObserver === 'undefined') return;
    const update = () => setHeight(Math.round(nav.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);
  return height;
}
