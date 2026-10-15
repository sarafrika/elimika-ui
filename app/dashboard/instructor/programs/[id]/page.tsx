'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { STALE_TIMES } from '@/lib/query-client';
import { getTrainingProgramByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
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

  // Shares its cache entry with the record's own program query.
  const { data } = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid } }),
    enabled: Boolean(programUuid),
    staleTime: STALE_TIMES.entity,
  });
  const title = data?.data?.title;

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

  return <ProgramRecordPage programUuid={programUuid} backHref={catalogueHref} />;
}
