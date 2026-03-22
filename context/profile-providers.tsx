'use client';

import type { ReactNode } from 'react';
import UserProfileProvider from './profile-context';
import { UserDomainProvider } from './user-domain-context';

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
