'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { CourseRecordPage } from '@/src/features/course-record';
import { CourseRecordRouteActions } from '@/src/features/dashboard/courses/components/CourseRecordRouteActions';

const ALL_COURSES_HREF = '/dashboard/course-creator/all-courses';
/** Kept verbatim from the legacy screen: these two live under `courses/`. */
const CLASSES_BASE_HREF = '/dashboard/course-creator/courses/available-classes';
const INSTRUCTORS_HREF = '/dashboard/course-creator/courses/instructor';

export default function CourseCreatorCourseDetailsRoute() {
  const params = useParams();
  const courseUuid = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/course-creator/overview' },
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
