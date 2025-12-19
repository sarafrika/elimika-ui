import { toNumber } from '@/lib/metrics';
import { fetchClient } from '@/services/api/fetch-client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

const activityEventActorSchema = z
  .object({
    uuid: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    type: z.string().optional(),
    identifier: z.string().optional(),
  })
  .partial();

const activityEventLinkSchema = z
  .object({
    label: z.string().optional(),
    href: z.string(),
    icon: z.string().optional(),
  })
  .partial();

const activityEventSchema = z
  .object({
    uuid: z.string().optional(),
    id: z.string().optional(),
    event_id: z.string().optional(),
    type: z.string().optional(),
    event_type: z.string().optional(),
    category: z.string().optional(),
    domain: z.string().optional(),
    scope: z.string().optional(),
    summary: z.string().optional(),
    title: z.string().optional(),
    message: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    severity: z.string().optional(),
    state: z.string().optional(),
    actor: activityEventActorSchema.optional(),
    actor_name: z.string().optional(),
    actor_type: z.string().optional(),
    actor_identifier: z.string().optional(),
    occurred_at: z.string().optional(),
    created_at: z.string().optional(),
    timestamp: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    context: z.record(z.unknown()).optional(),
    link: activityEventLinkSchema.optional(),
    links: z.array(activityEventLinkSchema).optional(),
  })
  .passthrough();

const activityEventListSchema = z.array(activityEventSchema);

const activityFeedResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    error: z.unknown().optional(),
    data: z
      .union([
        activityEventListSchema,
        z
          .object({
            items: activityEventListSchema.optional(),
            events: activityEventListSchema.optional(),
            content: activityEventListSchema.optional(),
            metadata: z
              .object({
                totalElements: z.union([z.number(), z.bigint()]).optional(),
                totalPages: z.number().optional(),
                pageNumber: z.number().optional(),
                pageSize: z.number().optional(),
              })
              .partial()
              .optional(),
          })
          .optional(),
      ])
      .optional(),
  })
  .passthrough();

export type AdminActivityEvent = z.infer<typeof activityEventSchema>;

export interface AdminActivityFeedResult {
  events: AdminActivityEvent[];
  totalItems?: number;
}

function normalizeActivityFeedPayload(payload: unknown): AdminActivityFeedResult | undefined {
  if (!payload) {
    return { events: [] };
  }

  const parsedObject = activityFeedResponseSchema.safeParse(payload);

  if (parsedObject.success) {
    const data = parsedObject.data.data;

    if (Array.isArray(data)) {
      return { events: data };
    }

    if (data && typeof data === 'object') {
      const events = data.items ?? data.events ?? data.content ?? [];
      const metadata = 'metadata' in data ? data.metadata : undefined;

      return {
        events,
        totalItems: metadata?.totalElements ? toNumber(metadata.totalElements) : events.length,
      };
    }

    return { events: [] };
  }

  const parsedArray = activityEventListSchema.safeParse(payload);

  if (parsedArray.success) {
    return { events: parsedArray.data };
  }

  return undefined;
}

export async function fetchAdminActivityFeed(): Promise<AdminActivityFeedResult> {
  const response = await fetchClient.GET('/api/v1/admin/dashboard/activity-feed' as any);

  if (response.error) {
    if (response.response && 'status' in response.response && response.response.status === 404) {
      return { events: [] };
    }

    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to load activity feed'
    );
  }

  const normalized = normalizeActivityFeedPayload(response.data);

  if (normalized) {
    return normalized;
  }

  return { events: [] };
}

export const adminActivityFeedQueryKey = ['admin-dashboard', 'activity-feed'] as const;

export function useAdminActivityFeed(
  options?: Partial<UseQueryOptions<AdminActivityFeedResult, Error>>
) {
  return useQuery({
    queryKey: adminActivityFeedQueryKey,
    queryFn: fetchAdminActivityFeed,
    staleTime: 1000 * 60,
    ...options,
  });
}
