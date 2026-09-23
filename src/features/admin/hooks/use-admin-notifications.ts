'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractEntity, extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import type { NotificationDispatch, NotificationDto } from '@/services/client';
import {
  applyActionMutation,
  applyBulkActionMutation,
  getCountsOptions,
  listNotificationsOptions,
  listSentOptions,
  sendMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { queueQuery } from '../lib/admin-queries';

export const NOTIFICATIONS_PAGE_SIZE = 20;

/** The admin sees their own inbox; `domain` also lets through anything with no domain. */
const ADMIN_DOMAIN = 'admin';

const NOTIFICATION_QUERY_IDS = ['listNotifications', 'getCounts', 'listSent'] as const;

export type NotificationTab = 'all' | 'unread' | 'archived';

/** The tab decides the status filter; "all" deliberately leaves archived out. */
function statusFor(tab: NotificationTab) {
  if (tab === 'unread') return 'UNREAD';
  if (tab === 'archived') return 'ARCHIVED';
  return undefined;
}

/** The admin's own inbox, one page at a time. */
export function useAdminNotifications(tab: NotificationTab, page: number, type?: string) {
  const status = statusFor(tab);

  const query = useQuery({
    ...listNotificationsOptions({
      query: {
        domain: ADMIN_DOMAIN,
        status,
        type: type || undefined,
        pageable: { page, size: NOTIFICATIONS_PAGE_SIZE },
      },
    }),
    ...queueQuery,
  });

  const { notifications, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<NotificationDto>(query.data);
    // "All" means everything still in the inbox, so archived rows are dropped here —
    // the API has no "not archived" filter.
    const visible = tab === 'all' ? items.filter(item => item.status !== 'ARCHIVED') : items;
    return {
      notifications: visible,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data, tab]);

  return { notifications, totalRows, pageCount, query };
}

/** Unread and popup counts for the header. */
export function useNotificationCounts() {
  const query = useQuery({
    ...getCountsOptions({ query: { domain: ADMIN_DOMAIN } }),
    ...queueQuery,
  });

  const counts = useMemo(() => {
    const data = extractEntity<{ unread_count?: number; popup_count?: number }>(query.data);
    return { unread: data?.unread_count ?? 0, popup: data?.popup_count ?? 0 };
  }, [query.data]);

  return { counts, query };
}

function useNotificationInvalidation() {
  const queryClient = useQueryClient();
  return () => invalidateGeneratedQueryIds(queryClient, NOTIFICATION_QUERY_IDS);
}

/** Mark one notification read, or archive it. There is no way back from archived. */
export function useNotificationAction() {
  const invalidate = useNotificationInvalidation();
  const mutation = useMutation(applyActionMutation());

  const apply = (
    input: { uuid: string; action: 'read' | 'archive' | 'popup_seen'; title?: string },
    onDone?: () => void
  ) => {
    mutation.mutate(
      { path: { uuid: input.uuid }, query: { action: input.action } },
      {
        onSuccess: async () => {
          await invalidate();
          toast.success(
            input.action === 'archive'
              ? `${input.title ?? 'Notification'} archived`
              : `${input.title ?? 'Notification'} marked read`
          );
          onDone?.();
        },
        onError: error => {
          toast.error(getErrorMessage(error, 'Couldn’t update that notification.'));
        },
      }
    );
  };

  return { apply, isPending: mutation.isPending };
}

/** `read_all` is the only bulk action the API accepts; anything else returns 400. */
export function useMarkAllRead() {
  const invalidate = useNotificationInvalidation();
  const mutation = useMutation(applyBulkActionMutation());

  const markAllRead = (onDone?: () => void) => {
    mutation.mutate(
      { query: { action: 'read_all', domain: ADMIN_DOMAIN } },
      {
        onSuccess: async response => {
          await invalidate();
          const affected = extractEntity<{ affected_count?: number }>(response)?.affected_count;
          toast.success(
            typeof affected === 'number'
              ? `${affected} notification(s) marked read`
              : 'Everything marked read'
          );
          onDone?.();
        },
        onError: error => {
          toast.error(getErrorMessage(error, 'Couldn’t mark those as read.'));
        },
      }
    );
  };

  return { markAllRead, isPending: mutation.isPending };
}

export interface AnnouncementInput {
  organisationUuid: string;
  organisationName: string;
  audience: string;
  channel: string;
  title: string;
  message: string;
}

/**
 * The only send the API has is per organisation. There is no platform-wide broadcast,
 * and the recipient count only comes back with the response.
 */
export function useSendAnnouncement() {
  const invalidate = useNotificationInvalidation();
  const mutation = useMutation(sendMutation());

  const send = (input: AnnouncementInput, onDone?: () => void) => {
    mutation.mutate(
      {
        path: { organisationUuid: input.organisationUuid },
        body: {
          audience: input.audience,
          channel: input.channel,
          title: input.title,
          message: input.message,
        },
      },
      {
        onSuccess: async response => {
          await invalidate();
          const dispatch = extractEntity<NotificationDispatch>(response);
          const reached = dispatch?.recipient_count;
          toast.success(
            typeof reached === 'number'
              ? `Sent to ${reached} member(s) of ${input.organisationName}`
              : `Sent to ${input.organisationName}`
          );
          onDone?.();
        },
        onError: error => {
          toast.error(getErrorMessage(error, 'Couldn’t send that announcement.'));
        },
      }
    );
  };

  return { send, isPending: mutation.isPending };
}

/** What an organisation has already been sent, newest first. */
export function useSentAnnouncements(organisationUuid?: string) {
  const query = useQuery({
    ...listSentOptions({
      path: { organisationUuid: organisationUuid ?? '' },
      query: { limit: 20 },
    }),
    ...queueQuery,
    enabled: Boolean(organisationUuid),
  });

  // Sent history comes back as a plain list, not a page.
  const dispatches = useMemo(
    () => (query.data ? extractList<NotificationDispatch>(query.data) : []),
    [query.data]
  );

  return { dispatches, query, enabled: Boolean(organisationUuid) };
}
