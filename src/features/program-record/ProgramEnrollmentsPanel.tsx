'use client';

import { Users } from 'lucide-react';

import { AsyncSection } from '@/components/data/async-section';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProgramEnrollment } from '@/services/client/types.gen';

/**
 * Who is enrolled on a programme: the list the instructor and course-creator
 * programme pages carried before they moved onto the shared record. Names come
 * from the caller's batched student lookup; a learner the lookup has not resolved
 * shows by reference rather than not at all.
 */
export function ProgramEnrollmentsPanel({
  enrollments,
  studentNames,
  total,
  loading,
  error,
  onRetry,
}: {
  enrollments: readonly ProgramEnrollment[];
  studentNames: Readonly<Record<string, string>>;
  total?: number;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}) {
  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-base font-semibold'>Enrolled learners</h2>
        {typeof total === 'number' ? (
          <span className='text-muted-foreground text-sm tabular-nums'>{total}</span>
        ) : null}
      </div>
      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        errorTitle='Couldn’t load enrolments'
        skeleton={
          <div className='flex flex-col gap-2'>
            {[0, 1, 2].map(row => (
              <Skeleton key={row} className='h-12 w-full rounded-[12px]' />
            ))}
          </div>
        }
      >
        {enrollments.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center gap-2 rounded-[12px] border border-dashed px-4 py-8 text-sm'>
            <Users className='size-6' aria-hidden />
            No students enrolled yet
          </div>
        ) : (
          <div className='bg-card overflow-x-auto rounded-[12px] border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/50 border-b'>
                <tr>
                  {['Student', 'Status', 'Enrolled'].map(heading => (
                    <th
                      key={heading}
                      className='text-muted-foreground px-4 py-2.5 text-left font-medium'
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y'>
                {enrollments.map(enrollment => (
                  <tr key={enrollment.uuid ?? enrollment.student_uuid}>
                    <td className='px-4 py-3'>
                      {studentNames[enrollment.student_uuid] ??
                        `Learner ${enrollment.student_uuid.slice(0, 8)}`}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium capitalize'>
                        {(enrollment.status ?? 'active').toString().toLowerCase()}
                      </span>
                    </td>
                    <td className='text-muted-foreground px-4 py-3'>
                      {formatDate(enrollment.enrollment_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsyncSection>
    </section>
  );
}

function formatDate(value: Date | string | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}
