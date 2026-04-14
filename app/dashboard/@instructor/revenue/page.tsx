'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { elimikaDesignSystem } from '@/lib/design-system';
import type { Enrollment } from '@/services/client';
import {
  getEnrollmentsForClassOptions,
  getWalletOptions,
  searchTrainingApplicationsOptions,
  transferMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Landmark,
  Search,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useInstructor } from '../../../../context/instructor-context';
import { TransferFundsSheet } from '../../_components/transfer-funds-sheet';
import {
  type InstructorClassWithSchedule,
  useInstructorClassesWithSchedules,
} from '../../../../hooks/use-instructor-classes-with-schedules';

type RevenueStatus = 'fulfilled' | 'partial' | 'pending' | 'cancelled' | 'refund';

type RevenueStatusFilter = 'all' | RevenueStatus;

type RevenueRow = {
  id: string;
  classTitle: string;
  orderDate: string;
  location: string;
  deliveryStatus: string;
  statusKey: RevenueStatus;
  sessions: number;
  duration: string;
  durationHours: number;
  students: number;
  sessionFee: number;
  feePerStudent: number;
  classFees: number;
  currencyCode: string;
  sortDate: number;
};

const STATUS_BADGE_MAP: Record<RevenueStatus, string> = {
  fulfilled:
    'bg-success/10 dark:bg-success/15 text-success dark:text-success-foreground border border-success/20 dark:border-success/30',
  partial:
    'bg-warning/10 dark:bg-warning/15 text-warning dark:text-warning-foreground border border-warning/20 dark:border-warning/30',
  pending:
    'bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-foreground border border-primary/20 dark:border-primary/30',
  cancelled:
    'bg-destructive/10 dark:bg-destructive/15 text-destructive dark:text-destructive-foreground border border-destructive/20 dark:border-destructive/30',
  refund:
    'bg-muted text-muted-foreground border border-border',
};

const STATUS_LABEL_MAP: Record<RevenueStatus, string> = {
  fulfilled: 'Fulfilled',
  partial: 'Partially',
  pending: 'Pending',
  cancelled: 'Cancelled',
  refund: 'Refund',
};

const STATUS_OPTIONS: { value: RevenueStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'partial', label: 'Partially' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refund', label: 'Refund' },
];

const PAGE_SIZE_OPTIONS = ['5', '10', '20', '50'] as const;

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

  if (wholeHours > 0 && minutes > 0) {
    return `${wholeHours}h ${minutes}m`;
  }

  if (wholeHours > 0) {
    return `${wholeHours}h`;
  }

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

  if (typeof classItem.course?.minimum_training_fee === 'number' && classItem.course.minimum_training_fee > 0) {
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

  if (completedSessions >= classItem.schedule.length) {
    return 'fulfilled';
  }

  if (completedSessions > 0) {
    return 'partial';
  }

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

const RevenuePage = () => {
  const instructor = useInstructor();
  const userUuid = instructor?.user_uuid;

  const [showStats, setShowStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RevenueStatusFilter>('all');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState('10');

  const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
  const [targetUserUuid, setTargetUserUuid] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState('KES');
  const [transferReference, setTransferReference] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const transferFundsMut = useMutation({
    ...transferMutation(),
    onSuccess: () => {
      setTargetUserUuid('');
      setTransferAmount('');
      setTransferCurrency('KES');
      setTransferReference('');
      setTransferDescription('');
      setUserSearchQuery('');
      setIsTransferSheetOpen(false);
    },
  });

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
    ...getWalletOptions({ path: { userUuid: userUuid as string } }),
    enabled: !!userUuid,
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

  const revenueRows = useMemo<RevenueRow[]>(() => {
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
          durationHours,
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
    const query = searchQuery.trim().toLowerCase();

    return revenueRows.filter(row => {
      const matchesSearch =
        !query ||
        [
          row.id,
          row.classTitle,
          row.orderDate,
          row.location,
          row.deliveryStatus,
          row.currencyCode,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === 'all' || row.statusKey === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [revenueRows, searchQuery, statusFilter]);

  const pageSize = Number(size);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));

  const paginatedTransactions = useMemo(() => {
    const start = page * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, page, pageSize]);

  const analyticsData = useMemo(() => {
    const totals = revenueRows.reduce(
      (accumulator, row) => {
        accumulator.totalRevenue += row.classFees;
        accumulator.totalStudents += row.students;
        accumulator.totalClasses += 1;
        accumulator[row.statusKey] += row.classFees;

        if (row.statusKey === 'pending' || row.statusKey === 'partial') {
          accumulator.activeRevenue += row.classFees;
          accumulator.activeClasses += 1;
        }

        return accumulator;
      },
      {
        totalRevenue: 0,
        totalStudents: 0,
        totalClasses: 0,
        activeRevenue: 0,
        activeClasses: 0,
        fulfilled: 0,
        partial: 0,
        pending: 0,
        cancelled: 0,
        refund: 0,
      }
    );

    return {
      ...totals,
      averageClassValue: totals.totalClasses ? totals.totalRevenue / totals.totalClasses : 0,
    };
  }, [revenueRows]);

  const topPerformingClasses = useMemo(
    () => [...revenueRows].sort((left, right) => right.classFees - left.classFees).slice(0, 5),
    [revenueRows]
  );

  const resetTransferForm = () => {
    setTargetUserUuid('');
    setTransferAmount('');
    setTransferCurrency(walletData?.data?.currency_code || 'KES');
    setTransferReference('');
    setTransferDescription('');
    setUserSearchQuery('');
  };

  const handleTransferFunds = () => {
    if (!targetUserUuid || !transferAmount || !transferCurrency) return;

    transferFundsMut.mutate({
      body: {
        target_user_uuid: targetUserUuid,
        amount: parseFloat(transferAmount),
        currency_code: transferCurrency,
        reference:
          transferReference ||
          `TRANSFER-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        description: transferDescription || 'Fund transfer',
      },
      path: { userUuid: targetUserUuid },
    });
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(0);
  }, []);

  const handleStatusFilter = useCallback((value: RevenueStatusFilter) => {
    setStatusFilter(value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: string) => {
    setSize(newSize);
    setPage(0);
  }, []);

  const availableBalance = walletData?.data?.balance_amount ?? analyticsData.fulfilled;
  const walletCurrency = walletData?.data?.currency_code ?? revenueRows[0]?.currencyCode ?? 'KES';
  const isLoadingRevenue =
    isLoadingClasses || enrollmentsQueries.some(query => query.isLoading || query.isFetching);
  const isInsufficientBalance = !!transferAmount && parseFloat(transferAmount) > availableBalance;

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>Revenue</h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              Track earnings from your live classes using actual schedules, enrollments, and
              instructor pricing.
            </p>
          </div>

          <Link href='/dashboard/revenue/transaction-list' className='text-primary text-sm font-medium'>
            Open table view
          </Link>
        </div>
      </section>

      <section className='mx-auto max-w-7xl space-y-6'>
        <div className='border-border bg-card max-w-[300px] rounded-xl border p-6 shadow-sm sm:max-w-2/5'>
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Available Balance</p>
              <h2 className='text-foreground mt-2 text-4xl font-bold'>
                {formatCurrency(availableBalance, walletCurrency)}
              </h2>
              <p className='text-muted-foreground mt-2 text-sm'>
                {walletData?.data?.balance_amount !== undefined
                  ? 'Current wallet balance'
                  : 'Derived from fulfilled class revenue'}
              </p>
            </div>
            <div className='bg-primary/10 rounded-lg p-3'>
              <Landmark className='text-primary' size={24} />
            </div>
          </div>
          <Button
            onClick={() => {
              setTransferCurrency(walletCurrency);
              setIsTransferSheetOpen(true);
            }}
            className='mt-6 w-full'
          >
            Withdraw Funds
          </Button>
        </div>

        <div className='flex justify-end'>
          <Button
            variant={showStats ? 'default' : 'outline'}
            onClick={() => setShowStats(!showStats)}
            className='flex items-center gap-2'
          >
            {showStats ? (
              <>
                <EyeOff size={16} />
                Hide Stats
              </>
            ) : (
              <>
                <Eye size={16} />
                View Stats
              </>
            )}
          </Button>
        </div>

        {showStats && (
          <div className='animate-in fade-in-50 grid grid-cols-1 gap-4 duration-300 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='border-border bg-card rounded-lg border p-5'>
              <div className='flex items-center justify-between'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <TrendingUp className='text-primary' size={20} />
                </div>
                <span className='text-success dark:text-success-foreground flex items-center text-sm font-medium'>
                  <ArrowUpRight size={16} />
                  {analyticsData.totalClasses}
                </span>
              </div>
              <p className='text-muted-foreground mt-3 text-sm'>Total Revenue</p>
              <p className='text-foreground mt-1 text-2xl font-bold'>
                {formatCurrency(analyticsData.totalRevenue, walletCurrency)}
              </p>
            </div>

            <div className='border-border bg-card rounded-lg border p-5'>
              <div className='flex items-center justify-between'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <ShoppingCart className='text-primary' size={20} />
                </div>
                <span className='text-success dark:text-success-foreground flex items-center text-sm font-medium'>
                  <ArrowUpRight size={16} />
                  {analyticsData.activeClasses}
                </span>
              </div>
              <p className='text-muted-foreground mt-3 text-sm'>Active Revenue</p>
              <p className='text-foreground mt-1 text-2xl font-bold'>
                {formatCurrency(analyticsData.activeRevenue, walletCurrency)}
              </p>
            </div>

            <div className='border-border bg-card rounded-lg border p-5'>
              <div className='flex items-center justify-between'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Users className='text-primary' size={20} />
                </div>
                <span className='text-success dark:text-success-foreground flex items-center text-sm font-medium'>
                  <ArrowUpRight size={16} />
                  {analyticsData.totalStudents}
                </span>
              </div>
              <p className='text-muted-foreground mt-3 text-sm'>Enrolled Students</p>
              <p className='text-foreground mt-1 text-2xl font-bold'>{analyticsData.totalStudents}</p>
            </div>

            <div className='border-border bg-card rounded-lg border p-5'>
              <div className='flex items-center justify-between'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Landmark className='text-primary' size={20} />
                </div>
                <span className='text-success dark:text-success-foreground flex items-center text-sm font-medium'>
                  <ArrowUpRight size={16} />
                  Avg
                </span>
              </div>
              <p className='text-muted-foreground mt-3 text-sm'>Average Class Value</p>
              <p className='text-foreground mt-1 text-2xl font-bold'>
                {formatCurrency(analyticsData.averageClassValue, walletCurrency)}
              </p>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='border-border bg-card rounded-xl border shadow-sm lg:col-span-2'>
            <div className='flex flex-col gap-3 p-4'>
              <div className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_180px]'>
                <div className='relative flex-1'>
                  <Search
                    className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2'
                    size={16}
                  />
                  <Input
                    placeholder='Search classes, dates, locations...'
                    value={searchQuery}
                    onChange={event => handleSearch(event.target.value)}
                    className='pl-9'
                  />
                </div>

                <Select value={size} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option} items
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={value => handleStatusFilter(value as RevenueStatusFilter)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full min-w-[1080px]'>
                <thead className='border-border bg-muted/50 border-b'>
                  <tr>
                    <th className='text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase'>
                      Class ID
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase'>
                      Class Title
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase'>
                      Order Date
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase'>
                      Location
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase'>
                      Delivery Status
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-right text-xs font-medium tracking-wider uppercase'>
                      Sessions
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-right text-xs font-medium tracking-wider uppercase'>
                      Duration
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-right text-xs font-medium tracking-wider uppercase'>
                      Students
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-right text-xs font-medium tracking-wider uppercase'>
                      Session Fee
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-right text-xs font-medium tracking-wider uppercase'>
                      Fee/Student
                    </th>
                    <th className='text-muted-foreground px-6 py-3 text-right text-xs font-medium tracking-wider uppercase'>
                      Class Fees
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-border divide-y'>
                  {isLoadingRevenue ? (
                    <tr>
                      <td colSpan={11} className='px-6 py-8 text-center'>
                        <p className='text-muted-foreground text-sm'>Loading class revenue…</p>
                      </td>
                    </tr>
                  ) : paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map(row => (
                      <tr key={row.id} className='hover:bg-muted/30 transition-colors'>
                        <td className='text-foreground max-w-[120px] px-6 py-4 text-sm font-medium'>
                          <TruncatedCellText value={row.id} maxLength={7} />
                        </td>
                        <td className='text-foreground max-w-[220px] px-6 py-4 text-sm'>
                          <TruncatedCellText value={row.classTitle} maxLength={24} />
                        </td>
                        <td className='text-muted-foreground px-6 py-4 text-sm'>{row.orderDate}</td>
                        <td className='text-muted-foreground max-w-[180px] px-6 py-4 text-sm'>
                          <TruncatedCellText value={row.location} maxLength={20} />
                        </td>
                        <td className='px-6 py-4 text-sm'>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_MAP[row.statusKey]}`}
                          >
                            {row.deliveryStatus}
                          </span>
                        </td>
                        <td className='text-foreground px-6 py-4 text-right text-sm'>{row.sessions}</td>
                        <td className='text-foreground px-6 py-4 text-right text-sm'>{row.duration}</td>
                        <td className='text-foreground px-6 py-4 text-right text-sm'>{row.students}</td>
                        <td className='text-foreground px-6 py-4 text-right text-sm'>
                          {formatCurrency(row.sessionFee, row.currencyCode)}
                        </td>
                        <td className='text-foreground px-6 py-4 text-right text-sm'>
                          {formatCurrency(row.feePerStudent, row.currencyCode)}
                        </td>
                        <td className='text-foreground px-6 py-4 text-right text-sm font-semibold'>
                          {formatCurrency(row.classFees, row.currencyCode)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className='px-6 py-8 text-center'>
                        <p className='text-muted-foreground text-sm'>
                          No revenue rows match your current filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className='border-border flex items-center justify-between border-t p-6'>
              <div className='text-muted-foreground text-sm'>
                Page {Math.min(page + 1, totalPages)} of {totalPages} • {paginatedTransactions.length}{' '}
                of {filteredTransactions.length} results
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page + 1 >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <div className='border-border bg-card rounded-xl border shadow-sm'>
            <div className='border-border border-b p-6'>
              <h3 className='text-foreground text-lg font-semibold'>Revenue by Course</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                Highest earning instructor classes based on live enrollments and pricing.
              </p>
            </div>
            <div className='space-y-5 p-6'>
              {topPerformingClasses.length > 0 ? (
                topPerformingClasses.map(item => {
                  const share =
                    analyticsData.totalRevenue > 0 ? (item.classFees / analyticsData.totalRevenue) * 100 : 0;

                  return (
                    <div key={item.id}>
                      <div className='mb-2 flex items-center justify-between gap-3'>
                        <span className='text-foreground max-w-[65%] truncate text-sm font-medium'>
                          {item.classTitle}
                        </span>
                        <span className='text-foreground text-sm font-semibold'>
                          {formatCurrency(item.classFees, item.currencyCode)}
                        </span>
                      </div>
                      <div className='bg-muted h-2 w-full rounded-full'>
                        <div
                          className='bg-primary h-2 rounded-full transition-all duration-300'
                          style={{ width: `${Math.min(100, share)}%` }}
                        />
                      </div>
                      <div className='text-muted-foreground mt-1 text-xs'>{share.toFixed(1)}% of total</div>
                    </div>
                  );
                })
              ) : (
                <p className='text-muted-foreground text-sm'>
                  Revenue by course will appear here once your classes have schedules and enrollments.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <TransferFundsSheet
        open={isTransferSheetOpen}
        onOpenChange={open => {
          setIsTransferSheetOpen(open);
          if (!open) resetTransferForm();
        }}
        balance={availableBalance}
        isInsufficientBalance={isInsufficientBalance}
        targetUserUuid={targetUserUuid}
        setTargetUserUuid={setTargetUserUuid}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
        transferCurrency={transferCurrency}
        setTransferCurrency={setTransferCurrency}
        transferReference={transferReference}
        setTransferReference={setTransferReference}
        transferDescription={transferDescription}
        setTransferDescription={setTransferDescription}
        userSearchQuery={userSearchQuery}
        setUserSearchQuery={setUserSearchQuery}
        isPending={transferFundsMut.isPending}
        isError={transferFundsMut.isError}
        isSuccess={transferFundsMut.isSuccess}
        onSubmit={handleTransferFunds}
        onCancel={() => {
          setIsTransferSheetOpen(false);
          resetTransferForm();
        }}
      />
    </div>
  );
};

export default RevenuePage;
