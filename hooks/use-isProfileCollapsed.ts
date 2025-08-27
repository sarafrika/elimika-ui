'use client';
import { useEffect, useState } from 'react';

export function useIsProfileCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const check = () => setIsCollapsed(typeof window !== 'undefined' && window.innerWidth <= 739);
    check();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }
  }, []);

  return isCollapsed;
}
