'use client';

/**
 * A creator's record for one course in the marketplace catalogue.
 *
 * `/dashboard/course-creator/courses` is the shared catalogue — how a creator's
 * own work sits alongside everyone else's. Opening a card used to slide an
 * older rendering of the course over the list in a drawer; it now lands here,
 * on the shared course record, whose back link returns to that catalogue.
 *
 * This is not the creator's own course-management preview
 * (`/dashboard/course-creator/course-management/preview/<uuid>`): a creator
 * browsing the catalogue is usually looking at somebody else's course, and it
 * is the API — not this route — that says which of the two they are.
 */

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
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
    <>
      <CourseRecordRouteActions
        courseUuid={courseUuid}
        classesHref={`${CATALOGUE_HREF}/available-classes/${courseUuid}`}
        instructorsHref={`${CATALOGUE_HREF}/instructor?courseId=${courseUuid}`}
      />
      <CourseRecordPage courseUuid={courseUuid} backHref={CATALOGUE_HREF} />
    </>
  );
}
