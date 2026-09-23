'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Mail, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/date';
import { formatCount, toNumber } from '@/lib/metrics';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type {
  EnrollmentStatusEnum2,
  InstructorClassOption,
  InstructorStudent,
} from '@/services/client';
import { listInstructorStudentsOptions } from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { StatusBadge, StatusTone } from '@/components/data-display';

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;
const ALL_CLASSES = 'all';
const TABLE_MIN_WIDTH = 'min-w-[920px]';

const STATUS_BADGES: Record<EnrollmentStatusEnum2, { label: string; tone: StatusTone }> = {
  ENROLLED: { label: 'Active', tone: 'success' },
  RESERVED: { label: 'Reserved', tone: 'info' },
  WAITLISTED: { label: 'Waitlisted', tone: 'warning' },
  ATTENDED: { label: 'Completed', tone: 'neutral' },
  ABSENT: { label: 'Absent', tone: 'warning' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

const SESSION_FORMAT_LABELS: Record<string, string> = {
  GROUP: 'Group session',
  INDIVIDUAL: '1-on-1',
};

const REMOTE_LOCATION_LABELS: Record<string, string> = {
  ONLINE: 'Online',
  HYBRID: 'Hybrid',
};

function initials(name?: string) {
  return (
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function classMeta(student: InstructorStudent) {
  const course =
    student.course_name && student.course_name !== student.class_title ? student.course_name : null;
  const format = student.session_format ? SESSION_FORMAT_LABELS[student.session_format] : null;
  return [course, format, student.schedule_summary].filter(Boolean).join(' · ');
}

function branchLabel(student: InstructorStudent) {
  const remote = student.location_type ? REMOTE_LOCATION_LABELS[student.location_type] : undefined;
  if (student.branch_name) {
    return remote ? `${student.branch_name} · ${remote}` : student.branch_name;
  }
  return remote ?? '—';
}

function attendanceLabel(rate?: number | null) {
  return typeof rate === 'number' ? `${Math.round(rate)}%` : '—';
}

function countLabel(count: number, singular: string, pluralForm: string) {
  return `${formatCount(count, '0')} ${count === 1 ? singular : pluralForm}`;
}

type InstructorStudentsPanelProps = {
  organisationUuid: string;
  instructorUuid: string;
};

export function InstructorStudentsPanel({
  organisationUuid,
  instructorUuid,
}: InstructorStudentsPanelProps) {
  const titleId = useId();
  const classSelectId = useId();
  const enabled = Boolean(organisationUuid && instructorUuid);
  const path = { organisationUuid, instructorUuid };

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [classUuid, setClassUuid] = useState('');

  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return;
    const timer = setTimeout(() => setSearch(next), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Paging is keyed to the filters, so a new search or class starts again on page 1.
  const filterKey = `${search}|${classUuid}`;
  const [paging, setPaging] = useState({ filterKey, page: 0 });
  const page = paging.filterKey === filterKey ? paging.page : 0;
  const goToPage = (next: number) => setPaging({ filterKey, page: Math.max(0, next) });
  const isFiltered = Boolean(search || classUuid);

  // The unfiltered first page carries the headline totals and shares its cache entry with the roster.
  const overviewQuery = useQuery({
    ...listInstructorStudentsOptions({ path, query: { page: 0, size: PAGE_SIZE } }),
    enabled,
    staleTime: STALE_TIMES.live,
  });
  const rosterQuery = useQuery({
    ...listInstructorStudentsOptions({
      path,
      query: {
        ...(search ? { search } : {}),
        ...(classUuid ? { class_definition_uuid: classUuid } : {}),
        page,
        size: PAGE_SIZE,
      },
    }),
    enabled,
    staleTime: STALE_TIMES.live,
    placeholderData: keepPreviousData,
  });

  const overview = overviewQuery.data?.data;
  const overviewTotal = toNumber(overview?.metadata?.totalElements, overview?.content?.length ?? 0);
  const studentCount = toNumber(overview?.student_count, 0);
  const classOptions = (overview?.class_options ?? []).filter(
    (option): option is InstructorClassOption & { class_definition_uuid: string } =>
      Boolean(option.class_definition_uuid)
  );

  const roster = rosterQuery.data?.data;
  const rows = roster?.content ?? [];
  const filteredTotal = toNumber(roster?.metadata?.totalElements, rows.length);
  const totalPages = Math.max(
    1,
    roster?.metadata?.totalPages ?? Math.ceil(filteredTotal / PAGE_SIZE)
  );
  const shownPage = roster?.metadata?.pageNumber ?? page;
  const firstRow = shownPage * PAGE_SIZE + 1;
  const lastRow = shownPage * PAGE_SIZE + rows.length;

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setClassUuid('');
  };

  return (
    <section
      aria-labelledby={titleId}
      className='border-border/70 bg-card min-w-0 overflow-hidden rounded-md border shadow-sm'
    >
      <div className='border-border/60 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4'>
        <div className='min-w-0 space-y-1'>
          <h2 id={titleId} className='text-foreground text-base font-semibold'>
            Students
          </h2>
          <p className='text-muted-foreground text-sm'>
            Everyone this instructor teaches in your organisation&apos;s classes, across all
            courses.
          </p>
        </div>
        {overviewQuery.isPending ? (
          <Skeleton className='h-6 w-36 rounded-md' />
        ) : overview ? (
          <Badge
            variant='outline'
            className='border-primary/30 bg-primary/10 text-primary rounded-md'
          >
            {countLabel(studentCount, 'student', 'students')} across{' '}
            {countLabel(classOptions.length, 'class', 'classes')}
          </Badge>
        ) : null}
      </div>

      <AsyncSection
        loading={overviewQuery.isPending}
        error={overviewQuery.error}
        empty={overviewTotal === 0}
        onRetry={() => void overviewQuery.refetch()}
        className='rounded-none border-0'
        skeleton={<RosterSkeleton withToolbar />}
        emptyState={
          <EmptyState
            variant='plain'
            icon={Users}
            title='No students yet'
            description='Students appear here once they enrol in a class this instructor teaches for your organisation.'
            action={
              <Button asChild size='sm' variant='outline'>
                <Link href={dashboardUrl('organisation', 'invite-students')}>
                  <Mail className='size-4' />
                  Invite students
                </Link>
              </Button>
            }
          />
        }
      >
        <div className='border-border/60 flex flex-col gap-3 border-b px-5 py-3.5 sm:flex-row sm:flex-wrap sm:items-center'>
          <div className='relative w-full sm:max-w-xs'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              type='search'
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              placeholder='Search by student name'
              aria-label='Search students'
              className='pl-9'
            />
          </div>
          <div className='flex w-full items-center gap-2 sm:w-auto'>
            <Label htmlFor={classSelectId} className='text-muted-foreground shrink-0 font-normal'>
              Class
            </Label>
            <Select
              value={classUuid || ALL_CLASSES}
              onValueChange={value => setClassUuid(value === ALL_CLASSES ? '' : value)}
            >
              <SelectTrigger id={classSelectId} className='w-full min-w-0 sm:w-72'>
                <SelectValue placeholder='All classes' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CLASSES}>All classes</SelectItem>
                {classOptions.map(option => (
                  <SelectItem
                    key={option.class_definition_uuid}
                    value={option.class_definition_uuid}
                  >
                    {option.class_title || 'Untitled class'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AsyncSection
          loading={rosterQuery.isPending}
          error={rosterQuery.error}
          empty={rows.length === 0}
          onRetry={() => void rosterQuery.refetch()}
          errorTitle='Couldn’t load these students'
          className='rounded-none border-0'
          skeleton={<RosterSkeleton />}
          emptyState={
            isFiltered || page === 0 ? (
              <EmptyState
                variant='plain'
                icon={Search}
                title='No students match'
                description='Clear the search or pick another class.'
                action={
                  <Button size='sm' variant='outline' onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                variant='plain'
                icon={Users}
                title='Nothing on this page'
                description='The list is shorter than this page. Go back to the first page.'
                action={
                  <Button size='sm' variant='outline' onClick={() => goToPage(0)}>
                    Go to first page
                  </Button>
                }
              />
            )
          }
        >
          <div
            aria-busy={rosterQuery.isFetching}
            className={cn('transition-opacity', rosterQuery.isPlaceholderData && 'opacity-60')}
          >
            <StudentsTable students={rows} />
            <div className='border-border/60 flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-muted-foreground text-sm'>
                Showing {formatCount(firstRow, '0')}–{formatCount(lastRow, '0')} of{' '}
                {formatCount(filteredTotal, '0')}
              </p>
              <div className='flex items-center justify-between gap-2 sm:justify-end'>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={page <= 0}
                  onClick={() => goToPage(page - 1)}
                >
                  <ArrowLeft className='size-4' />
                  Previous
                </Button>
                <span className='text-muted-foreground text-sm whitespace-nowrap'>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={rosterQuery.isPlaceholderData || page + 1 >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                  <ArrowRight className='size-4' />
                </Button>
              </div>
            </div>
          </div>
        </AsyncSection>
      </AsyncSection>
    </section>
  );
}

function StudentsTable({ students }: { students: InstructorStudent[] }) {
  return (
    <Table className={TABLE_MIN_WIDTH} aria-label='Students taught by this instructor'>
      <TableHeader className='bg-muted/40'>
        <TableRow className='hover:bg-transparent'>
          <TableHead className='text-muted-foreground px-5 text-xs'>Student</TableHead>
          <TableHead className='text-muted-foreground px-3 text-xs'>Class</TableHead>
          <TableHead className='text-muted-foreground px-3 text-xs'>Branch</TableHead>
          <TableHead className='text-muted-foreground px-3 text-xs'>Enrolled</TableHead>
          <TableHead className='text-muted-foreground px-3 text-xs'>Attendance</TableHead>
          <TableHead className='text-muted-foreground px-5 text-xs'>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map(student => {
          const status = student.enrollment_status
            ? STATUS_BADGES[student.enrollment_status]
            : undefined;
          const meta = classMeta(student);
          return (
            <TableRow
              key={`${student.student_uuid}-${student.class_definition_uuid}`}
              className='border-border/60'
            >
              <TableCell className='px-5 py-3'>
                <div className='flex min-w-0 items-center gap-2.5'>
                  <Avatar className='size-8'>
                    <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                      {initials(student.student_name)}
                    </AvatarFallback>
                  </Avatar>
                  {student.student_uuid ? (
                    <Link
                      href={dashboardUrl(
                        'organisation',
                        `students/${encodeURIComponent(student.student_uuid)}`
                      )}
                      className='text-foreground truncate font-medium hover:underline'
                    >
                      {student.student_name || 'Unnamed student'}
                    </Link>
                  ) : (
                    <span className='text-foreground truncate font-medium'>
                      {student.student_name || 'Unnamed student'}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className='max-w-[340px] px-3 py-3 whitespace-normal'>
                <p className='text-foreground font-medium'>
                  {student.class_title || 'Untitled class'}
                </p>
                {meta ? <p className='text-muted-foreground text-xs'>{meta}</p> : null}
              </TableCell>
              <TableCell className='text-muted-foreground px-3 py-3'>
                {branchLabel(student)}
              </TableCell>
              <TableCell className='text-muted-foreground px-3 py-3'>
                {formatDate(student.enrolled_at)}
              </TableCell>
              <TableCell className='px-3 py-3 font-mono tabular-nums'>
                {attendanceLabel(student.attendance_rate)}
              </TableCell>
              <TableCell className='px-5 py-3'>
                <StatusBadge
                  status={student.enrollment_status}
                  tone={status?.tone}
                  label={status?.label}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function RosterSkeleton({ withToolbar = false }: { withToolbar?: boolean }) {
  return (
    <div aria-hidden='true'>
      {withToolbar ? (
        <div className='border-border/60 flex flex-col gap-3 border-b px-5 py-3.5 sm:flex-row sm:items-center'>
          <Skeleton className='h-9 w-full rounded-md sm:max-w-xs' />
          <Skeleton className='h-9 w-full rounded-md sm:w-80' />
        </div>
      ) : null}
      <div className='overflow-hidden'>
        <div className='bg-muted/40 border-border/60 h-10 border-b' />
        {Array.from({ length: PAGE_SIZE }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'border-border/60 grid grid-cols-[1.3fr_1.8fr_1fr_7rem_6rem_6rem] items-center gap-3 border-b px-5 py-3',
              TABLE_MIN_WIDTH
            )}
          >
            <div className='flex items-center gap-2.5'>
              <Skeleton className='size-8 rounded-full' />
              <Skeleton className='h-4 w-28' />
            </div>
            <div className='space-y-1.5'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-3 w-36' />
            </div>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-10' />
            <Skeleton className='h-5 w-16 rounded-md' />
          </div>
        ))}
      </div>
    </div>
  );
}
