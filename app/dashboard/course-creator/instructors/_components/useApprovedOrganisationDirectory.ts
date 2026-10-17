'use client';

import { useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import { stripHtml } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { useMemo } from 'react';
import type { ApprovedPartnerSource } from './ApprovedPartnersTable';
import { useCreatorOrganisations } from './useCreatorOrganisations';

export function useApprovedOrganisationDirectory(): ApprovedPartnerSource {
  const data = useCreatorOrganisations();
  const organisationIds = useMemo(() => data.groups.map(group => group.uuid), [data.groups]);
  const { organisationMap, isLoading: profilesLoading } = useOrganisationsByIds(organisationIds);
  const rows = useMemo(
    () =>
      data.groups.map(group => {
        const profile = organisationMap[group.uuid];
        return {
          uuid: group.uuid,
          type: 'organisation' as const,
          name: profile?.name || 'Organisation details unavailable',
          subtitle: [profile?.location, profile?.country].filter(Boolean).join(', ') || null,
          searchText: stripHtml(profile?.description),
          offerings: group.courseIds.map(uuid => ({
            uuid,
            kind: 'course' as const,
            name: data.courseMap[uuid]?.name || null,
          })),
          href: `/dashboard/course-creator/organisations/${encodeURIComponent(group.uuid)}`,
        };
      }),
    [data.groups, data.courseMap, organisationMap]
  );
  return {
    type: 'organisation',
    rows,
    isLoading: data.isLoading || profilesLoading,
    hasProfile: data.hasProfile,
    hasError: data.hasError,
    hasNextPage: Boolean(data.applicationsQuery.hasNextPage),
    isFetching: data.applicationsQuery.isFetching,
    isFetchingNextPage: data.applicationsQuery.isFetchingNextPage,
    refetch: data.refetch,
    loadMore: () => data.applicationsQuery.fetchNextPage(),
  };
}
