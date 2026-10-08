import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import OrganisationProvider from '@/context/organisation-context';
import { emptyCourseCreatorDashboardData } from '@/lib/types/course-creator';
import {
  assertRoleAccess,
  resolveDashboardBootstrap,
} from '@/src/features/dashboard/server/entry-target';
import OrganisationLayoutClient from './layout-client';

export default async function OrganisationLayout({ children }: { children: ReactNode }) {
  const access = await assertRoleAccess('organisation');
  if (access.redirectTo) redirect(access.redirectTo);

  // Same cached call as the root dashboard layout, so no extra upstream round trip.
  const { organisation, fetchedAt } = await resolveDashboardBootstrap();

  return (
    <OrganisationProvider initialOrganisation={organisation} initialUpdatedAt={fetchedAt}>
      <OrganisationLayoutClient initialData={emptyCourseCreatorDashboardData}>
        {children}
      </OrganisationLayoutClient>
    </OrganisationProvider>
  );
}
