'use client';

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Building2,
  BookOpen,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  BellRing,
  AlertCircle,
} from 'lucide-react';
import type { ActivityEventDTO, AdminDashboardStatsDTO, ActivityEventStatus } from '@/services/api/actions';

interface ActivityFeedProps {
  statistics?: AdminDashboardStatsDTO;
  events: ActivityEventDTO[];
  isLoading: boolean;
}

const CATEGORY_LABELS: Record<ActivityEventDTO['category'], string> = {
  user: 'Users',
  organization: 'Organisations',
  compliance: 'Compliance',
  learning: 'Learning',
  admin: 'Admins',
  notifications: 'Notifications',
  general: 'General',
};

const getActivityIcon = (category: ActivityEventDTO['category']) => {
  switch (category) {
    case 'user':
      return User;
    case 'organization':
      return Building2;
    case 'learning':
      return BookOpen;
    case 'admin':
      return Shield;
    case 'notifications':
      return BellRing;
    case 'compliance':
      return Shield;
    default:
      return User;
  }
};

const getStatusBadge = (status: ActivityEventStatus) => {
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
    case 'warning':
      return (
        <Badge variant='warning' className='gap-1'>
          <AlertIcon />
          Warning
        </Badge>
      );
    case 'critical':
      return (
        <Badge variant='destructive' className='gap-1'>
          <XCircle className='h-3 w-3' />
          Attention
        </Badge>
      );
    default:
      return <Badge variant='secondary'>Info</Badge>;
  }
};

function AlertIcon() {
  return <AlertCircle className='h-3 w-3' />;
}

const categoryOptions: Array<{ value: ActivityEventDTO['category'] | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'user', label: CATEGORY_LABELS.user },
  { value: 'organization', label: CATEGORY_LABELS.organization },
  { value: 'compliance', label: CATEGORY_LABELS.compliance },
  { value: 'learning', label: CATEGORY_LABELS.learning },
  { value: 'admin', label: CATEGORY_LABELS.admin },
  { value: 'notifications', label: CATEGORY_LABELS.notifications },
];

function filterEvents(
  events: ActivityEventDTO[],
  category: ActivityEventDTO['category'] | 'all'
): ActivityEventDTO[] {
  if (category === 'all') return events;
  return events.filter(event => event.category === category);
}

export default function ActivityFeed({ statistics, events, isLoading }: ActivityFeedProps) {
  const snapshotTimestamp = statistics?.timestamp ?? null;

  const preparedEvents = useMemo(() => {
    if (events.length === 0) {
      return events;
    }

    return events.map(event => ({
      ...event,
      occurredAt: event.occurredAt ?? snapshotTimestamp ?? undefined,
    }));
  }, [events, snapshotTimestamp]);

  if (isLoading) {
    return (
      <DashboardChartCard
        title='Recent activity'
        description='Latest events and actions across the platform'
      >
        <div className='space-y-4'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className='h-20 w-full' />
          ))}
        </div>
      </DashboardChartCard>
    );
  }

  const snapshotTime = snapshotTimestamp
    ? formatDistanceToNow(snapshotTimestamp, { addSuffix: true })
    : 'a few moments ago';

  const renderEvents = (category: ActivityEventDTO['category'] | 'all') => {
    const filtered = filterEvents(preparedEvents, category);

    if (filtered.length === 0) {
      return (
        <div className='flex h-32 flex-col items-center justify-center text-center text-sm text-muted-foreground'>
          <Shield className='mb-2 h-6 w-6' />
          No recent activity to display for this snapshot.
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        {filtered.map(event => {
          const category = (event.category ?? 'general') as ActivityEventDTO['category'];
          const Icon = getActivityIcon(category);
          const occurredAt = event.occurredAt
            ? formatDistanceToNow(event.occurredAt, { addSuffix: true })
            : snapshotTime;

          return (
            <div
              key={event.id}
              className='hover:bg-muted/50 flex items-start gap-4 rounded-lg border p-4 transition-colors'
            >
              <div className='bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full'>
                <Icon className='text-primary h-5 w-5' />
              </div>
              <div className='flex-1 space-y-1'>
                <p className='text-sm'>
                  <span className='font-medium'>{event.title}</span>{' '}
                  <span className='text-muted-foreground'>{event.description}</span>
                </p>
                <p className='text-muted-foreground text-xs'>
                  {occurredAt}
                </p>
              </div>
              {getStatusBadge(event.status)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest events and actions across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='all' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-3 lg:grid-cols-7'>
            {categoryOptions.map(option => (
              <TabsTrigger key={option.value} value={option.value} className='text-xs md:text-sm'>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollArea className='h-[360px] pr-4'>
            {categoryOptions.map(option => (
              <TabsContent key={option.value} value={option.value} className='mt-4'>
                {renderEvents(option.value)}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
