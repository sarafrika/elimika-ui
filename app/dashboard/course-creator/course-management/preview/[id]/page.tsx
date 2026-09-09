'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseCreator } from '@/context/course-creator-context';
import { CourseRecordPage } from '@/src/features/course-record';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { CourseCreatorEmptyState } from '../../../_components/loading-state';

const COURSE_MANAGEMENT_HREF = '/dashboard/course-creator/course-management';

function Page() {
  const params = useParams();
  const courseUuid = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');
  const { profile, isLoading } = useCourseCreator();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/course-creator/overview' },
      {
        id: 'course-management',
        title: 'Course Management',
        url: COURSE_MANAGEMENT_HREF,
      },
      {
        id: 'preview',
        title: 'Preview',
        url: `/dashboard/course-creator/course-management/preview/${courseUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseUuid]);

  // Don't gate the record on the profile query — every region resolves itself.
  // Only a resolved "no course-creator profile" is a reason not to render.
  if (!profile && !isLoading) {
    return <CourseCreatorEmptyState />;
  }

  return <CourseRecordPage className='my-6' courseUuid={courseUuid} backHref={COURSE_MANAGEMENT_HREF} />
    ;
}

export default Page;
