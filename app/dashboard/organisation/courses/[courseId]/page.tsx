'use client';

/**
 * The organisation's record for one course it is approved to deliver.
 *
 * The whole body is `CourseRecordPage`. It asks the API who is looking and the
 * API answers `organisation` — the route never asserts it. What stays here is
 * what belongs to a route: the uuid, the breadcrumbs, the back link and the "no
 * organisation" guard. The record's own side panel carries "Create class" and
 * "Post a job", so the route adds no second copy of them.
 */

import { Building2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useOrganisation } from '@/context/organisation-context';
import { cn } from '@/lib/utils';
import { CourseRecordPage } from '@/src/features/course-record';

const COURSES_HREF = '/dashboard/organisation/courses';

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
    <div className={cn(surfaceTheme.pageWide, 'flex flex-col gap-4 py-4 pb-10')}>
      <CourseRecordPage courseUuid={courseUuid} backHref={COURSES_HREF} />
    </div>
  );
}
