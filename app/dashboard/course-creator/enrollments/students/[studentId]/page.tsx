'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useCourseCreator } from '@/context/course-creator-context';
import { useStudentsByIds, useUsersWithContactByIds } from '@/hooks/use-batched-lookups';
import type { Course, CourseEnrollment, ProgramEnrollment, TrainingProgram } from '@/services/client';
import {
  getCourseEnrollmentsOptions,
  getProgramEnrollmentsOptions,
  getProgramsByCourseCreatorOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { AdminTable, adminTheme, StatusBadge } from '../../../../admin/_components/ui';

type CourseRow = {
  id: string;
  course: string;
  status?: string;
  lastUpdated?: string | Date;
  enrolledAt?: string | Date;
};

type ContentItem = {
  uuid: string;
  kind: 'course' | 'program';
  title: string;
};

function formatDateValue(value?: string | Date | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'dd MMM, yyyy');
}

export default function CourseCreatorStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const creator = useCourseCreator();
  const creatorUuid = creator.profile?.uuid;
  const { studentMap, isLoading: studentIsLoading } = useStudentsByIds([studentId]);
  const student = studentMap[studentId];
  const userUuid = student?.user_uuid;
  const { userMap, isLoading: userIsLoading } = useUsersWithContactByIds(userUuid ? [userUuid] : []);
  const user = userUuid ? userMap[userUuid] : undefined;

  const programsQuery = useQuery({
    ...getProgramsByCourseCreatorOptions({
      path: { courseCreatorUuid: creatorUuid ?? '' },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(creatorUuid),
    staleTime: 60_000,
  });

  const contentItems = useMemo<ContentItem[]>(
    () => [
      ...((creator.courses ?? []) as Course[])
        .filter((course): course is Course & { uuid: string } => Boolean(course.uuid))
        .map(course => ({
          uuid: course.uuid,
          kind: 'course' as const,
          title: course.name,
        })),
      ...((programsQuery.data?.data?.content ?? []) as TrainingProgram[])
        .filter((program): program is TrainingProgram & { uuid: string } => Boolean(program.uuid))
        .map(program => ({
          uuid: program.uuid,
          kind: 'program' as const,
          title: program.title,
        })),
    ],
    [creator.courses, programsQuery.data?.data?.content]
  );

  const enrollmentQueries = useQueries({
    queries: contentItems.map(content => ({
      ...(content.kind === 'course'
        ? getCourseEnrollmentsOptions({
          path: { courseUuid: content.uuid },
          query: { pageable: { page: 0, size: 250 } },
        })
        : getProgramEnrollmentsOptions({
          path: { programUuid: content.uuid },
          query: { pageable: { page: 0, size: 250 } },
        })),
      enabled: Boolean(content.uuid),
      staleTime: 60_000,
    })),
  });

  const courseEnrollments = useMemo(() => {
    const rows: Array<
      | (CourseEnrollment & { contentTitle: string; contentUuid: string })
      | (ProgramEnrollment & { contentTitle: string; contentUuid: string })
    > = [];

    contentItems.forEach((content, index) => {
      const response = enrollmentQueries[index]?.data?.data;
      const items =
        content.kind === 'course'
          ? ((response?.content ?? []) as CourseEnrollment[])
          : ((response?.content ?? []) as ProgramEnrollment[]);

      items.forEach(item => {
        if (item.student_uuid !== studentId) return;
        rows.push({
          ...item,
          contentUuid: content.uuid,
          contentTitle: content.title,
        });
      });
    });

    return rows.sort((a, b) => {
      const aDate =
        ('updated_date' in a ? a.updated_date : undefined)?.getTime() ??
        ('enrollment_date' in a ? a.enrollment_date : undefined)?.getTime() ??
        0;
      const bDate =
        ('updated_date' in b ? b.updated_date : undefined)?.getTime() ??
        ('enrollment_date' in b ? b.enrollment_date : undefined)?.getTime() ??
        0;
      return bDate - aDate;
    });
  }, [contentItems, enrollmentQueries, studentId]);

  const rows = useMemo<CourseRow[]>(
    () =>
      courseEnrollments.map(enrollment => ({
        id: enrollment.uuid ?? enrollment.contentUuid,
        course: enrollment.contentTitle,
        status: enrollment.status,
        lastUpdated: 'updated_date' in enrollment ? enrollment.updated_date : undefined,
        enrolledAt: 'enrollment_date' in enrollment ? enrollment.enrollment_date : undefined,
      })),
    [courseEnrollments]
  );

  const columns = useMemo<ColumnDef<CourseRow>[]>(
    () => [
      {
        id: 'course',
        accessorFn: row => row.course,
        header: 'Course',
        meta: { label: 'Course' },
        cell: ({ row }) => <span className='text-foreground text-sm font-medium'>{row.original.course}</span>,
      },
      {
        id: 'status',
        accessorFn: row => row.status ?? '',
        header: 'Status',
        meta: { label: 'Status' },
        cell: ({ row }) => <StatusBadge status={row.original.status?.toLowerCase() ?? 'draft'} />,
      },
      {
        id: 'lastUpdated',
        accessorFn: row => (row.lastUpdated ? new Date(row.lastUpdated).getTime() : 0),
        header: 'Last updated',
        meta: { label: 'Last updated' },
        cell: ({ row }) => <span className='text-muted-foreground text-sm'>{formatDateValue(row.original.lastUpdated)}</span>,
      },
      {
        id: 'enrolledAt',
        accessorFn: row => (row.enrolledAt ? new Date(row.enrolledAt).getTime() : 0),
        header: 'Date enrolled',
        meta: { label: 'Date enrolled' },
        cell: ({ row }) => <span className='text-muted-foreground text-sm'>{formatDateValue(row.original.enrolledAt)}</span>,
      },
    ],
    []
  );

  const studentImageUrl = toAuthenticatedMediaUrl(user?.profile_image_url);
  const initials = `${user?.first_name?.[0] ?? student?.full_name?.[0] ?? 'S'}${user?.last_name?.[0] ?? ''}`.toUpperCase();
  const isLoading =
    studentIsLoading ||
    userIsLoading ||
    programsQuery.isLoading ||
    enrollmentQueries.some(query => query.isLoading);

  if (!studentId) {
    return (
      <main className={adminTheme.page}>
        <EmptyState
          title='No student selected'
          description='Return to the student roster and open a student record.'
        />
      </main>
    );
  }

  if (!isLoading && !student) {
    return (
      <main className={adminTheme.page}>
        <EmptyState
          title='Student not found'
          description='We could not find a student for that link.'
        />
      </main>
    );
  }

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button variant='ghost' size='sm' asChild className='max-w-fit text-muted-foreground mb-2 -ml-2'>
          <Link href='/dashboard/course-creator/enrollments'>
            <ArrowLeft className='size-4' />
            Back to students
          </Link>
        </Button>

        <header className='border-border/70 bg-card rounded-md border px-5 py-5 shadow-sm'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-4'>
              <Avatar className='size-14'>
                {studentImageUrl ? (
                  <AvatarImage
                    src={studentImageUrl}
                    alt={student?.full_name ?? 'Student'}
                  />
                ) : null}
                <AvatarFallback className='bg-primary/10 text-primary text-lg font-semibold'>
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className='min-w-0'>
                <h1 className='text-foreground truncate text-2xl font-semibold tracking-tight'>
                  {student?.full_name ?? 'Student'}
                </h1>

                <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'>
                  <span>{user?.email ?? '—'}</span>
                  <span className='text-border'>•</span>
                  <span>{user?.phone_number ?? '—'}</span>
                </div>

                <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                  <Badge variant='outline' className='rounded-md px-2.5 py-0.5 text-xs font-medium'>
                    ID: {student?.uuid ?? '—'}
                  </Badge>

                  <Badge variant='outline' className='rounded-md px-2.5 py-0.5 text-xs font-medium'>
                    Joined {formatDateValue(student?.created_date)}
                  </Badge>

                  <Badge variant='outline' className='rounded-md px-2.5 py-0.5 text-xs font-medium'>
                    {rows.length} course{rows.length === 1 ? '' : 's'}
                  </Badge>

                  {user ? <StatusBadge status={user.active ? 'active' : 'inactive'} /> : null}
                </div>
              </div>
            </div>

            <div className='text-sm text-muted-foreground sm:text-right'>
              <div>Guardian: {student?.primaryGuardianContact ?? '—'}</div>
              {student?.secondaryGuardianContact ? (
                <div>Second guardian: {student.secondaryGuardianContact}</div>
              ) : null}
            </div>
          </div>
        </header>


        <div className='space-y-4'>
          <div className='pt-6 font-medium'>Review the courses this student is enrolled in, along with their latest status and timestamps.</div>

          <AdminTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            searchPlaceholder='Search courses…'
            getRowId={row => row.id}
            pageSize={10}
            emptyTitle='No course enrollments found'
            emptyDescription='This student does not have any course enrollments yet.'
          />
        </div>
      </div>
    </main>
  );
}
