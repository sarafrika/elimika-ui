'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import type { Course, CourseEnrollment, TrainingProgram } from '@/services/client';
import {
  getCourseByUuidOptions,
  getCourseEnrollmentsOptions,
  getProgramEnrollmentsOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../../../../components/ui/button';
import { AdminPageHeader, AdminTable, adminTheme, StatusBadge } from '../../../../../admin/_components/ui';


type EnrolledStudentRow = {
  studentUuid: string;
  name: string;
  subtitle?: string;
  enrolledAt?: string | Date;
  status?: string;
};

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0] ?? '')
      .join('')
      .toUpperCase() || 'S'
  );
}

function formatRelative(value?: string | Date | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : formatDistanceToNow(date, { addSuffix: true });
}

function contentTitle(content?: Course | TrainingProgram | null): string {
  if (!content) return 'Student enrollments';
  return 'name' in content ? content.name : content.title;
}

export function CourseCreatorEnrollmentStudentsTable({ contentId }: { contentId: string }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: contentId } }),
    enabled: isMounted && Boolean(contentId),
    retry: false,
    staleTime: 60_000,
  });

  const course = courseQuery.data?.data ?? null;
  const programQuery = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: contentId } }),
    enabled: isMounted && Boolean(contentId) && !course && courseQuery.isError,
    retry: false,
    staleTime: 60_000,
  });
  const program = programQuery.data?.data ?? null;
  const content = course ?? program;
  const contentKind = course ? 'course' : program ? 'program' : null;

  const enrollmentQuery = useQuery({
    ...(contentKind === 'course'
      ? getCourseEnrollmentsOptions({
        path: { courseUuid: contentId },
        query: { pageable: { page: 0, size: 100 } },
      })
      : contentKind === 'program'
        ? getProgramEnrollmentsOptions({
          path: { programUuid: contentId },
          query: { pageable: { page: 0, size: 100 } },
        })
        : getCourseEnrollmentsOptions({
            path: { courseUuid: contentId },
            query: { pageable: { page: 0, size: 100 } },
          })),
    enabled: isMounted && Boolean(contentKind),
    staleTime: 60_000,
  });

  const enrollments = (enrollmentQuery.data?.data?.content ?? []) as Array<
    CourseEnrollment & { student_uuid?: string }
  >;
  const studentIds = enrollments
    .map(enrollment => enrollment.student_uuid)
    .filter((value): value is string => Boolean(value));
  const { studentMap, isLoading: studentsLoading } = useStudentsByIds(studentIds);

  const rows = useMemo<EnrolledStudentRow[]>(
    () =>
      enrollments
        .map(enrollment => {
          const student = studentMap[enrollment.student_uuid ?? ''];
          if (!student) return null;

          return {
            studentUuid: student.uuid ?? enrollment.student_uuid,
            name: student.full_name ?? 'Unknown student',
            subtitle: student.demographic_tag ?? undefined,
            enrolledAt: enrollment.enrollment_date,
            status: enrollment.status,
          };
        })
        .filter((row): row is EnrolledStudentRow => Boolean(row)),
    [enrollments, studentMap]
  );

  const columns = useMemo<ColumnDef<EnrolledStudentRow>[]>(
    () => [
      {
        id: 'student',
        accessorFn: row => `${row.name} ${row.subtitle ?? ''}`,
        header: 'Student',
        meta: { label: 'Student' },
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Avatar className='size-10'>
              <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                {initials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='text-foreground truncate text-sm font-medium'>{row.original.name}</p>
              {row.original.subtitle ? (
                <p className='text-muted-foreground truncate text-xs'>{row.original.subtitle}</p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        accessorFn: row => row.status ?? '',
        header: 'Status',
        meta: { label: 'Status' },
        cell: ({ row }) => <StatusBadge status={row.original.status?.toLowerCase() ?? 'draft'} />,
      },
      {
        id: 'enrolledAt',
        accessorFn: row => (row.enrolledAt ? new Date(row.enrolledAt).getTime() : 0),
        header: 'Enrolled',
        meta: { label: 'Enrolled' },
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
            {formatRelative(row.original.enrolledAt)}
          </span>
        ),
      },
    ],
    []
  );

  const title = contentTitle(content);
  const description = content
    ? `Review the students enrolled in ${title.toLowerCase()}.`
    : 'Review the students enrolled in this course or program.';
  const isLoading =
    !isMounted ||
    courseQuery.isLoading ||
    programQuery.isLoading ||
    enrollmentQuery.isLoading ||
    studentsLoading;

  if (!contentId) {
    return (
      <main className={adminTheme.page}>
        <div className={adminTheme.pageStack}>
          <EmptyState
            title='No content selected'
            description='Open a course or program from the enrollments table.'
          />
        </div>
      </main>
    );
  }

  if (!content && !isLoading) {
    return (
      <main className={adminTheme.page}>
        <div className={adminTheme.pageStack}>
          <EmptyState
            title='Content not found'
            description='We could not resolve that course or program.'
          />
        </div>
      </main>
    );
  }

  return (
    <main className={adminTheme.page}>
      <Button variant='ghost' size='sm' asChild className='text-muted-foreground mb-2 -ml-2'>
        <Link href={`/dashboard/course-creator/enrollments`}>
          <ArrowLeft className='size-4' />
          Back to course enrollments
        </Link>
      </Button>

      <div className={adminTheme.pageStack}>
        <AdminPageHeader title={title} description={description} />
        <AdminTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          searchPlaceholder='Search students…'
          getRowId={row => row.studentUuid}
          onRowClick={row =>
            router.push(`/dashboard/course-creator/enrollments/${contentId}/students/${row.studentUuid}`)
          }
          pageSize={15}
          emptyTitle='No students found'
          emptyDescription='This course or program does not have any enrolled students yet.'
          toolbar={
            <Badge variant='secondary' className='rounded-md px-2.5 py-1 text-xs font-medium'>
              {rows.length}
            </Badge>
          }
        />
      </div>
    </main>
  );
}
