'use client';

import { useQuery } from '@tanstack/react-query';
import { ProgressReportCard } from '@/components/lesson/ProgressReportCard';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { getCourseEnrollmentsForStudentOptions } from '@/services/client/@tanstack/react-query.gen';

function useStudentCourseEnrollments(studentUuid: string) {
  return useQuery({
    ...getCourseEnrollmentsForStudentOptions({
      path: { studentUuid },
      query: { pageable: { page: 0, size: 50 } },
    }),
    enabled: Boolean(studentUuid),
    staleTime: STALE_TIMES.live,
    select: response => response.data?.content ?? [],
  });
}

/** The learner's progress reports, read-only: the school sees marks but never changes them. */
export function StudentGradesSection({ studentUuid, studentName }: { studentUuid: string; studentName: string }) {
  const query = useStudentCourseEnrollments(studentUuid);
  if (query.isLoading) return <Skeleton className='h-40 w-full rounded-md' />;
  const enrollments = (query.data ?? []).filter(enrollment => enrollment.enrollment_uuid && enrollment.course_uuid);
  return (
    <section className='space-y-4' aria-label='Grades'>
      <p className='bg-primary/10 rounded-xl px-4 py-3 text-sm'>
        You can view marks and comments. Each class's trainer enters them; the school cannot change them.
      </p>
      {!enrollments.length ? (
        <p className='text-muted-foreground text-sm'>No course grades yet.</p>
      ) : (
        enrollments.map(enrollment => (
          <ProgressReportCard
            key={enrollment.enrollment_uuid}
            courseUuid={enrollment.course_uuid ?? ''}
            enrollmentUuid={enrollment.enrollment_uuid ?? ''}
            studentName={studentName}
            allowFeedback={false}
          />
        ))
      )}
    </section>
  );
}
