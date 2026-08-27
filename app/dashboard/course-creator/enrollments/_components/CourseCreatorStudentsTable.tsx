'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useCourseCreator } from '@/context/course-creator-context';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import type { Course, CourseEnrollment, ProgramEnrollment, TrainingProgram } from '@/services/client';
import {
  getCourseEnrollmentsOptions,
  getProgramEnrollmentsOptions,
  getProgramsByCourseCreatorOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Layers3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminTable, StatusBadge } from '../../../admin/_components/ui';

type ContentItem = {
  uuid: string;
  kind: 'course' | 'program';
  title: string;
};

type StudentRosterRow = {
  studentUuid: string;
  name: string;
  status?: string;
  courseTitles: string[];
  courseSummary: string;
  courseCount: number;
};

type EnrollmentRow = {
  studentUuid: string;
  contentUuid: string;
  contentTitle: string;
  enrollmentStatus?: string;
  enrolledAt?: string | Date;
  updatedAt?: string | Date;
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

function contentTitle(content?: Course | TrainingProgram | null): string {
  if (!content) return 'Student enrollments';
  return 'name' in content ? content.name : content.title;
}

function toEnrollmentRows(
  content: ContentItem,
  items: Array<CourseEnrollment | ProgramEnrollment>
): EnrollmentRow[] {
  return items
    .map<EnrollmentRow | null>(item => {
      const studentUuid = item.student_uuid;
      if (!studentUuid) return null;

      return {
        studentUuid,
        contentUuid: content.uuid,
        contentTitle: content.title,
        enrollmentStatus: item.status,
        enrolledAt: item.enrollment_date,
        updatedAt: item.updated_date ?? item.enrollment_date,
      };
    })
    .filter((row): row is EnrollmentRow => row !== null);
}

export function CourseCreatorStudentsTable() {
  const router = useRouter();
  const creator = useCourseCreator();
  const creatorUuid = creator.profile?.uuid;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const programsQuery = useQuery({
    ...getProgramsByCourseCreatorOptions({
      path: { courseCreatorUuid: creatorUuid ?? '' },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: isMounted && Boolean(creatorUuid),
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
          title: contentTitle(program),
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
      enabled: isMounted && Boolean(content.uuid),
      staleTime: 60_000,
    })),
  });

  const enrollmentRows = useMemo(() => {
    const rows = contentItems.flatMap((content, index) => {
      const response = enrollmentQueries[index]?.data?.data;
      const items =
        content.kind === 'course'
          ? ((response?.content ?? []) as CourseEnrollment[])
          : ((response?.content ?? []) as ProgramEnrollment[]);

      return toEnrollmentRows(content, items);
    });

    const unique = new Map<string, EnrollmentRow>();
    rows.forEach(row => {
      const key = `${row.studentUuid}:${row.contentUuid}`;
      if (!unique.has(key)) {
        unique.set(key, row);
      }
    });

    return Array.from(unique.values());
  }, [contentItems, enrollmentQueries]);

  const studentIds = useMemo(
    () => Array.from(new Set(enrollmentRows.map(row => row.studentUuid).filter(Boolean))),
    [enrollmentRows]
  );

  const { studentMap, isLoading: studentsLoading } = useStudentsByIds(studentIds);

  const rows = useMemo<StudentRosterRow[]>(() => {
    const grouped = new Map<
      string,
      {
        studentUuid: string;
        name: string;
        statuses: Array<{ status?: string; updatedAt?: string | Date; enrolledAt?: string | Date }>;
        titles: string[];
      }
    >();

    enrollmentRows.forEach(row => {
      const student = studentMap[row.studentUuid];
      const name = student?.full_name ?? 'Unknown student';
      const current = grouped.get(row.studentUuid) ?? {
        studentUuid: row.studentUuid,
        name,
        statuses: [],
        titles: [],
      };

      current.name = name;
      current.statuses.push({
        status: row.enrollmentStatus,
        updatedAt: row.updatedAt,
        enrolledAt: row.enrolledAt,
      });
      current.titles.push(row.contentTitle);
      grouped.set(row.studentUuid, current);
    });

    return Array.from(grouped.values())
      .map(entry => {
        const dedupedTitles = Array.from(new Set(entry.titles.filter(Boolean)));
        const latestEnrollment = [...entry.statuses].sort((a, b) => {
          const aDate = new Date(a.updatedAt ?? a.enrolledAt ?? 0).getTime();
          const bDate = new Date(b.updatedAt ?? b.enrolledAt ?? 0).getTime();
          return bDate - aDate;
        })[0];
        const courseSummary =
          dedupedTitles.length <= 2
            ? dedupedTitles.join(', ')
            : `${dedupedTitles.slice(0, 2).join(', ')} +${dedupedTitles.length - 2} more`;

        return {
          studentUuid: entry.studentUuid,
          name: entry.name,
          status: latestEnrollment?.status,
          courseTitles: dedupedTitles,
          courseSummary: courseSummary || '—',
          courseCount: dedupedTitles.length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrollmentRows, studentMap]);

  const columns = useMemo<ColumnDef<StudentRosterRow>[]>(
    () => [
      {
        id: 'student',
        accessorFn: row => `${row.name} ${row.courseSummary}`,
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
              <p className='text-muted-foreground truncate text-xs'>
                {row.original.courseCount} enrollment{row.original.courseCount === 1 ? '' : 's'}
              </p>
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
        id: 'courses',
        accessorFn: row => row.courseSummary,
        header: 'Courses enrolled',
        meta: { label: 'Courses enrolled' },
        cell: ({ row }) => (
          <div className='flex flex-wrap gap-1.5'>
            {row.original.courseTitles.length > 0 ? (
              <>
                {row.original.courseTitles.slice(0, 2).map(title => (
                  <Badge key={title} variant='outline' className='rounded-md'>
                    {title}
                  </Badge>
                ))}
                {row.original.courseTitles.length > 2 ? (
                  <Badge variant='secondary' className='rounded-md'>
                    +{row.original.courseTitles.length - 2} more
                  </Badge>
                ) : null}
              </>
            ) : (
              <span className='text-muted-foreground text-sm'>—</span>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const isLoading = programsQuery.isLoading || enrollmentQueries.some(query => query.isLoading) || studentsLoading;

  if (!creatorUuid) {
    return (
      <EmptyState
        title='No course creator profile'
        description='Create a course creator profile to view student enrollments.'
      />
    );
  }

  return (
    <div className='space-y-4'>
      <AdminTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchPlaceholder='Search students or courses…'
        getRowId={row => row.studentUuid}
        onRowClick={row => router.push(`/dashboard/course-creator/enrollments/students/${row.studentUuid}`)}
        pageSize={15}
        emptyTitle='No students found'
        emptyDescription='Your courses and programs do not have any enrolled students yet.'
        toolbar={
          <Badge variant='secondary' className='rounded-md px-2.5 py-1 text-xs font-medium'>
            <Layers3 className='mr-1.5 size-3.5' />
            {rows.length}
          </Badge>
        }
      />
    </div>
  );
}
