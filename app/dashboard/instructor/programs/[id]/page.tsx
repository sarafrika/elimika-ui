'use client';

import { skipToken, useQuery } from '@tanstack/react-query';
import { useParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { PlusSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import { ApplicantTypeEnum } from '@/services/client';
import {
  getTrainingProgramByUuidOptions,
  getTrainingProgramByUuidQueryKey,
  searchProgramTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { ProgramRecordPage } from '@/src/features/program-record';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { domainFromPath } from '@/src/features/dashboard/lib/dashboard-url';

const PROGRAMS_HREF = '/dashboard/instructor/programs';

/** The instructor's record for one training programme: the shared programme record. */
export default function InstructorProgramRoute() {
  const params = useParams();
  const domain = domainFromPath(usePathname());
  const catalogueHref = roleScopedDashboardPath(domain, '/dashboard/courses');
  const programUuid = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? '';
  const { replaceBreadcrumbs } = useBreadcrumb();
  const instructor = useInstructor();

  // Shares its cache entry with the record's own program query.
  const { data } = useQuery({
    ...(programUuid
      ? getTrainingProgramByUuidOptions({ path: { uuid: programUuid } })
      : {
          queryKey: getTrainingProgramByUuidQueryKey({ path: { uuid: programUuid } }),
          queryFn: skipToken,
        }),
    enabled: Boolean(programUuid),
    staleTime: STALE_TIMES.entity,
  });
  const title = data?.data?.title;
  const applications = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        pageable: { page: 0, size: 1 },
        searchParams: {
          applicant_uuid_eq: instructor?.uuid ?? '',
          applicant_type_eq: ApplicantTypeEnum.INSTRUCTOR,
          program_uuid_eq: programUuid,
          status_eq: 'approved',
        },
      },
    }),
    enabled: Boolean(instructor?.uuid && programUuid),
    staleTime: STALE_TIMES.entity,
    ...APPROVAL_QUERY_FRESHNESS,
  });
  const canCreateClass =
    !data?.error &&
    data?.success !== false &&
    data?.data?.admin_approved &&
    data.data.published &&
    !applications.data?.error &&
    applications.data?.success !== false &&
    applications.data?.data?.content?.some(
      application =>
        application.status === 'approved' &&
        application.program_uuid === programUuid &&
        application.applicant_uuid === instructor?.uuid &&
        application.applicant_type === ApplicantTypeEnum.INSTRUCTOR
    );

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/instructor/overview' },
      { id: 'courses', title: 'Courses', url: catalogueHref },
      {
        id: 'program-details',
        title: title ?? 'Program details',
        url: `${PROGRAMS_HREF}/${programUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, catalogueHref, programUuid, title]);

  if (!programUuid) return null;

  return (
    <ProgramRecordPage
      programUuid={programUuid}
      backHref={catalogueHref}
      primaryAction={
        canCreateClass ? (
          <Button asChild className='h-10 w-full rounded-[10px]'>
            <Link href={`/dashboard/instructor/classes/new?programUuid=${programUuid}`}>
              <PlusSquare className='size-4' />
              Create class
            </Link>
          </Button>
        ) : undefined
      }
    />
  );
}
