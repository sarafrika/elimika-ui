import type { ReactNode } from 'react';

export function AddProfilePageShell({ children }: { children: ReactNode }) {
  return <div className='bg-background min-h-screen py-8'>{children}</div>;
}
