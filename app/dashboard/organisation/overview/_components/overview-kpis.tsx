'use client';

import { useQuery } from '@tanstack/react-query';
import { Building, GraduationCap, Presentation, Users } from 'lucide-react';

import { KpiCard, KpiCardSkeleton, type KpiCardVariant } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
  getUsersByOrganisationOptions,
} from '@/services/client/@tanstack/react-query.gen';

/**
 * Real-data KPI row for the organisation control centre. Container component:
 * fetches org-scoped counts and hands them to the presentational {@link KpiCard}.
 */
export function OverviewKpis() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);

  const membersQuery = useQuery({
    ...getUsersByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled,
  });

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled,
  });

  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'instructor' },
    }),
    enabled,
  });

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled,
  });

  const studentsPage = extractPage(studentsQuery.data);
  const instructorsPage = extractPage(instructorsQuery.data);

  const tiles: Array<{
    label: string;
    value: number;
    hint: string;
    icon: typeof Users;
    variant: KpiCardVariant;
    href: string;
    loading: boolean;
  }> = [
    {
      label: 'Total Members',
      value: getTotalFromMetadata(extractPage(membersQuery.data).metadata),
      hint: 'Everyone in your organisation',
      icon: Users,
      variant: 'primary',
      href: '/dashboard/organisation/students',
      loading: membersQuery.isLoading,
    },
    {
      label: 'Students',
      value: getTotalFromMetadata(studentsPage.metadata) || studentsPage.items.length,
      hint: 'Enrolled learners',
      icon: GraduationCap,
      variant: 'green',
      href: '/dashboard/organisation/students',
      loading: studentsQuery.isLoading,
    },
    {
      label: 'Instructors',
      value: getTotalFromMetadata(instructorsPage.metadata) || instructorsPage.items.length,
      hint: 'Teaching staff',
      icon: Presentation,
      variant: 'indigo',
      href: '/dashboard/organisation/instructors',
      loading: instructorsQuery.isLoading,
    },
    {
      label: 'Venues',
      value: getTotalFromMetadata(extractPage(branchesQuery.data).metadata),
      hint: 'Training branches & facilities',
      icon: Building,
      variant: 'coral',
      href: '/dashboard/organisation/settings?tab=branches',
      loading: branchesQuery.isLoading,
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-5'>
      {tiles.map(tile =>
        tile.loading ? (
          <KpiCardSkeleton key={tile.label} />
        ) : (
          <KpiCard
            key={tile.label}
            title={tile.label}
            value={tile.value.toLocaleString()}
            hint={tile.hint}
            icon={<tile.icon className='h-5 w-5' />}
            variant={tile.variant}
            href={tile.href}
          />
        )
      )}
    </div>
  );
}
