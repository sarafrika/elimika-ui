'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Trash2,
  UserPlus,
  type LucideIcon
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { sampleAlertNotifications } from './data';
import type {
  AlertNotification,
  AlertNotificationPriority,
  AlertNotificationTab,
  AlertNotificationType,
} from './types';

const notificationTabs: AlertNotificationTab[] = ['all', 'unread', 'messages', 'requests'];

const isNotificationTab = (value: string): value is AlertNotificationTab =>
  notificationTabs.includes(value as AlertNotificationTab);

function getNotificationIcon(type: AlertNotificationType) {
  const iconMap: Record<AlertNotificationType, LucideIcon> = {
    message: MessageSquare,
    request: UserPlus,
    enrollment: CheckCircle2,
    payment: DollarSign,
    class_update: Calendar,
    review: FileText,
    achievement: CheckCircle2,
    reminder: Clock,
    system: AlertCircle,
  };

  return iconMap[type] || Bell;
}

function getNotificationColor(type: AlertNotificationType) {
  const colorMap: Record<AlertNotificationType, string> = {
    message: 'text-blue-500',
    request: 'text-purple-500',
    enrollment: 'text-green-500',
    payment: 'text-emerald-500',
    class_update: 'text-orange-500',
    review: 'text-yellow-500',
    achievement: 'text-pink-500',
    reminder: 'text-red-500',
    system: 'text-gray-500',
  };

  return colorMap[type] || 'text-gray-500';
}

function getPriorityBadgeVariant(priority: AlertNotificationPriority) {
  const variantMap: Record<
    AlertNotificationPriority,
    'default' | 'destructive' | 'outline' | 'secondary'
  > = {
    low: 'outline',
    medium: 'secondary',
    high: 'default',
    urgent: 'destructive',
  };

  return variantMap[priority];
}

export function AlertsTab() {
  const [notifications, setNotifications] = useState<AlertNotification[]>(sampleAlertNotifications);
  const [activeTab, setActiveTab] = useState<AlertNotificationTab>('all');

  const unreadCount = notifications.filter(notification => notification.status === 'unread').length;
  const messageCount = notifications.filter(
    notification => notification.type === 'message' && notification.status === 'unread'
  ).length;
  const requestCount = notifications.filter(
    notification => notification.type === 'request' && notification.status === 'unread'
  ).length;

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return notification.status === 'unread';
    if (activeTab === 'messages') return notification.type === 'message';
    if (activeTab === 'requests') return notification.type === 'request';
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications(previous =>
      previous.map(notification =>
        notification.id === id ? { ...notification, status: 'read' } : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(previous =>
      previous.map(notification => ({ ...notification, status: 'read' }))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(previous => previous.filter(notification => notification.id !== id));
  };

  const handleAction = (notificationId: string, actionType: string) => {
    toast.message(`Action: ${actionType} on notification: ${notificationId}`);
    handleMarkAsRead(notificationId);
  };

  return (
    <section className='space-y-5 bg-white'>
      <Tabs
        value={activeTab}
        onValueChange={value => {
          if (isNotificationTab(value)) {
            setActiveTab(value);
          }
        }}
      >
        <TabsList className='bg-muted/60 h-auto flex-wrap justify-start'>
          <TabsTrigger value='all'>
            All
            {notifications.length > 0 ? (
              <Badge variant='secondary' className='ml-2'>
                {notifications.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value='unread'>
            Unread
            {unreadCount > 0 ? (
              <Badge variant='destructive' className='ml-2'>
                {unreadCount}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value='messages'>
            Messages
            {messageCount > 0 ? (
              <Badge variant='secondary' className='ml-2'>
                {messageCount}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value='requests'>
            Requests
            {requestCount > 0 ? (
              <Badge variant='secondary' className='ml-2'>
                {requestCount}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='mt-5'>
          <div className='space-y-4'>
            {filteredNotifications.length === 0 ? (
              <Card className='p-8 sm:p-12'>
                <div className='text-muted-foreground text-center'>
                  <Bell className='mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12' />
                  <p className='text-base font-medium sm:text-lg'>No notifications</p>
                  <p className='text-xs sm:text-sm'>You're all caught up!</p>
                </div>
              </Card>
            ) : (
              filteredNotifications.map(notification => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);

                return (
                  <Card
                    key={notification.id}
                    className={`p-4 transition-colors ${notification.status === 'unread'
                      ? 'bg-primary/5 border-l-primary border-l-4'
                      : ''
                      }`}
                  >
                    <div className='flex gap-4'>
                      <div className='shrink-0'>
                        {notification.sender ? (
                          <Avatar>
                            <AvatarImage src={notification.sender.avatar} />
                            <AvatarFallback>
                              {notification.sender.name
                                .split(' ')
                                .map(name => name[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-full'>
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                        )}
                      </div>

                      <div className='min-w-0 flex-1'>
                        <div className='mb-1 flex flex-wrap items-start justify-between gap-2'>
                          <div className='flex min-w-0 flex-wrap items-center gap-2'>
                            <h3 className='text-sm font-semibold'>{notification.title}</h3>
                            {notification.status === 'unread' ? (
                              <div className='bg-primary h-2 w-2 rounded-full' />
                            ) : null}
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant={getPriorityBadgeVariant(notification.priority)}
                              className='text-xs'
                            >
                              {notification.priority}
                            </Badge>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDelete(notification.id)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>

                        {notification.sender ? (
                          <p className='text-muted-foreground mb-1 text-xs'>
                            {notification.sender.name} - {notification.sender.role}
                          </p>
                        ) : null}

                        <p className='text-muted-foreground mb-2 text-sm'>{notification.message}</p>

                        {notification.metadata ? (
                          <div className='mb-3 flex flex-wrap gap-2 text-xs'>
                            {notification.metadata.courseName ? (
                              <Badge variant='outline'>{notification.metadata.courseName}</Badge>
                            ) : null}
                            {notification.metadata.className ? (
                              <Badge variant='outline'>{notification.metadata.className}</Badge>
                            ) : null}
                            {notification.metadata.amount ? (
                              <Badge variant='outline' className='text-success'>
                                ${notification.metadata.amount.toFixed(2)}
                              </Badge>
                            ) : null}
                          </div>
                        ) : null}

                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <p className='text-muted-foreground flex items-center gap-1 text-xs'>
                            <Clock className='h-3 w-3' />
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>

                          {notification.actions ? (
                            <div className='flex flex-wrap gap-2'>
                              {notification.actions.map(action => (
                                <Button
                                  key={`${notification.id}-${action.type}`}
                                  variant={action.variant || 'outline'}
                                  size='sm'
                                  onClick={() => handleAction(notification.id, action.type)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
