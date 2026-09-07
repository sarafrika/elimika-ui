'use client';

/**
 * The organisation's record for one course it is approved to deliver.
 *
 * The whole body is `CourseRecordPage`. It asks the API who is looking and the
 * API answers `organisation` — the route never asserts it. What stays here is
 * what belongs to a route: the uuid, the breadcrumbs, the back link, the "no
 * organisation" guard, and the two delivery actions the legacy screen owned.
 *
 * Those actions sit beside the record rather than inside it, as ADOPTION.md
 * asks: the record view is read-only, and navigating to the class builder or
 * the job board is the route's business, not the record's.
 */

import { Briefcase, Building2, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useOrganisation } from '@/context/organisation-context';
import { CourseRecordPage } from '@/src/features/course-record';

const COURSES_HREF = '/dashboard/organisation/courses';
const NEW_CLASS_HREF = '/dashboard/organisation/classes/new';

export default function OrganisationCourseRecordRoute() {
  const params = useParams<{ courseId: string }>();
  const courseUuid =
    typeof params?.courseId === 'string' ? params.courseId : (params?.courseId?.[0] ?? '');
  const organisation = useOrganisation();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/organisation/overview' },
      { id: 'courses', title: 'Courses', url: COURSES_HREF },
      {
        id: 'course-record',
        title: 'Course record',
        url: `${COURSES_HREF}/${courseUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseUuid]);

  // `OrganisationProvider` holds children behind its own loader while the
  // organisation resolves, so a null here is a settled "this account has no
  // organisation" — not an in-flight request.
  if (!organisation) {
    return (
      <EmptyState
        icon={Building2}
        title='No organisation on this account'
        description='Switch to an organisation workspace, or ask your administrator to add you to one, to view course records.'
      />
    );
  }

  return (
    <div className='mx-auto w-full max-w-[1400px] space-y-4 px-3 py-4 sm:px-5 lg:px-6'>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <Button asChild size='sm' variant='outline'>
          <Link href={NEW_CLASS_HREF}>
            <CalendarPlus className='mr-2 h-4 w-4' />
            Create a class
          </Link>
        </Button>
        <Button asChild size='sm'>
          <Link href={`/dashboard/organisation/jobs/new?courseUuid=${courseUuid}`}>
            <Briefcase className='mr-2 h-4 w-4' />
            Post a job
          </Link>
        </Button>
      </div>

      <CourseRecordPage courseUuid={courseUuid} backHref={COURSES_HREF} />
    </div>
  );
}
