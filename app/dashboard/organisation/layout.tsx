import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import OrganisationProvider from '@/context/organisation-context';
import { emptyCourseCreatorDashboardData } from '@/lib/types/course-creator';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';
import { ApplicationWaitingScreen } from '@/src/features/onboarding/components/ApplicationWaitingScreen';
import OrganisationLayoutClient from './layout-client';

export default async function OrganisationLayout({ children }: { children: ReactNode }) {
  const access = await assertRoleAccess('organisation');
  if (access.redirectTo) redirect(access.redirectTo);
  if (access.application) {
    return (
      <ApplicationWaitingScreen
        domain={access.application.domain}
        status={access.application.status}
        reason={access.application.reason}
      />
    );
  }

  return (
    <OrganisationProvider>
      <OrganisationLayoutClient initialData={emptyCourseCreatorDashboardData}>
        {children}
      </OrganisationLayoutClient>
    </OrganisationProvider>
  );
}
