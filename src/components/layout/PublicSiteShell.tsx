import type { ReactNode } from 'react';
import { PublicTopNav } from '@/components/PublicTopNav';

export function PublicSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      {children}
    </div>
  );
}
