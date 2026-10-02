import type { ReactNode } from 'react';

import { surfaceTheme } from '@/components/data-display';
import { cn } from '@/lib/utils';

/**
 * Page shell for organisation dashboard pages. Lists and overviews use the wide
 * container (up to 2400px) so high-resolution screens fill out; forms and chart
 * dashboards pass `width='standard'` to keep the narrower centred column.
 */
export function OrgPage({
  children,
  className,
  width = 'wide',
}: {
  children: ReactNode;
  className?: string;
  width?: 'wide' | 'standard';
}) {
  return (
    <div
      className={cn(
        width === 'wide'
          ? cn(surfaceTheme.pageWide, 'py-3')
          : 'mx-auto w-full max-w-[1600px] px-3 py-3 min-[2000px]:max-w-[2200px] sm:px-5 lg:px-6 2xl:max-w-[1840px]',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Vertical stack spacing used inside {@link OrgPage}. */
export const orgStack = 'flex w-full flex-col gap-4 sm:gap-5';
