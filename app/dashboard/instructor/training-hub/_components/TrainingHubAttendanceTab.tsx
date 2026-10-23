'use client';

import { useQueries } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { hasApiError } from '@/components/lesson/workbook-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUserProfile } from '@/context/profile-context';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { formatDateTimeWithZone } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { getClassDefinitionsForInstructorOptions } from '@/services/client/@tanstack/react-query.gen';
import type { AttendanceMark, ClassAttendanceMatrix } from './attendance-matrix';
import { useInstructorAttendanceData } from './useInstructorAttendanceData';

const CLASSES_PER_PAGE = 4;

function AttendanceLoading() {
  return (
    <div className='space-y-4' role='status' aria-label='Loading class attendance'>
      {Array.from({ length: CLASSES_PER_PAGE }, (_, index) => (
        <Skeleton key={index} className='h-28 w-full rounded-xl' />
      ))}
    </div>
  );
}

function AttendanceCell({ mark }: { mark?: AttendanceMark }) {
  if (!mark)
    return (
      <span className='text-muted-foreground' aria-label='Not enrolled'>
        —
      </span>
    );
  if (mark === 'UNMARKED') return <Badge variant='secondary'>Not marked</Badge>;
  return (
    <Badge
      variant='outline'
      className={
        mark === 'PRESENT'
          ? 'border-success/20 bg-success/10 text-success'
          : 'border-destructive/20 bg-destructive/10 text-destructive'
      }
    >
      {mark === 'PRESENT' ? 'Present' : 'Absent'}
    </Badge>
  );
}

function AttendanceTable({
  title,
  matrix,
  names,
}: {
  title: string;
  matrix: ClassAttendanceMatrix;
  names: Map<string, string>;
}) {
  const rows = useMemo(
    () =>
      matrix.studentIds
        .map(id => ({ id, name: names.get(id) ?? 'Student' }))
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    [matrix.studentIds, names]
  );

  if (!matrix.sessions.length) return <EmptyState title='No class instances scheduled' />;
  if (!rows.length) return <EmptyState title='No students enrolled in these class instances' />;

  return (
    <div className='space-y-3'>
      <p className='text-muted-foreground text-xs'>
        Not marked means attendance has not been recorded. A dash means the student is not enrolled
        in that instance.
      </p>
      <div className='min-w-0 overflow-hidden rounded-lg border'>
        <Table className='min-w-max' aria-label={`${title} student attendance`}>
          <TableHeader>
            <TableRow className='bg-muted/40'>
              <TableHead scope='col' className='bg-card sticky left-0 z-20 min-w-44 px-4'>
                Student
              </TableHead>
              {matrix.sessions.map((session, index) => (
                <TableHead key={session.uuid} scope='col' className='min-w-48 px-4 py-3'>
                  <div className='font-semibold'>Class instance {index + 1}</div>
                  <div className='text-muted-foreground mt-1 text-xs font-normal'>
                    {formatDateTimeWithZone(session.start_time, { zone: session.timezone })}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(student => (
              <TableRow key={student.id}>
                <TableHead
                  scope='row'
                  className='bg-card sticky left-0 z-10 max-w-60 min-w-44 px-4 py-4 whitespace-normal'
                >
                  {student.name}
                </TableHead>
                {matrix.sessions.map(session => (
                  <TableCell key={session.uuid} className='px-4 py-4'>
                    <AttendanceCell mark={matrix.marks.get(student.id)?.get(session.uuid)} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function TrainingHubAttendanceTab() {
  const profile = useUserProfile();
  const instructorUuid = profile?.instructor?.uuid;
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim().toLowerCase());
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const classOptions = useMemo(
    () =>
      instructorUuid
        ? [
            {
              ...getClassDefinitionsForInstructorOptions({ path: { instructorUuid } }),
              enabled: Boolean(instructorUuid),
              staleTime: STALE_TIMES.entity,
            },
          ]
        : [],
    [instructorUuid]
  );
  const [classesQuery] = useQueries({ queries: classOptions });

  const classes = useMemo(() => {
    if (hasApiError(classesQuery?.data)) return [];
    const items = (classesQuery?.data?.data ?? []).flatMap(item => {
      const definition = item.class_definition;
      return definition?.uuid
        ? [
            {
              uuid: definition.uuid,
              title: definition.title || 'Untitled class',
              courseTitle: item.course_title || item.program_title || '',
            },
          ]
        : [];
    });
    return [...new Map(items.map(item => [item.uuid, item])).values()].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [classesQuery?.data]);
  const filteredClasses = useMemo(
    () => classes.filter(item => `${item.title} ${item.courseTitle}`.toLowerCase().includes(query)),
    [classes, query]
  );
  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / CLASSES_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleClasses = useMemo(
    () =>
      filteredClasses.slice(currentPage * CLASSES_PER_PAGE, (currentPage + 1) * CLASSES_PER_PAGE),
    [filteredClasses, currentPage]
  );
  const classIds = useMemo(() => visibleClasses.map(item => item.uuid), [visibleClasses]);
  const attendance = useInstructorAttendanceData(classIds);

  // Display identities are batched across the open cards, never fetched per student or class.
  const studentIds = useMemo(
    () =>
      attendance.isLoading || attendance.isError
        ? []
        : [
            ...new Set(
              classIds
                .filter(id => expanded.has(id))
                .flatMap(id => attendance.matrices.get(id)?.studentIds ?? [])
            ),
          ],
    [attendance.isLoading, attendance.isError, attendance.matrices, classIds, expanded]
  );
  const students = useStudentsByIds(studentIds);
  const userIds = useMemo(
    () =>
      studentIds.flatMap(id => {
        const userId = students.studentMap[id]?.user_uuid;
        return userId ? [userId] : [];
      }),
    [studentIds, students.studentMap]
  );
  const users = useUsersByIds(userIds);
  const names = useMemo(
    () =>
      new Map(
        studentIds.map(id => {
          const student = students.studentMap[id];
          const user = student?.user_uuid ? users.userMap[student.user_uuid] : undefined;
          const name = user?.full_name || student?.full_name;
          return [id, typeof name === 'string' && name.trim() ? name : 'Student'];
        })
      ),
    [studentIds, students.studentMap, users.userMap]
  );
  const namesLoading = students.isLoading || users.isLoading;
  const namesError = students.isError || users.isError;

  if (profile?.isLoading || classesQuery?.isLoading) return <AttendanceLoading />;
  if (!instructorUuid)
    return <EmptyState title='An instructor profile is required to view attendance' />;
  if (classesQuery?.isError || hasApiError(classesQuery?.data))
    return (
      <EmptyState
        title='Unable to load your classes'
        action={
          <Button variant='outline' onClick={() => void classesQuery?.refetch()}>
            Retry
          </Button>
        }
      />
    );
  if (!classes.length)
    return (
      <EmptyState
        title='No classes to show'
        description='Attendance will appear here when you have enrolled students in your classes.'
      />
    );

  return (
    <section className='min-w-0 space-y-5 py-4' aria-label='Class attendance'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='space-y-1'>
          <h2 className='text-xl font-semibold'>Class attendance</h2>
          <p className='text-muted-foreground text-sm'>
            Expand a class to see enrolled students across its sessions. Totals count recorded
            attendance per student and session.
          </p>
        </div>
        <div className='relative w-full sm:max-w-xs'>
          <Search
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
            aria-hidden='true'
          />
          <Input
            type='search'
            aria-label='Search classes for attendance'
            placeholder='Search classes...'
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setPage(0);
            }}
            className='pl-9'
          />
        </div>
      </div>

      {!filteredClasses.length ? (
        <EmptyState title='No classes match your search' />
      ) : attendance.isError ? (
        <EmptyState
          title='Unable to load class attendance'
          action={
            <Button variant='outline' onClick={attendance.retry}>
              Retry
            </Button>
          }
        />
      ) : attendance.isLoading ? (
        <AttendanceLoading />
      ) : (
        <div className='space-y-4'>
          {visibleClasses.map(item => {
            const matrix = attendance.matrices.get(item.uuid);
            if (!matrix) return null;
            const open = expanded.has(item.uuid);
            return (
              <Collapsible
                key={item.uuid}
                open={open}
                onOpenChange={nextOpen =>
                  setExpanded(current => {
                    const next = new Set(current);
                    if (nextOpen) next.add(item.uuid);
                    else next.delete(item.uuid);
                    return next;
                  })
                }
                asChild
              >
                <Card
                  className='min-w-0 gap-0 overflow-hidden'
                  aria-label={`${item.title} attendance`}
                >
                  <CardHeader className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='min-w-0 space-y-1'>
                      <h3 className='text-base font-semibold'>{item.title}</h3>
                      {item.courseTitle && (
                        <p className='text-muted-foreground text-sm'>{item.courseTitle}</p>
                      )}
                      <p className='text-muted-foreground text-xs'>
                        {matrix.studentIds.length} students · {matrix.sessions.length} class
                        instances
                      </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-4'>
                      <dl
                        className='flex flex-wrap items-center gap-4 text-sm'
                        aria-label={`${item.title} attendance totals`}
                      >
                        <div>
                          <dt className='text-muted-foreground text-xs'>Attended</dt>
                          <dd className='text-success font-semibold'>{matrix.totals.present}</dd>
                        </div>
                        <div>
                          <dt className='text-muted-foreground text-xs'>Absent</dt>
                          <dd className='text-destructive font-semibold'>{matrix.totals.absent}</dd>
                        </div>
                        <div>
                          <dt className='text-muted-foreground text-xs'>Not marked</dt>
                          <dd className='font-semibold'>{matrix.totals.unmarked}</dd>
                        </div>
                      </dl>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant='outline'
                          size='sm'
                          aria-label={`${open ? 'Hide' : 'View'} attendance for ${item.title}`}
                        >
                          {open ? 'Hide attendance' : 'View attendance'}
                          <ChevronDown
                            className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
                            aria-hidden='true'
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className='min-w-0 border-t pt-4'>
                      {namesLoading ? (
                        <Skeleton className='h-44 w-full' aria-label='Loading student names' />
                      ) : namesError ? (
                        <EmptyState
                          title='Unable to load student names'
                          action={
                            <Button
                              variant='outline'
                              onClick={() => {
                                void students.refetch();
                                void users.refetch();
                              }}
                            >
                              Retry
                            </Button>
                          }
                        />
                      ) : (
                        <AttendanceTable title={item.title} matrix={matrix} names={names} />
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-muted-foreground text-sm'>
            Page {currentPage + 1} of {totalPages} · {filteredClasses.length} classes
          </p>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className='size-4' />
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage + 1 >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
