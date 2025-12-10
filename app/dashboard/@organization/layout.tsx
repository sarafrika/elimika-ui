import OrganisationProvider from '@/context/organisation-context';
import type { Organisation } from '@/services/client';
import { getOrganisationByUuid, search, type ApiResponse, type SearchResponse } from '@/services/client';
import { auth } from '@/services/auth';
import type { ReactNode } from 'react';

async function fetchOrganisationForUser(): Promise<Organisation | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  const userResp = await search({
    query: {
      searchParams: { email_eq: email },
      pageable: { page: 0, size: 1, sort: [] },
    },
  });

  const userData = userResp.data as SearchResponse;
  const user = userData?.data?.content?.[0] as any;
  const affiliation = user?.organisation_affiliations?.find((org: any) => org.active) ?? user?.organisation_affiliations?.[0];
  const organisationUuid = affiliation?.organisationUuid ?? affiliation?.organisation_uuid;
  if (!organisationUuid) return null;

  const orgResp = await getOrganisationByUuid({ path: { uuid: organisationUuid } });
  const orgData = orgResp.data as ApiResponse;
  return (orgData.data as Organisation) ?? null;
}

export default async function OrganisationLayout({ children }: { children: ReactNode }) {
  const organisation = await fetchOrganisationForUser();

  return <OrganisationProvider initialOrganisation={organisation}>{children}</OrganisationProvider>;
}
