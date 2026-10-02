'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { surfaceTheme } from '@/components/data-display';

/**
 * Shell for a role's `/profile` section. The profile landing page (hero, stat strip,
 * section tabs) uses the wide layout; the edit forms under it keep their 7xl column.
 */
export function ProfileSectionLayout({
  landingPath,
  children,
}: {
  landingPath: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isLanding = pathname?.replace(/\/$/, '') === landingPath;

  return (
    <div className='flex min-h-screen flex-col gap-4 pt-4 pb-14'>
      <div className='flex-1'>
        <div
          className={
            isLanding ? surfaceTheme.pageWide : 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
