'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import { extractEntity } from '@/lib/api-helpers';
import type { ClassDefinitionResponse, Enrollment } from '@/services/client';
import {
  getClassDefinitionOptions,
  getEnrollmentsForClassOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatusBadge,
} from '../../_components/ui';

const pct = (value?: number | null): string =>
  value === undefined || value === null ? '—' : `${Math.round(Number(value))}%`;
const num = (value?: bigint | number | null): string =>
  value === undefined || value === null ? '—' : Number(value).toLocaleString();

export default function CohortProgressPage() {
  const params = useParams();
  const classUuid = params?.classUuid as string;

  const classQuery = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classUuid } }),
    enabled: Boolean(classUuid),
  });
  const enrollmentsQuery = useQuery({
    ...getEnrollmentsForClassOptions({ path: { uuid: classUuid } }),
    enabled: Boolean(classUuid),
  });

  const classDef = extractEntity<ClassDefinitionResponse>(classQuery.data)?.class_definition;
  const enrollments = (enrollmentsQuery.data?.data ?? []) as Enrollment[];

  const studentUuids = useMemo(
    () => enrollments.map(e => e.student_uuid).filter((uuid): uuid is string => Boolean(uuid)),
    [enrollments]
  );
  const { studentMap } = useStudentsByIds(studentUuids);

  const attendedCount = enrollments.filter(e => e.did_attend).length;

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title={classQuery.isLoading ? 'Cohort' : (classDef?.title ?? 'Cohort')}
          description='Cohort roster and delivery progress.'
          eyebrow={
            <Link
              href='/dashboard/learning-progress'
              className='inline-flex items-center gap-1 hover:text-foreground'
            >
              <ArrowLeft className='size-3.5' />
              Back to learning progress
            </Link>
          }
        />

        <SectionCard title='Delivery'>
          <DetailGrid
            items={[
              { label: 'Class progress', value: pct(classDef?.class_progress_percentage) },
              {
                label: 'Sessions',
                value: `${num(classDef?.completed_session_count)} / ${num(classDef?.scheduled_session_count)}`,
              },
              { label: 'Enrolled', value: num(enrollments.length) },
              { label: 'Attended (marked)', value: num(attendedCount) },
            ]}
          />
        </SectionCard>

        <SectionCard title='Students' description='Enrolled learners and attendance'>
          {enrollmentsQuery.isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading…</p>
          ) : enrollments.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No students enrolled yet.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground'>
                    <th className='py-2 pr-3 font-medium'>Student</th>
                    <th className='py-2 pr-3 font-medium'>Status</th>
                    <th className='py-2 font-medium'>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(enrollment => (
                    <tr key={enrollment.uuid} className='border-b border-border/40'>
                      <td className='py-2.5 pr-3 font-medium text-foreground'>
                        {studentMap[enrollment.student_uuid]?.full_name ?? 'Student'}
                      </td>
                      <td className='py-2.5 pr-3'>
                        <StatusBadge status={enrollment.status} />
                      </td>
                      <td className='py-2.5 text-muted-foreground'>
                        {enrollment.is_attendance_marked
                          ? enrollment.did_attend
                            ? 'Present'
                            : 'Absent'
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
