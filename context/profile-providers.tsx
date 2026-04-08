'use client';

import type { ReactNode } from 'react';
import { UserDomainProvider } from '@/src/features/dashboard/context/user-domain-context';
import UserProfileProvider from '@/src/features/profile/context/profile-context';

export function ProfileProviders({ children }: { children: ReactNode }) {
  return <UserProfileProvider>{children}</UserProfileProvider>;
}

export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <UserProfileProvider>
      <UserDomainProvider>{children}</UserDomainProvider>
    </UserProfileProvider>
  );
}
