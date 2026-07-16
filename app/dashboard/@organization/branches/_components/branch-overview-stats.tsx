'use client';

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import { Skeleton } from '../../../../../components/ui/skeleton';
import { useBranchClasses } from './use-branch-classes';

function StatCard({
  icon: Icon,
  title,
  description,
  value,
  loading,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Card className='flex-grow'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className='h-9 w-20' />
        ) : (
          <h1 className='flex items-center gap-3 text-3xl'>
            <Icon size={32} /> {value}
          </h1>
        )}
      </CardContent>
    </Card>
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
      <StatCard
        icon={DoorOpen}
        title='Venues'
        description='Classrooms at this branch'
        value={venueUuids.size}
        loading={joinLoading}
      />
      <StatCard
        icon={Boxes}
        title='Equipment'
        description='Resource pools at this branch'
        value={equipmentCount}
        loading={equipmentQuery.isLoading}
      />
      <StatCard
        icon={School}
        title='Classes'
        description='Classes scheduled here'
        value={branchClasses.length}
        loading={joinLoading}
      />
      <StatCard
        icon={GraduationCap}
        title='Students'
        description='Enrolled across branch classes'
        value={studentUuids.size}
        loading={studentsLoading}
      />
    </>
  );
}
