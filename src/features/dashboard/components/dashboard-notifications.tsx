'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useMarkAllNotificationsRead,
  useNotificationAction,
  useNotificationCounts,
  useNotifications,
  type UserNotification,
} from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';
import {
  Award,
  Bell,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  GraduationCap,
  MessageSquare,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type DashboardNotificationsProps = {
  notificationHref: string;
};

const iconByType: Array<[RegExp, LucideIcon]> = [
  [/PAYMENT|RECEIPT/, CreditCard],
  [/CERTIFICATE|ACHIEVEMENT|MILESTONE/, Award],
  [/CLASS|DEADLINE|REMINDER|SCHEDULE/, CalendarClock],
  [/ENROLLMENT/, GraduationCap],
  [/APPLICATION|INVITATION|REQUEST/, UserPlus],
  [/DOCUMENT|PROFILE/, FileCheck2],
  [/MESSAGE/, MessageSquare],
];

function notificationIcon(type: string) {
  return iconByType.find(([pattern]) => pattern.test(type))?.[1] ?? Bell;
}

function notificationTime(notification: UserNotification) {
  const rawDate = notification.occurred_at ?? notification.created_at;
  if (!rawDate) {
    return '';
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: UserNotification;
  onRead: (notification: UserNotification) => void;
}) {
  const Icon = notificationIcon(notification.type);
  const unread = notification.status === 'UNREAD';
  const href = notification.urlPath || '#';

  return (
    <Link
      href={href}
      onClick={() => onRead(notification)}
      className='hover:bg-muted/60 focus-visible:ring-ring block rounded-md px-3 py-3 outline-none transition focus-visible:ring-2'
    >
      <div className='flex gap-3'>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
            unread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className='h-4 w-4' />
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-start gap-2'>
            <p className='text-foreground line-clamp-1 text-sm font-semibold'>
              {notification.title}
            </p>
            {unread ? <span className='bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full' /> : null}
          </div>
          <p className='text-muted-foreground mt-1 line-clamp-2 text-xs leading-5'>
            {notification.body}
          </p>
          <p className='text-muted-foreground mt-2 text-[11px]'>{notificationTime(notification)}</p>
        </div>
      </div>
    </Link>
  );
}

const getNotificationUrlPath = (notification: UserNotification): string => {
  const { type, metadata, action_url } = notification;

  switch (type) {
    case 'QUIZ_DEADLINE_REMINDER':
      return metadata.quiz_uuid && metadata.class_definition_uuid
        ? `/dashboard/assignment/quiz_${metadata.quiz_uuid}?classId=${metadata.class_definition_uuid}`
        : '';

    case 'ASSIGNMENT_DEADLINE_REMINDER':
      return metadata.assignment_uuid && metadata.class_definition_uuid
        ? `/dashboard/assignment/assignment_${metadata.assignment_uuid}?classId=${metadata.class_definition_uuid}`
        : '';

    case 'UPCOMING_CLASS_REMINDER':
      return metadata.class_definition_uuid
        ? `/dashboard/classes/class-training/${metadata.class_definition_uuid}`
        : '';

    default:
      return action_url || '';
  }
};

export const normalizeNotifications = (notifications: UserNotification[]) => {
  return notifications.map((notification: UserNotification) => ({
    ...notification,
    urlPath: getNotificationUrlPath(notification),
  }));
};

export function DashboardNotifications({ notificationHref }: DashboardNotificationsProps) {
  const [open, setOpen] = useState(false);
  const shownPopupIds = useRef<Set<string>>(new Set());
  const actionMutation = useNotificationAction();
  const markAllMutation = useMarkAllNotificationsRead();

  const countsQuery = useNotificationCounts();
  const recentQuery = useNotifications({ page: 0, size: 6 });
  const popupQuery = useNotifications({
    page: 0,
    size: 5,
    presentation: 'POPUP',
    popupSeen: false,
  });

  const unreadCount = countsQuery.data?.unread_count ?? 0;
  const recentNotifications = recentQuery.data?.items ?? [];
  const popupNotifications = popupQuery.data?.items ?? [];
  const normalizedNotifications = normalizeNotifications(recentNotifications);

  useEffect(() => {
    for (const notification of popupNotifications) {
      if (shownPopupIds.current.has(notification.uuid)) {
        continue;
      }

      shownPopupIds.current.add(notification.uuid);
      toast(notification.title, {
        description: notification.body,
        action: notification.action_url
          ? {
            label: 'Open',
            onClick: () => {
              window.location.href = notification.action_url || notificationHref;
            },
          }
          : undefined,
      });
      actionMutation.mutate({ uuid: notification.uuid, action: 'popup_seen' });
    }
  }, [actionMutation, notificationHref, popupNotifications]);

  const handleRead = (notification: UserNotification) => {
    if (notification.status === 'UNREAD') {
      actionMutation.mutate({ uuid: notification.uuid, action: 'read' });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='border-border/70 bg-card/80 relative h-10 w-10 rounded-md shadow-sm'
          aria-label='Notifications'
        >
          <Bell className='h-4 w-4' />
          {unreadCount > 0 ? (
            <span className='bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        className='flex h-[480px] w-[min(92vw,380px)] flex-col p-0'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-4 py-3 shrink-0'>
          <DropdownMenuLabel className='p-0 text-sm font-semibold'>
            Notifications
          </DropdownMenuLabel>

          <div className='flex items-center gap-2'>
            {unreadCount > 0 ? (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 px-2 text-xs'
                onClick={() => markAllMutation.mutate()}
              >
                <CheckCircle2 className='h-3.5 w-3.5' />
                Mark read
              </Button>
            ) : null}

            <Badge variant='secondary'>{unreadCount}</Badge>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Scrollable notifications */}
        <div className='min-h-0 flex-1'>
          <ScrollArea className='h-full'>
            <div className='p-2'>
              {normalizedNotifications.length === 0 ? (
                <div className='px-4 py-8 text-center'>
                  <Bell className='text-muted-foreground mx-auto h-8 w-8' />
                  <p className='text-foreground mt-3 text-sm font-medium'>
                    No notifications
                  </p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    You are all caught up.
                  </p>
                </div>
              ) : (
                normalizedNotifications.map(notification => (
                  <NotificationRow
                    key={notification.uuid}
                    notification={notification}
                    onRead={handleRead}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Sticky footer */}
        <div className='border-t bg-background p-2 shrink-0'>
          <Button
            asChild
            variant='ghost'
            className='w-full justify-center text-sm'
          >
            <Link
              href={notificationHref}
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
