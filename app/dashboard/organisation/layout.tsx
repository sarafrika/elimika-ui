import OrganisationProvider from '@/context/organisation-context';
import { getCourseCreatorDashboardData } from '@/services/course-creator/data';
import type { Organisation, UserOrganisationAffiliationDto } from '@/services/client';
import { getOrganisationByUuid, type ApiResponse } from '@/services/client';
import { auth } from '@/services/auth';
import { fetchCurrentUser } from '@/services/user/current-user';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';
import OrganisationLayoutClient from './layout-client';

async function fetchOrganisationForUser(): Promise<Organisation | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  const user = await fetchCurrentUser();

  const affiliation: UserOrganisationAffiliationDto | undefined =
    user?.organisation_affiliations?.find(org => org.active) ??
    user?.organisation_affiliations?.[0];
  const organisationUuid = affiliation?.organisation_uuid;
  if (!organisationUuid) return null;

  const orgResp = await getOrganisationByUuid({ path: { uuid: organisationUuid } });
  const orgData = orgResp.data as ApiResponse;
  return (orgData.data as Organisation) ?? null;
}

export default async function OrganisationLayout({ children }: { children: ReactNode }) {
  const access = await assertRoleAccess('organisation');
  if (access.redirectTo) redirect(access.redirectTo);

  const organisation = await fetchOrganisationForUser();
  const courseCreatorData = await getCourseCreatorDashboardData();

  return (
    <OrganisationProvider initialOrganisation={organisation}>
      <OrganisationLayoutClient initialData={courseCreatorData}>
        {children}
      </OrganisationLayoutClient>
    </OrganisationProvider>
  );
}
