'use client';

import { useQuery } from '@tanstack/react-query';
import { surfaceTheme } from '@/components/data-display';
import { CourseGradesCard } from '@/components/grades/CourseGradesCard';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { getEnrollmentOverviewForStudentOptions } from '@/services/client/@tanstack/react-query.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

export default function StudentGradesPage() {
  const profile = useUserProfile();
  const studentUuid = profile?.student?.uuid;
  const studentName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Student';

  const query = useQuery({
    ...getEnrollmentOverviewForStudentOptions({
      path: { studentUuid: studentUuid as string },
      query: { pageable: { page: 0, size: 50 } },
    }),
    enabled: Boolean(studentUuid),
    staleTime: STALE_TIMES.live,
  });
  const enrollments = (query.data?.data?.course_enrollments?.content ?? []).filter(
    enrollment => enrollment.enrollment_uuid && enrollment.course_uuid
  );

  return (
    <div className={`${surfaceTheme.pageWide} space-y-6 py-4`}>
      <PageHeader title='My grades' description='Your lesson marks and your instructor’s comments.' />
      {query.isLoading || !studentUuid ? (
        <Skeleton className='h-64 w-full rounded-2xl' />
      ) : !enrollments.length ? (
        <EmptyState title='No graded courses yet' description='Grades appear here once you are enrolled in a course.' />
      ) : (
        <div className='flex flex-col gap-6'>
          {enrollments.map(enrollment => (
            <CourseGradesCard
              key={enrollment.enrollment_uuid}
              courseUuid={enrollment.course_uuid}
              enrollmentUuid={enrollment.enrollment_uuid as string}
              courseName={enrollment.course_name}
              studentName={studentName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
