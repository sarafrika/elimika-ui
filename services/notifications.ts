import { toNumber } from '@/lib/metrics';
import { fetchClient } from '@/services/api/fetch-client';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

const notificationSchema = z.object({
  uuid: z.string().uuid(),
  notification_id: z.string().uuid().optional(),
  type: z.string(),
  category: z.string().optional(),
  priority: z.string().default('NORMAL'),
  presentation: z.string().default('INBOX'),
  status: z.string().default('UNREAD'),
  title: z.string(),
  body: z.string(),
  action_url: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
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
      unread_count: z.number().int().default(0),
      popup_count: z.number().int().default(0),
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

export const notificationCountsQueryKey = ['notifications', 'counts'] as const;

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
  const items = parsed.data?.content ?? [];
  const metadata = parsed.data?.metadata ?? {};
  const page = metadata.pageNumber ?? normalizedParams.page ?? 0;
  const size = metadata.pageSize ?? normalizedParams.size ?? 20;
  const totalItems = toNumber(metadata.totalElements);
  const totalPages = metadata.totalPages ?? (totalItems > 0 ? Math.ceil(totalItems / size) : 0);

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

export async function fetchNotificationCounts(): Promise<NotificationCounts> {
  const response = await fetchClient.GET('/api/v1/notifications/counts' as never);

  if (response.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to fetch notification counts'
    );
  }

  return notificationCountsResponseSchema.parse(response.data ?? {}).data;
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

async function markAllNotificationsRead() {
  const response = await fetchClient.POST('/api/v1/notifications' as never, {
    params: {
      query: { action: 'read_all' },
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
  options?: Partial<UseQueryOptions<NotificationCounts, Error>>
) {
  return useQuery({
    queryKey: notificationCountsQueryKey,
    queryFn: fetchNotificationCounts,
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

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
