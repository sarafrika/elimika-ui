'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { elimikaDesignSystem } from '@/lib/design-system';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Download,
  Eye,
  EyeOff,
  Landmark,
  Search,
  Send,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useCourseCreator } from '../../../../context/course-creator-context';
import {
  getCourseEnrollmentsOptions,
  getWalletOptions,
  listTransactionsOptions,
  transferMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import { TransferFundsSheet } from '../../_components/transfer-funds-sheet';

const STATUS_BADGE_MAP = {
  completed:
    'bg-success/10 dark:bg-success/15 text-success dark:text-success-foreground border-success/20 dark:border-success/30',
  pending:
    'bg-warning/10 dark:bg-warning/15 text-warning dark:text-warning-foreground border-warning/20 dark:border-warning/30',
  failed:
    'bg-destructive/10 dark:bg-destructive/15 text-destructive dark:text-destructive-foreground border-destructive/20 dark:border-destructive/30',
};

type TransactionStatus = 'completed' | 'pending' | 'failed';
type SortMode = 'newest' | 'oldest' | 'largest' | 'smallest';

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'largest', label: 'Largest amount' },
  { value: 'smallest', label: 'Smallest amount' },
];

const STATUS_OPTIONS: Array<{ value: 'all' | TransactionStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

const RevenuePage = () => {
  const courseCreator = useCourseCreator();
  const userUuid = courseCreator?.profile?.user_uuid;

  const [timeRange, setTimeRange] = useState('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [showSummary, setShowSummary] = useState(true);

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
      resetTransferForm();
      setIsTransferSheetOpen(false);
    },
  });

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

  const resetTransferForm = () => {
    setTargetUserUuid('');
    setTransferAmount('');
    setTransferCurrency('KES');
    setTransferReference('');
    setTransferDescription('');
    setUserSearchQuery('');
  };

  const courses = courseCreator?.courses ?? [];
  const enrollmentQueries = useQueries({
    queries: courses.map(course => ({
      ...getCourseEnrollmentsOptions({
        path: { courseUuid: course.uuid as string },
        query: { pageable: {} },
      }),
      enabled: !!course.uuid,
    })),
  });

  const coursesWithStats = useMemo(() => {
    return courses
      .map((course, index) => {
        const enrollments = enrollmentQueries[index]?.data?.data?.content ?? [];
        return {
          ...course,
          enrollments,
          enrollmentCount: enrollments.length,
          revenue: 0,
        };
      })
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount);
  }, [courses, enrollmentQueries]);

  const { data: walletData } = useQuery({
    ...getWalletOptions({ path: { userUuid: userUuid as string } }),
    enabled: !!userUuid,
  });

  const { data: listTransactions } = useQuery({
    ...listTransactionsOptions({
      path: { userUuid: userUuid as string },
      query: {
        currency_code: walletData?.data?.currency_code,
        pageable: { page, size, sort: ['created_date,desc'] },
      },
    }),
    enabled: !!userUuid && !!walletData?.data?.currency_code,
  });

  const transactions = useMemo(
    () => (listTransactions?.data?.content as WalletTransaction[] | undefined) ?? [],
    [listTransactions?.data?.content]
  );

  const analyticsData = useMemo(() => {
    const totalCount = transactions.length;
    const totalRevenue = transactions
      .filter(t => t.transaction_type === 'DEPOSIT' || t.transaction_type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = transactions
      .filter(t => t.transaction_type === 'WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0);
    const completedCount = transactions.filter(t => getStatusFromType(t.transaction_type) === 'completed').length;
    const pendingCount = transactions.filter(t => getStatusFromType(t.transaction_type) === 'pending').length;
    const failedCount = transactions.filter(t => getStatusFromType(t.transaction_type) === 'failed').length;
    const averageTransactionValue = totalCount > 0 ? totalRevenue / totalCount : 0;

    return {
      totalRevenue,
      totalWithdrawals,
      netRevenue: totalRevenue - totalWithdrawals,
      totalTransactions: totalCount,
      completedTransactions: completedCount,
      pendingTransactions: pendingCount,
      failedTransactions: failedCount,
      averageTransactionValue,
      successRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    };
  }, [transactions]);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredTransactions = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    let filtered = [...transactions];

    if (query) {
      filtered = filtered.filter(
        txn =>
          txn.description?.toLowerCase().includes(query) ||
          txn.reference?.toLowerCase().includes(query) ||
          txn.transaction_type?.toLowerCase().includes(query) ||
          txn.counterparty_user_uuid?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(txn => getStatusFromType(txn.transaction_type) === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'oldest':
          return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
        case 'largest':
          return b.amount - a.amount;
        case 'smallest':
          return a.amount - b.amount;
        case 'newest':
        default:
          return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      }
    });

    return filtered;
  }, [deferredSearchQuery, sortMode, statusFilter, transactions]);

  const totalPages = useMemo(
    () => Math.ceil((filteredTransactions.length || 0) / size),
    [filteredTransactions.length, size]
  );

  const paginatedTransactions = useMemo(() => {
    const start = page * size;
    return filteredTransactions.slice(start, start + size);
  }, [filteredTransactions, page, size]);

  const summaryCards = [
    {
      label: 'Available balance',
      value: formatKES(analyticsData.netRevenue),
      hint: 'Ready to withdraw or transfer',
      icon: Landmark,
      tone: 'primary',
    },
    {
      label: 'Total revenue',
      value: formatKES(analyticsData.totalRevenue),
      hint: `${analyticsData.completedTransactions} completed transactions`,
      icon: TrendingUp,
    },
    {
      label: 'Withdrawals',
      value: formatKES(analyticsData.totalWithdrawals),
      hint: 'Funds already moved out',
      icon: Send,
    },
    {
      label: 'Success rate',
      value: `${analyticsData.successRate.toFixed(0)}%`,
      hint: `${analyticsData.pendingTransactions} pending • ${analyticsData.failedTransactions} failed`,
      icon: Users,
    },
  ] as const;

  const isInsufficientBalance =
    !!transferAmount && parseFloat(transferAmount) > analyticsData.netRevenue;

  const exportedTransactions = useMemo(
    () =>
      filteredTransactions.map(txn => [
        formatDateTime(txn.created_date),
        txn.description,
        txn.amount,
        txn.currency_code,
        txn.transaction_type,
        txn.counterparty_user_uuid ?? '',
        txn.reference,
        getStatusFromType(txn.transaction_type),
      ]),
    [filteredTransactions]
  );

  const handleExportCsv = useCallback(() => {
    downloadCsv(
      'elimika-course-creator-revenue-transactions.csv',
      ['Date', 'Description', 'Amount', 'Currency', 'Type', 'Counterparty', 'Reference', 'Status'],
      exportedTransactions
    );
  }, [exportedTransactions]);

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      <section
        className='border-border/70 bg-card rounded-md border px-5 py-5 shadow-sm sm:px-6 lg:px-7'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-1.5'>
              <h1 className='text-foreground text-2xl font-semibold tracking-tight sm:text-3xl'>
                Revenue
              </h1>
              <p className='text-muted-foreground max-w-2xl text-sm'> Track revenue, inspect transaction history, and keep an eye on course performance
                with a cleaner wallet-style layout.</p>
            </div>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end'>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className='w-full sm:w-44'>
                <SelectValue placeholder='Time range' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='7days'>Last 7 days</SelectItem>
                <SelectItem value='30days'>Last 30 days</SelectItem>
                <SelectItem value='90days'>Last 90 days</SelectItem>
                <SelectItem value='year'>This year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant='outline' onClick={() => setShowSummary(prev => !prev)}>
              {showSummary ? (
                <>
                  <EyeOff className='mr-2 h-4 w-4' />
                  Hide summary
                </>
              ) : (
                <>
                  <Eye className='mr-2 h-4 w-4' />
                  Show summary
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {showSummary && (
        <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {summaryCards.map(card => (
            <Card key={card.label} className={card.tone === 'primary' ? 'border-primary/20 bg-primary text-primary-foreground' : ''}>
              <CardHeader className='pb-0'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='space-y-2'>
                    <CardDescription className={card.tone === 'primary' ? 'text-primary-foreground/80' : ''}>
                      {card.label}
                    </CardDescription>
                    <CardTitle className='text-2xl'>{card.value}</CardTitle>
                  </div>

                  <div
                    className={
                      card.tone === 'primary'
                        ? 'rounded-xl bg-primary-foreground/15 p-3'
                        : 'rounded-xl bg-primary/10 p-3'
                    }
                  >
                    <card.icon
                      className={card.tone === 'primary' ? 'h-5 w-5 text-primary-foreground' : 'h-5 w-5 text-primary'}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className={card.tone === 'primary' ? 'text-xs text-primary-foreground/85' : 'text-xs text-muted-foreground'}>
                {card.hint}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className='grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]'>
        <Card className='overflow-hidden'>
          <CardHeader className='border-border border-b gap-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div className='space-y-1'>
                <CardTitle className='text-base'>Transactions</CardTitle>
                <CardDescription>
                  Wallet-style activity feed with compact rows, status chips, and local filtering.
                </CardDescription>
              </div>

              <Button variant='outline' size='sm' onClick={handleExportCsv} className='shrink-0'>
                <Download className='mr-2 h-4 w-4' />
                Export CSV
              </Button>
            </div>

            <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_160px]'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search transactions...'
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  className='pl-9'
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={value => {
                  setStatusFilter(value as 'all' | TransactionStatus);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortMode}
                onValueChange={value => {
                  setSortMode(value as SortMode);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Sort' />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={size.toString()}
                onValueChange={value => {
                  setSize(Number(value));
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Rows' />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(option => (
                    <SelectItem key={option} value={option.toString()}>
                      {option} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className='flex min-h-[400px] flex-col p-0'>
            {/* Content */}
            <div className='flex-1'>
              {paginatedTransactions.length > 0 ? (
                <div className='divide-y divide-border'>
                  {paginatedTransactions.map(txn => (
                    <TransactionRow key={txn.uuid} txn={txn} />
                  ))}
                </div>
              ) : (
                <div className='flex h-full min-h-[400px] flex-col items-center justify-center px-6 text-center'>
                  <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
                    <ArrowLeftRight className='h-5 w-5 text-muted-foreground' />
                  </div>

                  <h3 className='text-sm font-semibold text-foreground'>
                    No transactions found
                  </h3>

                  <p className='mt-1.5 max-w-sm text-sm text-muted-foreground'>
                    Try widening your search or clearing the status filter to reveal more
                    revenue activity.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination — only show when there is more than one page */}
            {totalPages > 1 && (
              <>
                <Separator />

                <div className='mt-auto flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between'>
                  <p className='text-sm text-muted-foreground'>
                    Page {page + 1} of {totalPages} · {paginatedTransactions.length} of{' '}
                    {filteredTransactions.length} results
                  </p>

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(prev => Math.max(0, prev - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={page + 1 >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className='space-y-6'>
          <Card className='overflow-hidden'>
            <CardHeader className='border-border border-b'>
              <div className='flex items-start justify-between gap-3'>
                <div className='space-y-1'>
                  <CardTitle className='text-base'>Withdraw balance</CardTitle>
                  <CardDescription>
                    Keep the current withdraw flow visible while matching the new dashboard style.
                  </CardDescription>
                </div>

                <div className='rounded-xl bg-primary/10 p-3'>
                  <Landmark className='h-5 w-5 text-primary' />
                </div>
              </div>
            </CardHeader>

            <CardContent className='space-y-5'>
              <div className='rounded-2xl border border-border/70 bg-muted/30 p-4'>
                <p className='text-sm text-muted-foreground'>Available balance</p>
                <p className='mt-2 text-3xl font-bold text-foreground'>
                  {formatKES(analyticsData.netRevenue)}
                </p>
                <p className='mt-2 text-xs text-muted-foreground'>Ready for withdrawal or transfer</p>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <Button disabled className='w-full'>
                  Withdraw Funds
                </Button>
                <Button variant='outline' className='w-full' onClick={() => setIsTransferSheetOpen(true)}>
                  <Send className='mr-2 h-4 w-4' />
                  Transfer
                </Button>
              </div>

              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div className='rounded-xl border border-border/70 bg-card p-3'>
                  <p className='text-muted-foreground text-xs'>Pending</p>
                  <p className='mt-1 font-semibold text-foreground'>
                    {formatKES(
                      transactions
                        .filter(txn => getStatusFromType(txn.transaction_type) === 'pending')
                        .reduce((sum, txn) => sum + txn.amount, 0)
                    )}
                  </p>
                </div>
                <div className='rounded-xl border border-border/70 bg-card p-3'>
                  <p className='text-muted-foreground text-xs'>Success rate</p>
                  <p className='mt-1 font-semibold text-foreground'>{analyticsData.successRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='overflow-hidden'>
            <CardHeader className='border-border border-b'>
              <div className='space-y-1'>
                <CardTitle className='text-base'>Revenue by course</CardTitle>
                <CardDescription>Reframed as a card stack so it feels consistent with the wallet UI.</CardDescription>
              </div>
            </CardHeader>

            <CardContent className='space-y-4'>
              {coursesWithStats.length > 0 ? (
                coursesWithStats.slice(0, 5).map((course, index) => {
                  const hasRevenue = course.revenue > 0;
                  const progressValue =
                    analyticsData.totalRevenue > 0
                      ? Math.max(0, Math.min(100, (course.revenue / analyticsData.totalRevenue) * 100))
                      : 0;

                  return (
                    <div key={course.uuid ?? index} className='rounded-2xl border border-border/70 bg-card p-4 shadow-sm'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0 space-y-1'>
                          <p className='truncate text-sm font-semibold text-foreground'>{course.name}</p>
                          <p className='text-xs text-muted-foreground'>
                            {course.enrollmentCount} enrollment{course.enrollmentCount === 1 ? '' : 's'}
                          </p>
                        </div>

                        <Badge variant='outline' className='rounded-full'>
                          {hasRevenue ? 'Live' : 'Preview'}
                        </Badge>
                      </div>

                      <div className='mt-4 flex items-end justify-between gap-3'>
                        <div>
                          <p className='text-xs text-muted-foreground'>Revenue</p>
                          <p className='mt-1 text-lg font-semibold text-foreground'>
                            {formatKES(course.revenue)}
                          </p>
                        </div>
                        <p className='text-right text-xs text-muted-foreground'>
                          {progressValue.toFixed(0)}% of tracked revenue
                        </p>
                      </div>

                      <Progress value={progressValue} className='mt-3 h-2' />

                      <p className='mt-2 text-xs text-muted-foreground'>
                        {hasRevenue
                          ? 'Revenue is being tracked against this course.'
                          : 'No revenue records are mapped to this course yet.'}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className='rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center'>
                  <div className='mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted'>
                    <ShoppingCart className='h-5 w-5 text-muted-foreground' />
                  </div>
                  <h3 className='text-sm font-semibold text-foreground'>No courses to show</h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Courses will appear here once the creator has published and enrolled learners.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <TransferFundsSheet
        open={isTransferSheetOpen}
        onOpenChange={open => {
          setIsTransferSheetOpen(open);
          if (!open) resetTransferForm();
        }}
        balance={analyticsData.netRevenue}
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

function TransactionRow({ txn }: { txn: WalletTransaction }) {
  const status = getStatusFromType(txn.transaction_type);
  const isCredit =
    txn.transaction_type === 'DEPOSIT' ||
    txn.transaction_type === 'PAYMENT' ||
    txn.transaction_type === 'SALE' ||
    txn.transaction_type === 'TRANSFER_IN';
  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className='flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/25'>
      <div className='flex min-w-0 items-start gap-3'>
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isCredit ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}
        >
          <Icon className='h-4 w-4' />
        </div>

        <div className='min-w-0 space-y-1'>
          <p className='truncate text-sm font-medium text-foreground'>{txn.description}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {formatDateTime(txn.created_date)} · {txn.reference}
            {txn.counterparty_user_uuid ? ` · ${txn.counterparty_user_uuid.slice(0, 8)}…` : ''}
          </p>
          <p className='text-[11px] uppercase tracking-wide text-muted-foreground'>
            {formatTxnType(txn.transaction_type)}
          </p>
        </div>
      </div>

      <div className='flex shrink-0 flex-col items-end gap-2 text-right'>
        <div className='space-y-0.5'>
          <p className='text-sm font-semibold text-foreground'>
            {txn.currency_code} {txn.amount.toLocaleString('en-US')}
          </p>
          <p className='text-[11px] text-muted-foreground'>
            Balance after {txn.currency_code} {txn.balance_after.toLocaleString('en-US')}
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_MAP[status]
            }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </div>
  );
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatKES = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);

const formatTxnType = (type: string) =>
  type
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const downloadCsv = (filename: string, header: string[], rows: (string | number)[][]) => {
  const lines = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const getStatusFromType = (type: string): TransactionStatus => {
  switch (type) {
    case 'DEPOSIT':
    case 'PAYMENT':
    case 'SALE':
    case 'TRANSFER_IN':
      return 'completed';
    case 'TRANSFER':
      return 'pending';
    case 'WITHDRAWAL':
    case 'TRANSFER_OUT':
      return 'failed';
    default:
      return 'completed';
  }
};

export type WalletTransaction = {
  uuid: string;
  wallet_uuid: string;
  transaction_type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amount: number;
  currency_code: string;
  balance_before: number;
  balance_after: number;
  reference: string;
  description: string;
  transfer_reference?: string;
  counterparty_user_uuid?: string;
  created_date: string;
};
