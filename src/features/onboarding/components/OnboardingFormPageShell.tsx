import type { ReactNode } from 'react';

export function OnboardingFormPageShell({ children }: { children: ReactNode }) {
  return (
    <div className='bg-background relative min-h-screen'>
      <div className='relative mx-auto flex min-h-screen max-w-6xl items-start px-4 py-12'>
        {children}
      </div>
    </div>
  );
}
