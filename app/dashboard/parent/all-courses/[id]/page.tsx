'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { CourseRecordPage } from '@/src/features/course-record';
import { CourseRecordRouteActions } from '@/src/features/dashboard/courses/components/CourseRecordRouteActions';

const ALL_COURSES_HREF = '/dashboard/parent/all-courses';

export default function ParentCourseDetailsRoute() {
  const params = useParams();
  const courseUuid = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/parent/overview' },
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
        classesHref={`${ALL_COURSES_HREF}/available-classes/${courseUuid}`}
        instructorsHref={`${ALL_COURSES_HREF}/instructor?courseId=${courseUuid}`}
      />
      <CourseRecordPage courseUuid={courseUuid} backHref={ALL_COURSES_HREF} />
    </>
  );
}
