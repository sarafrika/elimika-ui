'use client';

import { useQuery } from '@tanstack/react-query';
import { Pen } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { STALE_TIMES } from '@/lib/query-client';
import { getTrainingProgramByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { ProgramRecordRouteActions } from '@/src/features/dashboard/programs/components/ProgramRecordRouteActions';
import { ProgramRecordPage } from '@/src/features/program-record';
import { surfaceTheme } from '../../../../../components/data-display';
import { cn } from '../../../../../lib/utils';

const PROGRAMS_HREF = '/dashboard/course-creator/courses';
const CATALOGUE_HREF = PROGRAMS_HREF;
const EDIT_PROGRAM_HREF = '/dashboard/course-creator/courses/create-program';

/**
 * The course creator's record for one of their training programmes: the shared
 * programme record, with the route keeping its breadcrumbs and the Edit action.
 */
export default function CourseCreatorProgramRoute() {
  const params = useParams();
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
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/course-creator/overview' },
      { id: 'programs', title: 'Programs', url: PROGRAMS_HREF },
      {
        id: 'program-details',
        title: title ?? 'Program details',
        url: `${PROGRAMS_HREF}/${programUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, programUuid, title]);

  if (!programUuid) return null;

  return (
    <div className={cn(surfaceTheme.pageWide, 'flex flex-col gap-4 py-4 pb-10')}>
      <ProgramRecordRouteActions
        programUuid={programUuid}
        classesHref={`${CATALOGUE_HREF}/available-programs/${programUuid}`}
        instructorsHref={`${CATALOGUE_HREF}/instructor?courseId=${encodeURIComponent(programUuid)}`}
      />

      <ProgramRecordPage
        programUuid={programUuid}
        backHref={PROGRAMS_HREF}
        primaryAction={
          <Button asChild className='h-10 w-full rounded-[10px]'>
            <Link href={`${EDIT_PROGRAM_HREF}?id=${encodeURIComponent(programUuid)}`}>
              <Pen className='size-4' />
              Edit programme
            </Link>
          </Button>
        }
      />
    </div>

  );
}
