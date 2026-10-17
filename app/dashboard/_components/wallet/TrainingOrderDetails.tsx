'use client';

import { StatusBadge } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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
import { useUserProfile } from '@/context/profile-context';
import { useTimeZone } from '@/context/timezone-context';
import { useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { formatDate, formatTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionOptions,
  getClassDefinitionQueryKey,
  getClassSchedulesOptions,
  getClassSchedulesQueryKey,
  getCourseByUuidOptions,
  getCourseByUuidQueryKey,
  getEnrollmentsForClassOptions,
  getEnrollmentsForClassQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import {
  buildTrainingOrders,
  classRateBasis,
  lessonEarnings,
  type TrainingWalletRole,
} from '@/src/features/wallet/training-orders';
import { formatWalletMoney } from '@/src/features/wallet/wallet-accounts';
import { skipToken, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useTrainingSales } from './useTrainingSales';

const hoursLabel = (value: number | null) =>
  value == null ? '—' : `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} h`;

export function TrainingOrderDetails({
  role,
  classUuid,
}: {
  role: TrainingWalletRole;
  classUuid: string;
}) {
  const profile = useUserProfile();
  const profileUuid =
    role === 'instructor' ? profile?.instructor?.uuid : profile?.courseCreator?.uuid;
  const enabled = Boolean(profileUuid && classUuid);
  const { zone } = useTimeZone();
  const params = useSearchParams();
  const [currency, setCurrency] = useState(params.get('currency') ?? '');
  const [page, setPage] = useState(0);
  const definitionOptions = classUuid
    ? getClassDefinitionOptions({ path: { uuid: classUuid } })
    : undefined;
  const definitionQuery = useQuery({
    ...definitionOptions,
    queryKey: definitionOptions?.queryKey ?? getClassDefinitionQueryKey({ path: { uuid: '' } }),
    queryFn: definitionOptions?.queryFn ?? skipToken,
    enabled,
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const definition =
    definitionQuery.data?.error || definitionQuery.data?.success === false
      ? undefined
      : definitionQuery.data?.data?.class_definition;
  const courseOptions = definition?.course_uuid
    ? getCourseByUuidOptions({ path: { uuid: definition.course_uuid } })
    : undefined;
  const courseQuery = useQuery({
    ...courseOptions,
    queryKey: courseOptions?.queryKey ?? getCourseByUuidQueryKey({ path: { uuid: '' } }),
    queryFn: courseOptions?.queryFn ?? skipToken,
    enabled: enabled && Boolean(courseOptions),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const course =
    courseQuery.data?.error || courseQuery.data?.success === false
      ? undefined
      : courseQuery.data?.data;
  const salesQuery = useTrainingSales(role, enabled, classUuid);
  // The sales endpoint enforces the acting role. Secondary private details are requested only
  // after it confirms an order for this class, including for delegated organisation instructors.
  const hasOrder = salesQuery.sales.some(sale => sale.class_definition_uuid === classUuid);
  const scheduleOptions = classUuid
    ? getClassSchedulesOptions({ query: { class_uuids: [classUuid] } })
    : undefined;
  const scheduleQuery = useQuery({
    ...scheduleOptions,
    queryKey:
      scheduleOptions?.queryKey ?? getClassSchedulesQueryKey({ query: { class_uuids: [] } }),
    queryFn: scheduleOptions?.queryFn ?? skipToken,
    enabled: enabled && hasOrder,
    staleTime: STALE_TIMES.live,
    retry: false,
  });
  const enrollmentOptions = classUuid
    ? getEnrollmentsForClassOptions({ path: { uuid: classUuid } })
    : undefined;
  const enrollmentQuery = useQuery({
    ...enrollmentOptions,
    queryKey: enrollmentOptions?.queryKey ?? getEnrollmentsForClassQueryKey({ path: { uuid: '' } }),
    queryFn: enrollmentOptions?.queryFn ?? skipToken,
    enabled: enabled && hasOrder,
    staleTime: STALE_TIMES.live,
    retry: false,
  });
  const attendanceAvailable =
    // Course creators receive only their own enrollment, not the class roster.
    (role === 'instructor' ||
      Boolean(
        profile?.instructor?.uuid &&
        profile.instructor.uuid === definition?.default_instructor_uuid
      )) &&
    !enrollmentQuery.isError &&
    !enrollmentQuery.data?.error &&
    enrollmentQuery.data?.success !== false &&
    Boolean(enrollmentQuery.data?.data);
  const enrollments = useMemo(
    () => (attendanceAvailable ? (enrollmentQuery.data?.data ?? []) : []),
    [attendanceAvailable, enrollmentQuery.data]
  );
  const schedules = useMemo(
    () =>
      scheduleQuery.data?.error || scheduleQuery.data?.success === false
        ? []
        : (scheduleQuery.data?.data ?? [])
          .filter(session => session.class_definition_uuid === classUuid)
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [scheduleQuery.data, classUuid]
  );
  const instructorIds = useMemo(
    () => [...new Set(schedules.map(session => session.instructor_uuid))],
    [schedules]
  );
  const instructors = useInstructorsByIds(instructorIds);
  const orders = useMemo(
    () =>
      buildTrainingOrders({
        sales: salesQuery.sales.filter(sale => sale.class_definition_uuid === classUuid),
        classMap: definition ? { [classUuid]: { ...definition, hasFullDefinition: true } } : {},
        courseMap: course && definition?.course_uuid ? { [definition.course_uuid]: course } : {},
        schedules,
        salesComplete: salesQuery.complete,
        role,
      }),
    [salesQuery.sales, salesQuery.complete, classUuid, definition, course, schedules, role]
  );
  const currencies = orders.map(order => order.currency);
  const selectedCurrency = currencies.includes(currency) ? currency : currencies[0];
  const order = orders.find(item => item.currency === selectedCurrency);
  // Use the same class total / paid-student fallback as the orders listing.
  // A successful roster response can still be filtered to the current user.
  const studentCount = order?.students ?? null;
  const completeStudentCount = order?.studentCountComplete ? studentCount : null;
  // Class pricing has no currency field. Avoid attaching one rate to multiple sale currencies.
  const pricingCurrencyKnown = currencies.length === 1;
  const lessons = useMemo(
    () =>
      definition
        ? schedules.map(session => ({
          session,
          earnings: lessonEarnings({
            session,
            definition,
            course,
            enrollments,
            role,
            attendanceAvailable,
          }),
        }))
        : [],
    [definition, schedules, course, enrollments, role, attendanceAvailable]
  );
  const completedEarnings = useMemo(() => {
    const completed = lessons.filter(lesson => lesson.session.status === 'COMPLETED');
    return {
      gross: completed.some(lesson => lesson.earnings.earnedGross == null)
        ? null
        : completed.reduce((sum, lesson) => sum + (lesson.earnings.earnedGross ?? 0), 0),
      payable: completed.some(lesson => lesson.earnings.payable == null)
        ? null
        : completed.reduce((sum, lesson) => sum + (lesson.earnings.payable ?? 0), 0),
    };
  }, [lessons]);
  const failed =
    definitionQuery.isError ||
    Boolean(definitionQuery.data?.error) ||
    definitionQuery.data?.success === false;
  const sessionsFailed =
    scheduleQuery.isError ||
    Boolean(scheduleQuery.data?.error) ||
    scheduleQuery.data?.success === false;
  const retry = () =>
    Promise.all([
      definitionQuery.refetch(),
      salesQuery.refetch(),
      ...(courseOptions ? [courseQuery.refetch()] : []),
      ...(hasOrder ? [scheduleQuery.refetch(), enrollmentQuery.refetch()] : []),
    ]);
  const back = (
    <Button asChild variant='ghost' className='w-fit'>
      <Link href={dashboardUrl(role, 'wallet')}>
        <ArrowLeft aria-hidden className='size-4' />
        Back to wallet
      </Link>
    </Button>
  );

  if (profile?.isLoading || definitionQuery.isLoading || salesQuery.isLoading)
    return (
      <div className='space-y-4 p-4' role='status' aria-label='Loading class order'>
        <Skeleton className='h-24' />
        <Skeleton className='h-80' />
      </div>
    );
  if (!enabled || failed || !definition || (!hasOrder && !salesQuery.hasNextPage))
    return (
      <div className='space-y-4 p-4'>
        {back}
        <EmptyState
          icon={ReceiptText}
          title='Class order unavailable'
          description='This order could not be loaded for your current role.'
          action={
            <Button variant='outline' onClick={() => void retry()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  const money = (value: number | null | undefined) =>
    selectedCurrency ? formatWalletMoney(value, selectedCurrency) : '—';
  const estimate = (value: number | null | undefined) =>
    pricingCurrencyKnown ? money(value) : '—';
  const rateBasis = classRateBasis(
    definition ? { ...definition, hasFullDefinition: true } : undefined
  );
  const employed = role === 'instructor' && Boolean(definition.organisation_uuid);

  return (
    <div className='space-y-6 p-4 lg:p-6'>
      {back}
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Class order details</p>
          <h1 className='mt-1 text-2xl font-semibold'>{definition.title}</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            {course?.name ?? 'Course details unavailable'}
          </p>
          {definition.description && (
            <p className='mt-3 max-w-3xl text-sm'>{definition.description}</p>
          )}
        </div>
        {currencies.length > 1 && (
          <Select value={selectedCurrency} onValueChange={setCurrency}>
            <SelectTrigger aria-label='Class order currency'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(code => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {!salesQuery.complete && (
        <EmptyState
          variant='compact'
          title={
            salesQuery.failed ? 'Sales are temporarily unavailable' : 'Class payments are partial'
          }
          description='Load all sales for this class to complete its total order amount.'
          action={
            <Button
              variant='outline'
              disabled={salesQuery.isFetching}
              onClick={() =>
                void (salesQuery.failed ? salesQuery.refetch() : salesQuery.fetchNextPage())
              }
            >
              {salesQuery.isFetching && <Spinner />}
              {salesQuery.failed ? 'Retry payments' : 'Load more class payments'}
            </Button>
          }
        />
      )}
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {[
          {
            label: salesQuery.complete
              ? 'Total order · paid by students'
              : 'Payments loaded · partial',
            value: money(order?.total),
          },
          {
            label: 'Enrolled students',
            value:
              studentCount == null
                ? '—'
                : `${order?.studentCountComplete ? '' : '≥ '}${studentCount}`,
            description:
              order?.studentCountSource === 'paid'
                ? order.studentCountComplete
                  ? 'Distinct paid students'
                  : 'Paid students · loaded so far'
                : undefined,
          },
          {
            label: 'Lessons / completed',
            value:
              sessionsFailed || scheduleQuery.isLoading
                ? '—'
                : `${schedules.filter(session => session.status !== 'CANCELLED').length} / ${schedules.filter(session => session.status === 'COMPLETED').length}`,
          },
          {
            label: employed ? 'Agreed pay per completed lesson' : 'Your revenue share',
            value: employed
              ? estimate(definition.instructor_pay)
              : order?.share == null
                ? '—'
                : `${order.share}%`,
          },
          {
            label: 'Earned gross · estimate',
            value: estimate(
              sessionsFailed || scheduleQuery.isLoading ? null : completedEarnings.gross
            ),
          },
          {
            label: 'Your payable · estimate',
            value: estimate(
              sessionsFailed || scheduleQuery.isLoading ? null : completedEarnings.payable
            ),
          },
        ].map(tile => (
          <Card key={tile.label} className='gap-2 p-4'>
            <p className='text-muted-foreground text-xs'>{tile.label}</p>
            <p className='text-2xl font-semibold tabular-nums'>{tile.value}</p>
            {tile.description && (
              <p className='text-muted-foreground text-xs'>{tile.description}</p>
            )}
          </Card>
        ))}
      </div>
      <Card className='gap-3 p-4'>
        <h2 className='font-semibold'>Rates & revenue split</h2>
        <p className='text-sm'>
          Class rate: {estimate(definition.sale_price)}{' '}
          {rateBasis?.replaceAll('_', ' ') ?? '· rate basis unavailable'} per student. Fee per
          lesson and hourly rate appear below for each session.
        </p>
        <p className='text-muted-foreground text-sm'>
          {course
            ? `Course creator ${course.creator_share_percentage}% · ${definition.organisation_uuid ? 'Training organisation' : 'Instructor'} ${course.instructor_share_percentage}%.`
            : 'Course split unavailable.'}{' '}
          {employed
            ? 'Your session pay is the agreement with the organisation; the course split applies to the organisation’s training revenue.'
            : ''}
        </p>
        {course?.revenue_share_notes && (
          <p className='text-muted-foreground text-sm'>{course.revenue_share_notes}</p>
        )}
        <p className='text-muted-foreground text-sm'>
          Location:{' '}
          {definition.location_name ||
            definition.location_type?.replaceAll('_', ' ').toLowerCase() ||
            'Unavailable'}{' '}
          · {definition.session_format?.toLowerCase()}
        </p>
      </Card>
      {!attendanceAvailable && !enrollmentQuery.isLoading && hasOrder && (
        <EmptyState
          variant='compact'
          title='Attendance is unavailable'
          description='Earnings that depend on attendance cannot be calculated until attendance is accessible.'
          action={
            <Button variant='outline' onClick={() => void enrollmentQuery.refetch()}>
              Retry attendance
            </Button>
          }
        />
      )}
      <div className='space-y-2'>
        <h2 className='text-lg font-semibold'>Lesson earnings</h2>
        <p className='text-muted-foreground text-sm'>
          Estimates use current class rates and the course split. For hourly and per-session rates,
          teaching time is capped at the scheduled duration and prorated when shorter. Attendance
          must be marked for every enrolled student. Estimates exclude payment adjustments and
          platform fees; settled wallet amounts remain authoritative.
          {employed
            ? ' Organisation instructor pay uses the agreed fee for a completed session.'
            : ''}
          {!pricingCurrencyKnown
            ? ' A single pricing currency is required to calculate monetary estimates.'
            : ''}
          {rateBasis === 'per_day'
            ? ' Daily prices require a daily allocation from the billing service; lesson amounts are unavailable.'
            : ''}
        </p>
      </div>
      <Card className='gap-0 overflow-hidden py-0'>
        {scheduleQuery.isLoading || enrollmentQuery.isLoading ? (
          <Skeleton className='h-64' />
        ) : sessionsFailed ? (
          <EmptyState
            title='Could not load class sessions'
            action={
              <Button variant='outline' onClick={() => void scheduleQuery.refetch()}>
                Retry sessions
              </Button>
            }
          />
        ) : (
          <Table className='min-w-[1300px]'>
            <caption className='sr-only'>
              Session details, attendance, teaching hours, gross earnings and estimated payable
              share
            </caption>
            <TableHeader>
              <TableRow>
                {[
                  'Lesson / session',
                  'Teaching hours',
                  'Attendance',
                  'Hourly rate / student',
                  'Fee / student / lesson',
                  'Full lesson value',
                  'Earned gross',
                  'Your payable estimate',
                ].map(label => (
                  <TableHead key={label} className='px-4 py-3'>
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      variant='plain'
                      title='No scheduled lessons'
                      description='Scheduled class sessions will appear here.'
                    />
                  </TableCell>
                </TableRow>
              ) : (
                lessons.slice(page * 20, (page + 1) * 20).map(({ session, earnings }, index) => (
                  <TableRow key={session.uuid ?? `${session.start_time}:${index}`}>
                    <TableCell className='max-w-64 px-4 py-4 whitespace-normal'>
                      <p className='font-medium'>
                        {page * 20 + index + 1}. {session.title}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs' suppressHydrationWarning>
                        {formatDate(session.start_time, { zone })} ·{' '}
                        {formatTime(session.start_time, { zone })} –{' '}
                        {formatTime(session.end_time, { zone })}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {session.location_name || session.location_type?.toLowerCase()} ·{' '}
                        {session.timezone}
                      </p>
                      <StatusBadge
                        className='mt-2'
                        label={session.status?.toLowerCase() ?? 'Unavailable'}
                        tone={
                          session.status === 'COMPLETED'
                            ? 'success'
                            : session.status === 'CANCELLED'
                              ? 'destructive'
                              : 'neutral'
                        }
                      />
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {instructors.instructorMap[session.instructor_uuid]?.full_name ??
                          'Instructor details unavailable'}
                      </p>
                      {session.cancellation_reason && (
                        <p className='text-muted-foreground mt-1 text-xs'>
                          {session.cancellation_reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className='px-4 py-4'>
                      <p>{hoursLabel(earnings.hours)} required</p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {hoursLabel(earnings.actualHours)} taught
                      </p>
                      {session.started_at && (
                        <p className='text-muted-foreground mt-1 text-xs' suppressHydrationWarning>
                          Started {formatTime(session.started_at, { zone })}
                        </p>
                      )}
                      {session.concluded_at && (
                        <p className='text-muted-foreground mt-1 text-xs' suppressHydrationWarning>
                          Ended {formatTime(session.concluded_at, { zone })}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className='px-4 py-4'>
                      {earnings.attended ?? '—'} / {earnings.enrolled ?? completeStudentCount ?? '—'}
                      <p className='text-muted-foreground mt-1 text-xs'>Attended / enrolled</p>
                    </TableCell>
                    <TableCell className='px-4 py-4 tabular-nums'>
                      {estimate(
                        earnings.fee != null && earnings.hours != null
                          ? earnings.fee / earnings.hours
                          : null
                      )}
                    </TableCell>
                    <TableCell className='px-4 py-4 tabular-nums'>
                      {estimate(earnings.fee)}
                    </TableCell>
                    <TableCell className='px-4 py-4 tabular-nums'>
                      {estimate(
                        completeStudentCount != null && earnings.fee != null
                          ? completeStudentCount * earnings.fee
                          : null
                      )}
                      <p className='text-muted-foreground mt-1 text-xs'>
                        For all enrolled students, trained at full hours
                      </p>

                    </TableCell>
                    <TableCell className='px-4 py-4 tabular-nums'>
                      {estimate(earnings.earnedGross)}
                    </TableCell>
                    <TableCell className='px-4 py-4 font-semibold tabular-nums'>
                      {estimate(earnings.payable)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
      {lessons.length > 20 && (
        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            disabled={page === 0}
            onClick={() => setPage(value => value - 1)}
          >
            Previous lessons
          </Button>
          <span className='text-muted-foreground text-sm'>
            Page {page + 1} of {Math.ceil(lessons.length / 20)}
          </span>
          <Button
            variant='outline'
            disabled={(page + 1) * 20 >= lessons.length}
            onClick={() => setPage(value => value + 1)}
          >
            Next lessons
          </Button>
        </div>
      )}
    </div>
  );
}
