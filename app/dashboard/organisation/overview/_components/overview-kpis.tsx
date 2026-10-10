'use client';

import { useQuery } from '@tanstack/react-query';
import { Building, GraduationCap, MapPin, Presentation, Users } from 'lucide-react';

import { KpiCard, KpiCardSkeleton, type KpiCardVariant } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { toNumber } from '@/lib/metrics';
import {
  getOrganisationStatisticsOptions,
  listResourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';

/**
 * Real-data KPI row for the organisation control centre. Container component:
 * fetches org-scoped counts and hands them to the presentational {@link KpiCard}.
 */
export function OverviewKpis() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);

  // One statistics call carries all four people/branch counts.
  const statsQuery = useQuery({
    ...getOrganisationStatisticsOptions({ path: { uuid: organisationUuid } }),
    enabled,
  });

  const venuesQuery = useQuery({
    ...listResourcesOptions({
      path: { organisationUuid },
      query: { resource_type: 'VENUE', pageable: { page: 0, size: 1 } },
    }),
    enabled,
  });

  const stats = statsQuery.data?.data;
  const statsLoading = statsQuery.isLoading;
  const statsFailed = statsQuery.isError;

  const tiles: Array<{
    label: string;
    value: number;
    hint: string;
    icon: typeof Users;
    variant: KpiCardVariant;
    href: string;
    loading: boolean;
    failed: boolean;
  }> = [
    {
      label: 'Total Members',
      value: toNumber(stats?.total_members),
      hint: 'Everyone in your organisation',
      icon: Users,
      variant: 'primary',
      href: '/dashboard/organisation/students',
      loading: statsLoading,
      failed: statsFailed,
    },
    {
      label: 'Students',
      value: toNumber(stats?.total_students),
      hint: 'Enrolled learners',
      icon: GraduationCap,
      variant: 'green',
      href: '/dashboard/organisation/students',
      loading: statsLoading,
      failed: statsFailed,
    },
    {
      label: 'Instructors',
      value: toNumber(stats?.total_instructors),
      hint: 'Teaching staff',
      icon: Presentation,
      variant: 'indigo',
      href: '/dashboard/organisation/instructors',
      loading: statsLoading,
      failed: statsFailed,
    },
    {
      label: 'Branches',
      value: toNumber(stats?.total_branches),
      hint: 'Locations / campuses',
      icon: Building,
      variant: 'coral',
      href: '/dashboard/organisation/branches',
      loading: statsLoading,
      failed: statsFailed,
    },
    {
      label: 'Venues',
      value: getTotalFromMetadata(extractPage(venuesQuery.data).metadata),
      hint: 'Rooms, labs & halls',
      icon: MapPin,
      variant: 'indigo',
      href: '/dashboard/organisation/venues',
      loading: venuesQuery.isLoading,
      failed: venuesQuery.isError,
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:gap-5'>
      {tiles.map(tile =>
        tile.loading ? (
          <KpiCardSkeleton key={tile.label} />
        ) : (
          <KpiCard
            key={tile.label}
            title={tile.label}
            value={tile.failed ? '—' : tile.value.toLocaleString()}
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
