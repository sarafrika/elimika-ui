'use client';

import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Enrollment } from '@/services/client';
import {
  getEnrollmentsForClassOptions,
  getWalletOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Mail, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useInstructor } from '../../../../../context/instructor-context';
import {
  type InstructorClassWithSchedule,
  useInstructorClassesWithSchedules,
} from '../../../../../hooks/use-instructor-classes-with-schedules';

type RevenueTab = 'overview' | 'transaction-history' | 'withdraw';
type RevenueStatus = 'fulfilled' | 'partial' | 'pending' | 'cancelled' | 'refund';

type RevenueRow = {
  id: string;
  classTitle: string;
  orderDate: string;
  location: string;
  deliveryStatus: string;
  statusKey: RevenueStatus;
  sessions: number;
  duration: string;
  students: number;
  sessionFee: number;
  feePerStudent: number;
  classFees: number;
  currencyCode: string;
  sortDate: number;
};

const revenueTabs: { value: RevenueTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'transaction-history', label: 'Transaction History' },
  { value: 'withdraw', label: 'Withdraw' },
];

const STATUS_LABEL_MAP: Record<RevenueStatus, string> = {
  fulfilled: 'Fulfilled',
  partial: 'Partially',
  pending: 'Pending',
  cancelled: 'Cancelled',
  refund: 'Refund',
};

const statusTone: Record<RevenueStatus, string> = {
  fulfilled: 'bg-success/10 text-success',
  partial: 'bg-warning/10 text-warning',
  pending: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/10 text-destructive',
  refund: 'bg-muted text-muted-foreground',
};

const truncateText = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const formatCurrency = (amount: number, currencyCode = 'KES') =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (dateValue?: Date | string | null) => {
  if (!dateValue) return '-';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDuration = (hours: number) => {
  if (hours <= 0) return '-';

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours > 0 && minutes > 0) return `${wholeHours}h ${minutes}m`;
  if (wholeHours > 0) return `${wholeHours}h`;
  return `${minutes}m`;
};

const getDurationHours = (classItem: InstructorClassWithSchedule) => {
  const schedule = classItem.schedule[0];
  const startValue = schedule?.start_time ?? classItem.default_start_time;
  const endValue = schedule?.end_time ?? classItem.default_end_time;

  if (!startValue || !endValue) return 0;

  const start = new Date(startValue);
  const end = new Date(endValue);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  if (Number.isNaN(diff) || diff <= 0) return 0;
  return Number(diff.toFixed(2));
};

const getLocationLabel = (classItem: InstructorClassWithSchedule) => {
  if (classItem.location_name?.trim()) return classItem.location_name;

  switch (classItem.location_type) {
    case 'ONLINE':
      return 'Online';
    case 'IN_PERSON':
      return 'In person';
    case 'HYBRID':
      return 'Hybrid';
    default:
      return 'TBD';
  }
};

const getRateCardKey = (classItem: InstructorClassWithSchedule) => {
  const sessionPrefix = classItem.session_format === 'GROUP' ? 'group' : 'private';
  const locationSuffix = classItem.location_type === 'ONLINE' ? 'online' : 'inperson';
  return `${sessionPrefix}_${locationSuffix}_rate` as const;
};

const getHourlyRate = (
  classItem: InstructorClassWithSchedule,
  approvedRateCards: Map<string, { currency?: string; [key: string]: unknown }>
) => {
  if (typeof classItem.training_fee === 'number' && classItem.training_fee > 0) {
    return {
      amount: classItem.training_fee,
      currencyCode: approvedRateCards.get(classItem.course_uuid ?? '')?.currency ?? 'KES',
    };
  }

  const rateCard = approvedRateCards.get(classItem.course_uuid ?? '');
  const rateCardKey = getRateCardKey(classItem);
  const rateValue = rateCard?.[rateCardKey];

  if (typeof rateValue === 'number' && rateValue > 0) {
    return {
      amount: rateValue,
      currencyCode: rateCard?.currency ?? 'KES',
    };
  }

  if (
    typeof classItem.course?.minimum_training_fee === 'number' &&
    classItem.course.minimum_training_fee > 0
  ) {
    return {
      amount: classItem.course.minimum_training_fee,
      currencyCode: approvedRateCards.get(classItem.course_uuid ?? '')?.currency ?? 'KES',
    };
  }

  return {
    amount: 0,
    currencyCode: approvedRateCards.get(classItem.course_uuid ?? '')?.currency ?? 'KES',
  };
};

const getStatusFromClass = (
  classItem: InstructorClassWithSchedule,
  enrollments: Enrollment[],
  now: Date
): RevenueStatus => {
  if (classItem.is_active === false) return 'cancelled';

  const activeEnrollments = enrollments.filter(
    enrollment => enrollment.status !== 'CANCELLED' && enrollment.status !== 'WAITLISTED'
  );

  if (activeEnrollments.length === 0 || classItem.schedule.length === 0) {
    return 'pending';
  }

  const completedSessions = classItem.schedule.filter(
    scheduleItem => new Date(scheduleItem.end_time).getTime() < now.getTime()
  ).length;

  if (completedSessions >= classItem.schedule.length) return 'fulfilled';
  if (completedSessions > 0) return 'partial';
  return 'pending';
};

function TruncatedCellText({
  value,
  maxLength,
}: {
  value: string;
  maxLength: number;
}) {
  const displayValue = truncateText(value, maxLength);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='block truncate'>{displayValue}</span>
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-xs break-words'>
        {value}
      </TooltipContent>
    </Tooltip>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='bg-card flex min-h-20 flex-col items-center justify-center rounded-[18px] border px-4 py-3 text-center shadow-sm'>
      <p className='text-foreground text-[10px] font-semibold uppercase tracking-[0.16em]'>{label}</p>
      <p className='text-foreground mt-2 text-xl font-semibold'>{value}</p>
    </div>
  );
}

function BalanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='bg-card flex min-h-24 min-w-[250px] flex-col justify-center rounded-[18px] border px-6 py-4 shadow-sm'>
      <p className='text-muted-foreground text-center text-xs font-medium'>{label}</p>
      <p className='text-foreground mt-2 text-center text-3xl font-semibold'>{value}</p>
    </div>
  );
}

const TransactionList = () => {
  const instructor = useInstructor();
  const [activeTab, setActiveTab] = useState<RevenueTab>('transaction-history');
  const [searchTerm, setSearchTerm] = useState('');

  const { classes, isLoading: isLoadingClasses } = useInstructorClassesWithSchedules(instructor?.uuid);

  const enrollmentsQueries = useQueries({
    queries: classes.map(classItem => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.uuid as string },
      }),
      enabled: !!classItem.uuid,
    })),
  });

  const { data: approvedApplicationsData } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: { page: 0, size: 200 },
        searchParams: { applicant_uuid_eq: instructor?.uuid as string },
      },
    }),
    enabled: !!instructor?.uuid,
  });

  const { data: walletData } = useQuery({
    ...getWalletOptions({ path: { userUuid: instructor?.user_uuid as string } }),
    enabled: !!instructor?.user_uuid,
  });

  const approvedRateCards = useMemo(() => {
    const map = new Map<string, { currency?: string; [key: string]: unknown }>();

    approvedApplicationsData?.data?.content
      ?.filter(application => application.status === 'approved' && application.course_uuid)
      .forEach(application => {
        map.set(application.course_uuid as string, application.rate_card ?? {});
      });

    return map;
  }, [approvedApplicationsData?.data?.content]);

  const transactions = useMemo<RevenueRow[]>(() => {
    const now = new Date();

    return classes
      .map((classItem, index) => {
        const enrollments = enrollmentsQueries[index]?.data?.data ?? [];
        const activeEnrollments = enrollments.filter(
          enrollment => enrollment.status !== 'CANCELLED' && enrollment.status !== 'WAITLISTED'
        );
        const durationHours = getDurationHours(classItem);
        const sessions = classItem.schedule.length || classItem.session_templates.length || 0;
        const pricing = getHourlyRate(classItem, approvedRateCards);
        const sessionFee = pricing.amount * durationHours;
        const feePerStudent = sessionFee * sessions;
        const classFees = feePerStudent * activeEnrollments.length;
        const firstSessionDate =
          classItem.schedule[0]?.start_time ?? classItem.default_start_time ?? classItem.created_date;
        const statusKey = getStatusFromClass(classItem, enrollments, now);

        return {
          id: classItem.uuid ?? `class-${index}`,
          classTitle: classItem.title || classItem.course?.name || 'Untitled class',
          orderDate: formatDate(firstSessionDate),
          location: getLocationLabel(classItem),
          deliveryStatus: STATUS_LABEL_MAP[statusKey],
          statusKey,
          sessions,
          duration: formatDuration(durationHours),
          students: activeEnrollments.length,
          sessionFee,
          feePerStudent,
          classFees,
          currencyCode: pricing.currencyCode,
          sortDate: firstSessionDate ? new Date(firstSessionDate).getTime() : 0,
        };
      })
      .sort((left, right) => right.sortDate - left.sortDate);
  }, [approvedRateCards, classes, enrollmentsQueries]);

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return transactions;

    return transactions.filter(transaction =>
      [
        transaction.id,
        transaction.classTitle,
        transaction.orderDate,
        transaction.location,
        transaction.deliveryStatus,
        transaction.currencyCode,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [searchTerm, transactions]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (accumulator, transaction) => {
        accumulator.total += transaction.classFees;
        accumulator[transaction.statusKey] += transaction.classFees;

        if (transaction.statusKey === 'pending' || transaction.statusKey === 'partial') {
          accumulator.active += transaction.classFees;
        }

        return accumulator;
      },
      {
        total: 0,
        fulfilled: 0,
        pending: 0,
        partial: 0,
        refund: 0,
        cancelled: 0,
        active: 0,
      }
    );
  }, [transactions]);

  const displayCurrency = walletData?.data?.currency_code ?? transactions[0]?.currencyCode ?? 'KES';
  const availableBalance = walletData?.data?.balance_amount ?? totals.fulfilled;
  const isLoadingRevenue =
    isLoadingClasses || enrollmentsQueries.some(query => query.isLoading || query.isFetching);

  return (
    <div className='bg-background min-h-full'>
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as RevenueTab)}
        className='gap-8'
      >
        <div className='flex flex-col gap-5 border-b pb-5 lg:flex-row lg:items-center lg:justify-between'>
          <TabsList className='bg-transparent h-auto w-full justify-start gap-2 rounded-none p-0'>
            {revenueTabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='data-[state=active]:bg-muted rounded-full px-4 py-2 text-sm uppercase'
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <button
            type='button'
            aria-label='Messages'
            className='border-input text-foreground hover:bg-muted flex h-11 w-11 items-center justify-center rounded-full border transition-colors'
          >
            <Mail className='h-5 w-5' />
          </button>
        </div>

        {revenueTabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className='mt-0'>
            {tab.value === 'transaction-history' ? (
              <section className='space-y-8'>
                <div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6'>
                  <SummaryStat label='Total Orders' value={formatCurrency(totals.total, displayCurrency)} />
                  <SummaryStat
                    label='Fulfilled'
                    value={formatCurrency(totals.fulfilled, displayCurrency)}
                  />
                  <SummaryStat label='Pending' value={formatCurrency(totals.pending, displayCurrency)} />
                  <SummaryStat label='Partial' value={formatCurrency(totals.partial, displayCurrency)} />
                  <SummaryStat label='Refund' value={formatCurrency(totals.refund, displayCurrency)} />
                  <SummaryStat
                    label='Cancelled'
                    value={formatCurrency(totals.cancelled, displayCurrency)}
                  />
                </div>

                <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
                  <div className='relative max-w-[420px] flex-1'>
                    <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
                    <Input
                      value={searchTerm}
                      onChange={event => setSearchTerm(event.target.value)}
                      placeholder='Search'
                      className='bg-card h-14 rounded-[18px] border pl-11 text-sm shadow-sm'
                      aria-label='Search transactions'
                    />
                  </div>

                  <div className='grid gap-4 sm:grid-cols-2'>
                    <BalanceStat
                      label='Available balance'
                      value={formatCurrency(availableBalance, displayCurrency)}
                    />
                    <BalanceStat
                      label='Active balance'
                      value={formatCurrency(totals.active, displayCurrency)}
                    />
                  </div>
                </div>

                <div className='bg-card rounded-[24px] border p-5 shadow-sm md:p-6'>
                  <div className='max-h-[520px] overflow-auto rounded-[18px]'>
                    <Table className='min-w-[1080px]'>
                      <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                          <TableHead className='py-4 text-sm font-semibold'>Class ID</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Class Title</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Order Date</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Location</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Delivery Status</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Sessions</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Duration</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Students</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Session Fee</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Fee/student</TableHead>
                          <TableHead className='py-4 text-sm font-semibold'>Class fees</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingRevenue ? (
                          <TableRow className='hover:bg-transparent'>
                            <TableCell colSpan={11} className='py-10 text-center text-sm text-muted-foreground'>
                              Loading transaction history...
                            </TableCell>
                          </TableRow>
                        ) : filteredTransactions.length > 0 ? (
                          filteredTransactions.map(transaction => (
                            <TableRow key={transaction.id} className='hover:bg-muted/20'>
                              <TableCell className='max-w-[120px] py-4 text-sm font-medium'>
                                <TruncatedCellText value={transaction.id} maxLength={7} />
                              </TableCell>
                              <TableCell className='max-w-[220px] py-4 text-sm'>
                                <TruncatedCellText value={transaction.classTitle} maxLength={24} />
                              </TableCell>
                              <TableCell className='text-muted-foreground py-4 text-sm'>
                                {transaction.orderDate}
                              </TableCell>
                              <TableCell className='text-muted-foreground max-w-[180px] py-4 text-sm'>
                                <TruncatedCellText value={transaction.location} maxLength={20} />
                              </TableCell>
                              <TableCell className='py-4 text-sm'>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusTone[transaction.statusKey]}`}
                                >
                                  {transaction.deliveryStatus}
                                </span>
                              </TableCell>
                              <TableCell className='text-muted-foreground py-4 text-sm'>
                                {transaction.sessions}
                              </TableCell>
                              <TableCell className='text-muted-foreground py-4 text-sm'>
                                {transaction.duration}
                              </TableCell>
                              <TableCell className='text-muted-foreground py-4 text-sm'>
                                {transaction.students}
                              </TableCell>
                              <TableCell className='text-muted-foreground py-4 text-sm'>
                                {formatCurrency(transaction.sessionFee, transaction.currencyCode)}
                              </TableCell>
                              <TableCell className='text-muted-foreground py-4 text-sm'>
                                {formatCurrency(transaction.feePerStudent, transaction.currencyCode)}
                              </TableCell>
                              <TableCell className='text-muted-foreground py-4 text-sm'>
                                {formatCurrency(transaction.classFees, transaction.currencyCode)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className='hover:bg-transparent'>
                            <TableCell colSpan={11} className='py-10 text-center text-sm text-muted-foreground'>
                              No transaction rows match your search.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </section>
            ) : (
              <div className='bg-card rounded-[24px] border p-8 shadow-sm'>
                <p className='text-foreground text-lg font-semibold'>{tab.label}</p>
                <p className='text-muted-foreground mt-2 text-sm'>
                  This tab is ready for the next set of revenue details.
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TransactionList;
