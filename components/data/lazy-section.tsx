'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export type LazySectionProps = {
  /** Shown until the section nears the viewport; size it like the real content. */
  skeleton?: ReactNode;
  /** How far outside the viewport mounting starts (IntersectionObserver rootMargin). */
  rootMargin?: string;
  /** Reserves height for the default skeleton so the page does not jump. */
  minHeight?: number | string;
  className?: string;
  children: ReactNode;
};

/** Mounts children (and so their queries) only once the region is about to scroll into view. */
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
    <div ref={ref} className={className} aria-busy='true'>
      {skeleton ?? <Skeleton className='w-full rounded-xl' style={{ minHeight }} />}
    </div>
  );
}
