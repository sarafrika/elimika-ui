'use client';

import { KpiCard, KpiCardSkeleton, type KpiCardVariant } from '@/components/dashboard';
import { extractPage } from '@/lib/api-helpers';
import type { Enrollment, OrganisationResource } from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  getEnrollmentsForClassOptions,
  listResourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Boxes, DoorOpen, GraduationCap, School } from 'lucide-react';
import type { ComponentType } from 'react';
import { useBranchClasses } from './use-branch-classes';

function StatTile({
  icon: Icon,
  title,
  description,
  value,
  loading,
  variant,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  value: number;
  loading: boolean;
  variant: KpiCardVariant;
}) {
  if (loading) return <KpiCardSkeleton />;
  return (
    <KpiCard
      title={title}
      value={value}
      hint={description}
      icon={<Icon className='h-5 w-5' />}
      variant={variant}
    />
  );
}

/**
 * Real, branch-scoped stat tiles replacing the old hardcoded numbers.
 * Students is de-duplicated by `student_uuid` across the branch's classes
 * (there is no org/branch-level enrollment count endpoint, so we fan out
 * per class). Every tile degrades to 0 rather than blocking the page.
 */
export default function BranchOverviewStats({
  organisationUuid,
  branchUuid,
}: {
  organisationUuid: string;
  branchUuid: string;
}) {
  const enabled = Boolean(organisationUuid && branchUuid);
  const { branchClasses, venueUuids, isLoading: joinLoading } = useBranchClasses(
    organisationUuid,
    branchUuid
  );

  const equipmentQuery = useQuery({
    ...listResourcesOptions({
      path: { organisationUuid },
      query: {
        pageable: { page: 0, size: 100 },
        resource_type: ResourceTypeEnum.EQUIPMENT_POOL,
        branch_uuid: branchUuid,
      },
    }),
    enabled,
  });
  const equipmentCount = extractPage<OrganisationResource>(equipmentQuery.data).items.length;

  const enrollmentQueries = useQueries({
    queries: branchClasses.map(classDef => ({
      ...getEnrollmentsForClassOptions({ path: { uuid: classDef.uuid as string } }),
      enabled: enabled && Boolean(classDef.uuid),
    })),
  });

  const studentUuids = new Set<string>();
  for (const query of enrollmentQueries) {
    for (const enrollment of (query.data?.data ?? []) as Enrollment[]) {
      if (enrollment.student_uuid) studentUuids.add(enrollment.student_uuid);
    }
  }
  const studentsLoading = joinLoading || enrollmentQueries.some(query => query.isLoading);

  return (
    <>
      <StatTile
        icon={DoorOpen}
        title='Venues'
        description='Classrooms at this branch'
        value={venueUuids.size}
        loading={joinLoading}
        variant='primary'
      />
      <StatTile
        icon={Boxes}
        title='Equipment'
        description='Resource pools at this branch'
        value={equipmentCount}
        loading={equipmentQuery.isLoading}
        variant='indigo'
      />
      <StatTile
        icon={School}
        title='Classes'
        description='Classes scheduled here'
        value={branchClasses.length}
        loading={joinLoading}
        variant='amber'
      />
      <StatTile
        icon={GraduationCap}
        title='Students'
        description='Enrolled across branch classes'
        value={studentUuids.size}
        loading={studentsLoading}
        variant='green'
      />
    </>
  );
}
