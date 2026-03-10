'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { elimikaDesignSystem } from '@/lib/design-system';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Filter,
  MessageSquare,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type NotificationType =
  | 'message'
  | 'request'
  | 'enrollment'
  | 'payment'
  | 'class_update'
  | 'review'
  | 'achievement'
  | 'reminder'
  | 'system';

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

type NotificationStatus = 'unread' | 'read' | 'archived';

interface NotificationAction {
  label: string;
  type: 'approve' | 'reject' | 'view' | 'reply' | 'dismiss';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  status: NotificationStatus;
  priority: NotificationPriority;
  sender?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  metadata?: {
    courseId?: string;
    courseName?: string;
    classId?: string;
    className?: string;
    studentId?: string;
    studentName?: string;
    amount?: number;
    dueDate?: Date;
    requestId?: string;
  };
  actions?: NotificationAction[];
  link?: string;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [];

const getNotificationIcon = (type: NotificationType) => {
  const iconMap: Record<NotificationType, any> = {
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
};

const getNotificationColor = (type: NotificationType) => {
  const colorMap: Record<NotificationType, string> = {
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
};

const getPriorityBadgeVariant = (priority: NotificationPriority) => {
  const variantMap: Record<
    NotificationPriority,
    'default' | 'destructive' | 'outline' | 'secondary'
  > = {
    low: 'outline',
    medium: 'secondary',
    high: 'default',
    urgent: 'destructive',
  };
  return variantMap[priority];
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'messages' | 'requests'>('all');

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const messageCount = notifications.filter(
    n => n.type === 'message' && n.status === 'unread'
  ).length;
  const requestCount = notifications.filter(
    n => n.type === 'request' && n.status === 'unread'
  ).length;

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return notification.status === 'unread';
    if (activeTab === 'messages') return notification.type === 'message';
    if (activeTab === 'requests') return notification.type === 'request';
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, status: 'read' as NotificationStatus } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as NotificationStatus })));
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAction = (notificationId: string, actionType: string) => {
    toast.message(`Action: ${actionType} on notification: ${notificationId}`);
    // Implement action logic here
    handleMarkAsRead(notificationId);
  };

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>Notifications</h1>
            <p className='text-muted-foreground text-sm'>
              Stay updated with messages, requests, and platform activities
            </p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={handleMarkAllAsRead}>
              <Check className='mr-2 h-4 w-4' />
              Mark all as read
            </Button>
            <Button variant='outline' size='sm'>
              <Filter className='mr-2 h-4 w-4' />
              Filter
            </Button>
          </div>
        </div>
      </section>

      {/* <div className='flex flex-col gap-2 rounded-md border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-800 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <p className='font-medium'>🚧 This page is under construction.</p>
          <p className='text-sm text-yellow-900'>
            Mock data is currently being displayed on this page.
          </p>
        </div>
      </div> */}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className='mb-6'>
        <TabsList>
          <TabsTrigger value='all'>
            All
            {notifications.length > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='unread'>
            Unread
            {unreadCount > 0 && (
              <Badge variant='destructive' className='ml-2'>
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='messages'>
            Messages
            {messageCount > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {messageCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='requests'>
            Requests
            {requestCount > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {requestCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='mt-6'>
          <div className='space-y-4'>
            {filteredNotifications.length === 0 ? (
              <Card className='p-12'>
                <div className='text-muted-foreground text-center'>
                  <Bell className='mx-auto mb-4 h-12 w-12' />
                  <p className='text-lg font-medium'>No notifications</p>
                  <p className='text-sm'>You're all caught up!</p>
                </div>
              </Card>
            ) : (
              filteredNotifications.map(notification => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);

                return (
                  <Card
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      notification.status === 'unread'
                        ? 'bg-primary/5 border-l-primary border-l-4'
                        : ''
                    }`}
                  >
                    <div className='flex gap-4'>
                      {/* Icon */}
                      <div className='flex-shrink-0'>
                        {notification.sender ? (
                          <Avatar>
                            <AvatarImage src={notification.sender.avatar} />
                            <AvatarFallback>
                              {notification.sender.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div
                            className={`bg-muted flex h-10 w-10 items-center justify-center rounded-full`}
                          >
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className='min-w-0 flex-1'>
                        <div className='mb-1 flex items-start justify-between gap-2'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h3 className='text-sm font-semibold'>{notification.title}</h3>
                            {notification.status === 'unread' && (
                              <div className='bg-primary h-2 w-2 rounded-full' />
                            )}
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

                        {notification.sender && (
                          <p className='text-muted-foreground mb-1 text-xs'>
                            {notification.sender.name} • {notification.sender.role}
                          </p>
                        )}

                        <p className='text-muted-foreground mb-2 text-sm'>{notification.message}</p>

                        {notification.metadata && (
                          <div className='mb-3 flex flex-wrap gap-2 text-xs'>
                            {notification.metadata.courseName && (
                              <Badge variant='outline'>{notification.metadata.courseName}</Badge>
                            )}
                            {notification.metadata.className && (
                              <Badge variant='outline'>{notification.metadata.className}</Badge>
                            )}
                            {notification.metadata.amount && (
                              <Badge variant='outline' className='text-success'>
                                ${notification.metadata.amount.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <p className='text-muted-foreground flex items-center gap-1 text-xs'>
                            <Clock className='h-3 w-3' />
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>

                          {notification.actions && (
                            <div className='flex gap-2'>
                              {notification.actions.map((action, idx) => (
                                <Button
                                  key={idx}
                                  variant={action.variant || 'outline'}
                                  size='sm'
                                  onClick={() => handleAction(notification.id, action.type)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
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
    </div>
  );
};

export default NotificationsPage;
