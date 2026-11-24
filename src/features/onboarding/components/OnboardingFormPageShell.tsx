import type { ReactNode } from 'react';

export function OnboardingFormPageShell({ children }: { children: ReactNode }) {
  return (
    <div className='bg-background relative min-h-screen'>
      <div className='relative mx-auto flex min-h-screen max-w-7xl items-start justify-center px-4 pt-12 pb-8 sm:pt-16'>
        {children}
      </div>
    </div>
  );
}
