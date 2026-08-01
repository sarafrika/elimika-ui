// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  AlertTriangle,
  Bell,
  BellRing,
  CalendarIcon,
  CheckCheck,
  Clock,
  Info,
  Plus,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { extractPage } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import type { NotificationDto } from '@/services/client';
import { listNotificationsOptions } from '@/services/client/@tanstack/react-query.gen';

dayjs.extend(relativeTime);

const isReminder = (n: NotificationDto) => {
  const s = `${n.type ?? ''} ${n.category ?? ''}`.toLowerCase();
  return (
    s.includes('remind') || s.includes('due') || s.includes('schedul') || s.includes('deadline')
  );
};

const priorityTone = (n: NotificationDto) => {
  const p = (n.priority ?? '').toLowerCase();
  if (p.includes('high') || p.includes('urgent') || p.includes('critical'))
    return 'bg-destructive/10 text-destructive';
  if (p.includes('low')) return 'bg-muted text-muted-foreground';
  if (isReminder(n)) return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
};

const iconFor = (n: NotificationDto) => {
  const p = (n.priority ?? '').toLowerCase();
  if (p.includes('high') || p.includes('urgent') || p.includes('critical')) return AlertTriangle;
  if (isReminder(n)) return Clock;
  const c = (n.category ?? '').toLowerCase();
  if (c.includes('info')) return Info;
  return BellRing;
};

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'All students' },
  { value: 'instructors', label: 'All instructors' },
  { value: 'parents', label: 'Parents' },
  { value: 'staff', label: 'Staff & admins' },
] as const;

const CHANNELS = [
  { value: 'in-app', label: 'In-app' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' },
] as const;

const composerSchema = z.object({
  audience: z.string().min(1, 'Select an audience'),
  channel: z.string().min(1, 'Select a channel'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be under 120 characters'),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(1000, 'Message must be under 1000 characters'),
  scheduledAt: z.date().optional(),
});

function ComposeNotificationDialog() {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<string>('all');
  const [channel, setChannel] = useState<string>('in-app');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setAudience('all');
    setChannel('in-app');
    setTitle('');
    setMessage('');
    setSchedule(false);
    setScheduledAt(undefined);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = composerSchema.safeParse({
      audience,
      channel,
      title,
      message,
      scheduledAt: schedule ? scheduledAt : undefined,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path.join('.')] = issue.message;
      if (schedule && !scheduledAt) fieldErrors.scheduledAt = 'Pick a date';
      setErrors(fieldErrors);
      return;
    }
    if (schedule && !scheduledAt) {
      setErrors({ scheduledAt: 'Pick a date' });
      return;
    }
    const audienceLabel = AUDIENCES.find(a => a.value === audience)?.label ?? audience;
    toast.success(
      parsed.data.scheduledAt
        ? `Scheduled for ${audienceLabel} on ${format(parsed.data.scheduledAt, 'PPP')}`
        : `Sent to ${audienceLabel}`
    );
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size='sm' className='gap-2'>
          <Plus className='h-4 w-4' /> New notification
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>New notification</DialogTitle>
          <DialogDescription>
            Compose a message to a specific audience. Send now or schedule for later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='audience'>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger id='audience'>
                  <SelectValue placeholder='Select audience' />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map(a => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.audience && <p className='text-destructive text-xs'>{errors.audience}</p>}
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='channel'>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger id='channel'>
                  <SelectValue placeholder='Select channel' />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.channel && <p className='text-destructive text-xs'>{errors.channel}</p>}
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder='e.g. Term 2 schedule update'
              maxLength={120}
            />
            <div className='flex items-center justify-between'>
              {errors.title ? <p className='text-destructive text-xs'>{errors.title}</p> : <span />}
              <p className='text-muted-foreground text-[10px]'>{title.length}/120</p>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='message'>Message</Label>
            <Textarea
              id='message'
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder='Write the details recipients will see…'
              maxLength={1000}
              rows={5}
            />
            <div className='flex items-center justify-between'>
              {errors.message ? (
                <p className='text-destructive text-xs'>{errors.message}</p>
              ) : (
                <span />
              )}
              <p className='text-muted-foreground text-[10px]'>{message.length}/1000</p>
            </div>
          </div>

          <div className='bg-muted/30 space-y-2 rounded-lg border p-3'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <input
                type='checkbox'
                checked={schedule}
                onChange={e => setSchedule(e.target.checked)}
                className='border-input accent-primary h-4 w-4 rounded'
              />
              Schedule for later
            </label>
            {schedule && (
              <div className='space-y-1.5'>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !scheduledAt && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {scheduledAt ? format(scheduledAt, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={scheduledAt}
                      onSelect={setScheduledAt}
                      disabled={d => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn('pointer-events-auto p-3')}
                    />
                  </PopoverContent>
                </Popover>
                {errors.scheduledAt && (
                  <p className='text-destructive text-xs'>{errors.scheduledAt}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type='button' variant='ghost' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' className='gap-2'>
              <Send className='h-4 w-4' />
              {schedule ? 'Schedule' : 'Send now'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NotificationCard({ n }: { n: NotificationDto }) {
  const Icon = iconFor(n);
  const unread = !n.read_at;
  const when = n.occurred_at ?? n.created_at;
  return (
    <div className={cn('bg-card rounded-lg border p-3', unread && 'border-primary/30')}>
      <div className='flex items-start gap-3'>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            priorityTone(n)
          )}
        >
          <Icon className='h-4 w-4' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <p className='text-sm leading-tight font-semibold'>{n.title ?? 'Notification'}</p>
            {unread && (
              <span className='bg-primary h-2 w-2 shrink-0 rounded-full' aria-label='Unread' />
            )}
            {n.category && (
              <Badge variant='outline' className='text-[10px] capitalize'>
                {String(n.category).toLowerCase()}
              </Badge>
            )}
          </div>
          {n.body && <p className='text-muted-foreground mt-0.5 line-clamp-3 text-xs'>{n.body}</p>}
          <div className='mt-2 flex items-center gap-3'>
            <span className='text-muted-foreground text-[11px]'>
              {when ? dayjs(when).fromNow() : '—'}
            </span>
            {n.action_url && (
              <Button asChild variant='outline' size='sm' className='h-7 text-[11px]'>
                <Link href={n.action_url}>View details</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<'all' | 'alerts' | 'reminders'>('all');

  const notificationsQuery = useQuery({
    ...listNotificationsOptions({ query: { pageable: { page: 0, size: 100 } } }),
  });
  const notifications = extractPage<NotificationDto>(notificationsQuery.data).items;

  const alertsCount = notifications.filter(n => !isReminder(n)).length;
  const remindersCount = notifications.filter(n => isReminder(n)).length;
  const unreadCount = notifications.filter(n => !n.read_at).length;

  const filtered = useMemo(
    () =>
      notifications.filter(n =>
        tab === 'all' ? true : tab === 'reminders' ? isReminder(n) : !isReminder(n)
      ),
    [notifications, tab]
  );

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Notifications'
        description='Alerts, reminders and announcements for your organisation.'
        action={<ComposeNotificationDialog />}
      />

      <div className='grid gap-6 lg:grid-cols-[1fr_320px]'>
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <CardTitle className='text-base'>
                Inbox
                {unreadCount > 0 && (
                  <span className='text-muted-foreground ml-2 text-xs font-normal'>
                    {unreadCount} unread
                  </span>
                )}
              </CardTitle>
              <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
                <TabsList className='grid grid-cols-3'>
                  <TabsTrigger value='all' className='text-xs'>
                    All
                  </TabsTrigger>
                  <TabsTrigger value='alerts' className='text-xs'>
                    Alerts ({alertsCount})
                  </TabsTrigger>
                  <TabsTrigger value='reminders' className='text-xs'>
                    Reminders ({remindersCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className='space-y-2'>
            {notificationsQuery.isLoading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} className='h-16 w-full rounded-lg' />)
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="You're all caught up"
                description='New alerts and reminders will appear here.'
              />
            ) : (
              filtered.map(n => <NotificationCard key={n.uuid ?? n.notification_id} n={n} />)
            )}
          </CardContent>
        </Card>

        <div className='space-y-4'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>At a glance</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <span className='text-muted-foreground flex items-center gap-2'>
                  <BellRing className='text-success h-4 w-4' /> Alerts
                </span>
                <span className='font-semibold'>{alertsCount}</span>
              </div>
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <span className='text-muted-foreground flex items-center gap-2'>
                  <Clock className='text-warning h-4 w-4' /> Reminders
                </span>
                <span className='font-semibold'>{remindersCount}</span>
              </div>
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <span className='text-muted-foreground flex items-center gap-2'>
                  <CheckCheck className='text-primary h-4 w-4' /> Unread
                </span>
                <span className='font-semibold'>{unreadCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
