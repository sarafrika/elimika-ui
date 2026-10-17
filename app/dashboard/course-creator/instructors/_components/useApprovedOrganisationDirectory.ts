'use client';

import { useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import { toNumber } from '@/lib/metrics';
import { stripHtml } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { useMemo } from 'react';
import type { ApprovedPartnerSource } from './ApprovedPartnersTable';
import { useApprovedOrganisationClasses } from './useApprovedOrganisationClasses';
import { useCreatorOrganisations } from './useCreatorOrganisations';

export function useApprovedOrganisationDirectory(): ApprovedPartnerSource {
  const data = useCreatorOrganisations();
  const organisationIds = useMemo(() => data.groups.map(group => group.uuid), [data.groups]);
  const { organisationMap, isLoading: profilesLoading } = useOrganisationsByIds(organisationIds);
  const classData = useApprovedOrganisationClasses(organisationIds, data.courseIds);
  const rows = useMemo(
    () =>
      data.groups.map(group => {
        const profile = organisationMap[group.uuid];
        const courses = new Set(group.courseIds);
        const classes = classData.classes.filter(
          item =>
            item.organisation_uuid === group.uuid &&
            item.course_uuid &&
            courses.has(item.course_uuid)
        );
        const partial = classData.hasError || classData.hasNextPage;
        const counts = classes.map(item =>
          item.uuid ? classData.classMap[item.uuid]?.enrolled_count : undefined
        );
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
            creatorShare: data.courseMap[uuid]?.creator_share_percentage,
            trainerShare: data.courseMap[uuid]?.instructor_share_percentage,
          })),
          classCount: classData.hasError && classes.length === 0 ? null : classes.length,
          studentCount:
            partial || classData.countsError || counts.some(count => count == null)
              ? null
              : counts.reduce<number>((total, count) => total + toNumber(count), 0),
          countsLoading: data.isLoading || classData.isLoading,
          studentsLoading: classData.countsLoading,
          classesPartial: partial,
          href: `/dashboard/course-creator/organisations/${encodeURIComponent(group.uuid)}`,
        };
      }),
    [
      data.groups,
      data.courseMap,
      data.isLoading,
      organisationMap,
      classData.classes,
      classData.classMap,
      classData.hasError,
      classData.hasNextPage,
      classData.countsError,
      classData.isLoading,
      classData.countsLoading,
    ]
  );
  return {
    type: 'organisation',
    rows,
    isLoading: data.isLoading || profilesLoading,
    hasProfile: data.hasProfile,
    hasError: data.hasError || classData.hasError || classData.countsError,
    hasNextPage: Boolean(data.applicationsQuery.hasNextPage),
    isFetching: data.applicationsQuery.isFetching,
    isFetchingNextPage: data.applicationsQuery.isFetchingNextPage,
    refetch: () => Promise.all([data.refetch(), classData.refetch()]),
    loadMore: () => data.applicationsQuery.fetchNextPage(),
    hasMoreClasses: classData.hasNextPage,
    classesFetching: classData.isFetching,
    loadMoreClasses: classData.loadMore,
  };
}
