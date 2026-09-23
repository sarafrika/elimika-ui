'use client';

import { AlertTriangle, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { DataTable, DetailGrid, SectionCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { absoluteDateTime, formatDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import type { RevenueSaleLineItemDto } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { formatMoney } from '../components/money-list';
import { SectionBoundary } from '../components/section-boundary';
import { REVENUE_RANGES, type RevenueRange } from '../hooks/use-revenue';
import {
  exportPageCount,
  fetchSalesCsv,
  type SalesSubjectKind,
  useOrder,
  useOrderPayments,
  useSales,
} from '../hooks/use-sales';
import { enumParam, numberParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const rangeParam = enumParam<RevenueRange>(['7d', '30d', '90d', '12m'], '30d');
const statusParam = stringParam('any');
const scopeParam = stringParam('any');
const subjectKindParam = enumParam<SalesSubjectKind>(['none', 'course', 'class', 'student'], 'none');
const subjectParam = stringParam();
const orderParam = stringParam();
const pageParam = numberParam(0);

const PAYMENT_STATUSES = [
  'any',
  'CAPTURED',
  'AUTHORIZED',
  'PENDING',
  'AWAITING_PAYMENT',
  'FAILED',
  'REFUNDED',
  'CANCELED',
];

export function SalesPage() {
  const [range, setRange] = useSearchState('range', rangeParam);
  const [status, setStatus] = useSearchState('status', statusParam);
  const [scope, setScope] = useSearchState('scope', scopeParam);
  const [subjectKind, setSubjectKind] = useSearchState('subject', subjectKindParam);
  const [subjectUuid, setSubjectUuid] = useSearchState('id', subjectParam);
  const [orderId, setOrderId] = useSearchState('order', orderParam);
  const [page, setPage] = useSearchState('page', pageParam);

  const [confirmExport, setConfirmExport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters = { range, status, scope, subjectKind, subjectUuid, page };
  const { sales, totalRows, pageCount, query } = useSales(filters);

  const runExport = async () => {
    setExporting(true);
    try {
      const { csv, rowCount } = await fetchSalesCsv(filters, totalRows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `elimika-sales-${range}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rowCount} row(s)`);
      setConfirmExport(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not export these sales'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Finance'
          title='Sales & payments'
          description='Every order line the platform captured or tried to, and the payments behind them.'
          actions={
            <Button
              variant='outline'
              className='rounded-md'
              disabled={sales.length === 0}
              onClick={() => setConfirmExport(true)}
            >
              <Download className='mr-2 size-4' />
              Export CSV
            </Button>
          }
        />

        <div className='flex flex-wrap items-center gap-2'>
          <Select value={range} onValueChange={value => setRange(value as RevenueRange)}>
            <SelectTrigger className='border-border/70 h-9 w-[160px] rounded-md'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REVENUE_RANGES.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className='border-border/70 h-9 w-[180px] rounded-md'>
              <SelectValue placeholder='Payment status' />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map(value => (
                <SelectItem key={value} value={value}>
                  {value === 'any' ? 'Payment status: any' : value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className='border-border/70 h-9 w-[150px] rounded-md'>
              <SelectValue placeholder='Scope' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Scope: any</SelectItem>
              <SelectItem value='COURSE'>Course</SelectItem>
              <SelectItem value='CLASS'>Class</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={subjectKind}
            onValueChange={value => {
              setSubjectKind(value as SalesSubjectKind);
              setSubjectUuid('');
            }}
          >
            <SelectTrigger className='border-border/70 h-9 w-[190px] rounded-md'>
              <SelectValue placeholder='Narrow by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>Narrow by: nothing</SelectItem>
              <SelectItem value='course'>A course</SelectItem>
              <SelectItem value='class'>A class</SelectItem>
              <SelectItem value='student'>A student</SelectItem>
            </SelectContent>
          </Select>

          {subjectKind !== 'none' ? (
            <input
              value={subjectUuid}
              onChange={event => setSubjectUuid(event.target.value)}
              placeholder={`Paste the ${subjectKind} id`}
              aria-label={`${subjectKind} id`}
              className='border-input h-9 min-w-[280px] rounded-md border px-3 font-mono text-sm'
            />
          ) : null}
        </div>

        <p className='text-muted-foreground text-xs'>
          The API narrows by one thing at a time — a course, a class or a student, in that
          order — so this filter takes a single choice rather than silently ignoring the rest.
        </p>

        <SectionBoundary
          label='the sales'
          loading={query.isLoading && sales.length === 0}
          error={query.error}
          empty={!query.isLoading && sales.length === 0}
          onRetry={query.refetch}
          emptyTitle='No sales in this range'
          emptyDescription='Widen the range or clear the filters.'
        >
          <DataTable
            hideToolbar
            data={sales}
            isLoading={query.isLoading}
            getRowId={row => row.line_item_id ?? `${row.order_id}-${row.title}`}
            onRowClick={row => setOrderId(row.order_id ?? '')}
            selectedRowId={orderId || null}
            serverPagination={{ page, pageCount, totalRows, onPageChange: setPage }}
            columns={[
              {
                id: 'order',
                header: 'Order',
                cell: ({ row }) => (
                  <div className='min-w-0'>
                    <p className='font-mono text-sm'>{row.original.order_number ?? '—'}</p>
                    <p className='text-muted-foreground text-xs'>
                      {formatDate(row.original.order_created_at) || '—'}
                    </p>
                  </div>
                ),
              },
              {
                id: 'customer',
                header: 'Customer',
                cell: ({ row }) => (
                  <span className='text-sm'>{row.original.customer_email ?? '—'}</span>
                ),
              },
              {
                id: 'item',
                header: 'Item',
                cell: ({ row }) => (
                  <div className='flex min-w-0 flex-col gap-1'>
                    <span className='truncate text-sm font-medium'>{row.original.title ?? '—'}</span>
                    {row.original.scope ? (
                      <StatusBadge tone='neutral' label={row.original.scope} />
                    ) : null}
                  </div>
                ),
              },
              {
                id: 'total',
                header: 'Total',
                cell: ({ row }) => (
                  <span className='font-mono text-sm'>
                    {formatMoney(row.original.order_total_amount, row.original.order_currency_code)}
                  </span>
                ),
              },
              {
                id: 'fee',
                header: 'Platform fee',
                cell: ({ row }) => (
                  <span className='text-muted-foreground font-mono text-sm'>
                    {formatMoney(row.original.platform_fee_amount, row.original.platform_fee_currency)}
                  </span>
                ),
              },
              {
                id: 'status',
                header: 'Payment',
                cell: ({ row }) => <StatusBadge status={row.original.payment_status} />,
              },
            ]}
          />
        </SectionBoundary>
      </div>

      <OrderDrawer
        orderId={orderId}
        range={range}
        sale={sales.find(row => row.order_id === orderId)}
        onClose={() => setOrderId('')}
      />

      <ConfirmDialog
        open={confirmExport}
        onOpenChange={setConfirmExport}
        action='exportSales'
        subject={{
          name: 'these sales',
          detail: `${totalRows} row(s) across ${exportPageCount(totalRows)} page(s)`,
        }}
        isPending={exporting}
        onConfirm={runExport}
      />
    </div>
  );
}

function OrderDrawer({
  orderId,
  range,
  sale,
  onClose,
}: {
  orderId: string;
  range: RevenueRange;
  sale?: RevenueSaleLineItemDto;
  onClose: () => void;
}) {
  const { order, query: orderQuery } = useOrder(orderId || undefined);
  const { payments, query: paymentsQuery } = useOrderPayments(range, orderId || undefined);

  return (
    <Sheet open={Boolean(orderId)} onOpenChange={open => !open && onClose()}>
      <SheetContent className='w-full sm:max-w-[560px]'>
        <SheetHeader>
          <SheetTitle>{sale?.order_number ?? 'Order'}</SheetTitle>
          <SheetDescription>{sale?.customer_email ?? 'Order detail'}</SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-4 pb-6'>
          <SectionBoundary
            label='the order'
            loading={orderQuery.isLoading && !orderQuery.data}
            error={orderQuery.error}
            onRetry={orderQuery.refetch}
          >
            <DetailGrid
              columns={2}
              items={[
                { label: 'Order', value: <span className='font-mono'>{order?.display_id ?? '—'}</span> },
                { label: 'Payment status', value: <StatusBadge status={order?.payment_status} /> },
                { label: 'Subtotal', value: formatMoney(order?.subtotal, order?.currency_code) },
                { label: 'Total', value: formatMoney(order?.total, order?.currency_code) },
                { label: 'Placed', value: absoluteDateTime(order?.created_at, '—') },
                {
                  label: 'Platform fee',
                  value: formatMoney(order?.platform_fee?.amount, order?.platform_fee?.currency),
                },
              ]}
            />
          </SectionBoundary>

          <SectionCard title='Items' bodyClassName='p-0'>
            <ul className='divide-border/60 divide-y'>
              {(order?.items ?? []).map(item => (
                <li key={item.id ?? item.title} className='flex items-center gap-3 px-4 py-3'>
                  <span className='min-w-0 flex-1 truncate text-sm'>{item.title ?? '—'}</span>
                  <span className='text-muted-foreground text-xs'>× {item.quantity ?? 1}</span>
                  <span className='font-mono text-sm'>
                    {formatMoney(item.total, order?.currency_code)}
                  </span>
                </li>
              ))}
              {(order?.items ?? []).length === 0 ? (
                <li className='text-muted-foreground px-4 py-6 text-center text-sm'>
                  No line items on this order.
                </li>
              ) : null}
            </ul>
          </SectionCard>

          <SectionCard title='Payments' description='Every attempt recorded against this order.'>
            <SectionBoundary
              label='the payments'
              loading={paymentsQuery.isLoading && !paymentsQuery.data}
              error={paymentsQuery.error}
              empty={payments.length === 0}
              onRetry={paymentsQuery.refetch}
              emptyTitle='No payment recorded'
              emptyDescription='Nothing has been attempted against this order yet.'
            >
              <ul className='flex flex-col gap-2'>
                {payments.map(payment => (
                  <li
                    key={payment.payment_uuid}
                    className='border-border/60 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2'
                  >
                    <StatusBadge status={payment.status} />
                    <span className='text-sm font-medium'>{payment.provider ?? '—'}</span>
                    <span className='font-mono text-sm'>
                      {formatMoney(payment.amount, payment.currency_code)}
                    </span>
                    <span className='text-muted-foreground ml-auto font-mono text-xs'>
                      {payment.external_reference ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionBoundary>
          </SectionCard>

          <div className='border-warning/40 bg-warning/5 flex gap-2 rounded-md border p-3'>
            <AlertTriangle className='text-warning mt-0.5 size-4 shrink-0' />
            <div className='space-y-1 text-xs'>
              <p className='text-foreground'>
                The console never polls the payment-status endpoint: asking it can capture the
                order and take the money.
              </p>
              <p className='text-muted-foreground'>
                The order&apos;s own status and the payment channel are not in the API response,
                so only the payment status and provider above are shown.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
