'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

export type LazySectionProps = {
  /** Static space shown until the section nears the viewport; never a skeleton. */
  skeleton?: ReactNode;
  /** How far outside the viewport mounting starts (IntersectionObserver rootMargin). */
  rootMargin?: string;
  /** Reserves height for the default placeholder so the page does not jump. */
  minHeight?: number | string;
  className?: string;
  children: ReactNode;
};

/** Mounts children (and so their queries) only once the region nears the viewport.
 * The placeholder is deferred space, not a loading state: static and never aria-busy. */
export function LazySection({
  skeleton,
  rootMargin = '300px 0px',
  minHeight = 240,
  className,
  children,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  if (visible) return <>{children}</>;

  return (
    <div ref={ref} className={className} data-lazy-pending=''>
      {skeleton ?? <div aria-hidden className='bg-muted/40 w-full rounded-xl' style={{ minHeight }} />}
    </div>
  );
}
