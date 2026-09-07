'use client';

/**
 * A learner's record for one course in the catalogue.
 *
 * The catalogue at `/dashboard/student/courses` is the list the student nav
 * points at ("Start a course"). Opening a card used to slide a second, older
 * rendering of the course over the list in a drawer; it now lands here, on the
 * shared course record, and the record's back link returns to that same
 * catalogue.
 *
 * The record is `CourseRecordPage`: it fetches its own data and asks the API
 * what this viewer may see. The route never tells it — being the student route
 * is not evidence that an enrolment is paid, and only the server knows that.
 *
 * What stays with the route is the route's own business: the uuid, the
 * breadcrumbs, the back link, and the actions the drawer owned — "Join a Class"
 * and "Search Instructor", now rendered by `CourseRecordRouteActions` beside
 * the read-only record, alongside the review a signed-in student can leave.
 */

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { CourseRecordPage } from '@/src/features/course-record';
import { CourseRecordRouteActions } from '@/src/features/dashboard/courses/components/CourseRecordRouteActions';

const CATALOGUE_HREF = '/dashboard/student/courses';

export default function StudentCatalogueCourseRecordRoute() {
  const params = useParams();
  const courseUuid =
    typeof params?.courseId === 'string' ? params.courseId : (params?.courseId?.[0] ?? '');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/student/overview' },
      { id: 'courses', title: 'Start a course', url: CATALOGUE_HREF },
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
