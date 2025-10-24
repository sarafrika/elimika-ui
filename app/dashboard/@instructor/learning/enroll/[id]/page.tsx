'use client';

import { Card } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import useCourseClassesWithDetails from '@/hooks/use-course-classes';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CustomEmptyState, CustomLoadingState } from '../../../../@course_creator/_components/loading-state';
import EnrollCourseCard from '../../../../_components/enroll-course-card';

const EnrollmentPage = () => {
  const params = useParams();
  const courseId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (courseId) {
      replaceBreadcrumbs([
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        {
          id: 'learning',
          title: 'Learning',
          url: `/dashboard/learning`,
        },
        {
          id: 'course-details',
          title: `Enroll`,
          url: `/dashboard/learning/enroll/${courseId}`,
        },
      ]);
    }
  }, [replaceBreadcrumbs, courseId]);


  const [enrollingCourse, setEnrollingCourse] = useState<any | null>(null)
  const { classes, loading, isError } = useCourseClassesWithDetails(courseId, "2025-09-12", "2026-12-12");

  if (loading) {
    return <CustomLoadingState subHeading='Loading available classes...' />;
  }

  return (
    <Card className='space-y-4 py-10 px-6'>
      <div>
        <h1 className="text-2xl font-semibold">Explore Classes Open for Enrollment</h1>
        <p className="text-gray-600">Discover courses designed to help you grow and succeed.</p>
      </div>

      {classes.length === 0 ? (
        <CustomEmptyState headline='No class found' subHeading='No classes available for this course.' />
      ) : (
        <div className='flex flex-row flex-wrap gap-4'>
          {classes.map((cls: any) => (
            <EnrollCourseCard
              key={cls?.uuid}
              cls={cls as any}
              enrollmentPercentage={5}
              isFull={false}
              handleEnroll={() => setEnrollingCourse(cls)}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default EnrollmentPage;
