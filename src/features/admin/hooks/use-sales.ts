'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import type { OrderResponse, RevenuePaymentDto, RevenueSaleLineItemDto } from '@/services/client';
import { listSales } from '@/services/client';
import {
  getOrderOptions,
  listPaymentsOptions,
  listSalesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { listQuery } from '../lib/admin-queries';
import { revenueWindow, type RevenueRange } from './use-revenue';

export const SALES_PAGE_SIZE = 20;

/** The API applies one of these at a time, in this order, so the UI offers one. */
export type SalesSubjectKind = 'none' | 'course' | 'class' | 'student';

export interface SalesFilters {
  range: RevenueRange;
  status?: string;
  scope?: string;
  subjectKind?: SalesSubjectKind;
  subjectUuid?: string;
  page?: number;
}

function subjectQuery({ subjectKind, subjectUuid }: SalesFilters) {
  if (!subjectUuid || !subjectKind || subjectKind === 'none') return {};
  if (subjectKind === 'course') return { course_uuid: subjectUuid };
  if (subjectKind === 'class') return { class_definition_uuid: subjectUuid };
  return { student_uuid: subjectUuid };
}

function salesQueryInput(filters: SalesFilters, page: number, size: number) {
  const { start, end } = revenueWindow(filters.range);
  return {
    domain: 'admin' as const,
    start_date: start,
    end_date: end,
    payment_status: filters.status && filters.status !== 'any' ? filters.status : undefined,
    scope: filters.scope && filters.scope !== 'any' ? filters.scope : undefined,
    ...subjectQuery(filters),
    pageable: { page, size },
  };
}

/** One page of captured and attempted sales. */
export function useSales(filters: SalesFilters) {
  const page = filters.page ?? 0;

  const query = useQuery({
    ...listSalesOptions({ query: salesQueryInput(filters, page, SALES_PAGE_SIZE) }),
    ...listQuery,
  });

  const { sales, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<RevenueSaleLineItemDto>(query.data);
    return {
      sales: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { sales, totalRows, pageCount, page, query };
}

/**
 * The order behind one sale row. GET /commerce/orders/{id}/payment-status is never
 * called: it polls the provider and can capture the order, and looking at a record
 * must not change it.
 */
export function useOrder(orderId?: string) {
  const query = useQuery({
    ...getOrderOptions({ path: { orderId: orderId ?? '' } }),
    ...listQuery,
    enabled: Boolean(orderId),
  });

  const order = useMemo(() => {
    const entity = extractEntity<OrderResponse>(query.data);
    return entity ?? ((query.data as OrderResponse | undefined) ?? null);
  }, [query.data]);

  return { order, query };
}

/** Payment attempts recorded against one order. */
export function useOrderPayments(range: RevenueRange, orderId?: string) {
  const { start, end } = useMemo(() => revenueWindow(range), [range]);

  const query = useQuery({
    ...listPaymentsOptions({
      query: {
        domain: 'admin',
        start_date: start,
        end_date: end,
        order_id: orderId,
        pageable: { page: 0, size: 20 },
      },
    }),
    ...listQuery,
    enabled: Boolean(orderId),
  });

  const payments = useMemo(
    () => extractPage<RevenuePaymentDto>(query.data).items,
    [query.data]
  );

  return { payments, query };
}

const CSV_PAGE_SIZE = 100;
const CSV_MAX_PAGES = 50;

/** How many pages an export will ask for, so the confirmation can say it out loud. */
export function exportPageCount(totalRows: number) {
  return Math.min(Math.max(Math.ceil(totalRows / CSV_PAGE_SIZE), 1), CSV_MAX_PAGES);
}

const csvCell = (value: unknown) => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Pages through the same filter and builds a CSV in the browser. Reads only. */
export async function fetchSalesCsv(filters: SalesFilters, totalRows: number) {
  const pages = exportPageCount(totalRows);
  const rows: RevenueSaleLineItemDto[] = [];

  for (let page = 0; page < pages; page += 1) {
    const { data } = await listSales({
      query: salesQueryInput(filters, page, CSV_PAGE_SIZE),
      throwOnError: true,
    });
    const { items } = extractPage<RevenueSaleLineItemDto>(data);
    rows.push(...items);
    if (items.length < CSV_PAGE_SIZE) break;
  }

  const header = [
    'order_number',
    'order_created_at',
    'customer_email',
    'title',
    'scope',
    'payment_status',
    'order_total_amount',
    'order_currency_code',
    'platform_fee_amount',
    'platform_fee_currency',
  ];

  const lines = rows.map(row =>
    [
      row.order_number,
      row.order_created_at instanceof Date ? row.order_created_at.toISOString() : row.order_created_at,
      row.customer_email,
      row.title,
      row.scope,
      row.payment_status,
      row.order_total_amount,
      row.order_currency_code,
      row.platform_fee_amount,
      row.platform_fee_currency,
    ]
      .map(csvCell)
      .join(',')
  );

  return { csv: [header.join(','), ...lines].join('\n'), rowCount: rows.length };
}
