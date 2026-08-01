import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Centered, responsive page shell for organisation dashboard pages. Widens on
 * 2xl / ultrawide displays so content breathes on very high-resolution screens
 * without stretching edge-to-edge.
 */
export function OrgPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1600px] px-3 py-3 min-[2000px]:max-w-[2200px] sm:px-5 lg:px-6 2xl:max-w-[1840px]',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Vertical stack spacing used inside {@link OrgPage}. */
export const orgStack = 'flex w-full flex-col gap-4 sm:gap-5';
