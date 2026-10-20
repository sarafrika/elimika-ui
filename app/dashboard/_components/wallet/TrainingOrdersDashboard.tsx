'use client';

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
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTimeZone } from '@/context/timezone-context';
import { formatDate, formatTime } from '@/lib/date';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import {
  trainingOrderKpis,
  type RateRange,
  type TrainingWalletRole,
} from '@/src/features/wallet/training-orders';
import { formatWalletMoney } from '@/src/features/wallet/wallet-accounts';
import { ArrowUpRight, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { useTrainingOrders } from './useTrainingOrders';
import { WalletDashboardSkeleton } from './WalletPageSkeleton';

function formatRate(range: RateRange | null, currency: string) {
  if (!range) return '—';
  const minimum = formatWalletMoney(range.min, currency);
  const maximum = formatWalletMoney(range.max, currency);
  return minimum === maximum ? minimum : `${minimum} – ${maximum}`;
}

export function TrainingOrdersDashboard({ role }: { role: TrainingWalletRole }) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [currency, setCurrency] = useState('');
  const term = useDeferredValue(query).trim().toLowerCase();
  const data = useTrainingOrders(role, page);
  const { zone } = useTimeZone();
  const currencies = useMemo(
    () =>
      [
        ...new Set(
          data.sales.flatMap(sale => {
            const code = sale.order_currency_code?.trim().toUpperCase();
            return code ? [code] : [];
          })
        ),
      ].sort(),
    [data.sales]
  );
  const selectedCurrency = currencies.includes(currency) ? currency : (currencies[0] ?? 'KES');
  const orderKpis = useMemo(
    () => trainingOrderKpis(data.sales, selectedCurrency),
    [data.sales, selectedCurrency]
  );
  const rows = useMemo(
    () =>
      data.rows.filter(
        row =>
          row.currency === selectedCurrency &&
          (!term ||
            [row.classTitle, row.course?.name, row.definition?.instructor?.display_name].some(
              value => value?.toLowerCase().includes(term)
            ))
      ),
    [data.rows, selectedCurrency, term]
  );

  const total = useMemo(
    () =>
      (data.detailsFailed && !rows.length) || rows.some(row => row.total == null)
        ? null
        : rows.reduce((sum, row) => sum + (row.total ?? 0), 0),
    [rows, data.detailsFailed]
  );

  if (data.isLoading) return <WalletDashboardSkeleton variant='training' />;
  if (!data.hasProfile)
    return (
      <EmptyState
        icon={ReceiptText}
        title='Profile unavailable'
        description='Your training profile is needed to load class orders.'
      />
    );
  if (data.salesFailed && data.rows.length === 0)
    return (
      <EmptyState
        icon={ReceiptText}
        title='Could not load class orders'
        description='Please try again.'
        action={
          <Button variant='outline' disabled={data.isFetching} onClick={() => void data.refetch()}>
            {data.isFetching && <Spinner />}Retry orders
          </Button>
        }
      />
    );

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold'>Class orders</h2>
          <p className='text-muted-foreground text-sm'>
            {role === 'instructor'
              ? 'Student payments for the classes you teach.'
              : 'Student payments for classes delivering your courses.'}{' '}
            Revenue is shared using the course split.
          </p>
        </div>
        {currencies.length > 1 && (
          <Select value={selectedCurrency} onValueChange={setCurrency}>
            <SelectTrigger aria-label='Order currency'>
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
      <div className='space-y-2'>
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
          {[
            { label: 'All orders', value: orderKpis.all },
            { label: 'Complete', value: orderKpis.complete },
            { label: 'Cancelled', value: orderKpis.cancelled },
            { label: 'Incomplete', value: orderKpis.incomplete },
            { label: 'Refunds', value: orderKpis.refunds },
          ].map(tile => (
            <Card key={tile.label} className='min-w-0 gap-2 p-4'>
              <p className='text-muted-foreground text-xs'>{tile.label}</p>
              <p className='text-xl font-semibold break-words tabular-nums 2xl:text-2xl'>
                {formatWalletMoney(tile.value, selectedCurrency)}
              </p>
            </Card>
          ))}
        </div>
        <p className='text-muted-foreground text-xs'>
          Order amounts · {selectedCurrency} · {data.complete ? 'All sales loaded' : 'Loaded so far'}
          {!orderKpis.totalsAvailable && ' · Some amounts or payment statuses are unavailable'}
        </p>
      </div>
      {/* <div className='grid gap-3 sm:grid-cols-3'>
        {[
          { label: 'Classes shown', value: rows.length },
          {
            label: data.complete ? 'Total paid · shown classes' : 'Payments loaded · partial',
            value: formatWalletMoney(total, selectedCurrency),
          },
          {
            label: 'Scheduled lessons · shown classes',
            value: rows.some(row => row.sessions == null)
              ? '—'
              : rows.reduce((sum, row) => sum + (row.sessions ?? 0), 0),
          },
        ].map(tile => (
          <Card key={tile.label} className='gap-2 p-4'>
            <p className='text-muted-foreground text-xs'>{tile.label}</p>
            <p className='text-2xl font-semibold tabular-nums'>{tile.value}</p>
          </Card>
        ))}
      </div> */}
      {!data.complete && (
        <EmptyState
          variant='compact'
          title={data.salesFailed ? 'Some sales could not be loaded' : 'More sales records remain'}
          description='Class payments shown so far may be partial. Load remaining records to complete the totals, or open a class to see its own orders.'
          action={
            <Button
              variant='outline'
              disabled={data.isFetching}
              onClick={() => void (data.salesFailed ? data.refetch() : data.loadMoreSales())}
            >
              {data.isFetching && <Spinner />}
              {data.salesFailed ? 'Retry sales' : 'Load more sales'}
            </Button>
          }
        />
      )}
      {data.detailsFailed && (
        <EmptyState
          variant='compact'
          title='Some class details are unavailable'
          description='Payments remain visible. Retry to load class, course and schedule information.'
          action={
            <Button
              variant='outline'
              disabled={data.isFetching}
              onClick={() => void data.refetch()}
            >
              Retry details
            </Button>
          }
        />
      )}
      <Card className='gap-0 overflow-hidden py-0'>
        <div className='p-4'>
          <Input
            type='search'
            aria-label='Search classes on this page'
            placeholder='Search class, course or instructor…'
            value={query}
            onChange={event => setQuery(event.target.value)}
            className='max-w-md'
          />
        </div>
        <Table className='min-w-[1160px]'>
          <caption className='sr-only'>
            Class revenue, enrolled students, lesson fees, hourly rates and payments
          </caption>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              {[
                'Class / course',
                'Lessons & schedule',
                'Enrolled students',
                'Class hourly rate',
                'Fee / student / lesson',
                'Your revenue share',
                'Total order',
              ].map(label => (
                <TableHead key={label} className='px-4 py-3'>
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    variant='plain'
                    icon={ReceiptText}
                    title={data.rows.length ? 'No matching classes' : 'No class orders yet'}
                    description='Classes appear here when students place orders to enroll.'
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const definition = row.definition;
                const href = dashboardUrl(
                  role,
                  `wallet/orders/${encodeURIComponent(row.classUuid)}?currency=${encodeURIComponent(row.currency)}`
                );
                return (
                  <TableRow key={row.id}>
                    <TableCell className='max-w-72 px-4 py-4 whitespace-normal'>
                      <Link
                        href={href}
                        className='inline-flex items-center gap-1 font-semibold hover:underline'
                      >
                        {row.classTitle}
                        <ArrowUpRight aria-hidden className='size-3.5 shrink-0' />
                      </Link>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {row.course?.name ?? definition?.course_title ?? 'Course unavailable'}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {definition?.instructor?.display_name ?? 'Instructor details in order'}
                      </p>
                      {definition?.organisation_uuid && (
                        <StatusBadge className='mt-2' label='Organisation class' tone='neutral' />
                      )}
                    </TableCell>
                    <TableCell className='px-4 py-4'>
                      <p>
                        {row.sessions == null ? '—' : `${row.sessions} lessons`}
                        {row.completedSessions != null && ` · ${row.completedSessions} completed`}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs' suppressHydrationWarning>
                        {formatDate(definition?.default_start_time, { zone })}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs' suppressHydrationWarning>
                        {formatTime(definition?.default_start_time, { zone })} –{' '}
                        {formatTime(definition?.default_end_time, { zone })}
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
                      {formatWalletMoney(row.configuredPrice, row.currency)}
                      <p className='text-muted-foreground mt-1 text-xs'>Per student / hour</p>
                    </TableCell>
                    <TableCell className='px-4 py-4 tabular-nums'>
                      {row.feePerLessonRange
                        ? formatRate(row.feePerLessonRange, row.currency)
                        : '—'}
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {row.feePerLessonRange
                          ? row.feePerLessonRange.min !== row.feePerLessonRange.max
                            ? 'Varies by lesson duration'
                            : 'Per student / lesson'
                          : row.configuredPrice == null
                            ? 'Class fee not provided'
                            : 'Lesson duration unavailable'}
                      </p>
                    </TableCell>
                    <TableCell className='px-4 py-4'>
                      {role === 'instructor' && definition?.organisation_uuid ? (
                        <span className='text-xs'>Agreed instructor pay</span>
                      ) : row.share == null ? (
                        '—'
                      ) : (
                        `${row.share}%`
                      )}
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {row.course
                          ? `Creator ${row.course.creator_share_percentage}% · Trainer ${row.course.instructor_share_percentage}%`
                          : 'Split unavailable'}
                      </p>
                    </TableCell>
                    <TableCell className='px-4 py-4'>
                      <p className='font-semibold tabular-nums'>
                        {formatWalletMoney(row.total, row.currency)}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {data.complete ? 'Paid by students' : 'Loaded payments · partial'}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Unpaid {formatWalletMoney(row.pending, row.currency)}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Refunded {formatWalletMoney(row.refunded, row.currency)}
                      </p>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <ul className='text-muted-foreground list-disc space-y-1 pl-4 text-xs'>
        <li>Total order includes fully paid class items only.</li>
        <li>Pending, cancelled and refunded orders do not count as earnings.</li>
        <li>A dash means the source data is unavailable.</li>
        <li>Rates may vary by lesson duration.</li>
        <li>The class hourly rate is the configured sale price per student.</li>
        <li>Each lesson fee is that rate multiplied by the lesson’s hours.</li>
        <li>The ≥ marker means more sales records may increase the displayed student count.</li>
      </ul>

      <div className='flex items-center justify-between gap-3'>
        <p className='text-muted-foreground text-xs'>
          Page {page + 1} of {data.totalPages}
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
