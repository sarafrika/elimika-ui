'use client';

import { useQuery } from '@tanstack/react-query';
import { GettingStarted, type GettingStartedStep } from '@/components/dashboard';
import { AsyncSection } from '@/components/data/async-section';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { toNumber } from '@/lib/metrics';
import {
  getClassDefinitionsForOrganisationOptions,
  getOrganisationStatisticsOptions,
} from '@/services/client/@tanstack/react-query.gen';

/**
 * Onboarding checklist whose completion is derived from real org state
 * (verification, instructors, venues, classes, students). Read-only — steps are
 * not manually toggleable because they reflect backend truth.
 */
export function OverviewGettingStarted() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);

  // Same key as the KPI row, so the counts come from one shared statistics call.
  const statsQuery = useQuery({
    ...getOrganisationStatisticsOptions({ path: { uuid: organisationUuid } }),
    enabled,
  });
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled,
  });

  const stats = statsQuery.data?.data;
  const instructorCount = toNumber(stats?.total_instructors);
  const studentCount = toNumber(stats?.total_students);
  const branchCount = toNumber(stats?.total_branches);
  const classCount = (classesQuery.data?.data ?? []).length;

  const steps: GettingStartedStep[] = [
    {
      key: 'account',
      label: 'Create organisation account',
      href: '/dashboard/organisation/account',
      done: enabled,
    },
    {
      key: 'verify',
      label: 'Get verified',
      href: '/dashboard/organisation/account',
      done: organisation?.admin_verified === true,
    },
    {
      key: 'venues',
      label: 'Add training venues',
      href: '/dashboard/organisation/branches',
      done: branchCount > 0,
    },
    {
      key: 'instructors',
      label: 'Onboard instructors',
      href: '/dashboard/organisation/instructors',
      done: instructorCount > 0,
    },
    {
      key: 'classes',
      label: 'Create classes',
      href: '/dashboard/organisation/classes',
      done: classCount > 0,
    },
    {
      key: 'students',
      label: 'Invite students',
      href: '/dashboard/organisation/students',
      done: studentCount > 0,
    },
  ];

  const queries = [statsQuery, classesQuery];

  // Steps are derived from counts, so wait for them instead of flashing every step undone.
  return (
    <AsyncSection
      name='org-overview-getting-started'
      loading={queries.some(query => query.isLoading)}
      skeleton={<Skeleton className='h-72 w-full rounded-lg' />}
    >
      <GettingStarted steps={steps} />
    </AsyncSection>
  );
}
