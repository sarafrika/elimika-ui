import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { client } from './client.gen';

export type AdminDashboardActivityEvent = {
  id: string;
  title?: string;
  summary?: string;
  description?: string;
  actorName?: string;
  actorType?: string;
  category?: string;
  eventType?: string;
  severity?: string;
  status?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
  createdAt?: string;
};

export type AdminDashboardActivityFeed = {
  events: AdminDashboardActivityEvent[];
  message?: string;
};

const rawActivityEventSchema = z
  .object({
    id: z.union([z.string(), z.number(), z.bigint()]).nullish(),
    event_type: z.string().nullish(),
    eventType: z.string().nullish(),
    category: z.string().nullish(),
    severity: z.string().nullish(),
    status: z.string().nullish(),
    title: z.string().nullish(),
    summary: z.string().nullish(),
    description: z.string().nullish(),
    actor: z.string().nullish(),
    actor_name: z.string().nullish(),
    actorName: z.string().nullish(),
    actor_type: z.string().nullish(),
    actorType: z.string().nullish(),
    entity_id: z.union([z.string(), z.number(), z.bigint()]).nullish(),
    entityId: z.union([z.string(), z.number(), z.bigint()]).nullish(),
    entity_type: z.string().nullish(),
    entityType: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    occurred_at: z.union([z.string(), z.date()]).nullish(),
    occurredAt: z.union([z.string(), z.date()]).nullish(),
    created_at: z.union([z.string(), z.date()]).nullish(),
    createdAt: z.union([z.string(), z.date()]).nullish(),
    updated_at: z.union([z.string(), z.date()]).nullish(),
    updatedAt: z.union([z.string(), z.date()]).nullish(),
  })
  .passthrough();

type RawActivityEvent = z.infer<typeof rawActivityEventSchema>;

const activityFeedResponseSchema = z.union([
  z
    .object({
      success: z.boolean().optional(),
      data: z.array(rawActivityEventSchema).optional(),
      message: z.string().optional(),
      error: z.unknown().optional(),
    })
    .passthrough(),
  z.array(rawActivityEventSchema),
]);

const toOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }

  return undefined;
};

const normalizeDate = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toISOString();
    }
  }

  return undefined;
};

const mapActivityEvent = (event: RawActivityEvent): AdminDashboardActivityEvent => {
  const idCandidate =
    toOptionalString(event.id) ??
    toOptionalString(event.entity_id) ??
    toOptionalString(event.entityId) ??
    [event.event_type, event.eventType, event.created_at, event.createdAt]
      .map(toOptionalString)
      .filter(Boolean)
      .join(':');

  const title = event.title ?? event.summary ?? event.description ?? event.event_type ?? event.eventType ?? undefined;
  const summary = event.summary ?? event.description ?? event.title ?? undefined;

  const fallbackIdParts = [
    'activity',
    event.event_type ?? event.eventType ?? 'event',
    toOptionalString(event.created_at ?? event.createdAt ?? event.occurred_at ?? event.occurredAt) ?? Date.now().toString(),
    toOptionalString(event.entity_id ?? event.entityId ?? event.actor_name ?? event.actorName),
  ].filter(Boolean);

  return {
    id: idCandidate && idCandidate.length > 0 ? idCandidate : fallbackIdParts.join(':'),
    title: title ?? undefined,
    summary,
    description: event.description ?? undefined,
    actorName: event.actor_name ?? event.actorName ?? event.actor ?? undefined,
    actorType: event.actor_type ?? event.actorType ?? undefined,
    category: event.category ?? undefined,
    eventType: event.event_type ?? event.eventType ?? undefined,
    severity: event.severity ?? undefined,
    status: event.status ?? undefined,
    entityType: event.entity_type ?? event.entityType ?? undefined,
    entityId: toOptionalString(event.entity_id ?? event.entityId),
    metadata: (event.metadata ?? undefined) as Record<string, unknown> | undefined,
    occurredAt: normalizeDate(event.occurred_at ?? event.occurredAt ?? event.created_at ?? event.createdAt),
    createdAt: normalizeDate(event.created_at ?? event.createdAt),
  };
};

const parseActivityFeedResponse = (data: unknown): AdminDashboardActivityFeed => {
  const parsed = activityFeedResponseSchema.parse(data);
  const events = Array.isArray(parsed) ? parsed : parsed.data ?? [];

  return {
    events: events.map(mapActivityEvent),
    message: Array.isArray(parsed) ? undefined : parsed.message,
  };
};

export const fetchAdminDashboardActivityFeed = async (signal?: AbortSignal) => {
  const { data } = await client.get<AdminDashboardActivityFeed, unknown, true>({
    responseTransformer: async response => parseActivityFeedResponse(response),
    security: [
      {
        scheme: 'bearer',
        type: 'http',
      },
      {
        scheme: 'bearer',
        type: 'http',
      },
    ],
    signal,
    throwOnError: true,
    url: '/api/v1/admin/dashboard/activity-feed',
  });

  return data;
};

export const getDashboardActivityFeedQueryKey = ['getDashboardActivityFeed'] as const;

export const getDashboardActivityFeedOptions = () =>
  queryOptions({
    queryKey: getDashboardActivityFeedQueryKey,
    queryFn: async ({ signal }) => fetchAdminDashboardActivityFeed(signal),
    staleTime: 60_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
