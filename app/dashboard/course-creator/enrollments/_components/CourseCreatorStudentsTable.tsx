'use client';

import {
  ORDERS_PAGE_SIZE,
  useTrainingOrders,
} from '@/app/dashboard/_components/wallet/useTrainingOrders';
import { StatusBadge } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useCourseCreator } from '@/context/course-creator-context';
import { useTimeZone } from '@/context/timezone-context';
import { formatDate, formatTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { searchCoursesInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import {
  orderPaymentState,
  trainingEnrollmentKpis,
  type RateRange,
} from '@/src/features/wallet/training-orders';
import { formatWalletMoney } from '@/src/features/wallet/wallet-accounts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

const TABLE_COLUMNS = [
  'Class / course',
  'Lessons & schedule',
  'Enrolled students',
  'Active students',
  'Class hourly rate',
  'Fee / student / lesson',
];

function formatRate(range: RateRange | null, currency: string) {
  if (!range) return '—';
  const minimum = formatWalletMoney(range.min, currency);
  const maximum = formatWalletMoney(range.max, currency);
  return minimum === maximum ? minimum : `${minimum} – ${maximum}`;
}

export function CourseCreatorStudentsTable() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courseFilterOpen, setCourseFilterOpen] = useState(false);
  const creator = useCourseCreator();
  const term = useDeferredValue(query).trim().toLowerCase();
  const data = useTrainingOrders(
    'course_creator',
    page,
    selectedCourse === 'all' ? undefined : selectedCourse
  );
  const { zone } = useTimeZone();
  const creatorCourses = useInfiniteQuery({
    ...searchCoursesInfiniteOptions({
      query: {
        searchParams: { course_creator_uuid_eq: creator.profile?.uuid },
        pageable: { page: 0, size: ORDERS_PAGE_SIZE },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      if (last.error || last.success === false) return undefined;
      const metadata = last.data?.metadata;
      const nextPage = pages.length;
      const hasNext =
        metadata?.hasNext ??
        (metadata?.totalPages != null
          ? nextPage < metadata.totalPages
          : (last.data?.content?.length ?? 0) === ORDERS_PAGE_SIZE);
      return hasNext ? nextPage : undefined;
    },
    enabled: Boolean(creator.profile?.uuid && courseFilterOpen),
    staleTime: STALE_TIMES.entity,
  });
  const coursesFailed =
    creatorCourses.isError ||
    creatorCourses.data?.pages.some(page => page.error || page.success === false);
  const courseOptions = useMemo(() => {
    const courses = new Map(creator.courses.map(course => [course.uuid, course]));
    for (const row of data.rows) {
      if (row.course) courses.set(row.course.uuid, row.course);
    }
    for (const page of creatorCourses.data?.pages ?? []) {
      if (page.error || page.success === false) continue;
      for (const course of page.data?.content ?? []) courses.set(course.uuid, course);
    }
    return [...courses.values()]
      .filter(course => course.uuid && course.course_creator_uuid === creator.profile?.uuid)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [creator.courses, creator.profile?.uuid, creatorCourses.data, data.rows]);
  const enrollmentKpis = useMemo(
    () =>
      trainingEnrollmentKpis(
        data.sales,
        data.complete,
        selectedCourse === 'all' ? undefined : selectedCourse
      ),
    [data.sales, data.complete, selectedCourse]
  );

  const classes = useMemo(() => {
    const byClass = new Map(data.rows.map(row => [row.classUuid, row]));
    const currenciesByClass = new Map<string, Set<string>>();
    for (const row of data.rows) {
      const currencies = currenciesByClass.get(row.classUuid) ?? new Set<string>();
      currencies.add(row.currency);
      currenciesByClass.set(row.classUuid, currencies);
    }
    const paidStudents = new Map<string, Set<string>>();
    const missingStudentIds = new Set<string>();

    // Enrollment counts belong to a class, so combine its sales across currencies.
    for (const sale of data.sales) {
      const classUuid = sale.class_definition_uuid;
      if (!classUuid || !byClass.has(classUuid) || orderPaymentState(sale.payment_status) !== 'paid')
        continue;
      if (!sale.student_uuid) {
        missingStudentIds.add(classUuid);
        continue;
      }
      const students = paidStudents.get(classUuid) ?? new Set<string>();
      students.add(sale.student_uuid);
      paidStudents.set(classUuid, students);
    }

    return [...byClass.values()].map(row => {
      const classRow = {
        ...row,
        activeStudents: row.studentCountSource === 'active' ? row.students : null,
        pricingCurrencyKnown: currenciesByClass.get(row.classUuid)?.size === 1,
      };
      if (row.studentCountSource === 'active') return classRow;
      const students = missingStudentIds.has(row.classUuid)
        ? null
        : (paidStudents.get(row.classUuid)?.size ?? 0);
      return {
        ...classRow,
        students,
        studentCountSource: students == null ? 'unavailable' : 'paid',
        studentCountComplete: data.complete,
      };
    });
  }, [data.rows, data.sales, data.complete]);
  const rows = useMemo(
    () =>
      classes.filter(
        row =>
          !term ||
          [
            row.classTitle,
            row.course?.name,
            row.definition?.course_title,
            row.definition?.instructor?.display_name,
          ].some(value => value?.toLowerCase().includes(term))
      ),
    [classes, term]
  );

  if (data.isLoading) {
    return (
      <div className='space-y-4' aria-busy='true' aria-label='Loading class enrollments'>
        <Card className='gap-0 overflow-hidden py-0'>
          <div className='flex flex-col gap-3 p-4 sm:flex-row'>
            <Skeleton className='h-9 w-full max-w-md' />
            <Skeleton className='h-9 w-full sm:w-72' />
          </div>
          <div className='flex flex-wrap gap-x-8 gap-y-3 px-4 pb-4'>
            {['students', 'courses'].map(stat => (
              <div key={stat} className='space-y-1'>
                <Skeleton className='h-3 w-40' />
                <Skeleton className='h-7 w-16' />
                <Skeleton className='h-3 w-48' />
              </div>
            ))}
          </div>
          <Table className='min-w-[1120px]'>
            <TableHeader className='bg-muted/40'>
              <TableRow>
                {TABLE_COLUMNS.map(column => (
                  <TableHead key={column} className='px-4 py-3'>
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  {TABLE_COLUMNS.map(column => (
                    <TableCell key={column} className='space-y-2 px-4 py-4'>
                      <Skeleton className='h-4 w-28' />
                      <Skeleton className='h-3 w-24' />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }
  if (!data.hasProfile) {
    return (
      <EmptyState
        icon={Users}
        title='No course creator profile'
        description='Create a course creator profile to view class enrollments.'
      />
    );
  }
  if (data.salesFailed && data.rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title='Could not load classes'
        description='Please try again to load your class enrollments.'
        action={
          <Button variant='outline' disabled={data.isFetching} onClick={() => void data.refetch()}>
            {data.isFetching && <Spinner />}
            Retry classes
          </Button>
        }
      />
    );
  }

  return (
    <div className='space-y-4'>
      {!data.complete && (
        <EmptyState
          variant='compact'
          title={data.salesFailed ? 'Some records could not be loaded' : 'More records remain'}
          description='Load the remaining records to complete the class list and paid student counts.'
          action={
            <Button
              variant='outline'
              disabled={data.isFetching}
              onClick={() => void (data.salesFailed ? data.refetch() : data.loadMoreSales())}
            >
              {data.isFetching && <Spinner />}
              {data.salesFailed ? 'Retry records' : 'Load more records'}
            </Button>
          }
        />
      )}
      {data.detailsFailed && (
        <EmptyState
          variant='compact'
          title='Some class details are unavailable'
          description='Retry to load the class, course and schedule information.'
          action={
            <Button variant='outline' disabled={data.isFetching} onClick={() => void data.refetch()}>
              {data.isFetching && <Spinner />}
              Retry details
            </Button>
          }
        />
      )}
      {coursesFailed && (
        <EmptyState
          variant='compact'
          title='Some course filters are unavailable'
          description='Retry to load the remaining course names.'
          action={
            <Button
              variant='outline'
              disabled={creatorCourses.isFetching}
              onClick={() => void creatorCourses.refetch()}
            >
              {creatorCourses.isFetching && <Spinner />}
              Retry courses
            </Button>
          }
        />
      )}
      <Card className='gap-0 overflow-hidden py-0'>
        <div className='flex flex-col justify-between gap-3 p-4 sm:flex-row'>
          <Input
            type='search'
            aria-label='Search classes on this page'
            placeholder='Search class, course or instructor…'
            value={query}
            onChange={event => setQuery(event.target.value)}
            className='max-w-md'
          />
          <Select
            value={selectedCourse}
            onOpenChange={setCourseFilterOpen}
            onValueChange={value => {
              setSelectedCourse(value);
              setPage(0);
            }}
          >
            <SelectTrigger aria-label='Filter by your courses' className='w-full sm:w-72'>
              <SelectValue placeholder='All courses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All courses</SelectItem>
              {courseOptions.flatMap(course =>
                course.uuid ? (
                  <SelectItem key={course.uuid} value={course.uuid}>
                    {course.name}
                  </SelectItem>
                ) : []
              )}
              {creatorCourses.isFetching && (
                <div className='text-muted-foreground flex items-center gap-2 px-2 py-2 text-xs'>
                  <Spinner />
                  Loading courses…
                </div>
              )}
              {creatorCourses.hasNextPage && (
                <div className='border-t p-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='w-full'
                    disabled={creatorCourses.isFetching}
                    onClick={() => void creatorCourses.fetchNextPage()}
                  >
                    Load more courses
                  </Button>
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <dl className='flex flex-wrap gap-x-8 gap-y-3 px-4 pb-4' aria-live='polite'>
          {[
            {
              label: 'Total enrolled students',
              value: enrollmentKpis.students,
              complete: enrollmentKpis.studentsComplete,
              description:
                selectedCourse === 'all'
                  ? 'Distinct paid students across all courses'
                  : 'Distinct paid students in the selected course',
            },
            {
              label: 'Courses with enrolled students',
              value: enrollmentKpis.courses,
              complete: enrollmentKpis.coursesComplete,
              description: 'Courses with paid class enrollments',
            },
          ].map(stat => (
            <div key={stat.label} className='flex flex-row items-center gap-2 space-y-1'>
              <dd className='text-primary text-xl font-semibold tabular-nums'>
                {stat.complete
                  ? stat.value.toLocaleString()
                  : stat.value > 0
                    ? `≥ ${stat.value.toLocaleString()}`
                    : '—'}
              </dd>
              <dt className='text-muted-foreground text-[13px] font-medium'>{stat.label}</dt>
              {/* <dd className='text-muted-foreground text-xs'>
                {stat.description} · {stat.complete ? 'All records loaded' : 'Partial total'}
              </dd> */}
            </div>
          ))}
        </dl>

        <Table className='min-w-[1120px]'>
          <caption className='sr-only'>
            Classes, courses, lesson schedules, student counts and training rates
          </caption>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              {TABLE_COLUMNS.map(column => (
                <TableHead key={column} className='px-4 py-3'>
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMNS.length}>
                  <EmptyState
                    variant='plain'
                    icon={Users}
                    title={
                      selectedCourse !== 'all' || term || classes.length
                        ? 'No matching classes'
                        : 'No class enrollments yet'
                    }
                    description={
                      selectedCourse !== 'all' || term
                        ? 'Choose another course or clear your search.'
                        : 'Classes appear here when students place orders to enroll.'
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow key={row.classUuid}>
                  <TableCell className='max-w-72 px-4 py-4 whitespace-normal'>
                    <p className='font-semibold'>{row.classTitle}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {row.course?.name ?? row.definition?.course_title ?? 'Course unavailable'}
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {row.definition?.instructor?.display_name ?? 'Instructor details unavailable'}
                    </p>
                    {row.definition?.organisation_uuid && (
                      <StatusBadge className='mt-2' label='Organisation class' tone='neutral' />
                    )}
                  </TableCell>
                  <TableCell className='px-4 py-4'>
                    <p>
                      {row.sessions == null ? '—' : `${row.sessions} lessons`}
                      {row.completedSessions != null && ` · ${row.completedSessions} completed`}
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs' suppressHydrationWarning>
                      {formatDate(row.definition?.default_start_time, { zone })}
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs' suppressHydrationWarning>
                      {formatTime(row.definition?.default_start_time, { zone })} –{' '}
                      {formatTime(row.definition?.default_end_time, { zone })}
                    </p>
                  </TableCell>
                  <TableCell className='px-4 py-4 tabular-nums'>
                    {row.students == null
                      ? '—'
                      : `${row.studentCountComplete ? '' : '≥ '}${row.students}`}
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {row.studentCountSource === 'active'
                        ? 'Active enrollments'
                        : row.studentCountSource === 'paid'
                          ? row.studentCountComplete
                            ? 'Distinct paid students'
                            : 'Paid students · loaded so far'
                          : 'Not provided'}
                    </p>
                  </TableCell>
                  <TableCell className='px-4 py-4 tabular-nums'>
                    {row.activeStudents ?? '—'}
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {row.activeStudents == null ? 'Not provided' : 'Active enrollments'}
                    </p>
                  </TableCell>
                  <TableCell className='px-4 py-4 tabular-nums'>
                    {row.pricingCurrencyKnown
                      ? formatWalletMoney(row.configuredPrice, row.currency)
                      : '—'}
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {row.pricingCurrencyKnown ? 'Per student / hour' : 'Multiple order currencies'}
                    </p>
                  </TableCell>
                  <TableCell className='px-4 py-4 tabular-nums'>
                    {row.pricingCurrencyKnown && row.feePerLessonRange
                      ? formatRate(row.feePerLessonRange, row.currency)
                      : '—'}
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {!row.pricingCurrencyKnown
                        ? 'Multiple order currencies'
                        : row.feePerLessonRange
                          ? row.feePerLessonRange.min !== row.feePerLessonRange.max
                            ? 'Varies by lesson duration'
                            : 'Per student / lesson'
                          : row.configuredPrice == null
                            ? 'Class fee not provided'
                            : 'Lesson duration unavailable'}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-muted-foreground text-xs'>
          Page {page + 1} of {data.totalPages} · up to {ORDERS_PAGE_SIZE} classes per page. Search
          applies to this page.
        </p>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page === 0 || data.isFetching}
            onClick={() => setPage(value => value - 1)}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={page + 1 >= data.totalPages || data.isFetching}
            onClick={() => setPage(value => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
