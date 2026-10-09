'use client';

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

const EMPTY: ReadonlySet<string> = new Set();

/** Ids of cards that have scrolled near the viewport; an id stays once seen. */
export function useSeenIds() {
  const [seenIds, setSeenIds] = useState<ReadonlySet<string>>(EMPTY);
  const markSeen = useCallback((id: string) => {
    setSeenIds(current => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);
  return { seenIds, markSeen };
}

type SeenOnScreenProps = {
  id: string;
  onSeen: (id: string) => void;
  className?: string;
  children: ReactNode;
};

/** Reports `id` once its box comes within 200px of the viewport, then stops watching. */
export function SeenOnScreen({ id, onSeen, className, children }: SeenOnScreenProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      onSeen(id);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        onSeen(id);
        observer.disconnect();
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [id, onSeen]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
