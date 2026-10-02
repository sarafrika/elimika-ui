'use client';

/**
 * A trainer's record for one course in the marketplace catalogue.
 *
 * `/dashboard/instructor/courses` is the same shared catalogue the learner
 * browses ("Courses" in the instructor nav). Opening a card used to slide an
 * older rendering of the course over the list in a drawer; it now lands here,
 * on the shared course record, whose back link returns to that catalogue.
 *
 * The route asserts nothing about this viewer. Whether the instructor's
 * training application for this course is approved *today* is the server's
 * answer, and `CourseRecordPage` asks for it — the applicant's own action, when
 * there is one, comes from the record's own default, not from a button this
 * route invents.
 *
 * The two navigations the drawer owned — the class list and the instructor
 * directory — stay with the route.
 */

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { surfaceTheme } from '@/components/data-display/page-shell';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { cn } from '@/lib/utils';
import { CourseRecordPage } from '@/src/features/course-record';
import { CourseRecordRouteActions } from '@/src/features/dashboard/courses/components/CourseRecordRouteActions';

const CATALOGUE_HREF = '/dashboard/instructor/courses';

export default function InstructorCatalogueCourseRecordRoute() {
  const params = useParams();
  const courseUuid =
    typeof params?.courseId === 'string' ? params.courseId : (params?.courseId?.[0] ?? '');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/instructor/overview' },
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
