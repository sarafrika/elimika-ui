'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useMarkAllNotificationsRead,
  useNotificationAction,
  useNotificationCounts,
  useNotifications,
  type NotificationListParams,
  type UserNotification,
} from '@/services/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
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

type NotificationTab = 'all' | 'unread' | 'popups' | 'archived';

const notificationTabs: NotificationTab[] = ['all', 'unread', 'popups', 'archived'];

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

function getQueryParams(tab: NotificationTab): NotificationListParams {
  if (tab === 'unread') {
    return { page: 0, size: 30, status: 'UNREAD' };
  }

  if (tab === 'popups') {
    return { page: 0, size: 30, presentation: 'POPUP' };
  }

  if (tab === 'archived') {
    return { page: 0, size: 30, status: 'ARCHIVED' };
  }

  return { page: 0, size: 30 };
}

function notificationTime(notification: UserNotification) {
  const rawDate = notification.occurred_at ?? notification.created_at;
  if (!rawDate) {
    return 'Recently';
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

function notificationTypeLabel(type: string) {
  return type
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export function AlertsTab() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const queryParams = getQueryParams(activeTab);
  const notificationsQuery = useNotifications(queryParams);
  const countsQuery = useNotificationCounts();
  const actionMutation = useNotificationAction();
  const markAllMutation = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = countsQuery.data?.unread_count ?? 0;
  const popupCount = countsQuery.data?.popup_count ?? 0;
  const totalItems = notificationsQuery.data?.totalItems ?? notifications.length;

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
          }
        }}
      >
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <TabsList className='bg-muted/60 h-auto flex-wrap justify-start'>
            <TabsTrigger value='all'>
              <Inbox className='h-4 w-4' />
              All
              {totalItems > 0 ? (
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
              <CheckCircle2 className='h-4 w-4' />
              Mark all read
            </Button>
          ) : null}
        </div>

        <TabsContent value={activeTab} className='mt-5 mb-20'>
          {notificationsQuery.isLoading ? (
            <Card className='p-8 sm:p-12'>
              <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                <div className='h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary' />
                <p className='text-sm'>Loading notifications</p>
              </div>
            </Card>
          ) : notificationsQuery.isError ? (
            <Card className='p-8 sm:p-12'>
              <div className='text-center text-muted-foreground'>
                <Bell className='mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12' />
                <p className='text-base font-medium text-foreground sm:text-lg'>
                  Notifications could not be loaded
                </p>
                <p className='mt-1 text-xs sm:text-sm'>Refresh the page or try again shortly.</p>
              </div>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className='p-8 sm:p-12'>
              <div className='text-center text-muted-foreground'>
                <Bell className='mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12' />
                <p className='text-base font-medium text-foreground sm:text-lg'>No notifications</p>
                <p className='mt-1 text-xs sm:text-sm'>You are all caught up.</p>
              </div>
            </Card>
          ) : (
            <div className='space-y-3'>
              {notifications.map(notification => {
                const Icon = getNotificationIcon(notification.type);
                const unread = notification.status === 'UNREAD';

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
                        <div className='mb-1 flex flex-wrap items-start justify-between gap-2'>
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

                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <p className='flex items-center gap-1 text-xs text-muted-foreground'>
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

                            {notification.action_url ? (
                              <Button
                                asChild
                                size='sm'
                                onClick={() => handleMarkAsRead(notification)}
                              >
                                <Link href={notification.action_url}>
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
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
