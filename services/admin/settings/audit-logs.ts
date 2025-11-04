import { client } from '@/services/client/client.gen';

import { AuditLogCollectionSchema, AuditLogPage, AuditLogPageSchema } from './schemas';

const unwrapAuditLogPayload = (payload: unknown): AuditLogPage => {
  const directParse = AuditLogCollectionSchema.safeParse(payload);
  if (directParse.success) {
    return directParse.data;
  }

  const wrapped =
    typeof payload === 'object' &&
    payload !== null &&
    'data' in (payload as Record<string, unknown>)
      ? AuditLogCollectionSchema.safeParse((payload as { data: unknown }).data)
      : undefined;

  if (wrapped?.success) {
    return wrapped.data;
  }

  const fallback = AuditLogPageSchema.safeParse(payload);
  if (fallback.success) {
    return fallback.data;
  }

  return {
    items: [],
    page: 0,
    pageSize: 50,
    total: 0,
    hasNext: false,
  };
};

export type AuditLogFilters = {
  actor?: string;
  event?: string;
  resource?: string;
  status?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
};

const normalizeDate = (value?: string | Date) => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString();
};

export async function fetchAuditLogs({
  page = 0,
  pageSize = 50,
  filters = {},
}: {
  page?: number;
  pageSize?: number;
  filters?: AuditLogFilters;
}): Promise<AuditLogPage> {
  const query: Record<string, string | number | undefined> = {
    page,
    size: pageSize,
    actor: filters.actor,
    event: filters.event,
    resource: filters.resource,
    status: filters.status,
    q: filters.search,
    startDate: normalizeDate(filters.startDate),
    endDate: normalizeDate(filters.endDate),
  };

  Object.keys(query).forEach(key => {
    const value = query[key];
    if (value === undefined || value === '') {
      delete query[key];
    }
  });

  const response = await client.get<{ data?: unknown }, unknown, true>({
    url: '/api/v1/admin/audit-logs',
    query,
    throwOnError: true,
  });

  return unwrapAuditLogPayload(response.data);
}
