'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { absoluteDateTime, relativeTimeFromNow } from '@/lib/date';
import { cn } from '@/lib/utils';
import {
  useMarkAllNotificationsRead,
  useNotificationAction,
  useNotificationCounts,
  useNotifications,
  type NotificationListParams,
  type UserNotification,
} from '@/services/notifications';
import {
  Archive,
  Award,
  Bell,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Inbox,
  MessageSquare,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUserDomain } from '../../../../context/user-domain-context';
import { getNotificationUrlPath } from '../../../../src/features/dashboard/components/dashboard-notifications';

type NotificationTab = 'all' | 'unread' | 'popups' | 'archived';

const notificationTabs: NotificationTab[] = ['all', 'unread', 'popups', 'archived'];
const pageSize = 20;

const iconByType: Array<[RegExp, LucideIcon]> = [
  [/PAYMENT|RECEIPT/, CreditCard],
  [/CERTIFICATE|ACHIEVEMENT|MILESTONE/, Award],
  [/CLASS|DEADLINE|REMINDER|SCHEDULE/, CalendarClock],
  [/ENROLLMENT/, GraduationCap],
  [/APPLICATION|INVITATION|REQUEST/, UserPlus],
  [/DOCUMENT|PROFILE/, FileCheck2],
  [/MESSAGE/, MessageSquare],
];

function isNotificationTab(value: string): value is NotificationTab {
  return notificationTabs.includes(value as NotificationTab);
}

function getNotificationIcon(type: string) {
  return iconByType.find(([pattern]) => pattern.test(type))?.[1] ?? Bell;
}

function getNotificationTone(notification: UserNotification) {
  if (notification.status === 'UNREAD') {
    return 'bg-primary/10 text-primary';
  }

  if (notification.presentation === 'POPUP') {
    return 'bg-accent/15 text-accent-foreground';
  }

  return 'bg-muted text-muted-foreground';
}

function getQueryParams(tab: NotificationTab, page: number): NotificationListParams {
  if (tab === 'unread') {
    return { page, size: pageSize, status: 'UNREAD' };
  }

  if (tab === 'popups') {
    return { page, size: pageSize, presentation: 'POPUP' };
  }

  if (tab === 'archived') {
    return { page, size: pageSize, status: 'ARCHIVED' };
  }

  return { page, size: pageSize };
}

function notificationTime(notification: UserNotification) {
  const rawDate = notification.occurred_at ?? notification.created_at;
  return relativeTimeFromNow(rawDate, 'Recently');
}

function notificationExactTime(notification: UserNotification) {
  const rawDate = notification.occurred_at ?? notification.created_at;
  return absoluteDateTime(rawDate, 'Recently');
}

function notificationTypeLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function priorityVariant(priority: string) {
  if (priority === 'CRITICAL') return 'destructive';
  if (priority === 'HIGH') return 'warning';
  if (priority === 'LOW') return 'secondary';
  return 'outline';
}

function metadataValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function metadataEntries(notification: UserNotification) {
  return Object.entries(notification.metadata ?? {})
    .map(([key, value]) => [notificationTypeLabel(key), metadataValue(value)] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
    .slice(0, 4);
}

function NotificationLoadingList() {
  return (
    <div className='space-y-3'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className='gap-4 p-4'>
          <div className='flex gap-4'>
            <Skeleton className='h-10 w-10 shrink-0 rounded-md' />
            <div className='min-w-0 flex-1 space-y-3'>
              <div className='flex items-start justify-between gap-4'>
                <div className='w-full max-w-md space-y-2'>
                  <Skeleton className='h-4 w-2/3' />
                  <Skeleton className='h-3 w-1/3' />
                </div>
                <Skeleton className='h-7 w-24' />
              </div>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-4/5' />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AlertsTab() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const { activeDomain } = useUserDomain()
  const [page, setPage] = useState(0);
  const queryParams = getQueryParams(activeTab, page);
  const notificationsQuery = useNotifications(queryParams);
  const countsQuery = useNotificationCounts();
  const actionMutation = useNotificationAction();
  const markAllMutation = useMarkAllNotificationsRead();

  const normalizeNotifications = (notifications: UserNotification[], activeDomain: string) => {
    return notifications.map((notification: UserNotification) => ({
      ...notification,
      urlPath: getNotificationUrlPath(notification, activeDomain),
    }));
  };

  const notifications = notificationsQuery.data?.items ?? [];
  const normalizedNotifications = normalizeNotifications(notifications, activeDomain as string);

  const unreadCount = countsQuery.data?.unread_count ?? 0;
  const popupCount = countsQuery.data?.popup_count ?? 0;
  const currentPage = notificationsQuery.data?.page ?? page;
  const totalItems = notificationsQuery.data?.totalItems ?? notifications.length;
  const totalPages = notificationsQuery.data?.totalPages ?? 0;
  const hasNextPage = notificationsQuery.data?.hasNext ?? false;
  const hasPreviousPage = notificationsQuery.data?.hasPrevious ?? currentPage > 0;
  const firstItem = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const lastItem = Math.min(totalItems, currentPage * pageSize + notifications.length);

  const handleMarkAsRead = (notification: UserNotification) => {
    if (notification.status !== 'UNREAD') {
      return;
    }

    actionMutation.mutate(
      { uuid: notification.uuid, action: 'read' },
      {
        onError: () => toast.error('Could not mark notification as read'),
      }
    );
  };

  const handleArchive = (notification: UserNotification) => {
    actionMutation.mutate(
      { uuid: notification.uuid, action: 'archive' },
      {
        onError: () => toast.error('Could not archive notification'),
      }
    );
  };

  const handleMarkAllAsRead = () => {
    markAllMutation.mutate(undefined, {
      onError: () => toast.error('Could not mark notifications as read'),
    });
  };

  return (
    <section className='space-y-5 bg-background'>
      <Tabs
        value={activeTab}
        onValueChange={value => {
          if (isNotificationTab(value)) {
            setActiveTab(value);
            setPage(0);
          }
        }}
      >
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <TabsList className='bg-muted/60 h-auto flex-wrap justify-start'>
            <TabsTrigger value='all'>
              <Inbox className='h-4 w-4' />
              All
              {activeTab === 'all' && totalItems > 0 ? (
                <Badge variant='secondary' className='ml-2'>
                  {totalItems}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value='unread'>
              <Bell className='h-4 w-4' />
              Unread
              {unreadCount > 0 ? (
                <Badge variant='destructive' className='ml-2'>
                  {unreadCount}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value='popups'>
              <ExternalLink className='h-4 w-4' />
              Popups
              {popupCount > 0 ? (
                <Badge variant='secondary' className='ml-2'>
                  {popupCount}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value='archived'>
              <Archive className='h-4 w-4' />
              Archived
              {activeTab === 'archived' && totalItems > 0 ? (
                <Badge variant='secondary' className='ml-2'>
                  {totalItems}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {unreadCount > 0 ? (
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='w-full justify-center rounded-md sm:w-auto'
              disabled={markAllMutation.isPending}
              onClick={handleMarkAllAsRead}
            >
              {markAllMutation.isPending ? (
                <Spinner className='h-4 w-4' />
              ) : (
                <CheckCircle2 className='h-4 w-4' />
              )}
              Mark all read
            </Button>
          ) : null}
        </div>

        <TabsContent value={activeTab} className='mt-5 mb-20'>
          {notificationsQuery.isPending ? (
            <NotificationLoadingList />
          ) : notificationsQuery.isError ? (
            <EmptyState
              icon={Bell}
              title='Notifications could not be loaded'
              description='Refresh the page or try again shortly.'
              variant='card'
            />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title='No notifications'
              description='You are all caught up.'
              variant='card'
            />
          ) : (
            <div className='space-y-4'>
              <div className='flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
                <p>
                  Showing {firstItem}-{lastItem} of {totalItems}
                </p>
                {totalPages > 1 ? <p>Page {currentPage + 1} of {totalPages}</p> : null}
              </div>

              <div className='space-y-3'>
                {normalizedNotifications.map(notification => {
                  const Icon = getNotificationIcon(notification.type);
                  const unread = notification.status === 'UNREAD';
                  const details = metadataEntries(notification);

                  return (
                    <Card
                      key={notification.uuid}
                      className={cn(
                        'p-4 transition-colors',
                        unread ? 'border-l-4 border-l-primary bg-primary/5' : 'bg-card'
                      )}
                    >
                      <div className='flex gap-4'>
                        <div className='shrink-0'>
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-md',
                              getNotificationTone(notification)
                            )}
                          >
                            <Icon className='h-5 w-5' />
                          </div>
                        </div>

                        <div className='min-w-0 flex-1'>
                          <div className='mb-2 flex flex-wrap items-start justify-between gap-2'>
                            <div className='min-w-0'>
                              <div className='flex min-w-0 items-center gap-2'>
                                <h3 className='truncate text-sm font-semibold'>
                                  {notification.title}
                                </h3>
                                {unread ? <div className='h-2 w-2 rounded-full bg-primary' /> : null}
                              </div>
                              <p className='mt-1 text-xs text-muted-foreground'>
                                {notificationTypeLabel(notification.type)}
                              </p>
                            </div>

                            <div className='flex items-center gap-2'>
                              <Badge variant='outline' className='text-xs'>
                                {notification.presentation}
                              </Badge>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                aria-label='Archive notification'
                                disabled={actionMutation.isPending}
                                onClick={() => handleArchive(notification)}
                              >
                                <Archive className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>

                          <p className='mb-3 text-sm leading-6 text-muted-foreground'>
                            {notification.body}
                          </p>

                          <div className='mb-3 flex flex-wrap gap-2'>
                            <Badge variant='outline' className='text-xs'>
                              {notification.status}
                            </Badge>
                            <Badge variant={priorityVariant(notification.priority)} className='text-xs'>
                              {notification.priority}
                            </Badge>
                            {notification.category ? (
                              <Badge variant='secondary' className='text-xs'>
                                {notificationTypeLabel(notification.category)}
                              </Badge>
                            ) : null}
                          </div>

                          {details.length > 0 ? (
                            <dl className='mb-3 grid gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs sm:grid-cols-2'>
                              {details.map(([label, value]) => (
                                <div key={label} className='min-w-0'>
                                  <dt className='text-muted-foreground'>{label}</dt>
                                  <dd className='truncate font-medium text-foreground'>{value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}

                          <div className='flex flex-wrap items-center justify-between gap-2'>
                            <p
                              className='flex items-center gap-1 text-xs text-muted-foreground'
                              title={notificationExactTime(notification)}
                            >
                              <CalendarClock className='h-3 w-3' />
                              {notificationTime(notification)}
                            </p>

                            <div className='flex flex-wrap gap-2'>
                              {unread ? (
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='sm'
                                  disabled={actionMutation.isPending}
                                  onClick={() => handleMarkAsRead(notification)}
                                >
                                  <CheckCircle2 className='h-4 w-4' />
                                  Mark read
                                </Button>
                              ) : null}

                              {notification.urlPath ? (
                                <Button
                                  asChild
                                  size='sm'
                                  onClick={() => handleMarkAsRead(notification)}
                                >
                                  <Link href={notification.urlPath}>
                                    <ExternalLink className='h-4 w-4' />
                                    Open
                                  </Link>
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end'>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={!hasPreviousPage || notificationsQuery.isFetching}
                    onClick={() => setPage(previous => Math.max(previous - 1, 0))}
                  >
                    Previous
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={!hasNextPage || notificationsQuery.isFetching}
                    onClick={() => setPage(previous => previous + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
