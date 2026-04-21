import type { LucideIcon } from 'lucide-react';

export type AlertNotificationType =
  | 'message'
  | 'request'
  | 'enrollment'
  | 'payment'
  | 'class_update'
  | 'review'
  | 'achievement'
  | 'reminder'
  | 'system';

export type AlertNotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AlertNotificationStatus = 'unread' | 'read' | 'archived';
export type AlertNotificationTab = 'all' | 'unread' | 'messages' | 'requests';

export type AlertNotificationAction = {
  label: string;
  type: 'approve' | 'reject' | 'view' | 'reply' | 'dismiss';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
};

export type AlertNotification = {
  id: string;
  type: AlertNotificationType;
  title: string;
  message: string;
  timestamp: Date;
  status: AlertNotificationStatus;
  priority: AlertNotificationPriority;
  sender?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  metadata?: {
    courseName?: string;
    className?: string;
    amount?: number;
  };
  actions?: AlertNotificationAction[];
};

export type MessagePreview = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  preview: string;
  meta: string;
  time: string;
  unreadCount?: number;
  isActive?: boolean;
};

export type ChatMessage = {
  id: string;
  sender: string;
  avatar: string;
  time?: string;
  content: string;
  jobCard?: {
    title: string;
    company: string;
    mode: string;
    role: string;
    skills: string;
    pay: string;
  };
};

export type ResourceItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action: string;
};
