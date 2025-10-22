'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Building2, BookOpen, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

// Mock data - replace with actual API data when endpoint is available
const activityData = [
  {
    id: 1,
    user: 'John Doe',
    action: 'registered as a new instructor',
    timestamp: '2 minutes ago',
    type: 'user',
    status: 'pending',
  },
  {
    id: 2,
    user: 'TechCorp Academy',
    action: 'submitted organization verification',
    timestamp: '15 minutes ago',
    type: 'organization',
    status: 'pending',
  },
  {
    id: 3,
    user: 'Admin Sarah',
    action: 'approved instructor profile',
    timestamp: '1 hour ago',
    type: 'admin',
    status: 'success',
  },
  {
    id: 4,
    user: 'Jane Smith',
    action: 'published new course "React Fundamentals"',
    timestamp: '2 hours ago',
    type: 'course',
    status: 'success',
  },
  {
    id: 5,
    user: 'Admin Mike',
    action: 'rejected organization application',
    timestamp: '3 hours ago',
    type: 'admin',
    status: 'rejected',
  },
  {
    id: 6,
    user: 'Skills Hub',
    action: 'added new training branch',
    timestamp: '4 hours ago',
    type: 'organization',
    status: 'success',
  },
  {
    id: 7,
    user: 'Mark Johnson',
    action: 'requested course review',
    timestamp: '5 hours ago',
    type: 'course',
    status: 'pending',
  },
  {
    id: 8,
    user: 'Admin Lisa',
    action: 'suspended user account',
    timestamp: '6 hours ago',
    type: 'admin',
    status: 'warning',
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user':
      return User;
    case 'organization':
      return Building2;
    case 'course':
      return BookOpen;
    case 'admin':
      return Shield;
    default:
      return User;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return (
        <Badge variant='success' className='gap-1'>
          <CheckCircle className='h-3 w-3' />
          Success
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant='warning' className='gap-1'>
          <Clock className='h-3 w-3' />
          Pending
        </Badge>
      );
    case 'rejected':
    case 'warning':
      return (
        <Badge variant='destructive' className='gap-1'>
          <XCircle className='h-3 w-3' />
          {status === 'rejected' ? 'Rejected' : 'Warning'}
        </Badge>
      );
    default:
      return <Badge variant='secondary'>{status}</Badge>;
  }
};

export default function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest events and actions across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className='h-[400px] pr-4'>
          <div className='space-y-4'>
            {activityData.map(activity => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className='hover:bg-muted/50 flex items-start gap-4 rounded-lg border p-4 transition-colors'
                >
                  <div className='bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full'>
                    <Icon className='text-primary h-5 w-5' />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <p className='text-sm'>
                      <span className='font-medium'>{activity.user}</span>{' '}
                      <span className='text-muted-foreground'>{activity.action}</span>
                    </p>
                    <p className='text-muted-foreground text-xs'>{activity.timestamp}</p>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
