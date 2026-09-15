'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { formatDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseEnrollmentsInfiniteOptions,
  getEnrollmentsForClassOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useDeferredValue, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { hasApiError, nextWorkbookPage, WORKBOOK_PAGE_SIZE } from './workbook-data';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';

const TaskGradingSheet = dynamic(
  () => import('./TaskGradingSheet').then(module => module.TaskGradingSheet),
  { loading: () => <WorkbookLoading /> }
);

export type LessonGradingTask = {
  id: string;
  kind: 'assignment' | 'quiz';
  uuid: string;
  title: string;
  maxPoints?: number;
  dueAt?: Date;
};

export function LessonGradingPanel({
  classId,
  courseId,
  sessionId,
  tasks,
}: {
  classId: string;
  courseId: string;
  sessionId?: string;
  tasks: LessonGradingTask[];
}) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [selected, setSelected] = useState<{
    studentId: string;
    studentName: string;
    enrollmentId: string;
    task: LessonGradingTask;
  } | null>(null);
  const [savedGrades, setSavedGrades] = useState<Record<string, string>>({});
  const rosterQuery = useQuery({
    ...getEnrollmentsForClassOptions({ path: { uuid: classId } }),
    enabled: Boolean(classId && sessionId),
    staleTime: STALE_TIMES.live,
  });
  // Submissions belong to course enrollments, not the session attendance enrollment.
  const courseQuery = useInfiniteQuery({
    ...getCourseEnrollmentsInfiniteOptions({
      path: { courseUuid: courseId },
      query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(courseId && sessionId),
    staleTime: STALE_TIMES.live,
  });
  const roster = useMemo(() => {
    if (hasApiError(rosterQuery.data)) return [];
    return [
      ...new Map(
        (rosterQuery.data?.data ?? [])
          .filter(
            entry =>
              entry.scheduled_instance_uuid === sessionId &&
              ['ENROLLED', 'ATTENDED', 'ABSENT'].includes(entry.status ?? '')
          )
          .map(entry => [entry.student_uuid, entry])
      ).values(),
    ];
  }, [rosterQuery.data, sessionId]);
  const courseEnrollments = useMemo(
    () =>
      new Map(
        (
          courseQuery.data?.pages.flatMap(page =>
            hasApiError(page) ? [] : (page.data?.content ?? [])
          ) ?? []
        )
          .filter(entry => entry.course_uuid === courseId && entry.uuid)
          .map(entry => [entry.student_uuid, entry])
      ),
    [courseQuery.data, courseId]
  );
  const studentIds = useMemo(() => roster.map(entry => entry.student_uuid), [roster]);
  const students = useStudentsByIds(studentIds);
  const userIds = useMemo(
    () =>
      studentIds.flatMap(id =>
        students.studentMap[id]?.user_uuid ? [students.studentMap[id].user_uuid] : []
      ),
    [studentIds, students.studentMap]
  );
  const users = useUsersByIds(userIds);
  const rows = useMemo(
    () =>
      roster
        .map(entry => ({
          studentId: entry.student_uuid,
          enrollmentId: courseEnrollments.get(entry.student_uuid)?.uuid,
          name:
            users.userMap[students.studentMap[entry.student_uuid]?.user_uuid]?.full_name ||
            students.studentMap[entry.student_uuid]?.full_name ||
            'Student',
        }))
        .filter(entry => entry.name.toLowerCase().includes(deferredSearch)),
    [roster, courseEnrollments, users.userMap, students.studentMap, deferredSearch]
  );

  if (!sessionId) return <EmptyState title='Select a class session to grade its students' />;
  if (rosterQuery.isLoading || courseQuery.isLoading || students.isLoading || users.isLoading)
    return <WorkbookLoading />;
  if (
    rosterQuery.isError ||
    courseQuery.isError ||
    hasApiError(rosterQuery.data) ||
    courseQuery.data?.pages.some(hasApiError) ||
    students.isError ||
    users.isError
  ) {
    return (
      <WorkbookError
        title='Unable to load students for grading'
        retry={() => {
          void rosterQuery.refetch();
          void courseQuery.refetch();
          void students.refetch();
          void users.refetch();
        }}
      />
    );
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>Grading</h2>
        <p className='text-muted-foreground text-sm'>
          Review each student's assigned tasks for this lesson and save their grades.
        </p>
        <Input
          aria-label='Search students for grading'
          placeholder='Search students'
          value={search}
          onChange={event => setSearch(event.target.value)}
          className='max-w-sm'
        />
      </div>
      {!roster.length ? (
        <EmptyState title='No students enrolled in this session' />
      ) : !rows.length ? (
        <EmptyState title='No students match your search' />
      ) : (
        rows.map(student => (
          <Card key={student.studentId}>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage src={""} alt={student.name} />
                  <AvatarFallback>
                    {student.name
                      .split(' ')
                      .map((name: string) => name[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className='min-w-0'>
                  <CardTitle className='truncate text-base'>
                    {student.name}
                  </CardTitle>

                  <p className='text-muted-foreground text-sm'>
                    {tasks.length} assigned {tasks.length === 1 ? 'task' : 'tasks'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!tasks.length ? (
                <EmptyState title='No tasks assigned for this lesson' />
              ) : (
                <Table aria-label={`Assigned tasks for ${student.name}`}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assigned task</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Grading due</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell className='min-w-40 font-medium whitespace-normal'>
                          {task.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>
                            {task.kind === 'assignment' ? 'Assignment' : 'Quiz'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(task.dueAt, { fallback: 'No deadline' })}
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-wrap items-center gap-2'>
                            {savedGrades[`${student.studentId}-${task.id}`] && (
                              <Badge variant='outline'>
                                {savedGrades[`${student.studentId}-${task.id}`]}
                              </Badge>
                            )}
                            <Button
                              size='sm'
                              variant='outline'
                              disabled={!student.enrollmentId}
                              onClick={() => {
                                if (student.enrollmentId)
                                  setSelected({
                                    studentId: student.studentId,
                                    studentName: student.name,
                                    enrollmentId: student.enrollmentId,
                                    task,
                                  });
                              }}
                              aria-label={`Review and grade ${task.title} for ${student.name}`}
                            >
                              Review & grade
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!student.enrollmentId && (
                <p className='text-muted-foreground mt-3 text-sm'>
                  {courseQuery.hasNextPage
                    ? 'Load more student records below to enable grading for this student.'
                    : 'This student has no course enrollment available for grading.'}
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
      {courseQuery.hasNextPage && (
        <Button
          variant='outline'
          disabled={courseQuery.isFetchingNextPage}
          onClick={() => void courseQuery.fetchNextPage()}
        >
          Load more student records
        </Button>
      )}
      {selected && (
        <TaskGradingSheet
          key={`${selected.enrollmentId}-${selected.task.id}`}
          {...selected}
          onClose={() => setSelected(null)}
          onGraded={grade =>
            setSavedGrades(previous => ({
              ...previous,
              [`${selected.studentId}-${selected.task.id}`]: grade,
            }))
          }
        />
      )}
    </div>
  );
}
