'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCourseCreator } from '@/context/course-creator-context';
import type { Course, TrainingProgram } from '@/services/client';
import {
  getCourseEnrollmentsOptions,
  getProgramEnrollmentsOptions,
  getProgramsByCourseCreatorOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Layers3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import { toAuthenticatedMediaUrl } from '../../../../../src/lib/media-url';
import { AdminTable, StatusBadge } from '../../../admin/_components/ui';

type EnrolledContent = {
  uuid: string;
  kind: 'course' | 'program';
  title: string;
  description?: string;
  published: boolean;
  enrolledStudents: number;
  updatedDate?: string | Date;
};

function initials(label: string): string {
  return (
    label
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0] ?? '')
      .join('')
      .toUpperCase() || 'EC'
  );
}

function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'dd MMM, yyyy');
}

function summaryText(item: Course | TrainingProgram): string | undefined {
  return item.description?.trim() || item.objectives?.trim() || undefined;
}

export function CourseCreatorEnrollmentsTable() {
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

  const courses = creator.courses ?? [];
  const programs = programsQuery.data?.data?.content ?? [];

  const contentRows = useMemo<EnrolledContent[]>(
    () => [
      ...courses
        .filter((course): course is Course & { uuid: string } => Boolean(course.uuid))
        .map(course => ({
          uuid: course.uuid,
          kind: 'course' as const,
          title: course.name,
          description: summaryText(course),
          published: Boolean(course.is_published),
          updatedDate: course.updated_date,
          thumbnail_url: course.thumbnail_url
        })),
      ...programs
        .filter((program): program is TrainingProgram & { uuid: string } => Boolean(program.uuid))
        .map(program => ({
          uuid: program.uuid,
          kind: 'program' as const,
          title: program.title,
          description: summaryText(program),
          published: Boolean(program.published),
          updatedDate: program.updated_date,
          thumbnail_url: course.thumbnail_url
        })),
    ],
    [courses, programs]
  );

  const enrollmentQueries = useQueries({
    queries: contentRows.map(content => ({
      ...(content.kind === 'course'
        ? getCourseEnrollmentsOptions({
          path: { courseUuid: content.uuid },
          query: { pageable: { page: 0, size: 1 } },
        })
        : getProgramEnrollmentsOptions({
          path: { programUuid: content.uuid },
          query: { pageable: { page: 0, size: 1 } },
        })),
      enabled: isMounted && Boolean(content.uuid),
      staleTime: 60_000,
    })),
  });

  const contentWithCounts = useMemo(
    () =>
      contentRows.map((content, index) => {
        const response = enrollmentQueries[index]?.data?.data;
        const enrolledStudents = Number(response?.metadata?.totalElements ?? 0);

        return {
          ...content,
          enrolledStudents,
        };
      }),
    [contentRows, enrollmentQueries]
  );

  const columns = useMemo<ColumnDef<EnrolledContent>[]>(
    () => [
      {
        id: 'content',
        accessorFn: row => `${row.title} ${row.description ?? ''} ${row.kind}`,
        header: 'Course / program',
        meta: { label: 'Course / program' },
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className='flex items-center gap-3'>
              <Avatar className='size-10'>
                <AvatarImage src={toAuthenticatedMediaUrl(item?.thumbnail_url!) ?? undefined} alt={item.title} />
                <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                  {initials(item.title)}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='text-foreground truncate text-sm font-medium'>{item.title}</p>
                  <Badge variant='outline' className='text-[10px] uppercase'>
                    {item.kind}
                  </Badge>
                </div>
                <p className='text-muted-foreground line-clamp-2 text-xs'>
                  {(() => {
                    const description = stripHtml(item.description)
                    if (!description) return 'No description available.'

                    return description.length > 75
                      ? `${description.slice(0, 75)}...`
                      : description
                  })()}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorFn: row => (row.published ? 'published' : 'draft'),
        header: 'Status',
        meta: { label: 'Status' },
        cell: ({ row }) => <StatusBadge status={row.original.published ? 'published' : 'draft'} />,
      },
      {
        id: 'enrolledStudents',
        accessorFn: row => row.enrolledStudents,
        header: 'Enrolled students',
        meta: { label: 'Enrolled students' },
        cell: ({ row }) => (
          <span className='text-foreground text-sm font-medium'>{row.original.enrolledStudents}</span>
        ),
      },
      {
        id: 'updatedDate',
        accessorFn: row => (row.updatedDate ? new Date(row.updatedDate).getTime() : 0),
        header: 'Last updated',
        meta: { label: 'Last updated' },
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
            {formatDate(row.original.updatedDate)}
          </span>
        ),
      },
    ],
    []
  );

  const isLoading = programsQuery.isLoading || enrollmentQueries.some(query => query.isLoading);

  return (
    <AdminTable
      columns={columns}
      data={contentWithCounts}
      isLoading={isLoading}
      searchPlaceholder='Search courses or programs…'
      getRowId={row => row.uuid}
      onRowClick={row => router.push(`/dashboard/course-creator/enrollments/${row.uuid}/students`)}
      pageSize={15}
      emptyTitle='No courses or programs found'
      emptyDescription='Create a course or program first, then come back here to review the enrollments they collect.'
      toolbar={
        <Badge variant='secondary' className='rounded-md px-2.5 py-1 text-xs font-medium'>
          <Layers3 className='mr-1.5 size-3.5' />
          {contentWithCounts.length}
        </Badge>
      }
    />
  );
}
