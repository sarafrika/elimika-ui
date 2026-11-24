import type { ReactNode } from 'react';

export function AddProfilePageShell({ children }: { children: ReactNode }) {
  return (
    <div className='bg-background flex min-h-screen items-start justify-center px-4 pt-12 pb-8 sm:pt-16'>
      {children}
    </div>
  );
}
