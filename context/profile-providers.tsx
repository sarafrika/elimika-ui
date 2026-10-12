'use client';

import type { ReactNode } from 'react';
import StudentContextProvider from '@/context/student-context';
import type { UserProfileType } from '@/lib/types';
import type { Organisation } from '@/services/client';
import { UserDomainProvider } from '@/src/features/dashboard/context/user-domain-context';
import OrganisationProvider from '@/src/features/organisation/context/organisation-context';
import UserProfileProvider from '@/src/features/profile/context/profile-context';

export function ProfileProviders({ children }: { children: ReactNode }) {
  return <UserProfileProvider>{children}</UserProfileProvider>;
}

export function DashboardProviders({
  children,
  initialProfile,
  initialOrganisation,
  initialUpdatedAt,
}: {
  children: ReactNode;
  initialProfile?: UserProfileType | null;
  initialOrganisation?: Organisation | null;
  initialUpdatedAt?: number;
}) {
  return (
    <UserProfileProvider initialProfile={initialProfile} initialUpdatedAt={initialUpdatedAt}>
      <StudentContextProvider>
        <UserDomainProvider>
          <OrganisationProvider
            initialOrganisation={initialOrganisation}
            initialUpdatedAt={initialUpdatedAt}
          >
            {children}
          </OrganisationProvider>
        </UserDomainProvider>
      </StudentContextProvider>
    </UserProfileProvider>
  );
}
