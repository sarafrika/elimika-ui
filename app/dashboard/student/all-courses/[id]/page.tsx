'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { CourseRecordPage } from '@/src/features/course-record';
import { CourseRecordRouteActions } from '@/src/features/dashboard/courses/components/CourseRecordRouteActions';

const ALL_COURSES_HREF = '/dashboard/student/all-courses';
/**
 * The enrolment path the legacy screen pushed to, kept verbatim: the learner's
 * classes list lives under `courses/`, not under `all-courses/`.
 */
const CLASSES_BASE_HREF = '/dashboard/student/courses/available-classes';
const INSTRUCTORS_HREF = '/dashboard/student/courses/instructor';

export default function StudentCourseDetailsRoute() {
  const params = useParams();
  const courseUuid = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/student/overview' },
      { id: 'all-courses', title: 'Browse Courses', url: ALL_COURSES_HREF },
      {
        id: 'course',
        title: 'Course details',
        url: `${ALL_COURSES_HREF}/${courseUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseUuid]);

  return (
    <>
      <CourseRecordRouteActions
        courseUuid={courseUuid}
        classesHref={`${CLASSES_BASE_HREF}/${courseUuid}`}
        instructorsHref={`${INSTRUCTORS_HREF}?courseId=${courseUuid}`}
      />
      <CourseRecordPage courseUuid={courseUuid} backHref={ALL_COURSES_HREF} />
    </>
  );
}
