import type { ReactNode } from 'react';
import { PublicTopNav } from '@/components/PublicTopNav';

export function PublicSiteShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav wide={wide} />
      {children}
    </div>
  );
}
