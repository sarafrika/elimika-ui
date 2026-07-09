'use client';

import { useQuery } from '@tanstack/react-query';
import { Building, GraduationCap, Presentation, Users } from 'lucide-react';
import Link from 'next/link';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
  getUsersByOrganisationOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { StatCard, StatCardSkeleton } from '../../_components/ui';

/** Real-data KPI row for the organisation control centre. */
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

  const tiles = [
    {
      label: 'Total Members',
      value: getTotalFromMetadata(extractPage(membersQuery.data).metadata),
      hint: 'Everyone affiliated with your organisation',
      icon: Users,
      tone: 'info' as const,
      href: '/dashboard/people',
      loading: membersQuery.isLoading,
    },
    {
      label: 'Students',
      value: getTotalFromMetadata(studentsPage.metadata) || studentsPage.items.length,
      hint: 'Enrolled learners',
      icon: GraduationCap,
      tone: 'success' as const,
      href: '/dashboard/people',
      loading: studentsQuery.isLoading,
    },
    {
      label: 'Instructors',
      value: getTotalFromMetadata(instructorsPage.metadata) || instructorsPage.items.length,
      hint: 'Teaching staff',
      icon: Presentation,
      tone: 'neutral' as const,
      href: '/dashboard/people',
      loading: instructorsQuery.isLoading,
    },
    {
      label: 'Training Branches',
      value: getTotalFromMetadata(extractPage(branchesQuery.data).metadata),
      hint: 'Locations and facilities',
      icon: Building,
      tone: 'warning' as const,
      href: '/dashboard/branches',
      loading: branchesQuery.isLoading,
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {tiles.map(tile =>
        tile.loading ? (
          <StatCardSkeleton key={tile.label} />
        ) : (
          <Link key={tile.label} href={tile.href} className='block'>
            <StatCard
              label={tile.label}
              value={tile.value}
              hint={tile.hint}
              icon={tile.icon}
              tone={tile.tone}
              className='h-full transition-colors hover:border-border'
            />
          </Link>
        )
      )}
    </div>
  );
}
