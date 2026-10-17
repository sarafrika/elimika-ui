'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/lib/error-utils';
import { formatCount, toNumber } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { ChevronDown, CircleAlert, GraduationCap, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import type { InstructorOffering } from './instructor-data';
import { useApprovedInstructorClasses } from './useApprovedInstructorClasses';
import { useCreatorInstructors } from './useCreatorInstructors';

const VISIBLE_OFFERINGS = 2;
const HEADING = 'px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap uppercase';
const plural = (n: number, word: string) =>
  `${formatCount(n, '0')} ${n === 1 ? word : word === 'class' ? 'classes' : `${word}s`}`;

function SplitBar({ offering }: { offering: InstructorOffering }) {
  const { creatorShare, instructorShare } = offering;
  if (creatorShare == null || instructorShare == null || (!creatorShare && !instructorShare)) {
    return (
      <Badge variant='outline' className='text-muted-foreground shrink-0 border-dashed font-normal'>
        {offering.kind === 'program' ? 'Split unavailable' : 'Split not set'}
      </Badge>
    );
  }
  return (
    <div
      className='w-28 shrink-0'
      role='img'
      aria-label={`Revenue split: you ${creatorShare}%, instructor ${instructorShare}%`}
    >
      <div className='bg-muted flex h-1.5 overflow-hidden rounded-full'>
        <div className='bg-primary' style={{ width: `${creatorShare}%` }} />
        <div className='bg-primary/30' style={{ width: `${instructorShare}%` }} />
      </div>
      <div className='text-muted-foreground mt-1 flex justify-between text-[11px] tabular-nums'>
        <span>{creatorShare}%</span>
        <span>{instructorShare}%</span>
      </div>
    </div>
  );
}

function Count({
  value,
  loading,
  partial = false,
}: {
  value: number | null;
  loading: boolean;
  partial?: boolean;
}) {
  if (loading) return <Skeleton className='ml-auto h-4 w-8' />;
  return (
    <span
      className={cn('text-sm tabular-nums', value ? 'font-semibold' : 'text-muted-foreground')}
      title={
        value == null
          ? 'This count is unavailable'
          : partial
            ? 'Count of classes loaded so far'
            : undefined
      }
    >
      {value == null ? '—' : `${partial ? '≥ ' : ''}${formatCount(value, '0')}`}
    </span>
  );
}

export default function ApprovedInstructors() {
  const [search, setSearch] = useState('');
  const searchTerm = useDeferredValue(search).trim().toLowerCase();
  const [kind, setKind] = useState<'all' | 'course' | 'program'>('all');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const data = useCreatorInstructors();
  const classData = useApprovedInstructorClasses(
    data.instructorIds,
    data.courseIds,
    data.programIds
  );

  const rows = useMemo(
    () =>
      data.instructors
        .map(instructor => {
          const offerings = instructor.offerings
            .filter(offering => kind === 'all' || offering.kind === kind)
            .map(offering => {
              const classes = classData.classes.filter(
                item =>
                  item.default_instructor_uuid === instructor.uuid &&
                  (offering.kind === 'course'
                    ? item.course_uuid === offering.uuid
                    : item.program_uuid === offering.uuid)
              );
              const counts = classes.map(item =>
                item.uuid ? classData.classMap[item.uuid]?.enrolled_count : undefined
              );
              const students =
                classData.hasError ||
                  classData.countsError ||
                  classData.hasNextPage ||
                  counts.some(count => count == null)
                  ? null
                  : counts.reduce<number>((total, count) => total + toNumber(count), 0);
              return { ...offering, classes, students };
            });
          const uniqueClasses = new Set(
            offerings.flatMap(offering =>
              offering.classes.flatMap(item => (item.uuid ? [item.uuid] : []))
            )
          );
          const studentCounts = [...uniqueClasses].map(
            uuid => classData.classMap[uuid]?.enrolled_count
          );
          const students =
            classData.hasError ||
              classData.countsError ||
              classData.hasNextPage ||
              studentCounts.some(count => count == null)
              ? null
              : studentCounts.reduce<number>((total, count) => total + toNumber(count), 0);
          return { ...instructor, offerings, classCount: uniqueClasses.size, students };
        })
        .filter(
          instructor =>
            instructor.offerings.length > 0 &&
            [
              instructor.name,
              instructor.profile?.professional_headline,
              ...instructor.offerings.flatMap(offering => [
                offering.name,
                ...offering.classes.map(item => item.title),
              ]),
            ].some(value => value?.toLowerCase().includes(searchTerm))
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [
      data.instructors,
      data.courseIds,
      data.courseCount,
      kind,
      classData.classes,
      classData.classMap,
      classData.hasError,
      classData.countsError,
      classData.hasNextPage,
      searchTerm,
    ]
  );

  const toggle = (uuid: string) =>
    setExpanded(previous => {
      const next = new Set(previous);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  const filters: { id: typeof kind; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: data.courseCount + data.programCount },
    { id: 'course', label: 'Courses', count: data.courseCount },
    { id: 'program', label: 'Programs', count: data.programCount },
  ];
  const classCountsLoading = data.isLoading || classData.isLoading;
  const partialClasses = classData.hasNextPage || classData.hasError;

  return (
    <div className='space-y-4'>
      <Card className='gap-0 overflow-hidden rounded-2xl py-0'>
        <div className='flex flex-wrap items-center justify-between gap-4 p-4'>
          <div>
            {data.isLoading ? (
              <Skeleton className='mb-2 h-5 w-44' />
            ) : (
              <h2 className='text-base font-semibold'>
                {plural(data.instructors.length, 'approved instructor')}
              </h2>
            )}
            <p className='text-muted-foreground text-sm'>
              Approved to teach {plural(data.courseCount, 'course')} and{' '}
              {plural(data.programCount, 'program')} you created
              {data.hasNextPage ? ' (loaded so far)' : ''}.
            </p>
          </div>
          <div className='flex w-full flex-wrap items-center gap-3 sm:w-auto'>
            <div
              role='group'
              aria-label='Filter by approved content type'
              className='bg-muted/60 flex rounded-lg p-0.5'
            >
              {filters.map(filter => (
                <Button
                  key={filter.id}
                  type='button'
                  variant='ghost'
                  size='sm'
                  aria-pressed={kind === filter.id}
                  onClick={() => setKind(filter.id)}
                  className={cn(
                    'h-8 rounded-md px-3',
                    kind === filter.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  )}
                >
                  {filter.label}
                  <span className='text-muted-foreground ml-1.5 text-xs tabular-nums'>
                    {filter.count}
                  </span>
                </Button>
              ))}
            </div>
            <label className='relative block w-full sm:w-72'>
              <span className='sr-only'>Search instructors, courses, programs or classes</span>
              <Search
                aria-hidden
                className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2'
              />
              <Input
                type='search'
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder='Search instructors or content…'
                className='h-9 pl-9'
              />
            </label>
          </div>
        </div>

        {data.isLoading && data.instructors.length === 0 ? (
          <div className='space-y-2 border-t p-4' aria-label='Loading approved instructors'>
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className='h-16 w-full' />
            ))}
          </div>
        ) : !data.hasProfile ? (
          <EmptyState
            icon={GraduationCap}
            title='Course creator profile unavailable'
            description='A course creator profile is needed to view your instructors.'
          />
        ) : data.hasError && data.instructors.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title='Could not load instructors'
            description={getErrorMessage(data.error, 'Please try again.')}
            action={
              <Button variant='outline' onClick={() => void data.refetch()}>
                Retry
              </Button>
            }
          />
        ) : data.instructors.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title='No approved instructors yet'
            description='Instructors appear here once their application to teach one of your courses or programs is approved.'
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title='No instructors match your filters'
            description='Try another name or content type, or load more approvals.'
          />
        ) : (
          <div className='border-t'>
            <Table className='min-w-[1000px] text-left'>
              <caption className='sr-only'>
                Approved instructors, courses and programs, revenue splits, instructor-owned
                classes, student enrolments and ratings.
              </caption>
              <TableHeader className='bg-muted/40'>
                <TableRow className='hover:bg-transparent'>
                  <TableHead scope='col' className={cn(HEADING, 'min-w-60')}>
                    Instructor
                  </TableHead>
                  <TableHead scope='col' className={HEADING}>
                    <div className='flex items-center justify-between gap-6'>
                      <span>Courses &amp; programs</span>

                      <span className='flex flex-col gap-1 font-medium tracking-normal normal-case'>
                        <span>Split</span>

                        <span className='inline-flex items-center gap-3 text-xs'>
                          <span className='inline-flex items-center gap-1'>
                            <span aria-hidden className='bg-primary size-2 rounded-full' />
                            You
                          </span>

                          <span className='inline-flex items-center gap-1'>
                            <span aria-hidden className='bg-primary/30 size-2 rounded-full' />
                            Instructor
                          </span>
                        </span>
                      </span>
                    </div>
                  </TableHead>
                  <TableHead scope='col' className={cn(HEADING, 'text-right')}>
                    Classes
                  </TableHead>
                  <TableHead
                    scope='col'
                    className={cn(HEADING, 'text-right')}
                    title='Enrolments across listed classes. A learner in multiple classes is counted in each class.'
                  >
                    Students
                  </TableHead>
                  <TableHead scope='col' className={HEADING}>
                    Rating
                  </TableHead>
                  <TableHead scope='col' className={HEADING}>
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(instructor => {
                  const isOpen = expanded.has(instructor.uuid);
                  const hidden = instructor.offerings.length - VISIBLE_OFFERINGS;
                  const offerings = isOpen
                    ? instructor.offerings
                    : instructor.offerings.slice(0, VISIBLE_OFFERINGS);
                  const reviewCount = toNumber(instructor.profile?.review_count);
                  const average = instructor.profile?.rating_avg;
                  return (
                    <TableRow key={instructor.uuid} className='hover:bg-muted/30'>
                      <TableHead scope='row' className='px-4 py-4 font-normal'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='size-9 shrink-0'>
                            <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                              {instructor.name
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map(part => part[0]?.toUpperCase())
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className='min-w-0'>
                            <Link
                              href={`/dashboard/course-creator/instructors/${encodeURIComponent(instructor.uuid)}`}
                              className='hover:text-primary focus-visible:ring-ring block max-w-56 truncate rounded-sm text-sm font-semibold focus-visible:ring-2'
                              title={instructor.name}
                            >
                              {instructor.name}
                            </Link>
                            {instructor.profile?.professional_headline ? (
                              <p
                                className='text-muted-foreground max-w-56 truncate text-xs'
                                title={instructor.profile.professional_headline}
                              >
                                {instructor.profile.professional_headline}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableHead>
                      <TableCell className='w-full max-w-0 min-w-80 px-4 py-4 whitespace-normal'>
                        <div id={`instructor-offerings-${instructor.uuid}`} className='divide-y'>
                          {offerings.map(offering => (
                            <div
                              key={`${offering.kind}-${offering.uuid}`}
                              className='flex items-start justify-between gap-6 py-2.5 first:pt-0 last:pb-0'
                            >

                              <div className='min-w-0 flex-1'>
                                <div className='mb-1 flex flex-wrap items-center gap-2'>
                                  {offering.name ? (
                                    <div
                                      className='break-words text-sm font-medium'
                                      title={offering.name}
                                    >
                                      {offering.name}

                                      <Badge
                                        variant={offering.kind === 'program' ? 'success' : 'default'}
                                        className='ml-2 shrink-0 px-1.5 py-0 text-[10px] font-medium italic'
                                      >
                                        {offering.kind === 'course' ? 'Course' : 'Program'}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <div className='text-muted-foreground flex items-center gap-1.5 text-sm italic'>
                                      <CircleAlert aria-hidden className='size-3.5 shrink-0' />
                                      {offering.kind === 'course' ? 'Course' : 'Program'} details
                                      unavailable

                                      <Badge
                                        variant={offering.kind === 'program' ? 'success' : 'default'}
                                        className='ml-2 shrink-0 px-1.5 py-0 text-[10px] font-medium italic'
                                      >
                                        {offering.kind === 'course' ? 'Course' : 'Program'}
                                      </Badge>
                                    </div>
                                  )}

                                </div>

                                {classCountsLoading ? (
                                  <Skeleton className='mt-1 h-3 w-32' />
                                ) : (
                                  <p className='text-muted-foreground mt-0.5 text-xs'>
                                    {partialClasses ? 'At least ' : ''}
                                    {plural(offering.classes.length, 'class')}
                                    {offering.students != null && !classData.countsLoading
                                      ? ` · ${plural(offering.students, 'student')}`
                                      : ''}
                                  </p>
                                )}

                                {isOpen && offering.classes.length > 0 ? (
                                  <ul
                                    className='text-muted-foreground mt-2 space-y-1 text-xs'
                                    aria-label='Instructor-created classes'
                                  >
                                    {offering.classes.map(item => (
                                      <li key={item.uuid} className='flex items-start gap-1.5'>
                                        <GraduationCap
                                          aria-hidden
                                          className='mt-0.5 size-3 shrink-0'
                                        />
                                        <span className='break-words'>
                                          {item.title || 'Untitled class'}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>

                              <div className='pt-1'>
                                <SplitBar offering={offering} />
                              </div>
                            </div>
                          ))}
                        </div>
                        {hidden > 0 || instructor.classCount > 0 ? (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => toggle(instructor.uuid)}
                            aria-expanded={isOpen}
                            aria-controls={`instructor-offerings-${instructor.uuid}`}
                            className='text-primary mt-2 h-auto gap-1 p-0 text-xs hover:bg-transparent hover:underline'
                          >
                            {isOpen
                              ? 'Show fewer'
                              : hidden > 0
                                ? `Show ${hidden} more`
                                : 'Show class details'}
                            <ChevronDown
                              aria-hidden
                              className={cn(
                                'size-3.5 transition-transform motion-reduce:transition-none',
                                isOpen && 'rotate-180'
                              )}
                            />
                          </Button>
                        ) : null}
                      </TableCell>
                      <TableCell className='px-4 py-4 text-right'>
                        <Count
                          value={
                            classData.hasError && instructor.classCount === 0
                              ? null
                              : instructor.classCount
                          }
                          loading={classCountsLoading}
                          partial={partialClasses && instructor.classCount > 0}
                        />
                      </TableCell>
                      <TableCell className='px-4 py-4 text-right'>
                        <Count
                          value={instructor.students}
                          loading={classCountsLoading || classData.countsLoading}
                        />
                      </TableCell>
                      <TableCell className='px-4 py-4'>
                        {reviewCount > 0 && average != null ? (
                          <span className='inline-flex items-center gap-1'>
                            <Star aria-hidden className='fill-warning text-warning size-3.5' />
                            <span className='font-semibold tabular-nums'>{average.toFixed(1)}</span>
                            <span className='text-muted-foreground text-xs'>
                              ({formatCount(reviewCount, '0')})
                            </span>
                          </span>
                        ) : (
                          <span className='text-muted-foreground text-sm'>
                            {instructor.profile ? 'No reviews' : 'Unavailable'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='px-4 py-4'>
                        <Badge
                          variant='secondary'
                          className='bg-primary/10 text-primary gap-1.5 rounded-full'
                        >
                          <span aria-hidden className='bg-primary size-1.5 rounded-full' />
                          Approved
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
      {data.hasError && data.instructors.length > 0 ? (
        <EmptyState
          variant='compact'
          title='Some approvals could not be loaded'
          description='The course and program approvals already loaded are shown above.'
          action={
            <Button variant='outline' onClick={() => void data.refetch()}>
              Retry approvals
            </Button>
          }
        />
      ) : null}
      {classData.hasError ? (
        <EmptyState
          variant='compact'
          title='Some classes could not be loaded'
          description='Available classes are shown above. Counts may be incomplete.'
          action={
            <Button variant='outline' onClick={() => void classData.refetch()}>
              Retry classes
            </Button>
          }
        />
      ) : null}
      {classData.hasNextPage ? (
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <p className='text-muted-foreground text-xs'>
            Class counts reflect the classes loaded so far.
          </p>
          <Button
            variant='outline'
            disabled={classData.isFetching}
            onClick={() => void classData.loadMore()}
          >
            {classData.isFetching && <Spinner />}Load more classes
          </Button>
        </div>
      ) : null}
      {data.hasNextPage ? (
        <div className='flex justify-center'>
          <Button variant='outline' disabled={data.isFetching} onClick={() => void data.loadMore()}>
            {data.isFetchingNextPage && <Spinner />}Load more approvals
          </Button>
        </div>
      ) : null}
    </div>
  );
}
