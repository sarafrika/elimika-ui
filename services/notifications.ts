import { toNumber } from '@/lib/metrics';
import { fetchClient } from '@/services/api/fetch-client';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

const notificationMetadataSchema = z.object({
  quiz_uuid: z.string().optional(),
  assignment_uuid: z.string().optional(),
  class_definition_uuid: z.string().optional(),
  due_at: z.string().optional(),
  start_time: z.string().optional(),
  schedule_uuid: z.string().optional(),
  student_uuid: z.string().optional(),
  instructor_uuid: z.string().optional(),
  reminder_minutes: z.number().optional(),
}).passthrough();

const notificationSchema = z.object({
  uuid: z.string().uuid(),
  notification_id: z.string().uuid().nullable().optional(),
  recipient_domain: z.string().nullable().optional(),
  type: z.string(),
  category: z.string().nullable().optional(),
  priority: z.string().default('NORMAL'),
  presentation: z.string().default('INBOX'),
  status: z.string().default('UNREAD'),
  title: z.string(),
  body: z.string(),
  action_url: z.string().nullable().optional(),
  urlPath: z.string().nullable().optional(),
  metadata: notificationMetadataSchema.default({}),
  occurred_at: z.string().optional(),
  popup_seen_at: z.string().nullable().optional(),
  read_at: z.string().nullable().optional(),
  archived_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

const notificationsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z
    .object({
      content: z.array(notificationSchema).default([]),
      metadata: z
        .object({
          pageNumber: z.number().int().optional(),
          pageSize: z.number().int().optional(),
          totalElements: z.coerce.bigint().optional(),
          totalPages: z.number().int().optional(),
          hasNext: z.boolean().optional(),
          hasPrevious: z.boolean().optional(),
        })
        .partial()
        .optional(),
    })
    .optional(),
});

const notificationCountsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z
    .object({
      unread_count: z.coerce.number().int().default(0),
      popup_count: z.coerce.number().int().default(0),
    })
    .default({ unread_count: 0, popup_count: 0 }),
});

const notificationActionResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export type UserNotification = z.infer<typeof notificationSchema>;

export interface NotificationListParams {
  page?: number;
  size?: number;
  domain?: string;
  status?: 'UNREAD' | 'READ' | 'ARCHIVED';
  presentation?: 'POPUP' | 'INBOX';
  type?: string;
  popupSeen?: boolean;
}

export interface NotificationListResult {
  items: UserNotification[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface NotificationCounts {
  unread_count: number;
  popup_count: number;
}

const defaultListParams = {
  page: 0,
  size: 20,
} satisfies NotificationListParams;

export const notificationListQueryKey = (params: NotificationListParams = {}) =>
  ['notifications', 'list', normalizeListParams(params)] as const;

export const notificationCountsQueryKey = (domain?: string) =>
  ['notifications', 'counts', domain ?? null] as const;

function normalizeListParams(params: NotificationListParams = {}): NotificationListParams {
  return {
    ...defaultListParams,
    ...params,
  };
}

export async function fetchNotifications(
  params: NotificationListParams = {}
): Promise<NotificationListResult> {
  const normalizedParams = normalizeListParams(params);

  const response = await fetchClient.GET('/api/v1/notifications' as never, {
    params: {
      query: {
        page: normalizedParams.page,
        size: normalizedParams.size,
        sort: 'createdDate,desc',
        domain: normalizedParams.domain,
        status: normalizedParams.status,
        presentation: normalizedParams.presentation,
        type: normalizedParams.type,
        popup_seen: normalizedParams.popupSeen,
      },
    },
  } as never);

  if (response.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to fetch notifications'
    );
  }

  const parsed = notificationsResponseSchema.parse(response.data ?? {});
  if (parsed.success === false) {
    throw new Error(parsed.message || 'Failed to fetch notifications');
  }

  const items = parsed.data?.content ?? [];
  const metadata = parsed.data?.metadata ?? {};
  const page = metadata.pageNumber ?? normalizedParams.page ?? 0;
  const size = metadata.pageSize ?? normalizedParams.size ?? 20;
  const totalItems =
    metadata.totalElements === undefined ? items.length : toNumber(metadata.totalElements);
  const totalPages =
    metadata.totalPages ?? (totalItems > 0 ? Math.ceil(totalItems / size) : items.length > 0 ? 1 : 0);

  return {
    items,
    page,
    size,
    totalItems,
    totalPages,
    hasNext: metadata.hasNext ?? page < totalPages - 1,
    hasPrevious: metadata.hasPrevious ?? page > 0,
  };
}

export async function fetchNotificationCounts(domain?: string): Promise<NotificationCounts> {
  const response = await fetchClient.GET('/api/v1/notifications/counts' as never, {
    params: { query: { domain } },
  } as never);

  if (response.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to fetch notification counts'
    );
  }

  const parsed = notificationCountsResponseSchema.parse(response.data ?? {});
  if (parsed.success === false) {
    throw new Error(parsed.message || 'Failed to fetch notification counts');
  }

  return parsed.data;
}

async function applyNotificationAction(uuid: string, action: 'read' | 'archive' | 'popup_seen') {
  const response = await fetchClient.POST('/api/v1/notifications/{uuid}' as never, {
    params: {
      path: { uuid },
      query: { action },
    },
  } as never);

  if (response.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to update notification'
    );
  }

  return notificationActionResponseSchema.parse(response.data ?? {});
}

async function markAllNotificationsRead(domain?: string) {
  const response = await fetchClient.POST('/api/v1/notifications' as never, {
    params: {
      query: { action: 'read_all', domain },
    },
  } as never);

  if (response.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to mark notifications read'
    );
  }

  return notificationActionResponseSchema.parse(response.data ?? {});
}

export function useNotifications(
  params: NotificationListParams,
  options?: Partial<UseQueryOptions<NotificationListResult, Error>>
) {
  const normalizedParams = normalizeListParams(params);

  return useQuery({
    queryKey: notificationListQueryKey(normalizedParams),
    queryFn: () => fetchNotifications(normalizedParams),
    refetchInterval: 30_000,
    ...options,
  });
}

export function useNotificationCounts(
  domain?: string,
  options?: Partial<UseQueryOptions<NotificationCounts, Error>>
) {
  return useQuery({
    queryKey: notificationCountsQueryKey(domain),
    queryFn: () => fetchNotificationCounts(domain),
    refetchInterval: 30_000,
    ...options,
  });
}

export function useNotificationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, action }: { uuid: string; action: 'read' | 'archive' | 'popup_seen' }) =>
      applyNotificationAction(uuid, action),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead(domain?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(domain),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
