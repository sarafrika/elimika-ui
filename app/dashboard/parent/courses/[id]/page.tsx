'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { CoursePrerequisitesNotice } from '@/src/features/course-prerequisites/course-prerequisites-notice';
import { CourseRecordPage } from '@/src/features/course-record';
import { CourseRecordRouteActions } from '@/src/features/dashboard/courses/components/CourseRecordRouteActions';
import { SimilarCoursesRail } from '@/src/features/recommendations/similar-courses-rail';

const COURSES_HREF = '/dashboard/parent/courses';
const courseHref = (uuid: string) => `${COURSES_HREF}/${uuid}`;

export default function ParentCourseDetailsRoute() {
  const params = useParams();
  const courseUuid = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/parent/overview' },
      { id: 'courses', title: 'Browse Courses', url: COURSES_HREF },
      {
        id: 'course',
        title: 'Course details',
        url: `${COURSES_HREF}/${courseUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseUuid]);

  return (
    <>
      <CourseRecordRouteActions
        courseUuid={courseUuid}
        classesHref={`${COURSES_HREF}/available-classes/${courseUuid}`}
        instructorsHref={`${COURSES_HREF}/instructor?courseId=${courseUuid}`}
      />
      <CoursePrerequisitesNotice courseUuid={courseUuid} hrefFor={courseHref} className='mb-4' />
      <CourseRecordPage courseUuid={courseUuid} backHref={COURSES_HREF} />
      <SimilarCoursesRail courseUuid={courseUuid} hrefFor={courseHref} className='mt-8' />
    </>
  );
}
