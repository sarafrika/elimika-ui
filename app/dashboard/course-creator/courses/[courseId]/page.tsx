'use client';

/**
 * A creator's record for one course in the marketplace catalogue.
 *
 * `/dashboard/course-creator/courses` is the shared catalogue — how a creator's
 * own work sits alongside everyone else's. Opening a card used to slide an
 * older rendering of the course over the list in a drawer; it now lands here,
 * on the shared course record, whose back link returns to that catalogue.
 *
 * It is also where Course Management previews the creator's own courses: the
 * API, not this route, says whether the viewer owns the course.
 */

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { surfaceTheme } from '@/components/data-display/page-shell';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { cn } from '@/lib/utils';
import { CourseRecordPage } from '@/src/features/course-record';
import { CourseRecordRouteActions } from '@/src/features/dashboard/courses/components/CourseRecordRouteActions';

const CATALOGUE_HREF = '/dashboard/course-creator/courses';

export default function CourseCreatorCatalogueCourseRecordRoute() {
  const params = useParams();
  const courseUuid =
    typeof params?.courseId === 'string' ? params.courseId : (params?.courseId?.[0] ?? '');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/course-creator/overview' },
      { id: 'courses', title: 'Courses', url: CATALOGUE_HREF },
      {
        id: 'course',
        title: 'Course details',
        url: `${CATALOGUE_HREF}/${courseUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseUuid]);

  return (
    <div className={cn(surfaceTheme.pageWide, 'flex flex-col gap-4 py-4 pb-10')}>
      <CourseRecordRouteActions
        courseUuid={courseUuid}
        classesHref={`${CATALOGUE_HREF}/available-classes/${courseUuid}`}
        instructorsHref={`${CATALOGUE_HREF}/instructor?courseId=${courseUuid}`}
      />
      <CourseRecordPage courseUuid={courseUuid} backHref={CATALOGUE_HREF} />
    </div>
  );
}
