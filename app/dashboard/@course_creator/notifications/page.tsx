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

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'request',
    title: 'New Instructor Application',
    message:
      'Sarah Johnson has applied to teach "Advanced React Development". Review their credentials and experience.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    status: 'unread',
    priority: 'high',
    sender: {
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=1',
      role: 'Instructor Applicant',
    },
    metadata: {
      courseId: 'course-123',
      courseName: 'Advanced React Development',
      requestId: 'req-001',
    },
    actions: [
      { label: 'Approve', type: 'approve', variant: 'default' },
      { label: 'Reject', type: 'reject', variant: 'destructive' },
      { label: 'View Profile', type: 'view', variant: 'outline' },
    ],
    link: '/dashboard/applications/req-001',
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message from Student',
    message:
      'Hi! I have a question about the assignment for Week 3. Could you clarify the requirements?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: 'unread',
    priority: 'medium',
    sender: {
      name: 'Michael Chen',
      avatar: 'https://i.pravatar.cc/150?img=12',
      role: 'Student',
    },
    metadata: {
      courseId: 'course-456',
      courseName: 'Introduction to Python',
      studentId: 'student-789',
    },
    actions: [
      { label: 'Reply', type: 'reply', variant: 'default' },
      { label: 'Mark as Read', type: 'dismiss', variant: 'outline' },
    ],
    link: '/dashboard/messages/2',
  },
  {
    id: '3',
    type: 'enrollment',
    title: 'New Student Enrollment',
    message: 'Emma Williams has enrolled in "Web Design Fundamentals". Class starts next Monday.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'unread',
    priority: 'medium',
    sender: {
      name: 'Emma Williams',
      avatar: 'https://i.pravatar.cc/150?img=5',
      role: 'Student',
    },
    metadata: {
      courseId: 'course-789',
      courseName: 'Web Design Fundamentals',
      studentId: 'student-456',
      studentName: 'Emma Williams',
    },
    actions: [{ label: 'View Class', type: 'view', variant: 'default' }],
    link: '/dashboard/classes/class-789',
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $150.00 for "Data Science Bootcamp" - Session 5.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    status: 'read',
    priority: 'low',
    metadata: {
      amount: 150.0,
      courseName: 'Data Science Bootcamp',
      classId: 'class-555',
    },
    actions: [{ label: 'View Details', type: 'view', variant: 'outline' }],
    link: '/dashboard/payments/payment-004',
  },
  {
    id: '5',
    type: 'class_update',
    title: 'Class Rescheduled',
    message:
      'Your "JavaScript Essentials" class on Thursday has been moved to Friday 3:00 PM due to student request.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    status: 'read',
    priority: 'high',
    metadata: {
      classId: 'class-321',
      className: 'JavaScript Essentials',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    },
    actions: [{ label: 'View Schedule', type: 'view', variant: 'default' }],
    link: '/dashboard/schedule',
  },
  {
    id: '6',
    type: 'review',
    title: 'New Student Review',
    message: 'You received a 5-star review from David Martinez for "Mobile App Development".',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    status: 'read',
    priority: 'low',
    sender: {
      name: 'David Martinez',
      avatar: 'https://i.pravatar.cc/150?img=8',
      role: 'Student',
    },
    metadata: {
      courseId: 'course-999',
      courseName: 'Mobile App Development',
    },
    actions: [{ label: 'View Review', type: 'view', variant: 'outline' }],
    link: '/dashboard/reviews/6',
  },
  {
    id: '7',
    type: 'reminder',
    title: 'Upcoming Class Reminder',
    message: 'You have a class "React Hooks Deep Dive" starting in 1 hour. 12 students enrolled.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    status: 'read',
    priority: 'urgent',
    metadata: {
      classId: 'class-111',
      className: 'React Hooks Deep Dive',
      dueDate: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    },
    actions: [{ label: 'Join Class', type: 'view', variant: 'default' }],
    link: '/dashboard/classes/class-111/join',
  },
  {
    id: '8',
    type: 'achievement',
    title: 'Milestone Achieved! 🎉',
    message:
      "Congratulations! You've successfully taught 50 classes and received an average rating of 4.8 stars.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    status: 'read',
    priority: 'low',
    actions: [{ label: 'View Stats', type: 'view', variant: 'outline' }],
    link: '/dashboard/achievements',
  },
  {
    id: '9',
    type: 'system',
    title: 'Platform Update',
    message:
      'New features available: Live polling during classes and automated attendance tracking. Check them out!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    status: 'read',
    priority: 'low',
    actions: [{ label: 'Learn More', type: 'view', variant: 'outline' }],
    link: '/dashboard/updates',
  },
  {
    id: '10',
    type: 'request',
    title: 'Course Material Access Request',
    message:
      'Alumni student requesting access to "Advanced TypeScript" course materials for review purposes.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    status: 'unread',
    priority: 'medium',
    sender: {
      name: 'Jessica Lee',
      avatar: 'https://i.pravatar.cc/150?img=9',
      role: 'Alumni',
    },
    metadata: {
      courseId: 'course-777',
      courseName: 'Advanced TypeScript',
      studentId: 'student-888',
      requestId: 'req-010',
    },
    actions: [
      { label: 'Grant Access', type: 'approve', variant: 'default' },
      { label: 'Deny', type: 'reject', variant: 'destructive' },
    ],
    link: '/dashboard/requests/req-010',
  },
];

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

      <div className='flex flex-col gap-2 rounded-md border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-800 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <p className='font-medium'>🚧 This page is under construction.</p>
          <p className='text-sm text-yellow-900'>
            Mock data is currently being displayed on this page.
          </p>
        </div>
      </div>

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
