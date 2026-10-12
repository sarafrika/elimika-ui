import type { ReactNode } from 'react';
import { PublicTopNav } from '@/components/PublicTopNav';

// Onboarding is a focused task: app styles, the top nav, and no marketing footer.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav wide />
      <main>{children}</main>
    </div>
  );
}
