'use client';

import { Bell, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { absoluteDateTime, relativeTimeFromNow } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { UserNotification } from '@/services/notifications';
import { notificationIcon } from './notification-icon';

function notificationTime(notification: UserNotification) {
  const rawDate = notification.occurred_at ?? notification.created_at;
  return relativeTimeFromNow(rawDate);
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
      className='hover:bg-muted/60 focus-visible:ring-ring block rounded-md px-3 py-3 transition outline-none focus-visible:ring-2'
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
          <p
            className='text-muted-foreground mt-2 text-[11px]'
            title={absoluteDateTime(notification.occurred_at ?? notification.created_at)}
          >
            {notificationTime(notification)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function DashboardNotificationsPanel({
  notifications,
  unreadCount,
  notificationHref,
  onMarkAll,
  onRead,
  onNavigate,
}: {
  notifications: UserNotification[];
  unreadCount: number;
  notificationHref: string;
  onMarkAll: () => void;
  onRead: (notification: UserNotification) => void;
  onNavigate: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className='flex shrink-0 items-center justify-between px-4 py-3'>
        <DropdownMenuLabel className='p-0 text-sm font-semibold'>Notifications</DropdownMenuLabel>

        <div className='flex items-center gap-2'>
          {unreadCount > 0 ? (
            <Button variant='ghost' size='sm' className='h-8 px-2 text-xs' onClick={onMarkAll}>
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
            {notifications.length === 0 ? (
              <div className='px-4 py-8 text-center'>
                <Bell className='text-muted-foreground mx-auto h-8 w-8' />
                <p className='text-foreground mt-3 text-sm font-medium'>No notifications</p>
                <p className='text-muted-foreground mt-1 text-xs'>You are all caught up.</p>
              </div>
            ) : (
              notifications.map(notification => (
                <NotificationRow
                  key={notification.uuid}
                  notification={notification}
                  onRead={onRead}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Sticky footer */}
      <div className='bg-background shrink-0 border-t p-2'>
        <Button asChild variant='ghost' className='w-full justify-center text-sm'>
          <Link href={notificationHref} onClick={onNavigate}>
            View all notifications
          </Link>
        </Button>
      </div>
    </>
  );
}
