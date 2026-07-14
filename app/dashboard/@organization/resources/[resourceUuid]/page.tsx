'use client';

import { apiErrorMessage } from '@/components/resourcing/conflicts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { localDate } from '@/lib/date';
import type {
  ResourceAvailabilityRule,
  ResourceBooking,
  ResourceCalendarEntry,
} from '@/services/client';
import { ResourceTypeEnum, RuleTypeEnum } from '@/services/client';
import {
  addAvailabilityRuleMutation,
  deleteAvailabilityRuleMutation,
  getCalendarOptions,
  getCalendarQueryKey,
  getResourceOptions,
  listAvailabilityRulesOptions,
  listAvailabilityRulesQueryKey,
  listBookingsOptions,
  updateAvailabilityRuleMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Loader2,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const weekdayOptions: Array<{ value: string; label: string }> = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
  { value: 'SATURDAY', label: 'Sat' },
  { value: 'SUNDAY', label: 'Sun' },
];

type RuleFormState = {
  rule_type: RuleTypeEnum;
  mode: 'recurring' | 'one_off';
  days_of_week: string[];
  start_time: string;
  end_time: string;
  specific_start: string;
  specific_end: string;
  effective_start_date: string;
  effective_end_date: string;
  notes: string;
};

function emptyRuleForm(): RuleFormState {
  return {
    rule_type: RuleTypeEnum.OPEN_HOURS,
    mode: 'recurring',
    days_of_week: [],
    start_time: '08:00',
    end_time: '18:00',
    specific_start: '',
    specific_end: '',
    effective_start_date: '',
    effective_end_date: '',
    notes: '',
  };
}

function ruleFormFromRule(rule: ResourceAvailabilityRule): RuleFormState {
  const isOneOff = Boolean(rule.specific_start);
  return {
    rule_type: rule.rule_type ?? RuleTypeEnum.OPEN_HOURS,
    mode: isOneOff ? 'one_off' : 'recurring',
    days_of_week: rule.days_of_week ? rule.days_of_week.split(',').map(day => day.trim()) : [],
    start_time: rule.start_time ? rule.start_time.slice(0, 5) : '08:00',
    end_time: rule.end_time ? rule.end_time.slice(0, 5) : '18:00',
    specific_start: rule.specific_start ? dayjs(rule.specific_start).format('YYYY-MM-DDTHH:mm') : '',
    specific_end: rule.specific_end ? dayjs(rule.specific_end).format('YYYY-MM-DDTHH:mm') : '',
    effective_start_date: rule.effective_start_date
      ? dayjs(rule.effective_start_date).format('YYYY-MM-DD')
      : '',
    effective_end_date: rule.effective_end_date
      ? dayjs(rule.effective_end_date).format('YYYY-MM-DD')
      : '',
    notes: rule.notes ?? '',
  };
}

function describeRuleWindow(rule: ResourceAvailabilityRule): string {
  if (rule.specific_start && rule.specific_end) {
    return `${dayjs(rule.specific_start).format('D MMM YYYY HH:mm')} – ${dayjs(rule.specific_end).format('D MMM YYYY HH:mm')}`;
  }
  const days = rule.days_of_week
    ? rule.days_of_week
        .split(',')
        .map(day => day.trim().slice(0, 3).toLowerCase())
        .map(day => day.charAt(0).toUpperCase() + day.slice(1))
        .join(', ')
    : 'Every day';
  const start = rule.start_time ? rule.start_time.slice(0, 5) : '';
  const end = rule.end_time ? rule.end_time.slice(0, 5) : '';
  return `${days} · ${start} – ${end}`;
}

const calendarEntryStyles: Record<string, string> = {
  OPEN_HOURS: 'border-success/40 bg-success/10 text-success',
  BLACKOUT: 'border-destructive/40 bg-destructive/10 text-destructive',
  HOLD: 'border-warning/40 bg-warning/10 text-warning-foreground',
  CONFIRMED: 'border-primary/40 bg-primary/10 text-primary',
};

const calendarEntryLabels: Record<string, string> = {
  OPEN_HOURS: 'Open',
  BLACKOUT: 'Blackout',
  HOLD: 'Job hold',
  CONFIRMED: 'Booked',
};

const bookingStatusStyles: Record<string, string> = {
  HOLD: 'border-warning/40 bg-warning/10 text-warning-foreground',
  CONFIRMED: 'border-primary/40 bg-primary/10 text-primary',
  RELEASED: 'text-muted-foreground',
  CANCELLED: 'text-muted-foreground',
};

function startOfWeek(reference: dayjs.Dayjs): dayjs.Dayjs {
  // dayjs .day(): 0 = Sunday; normalise to Monday-start weeks
  const day = reference.day();
  return reference.subtract(day === 0 ? 6 : day - 1, 'day').startOf('day');
}

export default function ResourceDetailPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const params = useParams<{ resourceUuid: string }>();
  const resourceUuid = params?.resourceUuid ?? '';
  const queryClient = useQueryClient();

  const resourceQuery = useQuery({
    ...getResourceOptions({ path: { organisationUuid, resourceUuid } }),
    enabled: Boolean(organisationUuid && resourceUuid),
  });
  const resource = resourceQuery.data?.data;
  const isVenue = resource?.resource_type === ResourceTypeEnum.VENUE;

  // ===== Calendar (week view) =====
  const [weekStart, setWeekStart] = useState(() => startOfWeek(dayjs()));
  const weekEnd = useMemo(() => weekStart.add(6, 'day'), [weekStart]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => weekStart.add(index, 'day')),
    [weekStart]
  );

  const calendarRequestOptions = useMemo(
    () => ({
      path: { organisationUuid, resourceUuid },
      query: {
        start_date: localDate(weekStart.toDate()),
        end_date: localDate(weekEnd.toDate()),
      },
    }),
    [organisationUuid, resourceUuid, weekStart, weekEnd]
  );
  const calendarQuery = useQuery({
    ...getCalendarOptions(calendarRequestOptions),
    enabled: Boolean(organisationUuid && resourceUuid),
  });
  const calendarEntries = useMemo(
    () => calendarQuery.data?.data ?? [],
    [calendarQuery.data]
  );
  const entriesByDay = useMemo(() => {
    const map = new Map<string, ResourceCalendarEntry[]>();
    for (const entry of calendarEntries) {
      if (!entry.start_time) continue;
      const key = dayjs(entry.start_time).format('YYYY-MM-DD');
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf());
    }
    return map;
  }, [calendarEntries]);

  // ===== Availability rules =====
  const rulesQuery = useQuery({
    ...listAvailabilityRulesOptions({ path: { organisationUuid, resourceUuid } }),
    enabled: Boolean(organisationUuid && resourceUuid),
  });
  const rules = useMemo(() => rulesQuery.data?.data ?? [], [rulesQuery.data]);

  const [isRuleSheetOpen, setIsRuleSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ResourceAvailabilityRule | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormState>(emptyRuleForm());

  const invalidateRulesAndCalendar = async () => {
    await queryClient.invalidateQueries({
      queryKey: listAvailabilityRulesQueryKey({ path: { organisationUuid, resourceUuid } }),
    });
    await queryClient.invalidateQueries({
      queryKey: getCalendarQueryKey(calendarRequestOptions),
    });
  };

  const addRuleMutation = useMutation({
    ...addAvailabilityRuleMutation(),
    onSuccess: async response => {
      toast.success(response?.message ?? 'Availability rule created.');
      setIsRuleSheetOpen(false);
      await invalidateRulesAndCalendar();
    },
    onError: error => {
      toast.error(apiErrorMessage(error, 'Unable to save this availability rule.'));
    },
  });
  const updateRuleMutation = useMutation({
    ...updateAvailabilityRuleMutation(),
    onSuccess: async response => {
      toast.success(response?.message ?? 'Availability rule updated.');
      setIsRuleSheetOpen(false);
      await invalidateRulesAndCalendar();
    },
    onError: error => {
      toast.error(apiErrorMessage(error, 'Unable to save this availability rule.'));
    },
  });
  const deleteRuleMutation = useMutation({
    ...deleteAvailabilityRuleMutation(),
    onSuccess: async () => {
      toast.success('Availability rule deleted.');
      await invalidateRulesAndCalendar();
    },
    onError: error => {
      toast.error(apiErrorMessage(error, 'Unable to delete this availability rule.'));
    },
  });

  const openCreateRule = () => {
    setEditingRule(null);
    setRuleForm(emptyRuleForm());
    setIsRuleSheetOpen(true);
  };
  const openEditRule = (rule: ResourceAvailabilityRule) => {
    setEditingRule(rule);
    setRuleForm(ruleFormFromRule(rule));
    setIsRuleSheetOpen(true);
  };

  const updateRuleField = <K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) => {
    setRuleForm(previous => ({ ...previous, [key]: value }));
  };

  const toggleRuleDay = (day: string) => {
    setRuleForm(previous => ({
      ...previous,
      days_of_week: previous.days_of_week.includes(day)
        ? previous.days_of_week.filter(value => value !== day)
        : [...previous.days_of_week, day],
    }));
  };

  const handleRuleSubmit = () => {
    const isOneOff = ruleForm.mode === 'one_off';
    if (isOneOff) {
      if (ruleForm.rule_type !== RuleTypeEnum.BLACKOUT) {
        toast.error('One-off windows are only supported for blackout rules.');
        return;
      }
      if (!ruleForm.specific_start || !ruleForm.specific_end) {
        toast.error('Please choose the one-off window start and end.');
        return;
      }
      if (ruleForm.specific_end <= ruleForm.specific_start) {
        toast.error('The window end must be after its start.');
        return;
      }
    } else {
      if (!ruleForm.start_time || !ruleForm.end_time || ruleForm.end_time <= ruleForm.start_time) {
        toast.error('Please choose a valid daily start and end time.');
        return;
      }
    }

    const body: ResourceAvailabilityRule = {
      rule_type: ruleForm.rule_type,
      days_of_week:
        !isOneOff && ruleForm.days_of_week.length > 0 ? ruleForm.days_of_week.join(',') : null,
      start_time: isOneOff ? null : `${ruleForm.start_time}:00`,
      end_time: isOneOff ? null : `${ruleForm.end_time}:00`,
      specific_start: isOneOff ? new Date(ruleForm.specific_start) : null,
      specific_end: isOneOff ? new Date(ruleForm.specific_end) : null,
      effective_start_date:
        !isOneOff && ruleForm.effective_start_date
          ? localDate(ruleForm.effective_start_date)
          : null,
      effective_end_date:
        !isOneOff && ruleForm.effective_end_date ? localDate(ruleForm.effective_end_date) : null,
      notes: ruleForm.notes.trim() || null,
    };

    if (editingRule?.uuid) {
      updateRuleMutation.mutate({
        path: { organisationUuid, resourceUuid, ruleUuid: editingRule.uuid },
        body,
      });
      return;
    }
    addRuleMutation.mutate({ path: { organisationUuid, resourceUuid }, body });
  };

  // ===== Bookings =====
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingsPage, setBookingsPage] = useState(0);
  const bookingsQuery = useQuery({
    ...listBookingsOptions({
      path: { organisationUuid, resourceUuid },
      query: {
        pageable: { page: bookingsPage, size: 20 },
        ...(bookingStatusFilter !== 'all' ? { status: bookingStatusFilter } : {}),
      },
    }),
    enabled: Boolean(organisationUuid && resourceUuid),
  });
  const bookingsPageData = useMemo(
    () => extractPage<ResourceBooking>(bookingsQuery.data),
    [bookingsQuery.data]
  );
  const bookings = bookingsPageData.items;
  const totalBookings = getTotalFromMetadata(bookingsPageData.metadata);
  const totalBookingPages = Math.max(1, Math.ceil(totalBookings / 20));

  const isSavingRule = addRuleMutation.isPending || updateRuleMutation.isPending;
  const ResourceIcon = isVenue ? DoorOpen : Boxes;

  return (
    <main className='mx-auto w-full max-w-[1520px] space-y-6 px-4 py-6 sm:px-6'>
      <div className='space-y-4'>
        <Link
          href='/dashboard/resources'
          className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm'
        >
          <ArrowLeft className='h-4 w-4' />
          All resources
        </Link>

        {resourceQuery.isLoading ? (
          <Skeleton className='h-16 w-full max-w-xl' />
        ) : resource ? (
          <div className='flex flex-wrap items-center gap-4'>
            <div className='bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl'>
              <ResourceIcon className='text-primary h-6 w-6' />
            </div>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='text-foreground text-2xl font-bold tracking-tight'>
                  {resource.name}
                </h1>
                <Badge variant='outline'>{isVenue ? 'Venue' : 'Equipment pool'}</Badge>
                {resource.is_active === false ? (
                  <Badge variant='outline' className='text-muted-foreground'>
                    Deactivated
                  </Badge>
                ) : null}
              </div>
              <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-4 text-sm'>
                <span className='inline-flex items-center gap-1.5'>
                  <Users className='h-3.5 w-3.5' />
                  {isVenue
                    ? `${resource.seat_capacity ?? '—'} seats`
                    : `${resource.total_quantity ?? '—'} units`}
                </span>
                {resource.location_name ? (
                  <span className='inline-flex items-center gap-1.5'>
                    <MapPin className='h-3.5 w-3.5' />
                    {resource.location_name}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState icon={CalendarOff} title='Resource not found' variant='card' />
        )}
      </div>

      <Tabs defaultValue='calendar'>
        <TabsList>
          <TabsTrigger value='calendar'>Calendar</TabsTrigger>
          <TabsTrigger value='rules'>Availability rules</TabsTrigger>
          <TabsTrigger value='bookings'>Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value='calendar' className='space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8'
                onClick={() => setWeekStart(previous => previous.subtract(7, 'day'))}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setWeekStart(startOfWeek(dayjs()))}
              >
                Today
              </Button>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8'
                onClick={() => setWeekStart(previous => previous.add(7, 'day'))}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
              <span className='text-foreground ml-2 text-sm font-semibold'>
                {weekStart.format('D MMM')} – {weekEnd.format('D MMM YYYY')}
              </span>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              {Object.entries(calendarEntryLabels).map(([type, label]) => (
                <span key={type} className='inline-flex items-center gap-1.5 text-xs'>
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full border ${calendarEntryStyles[type]}`}
                  />
                  <span className='text-muted-foreground'>{label}</span>
                </span>
              ))}
            </div>
          </div>

          {calendarQuery.isLoading ? (
            <Skeleton className='h-72 w-full' />
          ) : (
            <div className='overflow-x-auto'>
              <div className='grid min-w-[840px] grid-cols-7 gap-2'>
                {weekDays.map(day => {
                  const key = day.format('YYYY-MM-DD');
                  const entries = entriesByDay.get(key) ?? [];
                  const isToday = day.isSame(dayjs(), 'day');
                  return (
                    <div
                      key={key}
                      className={`bg-card min-h-56 rounded-lg border p-2 ${isToday ? 'border-primary/50' : ''}`}
                    >
                      <div className='mb-2 text-center'>
                        <div className='text-muted-foreground text-xs uppercase'>
                          {day.format('ddd')}
                        </div>
                        <div
                          className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}
                        >
                          {day.format('D')}
                        </div>
                      </div>
                      <div className='space-y-1.5'>
                        {entries.map((entry, index) => {
                          const type = entry.entry_type ?? 'OPEN_HOURS';
                          return (
                            <div
                              key={`${entry.rule_uuid ?? entry.booking_uuid ?? index}-${index}`}
                              className={`rounded-md border px-2 py-1.5 text-xs ${calendarEntryStyles[type] ?? ''}`}
                            >
                              <div className='flex items-center gap-1 font-medium'>
                                <Clock className='h-3 w-3 shrink-0' />
                                {dayjs(entry.start_time).format('HH:mm')}–
                                {dayjs(entry.end_time).format('HH:mm')}
                              </div>
                              <div className='mt-0.5'>
                                {calendarEntryLabels[type] ?? type}
                                {entry.quantity != null && entry.quantity > 1
                                  ? ` · ${entry.quantity} units`
                                  : ''}
                              </div>
                              {entry.notes ? (
                                <div className='text-muted-foreground mt-0.5 truncate'>
                                  {entry.notes}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <p className='text-muted-foreground text-xs'>
            Job holds reserve this resource while recruitment runs and convert to bookings when an
            instructor is assigned. Without open-hours rules the resource is bookable at any time.
          </p>
        </TabsContent>

        <TabsContent value='rules' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <p className='text-muted-foreground text-sm'>
              Define when this resource can be booked. Blackouts always win over open hours.
            </p>
            <Button size='sm' onClick={openCreateRule}>
              <Plus className='mr-2 h-4 w-4' />
              Add rule
            </Button>
          </div>

          {rulesQuery.isLoading ? (
            <Skeleton className='h-32 w-full' />
          ) : rules.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              variant='card'
              title='Open around the clock'
              description='No availability rules yet — this resource can currently be booked at any time. Add open-hours or blackout rules to restrict it.'
              action={
                <Button size='sm' onClick={openCreateRule}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add a rule
                </Button>
              }
            />
          ) : (
            <div className='grid gap-3 md:grid-cols-2'>
              {rules.map(rule => (
                <div key={rule.uuid} className='bg-card flex items-start justify-between rounded-lg border p-4'>
                  <div className='min-w-0 space-y-1'>
                    <Badge
                      variant='outline'
                      className={
                        rule.rule_type === RuleTypeEnum.BLACKOUT
                          ? 'border-destructive/40 bg-destructive/10 text-destructive'
                          : 'border-success/40 bg-success/10 text-success'
                      }
                    >
                      {rule.rule_type === RuleTypeEnum.BLACKOUT ? 'Blackout' : 'Open hours'}
                    </Badge>
                    <div className='text-foreground text-sm font-medium'>
                      {describeRuleWindow(rule)}
                    </div>
                    {rule.effective_start_date || rule.effective_end_date ? (
                      <div className='text-muted-foreground text-xs'>
                        {rule.effective_start_date
                          ? `From ${dayjs(rule.effective_start_date).format('D MMM YYYY')}`
                          : ''}
                        {rule.effective_end_date
                          ? ` until ${dayjs(rule.effective_end_date).format('D MMM YYYY')}`
                          : ''}
                      </div>
                    ) : null}
                    {rule.notes ? (
                      <div className='text-muted-foreground text-xs'>{rule.notes}</div>
                    ) : null}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => openEditRule(rule)}>
                        <Pencil className='mr-2 h-4 w-4' />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive'
                        disabled={deleteRuleMutation.isPending}
                        onClick={() =>
                          rule.uuid &&
                          deleteRuleMutation.mutate({
                            path: { organisationUuid, resourceUuid, ruleUuid: rule.uuid },
                          })
                        }
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='bookings' className='space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <Select
              value={bookingStatusFilter}
              onValueChange={value => {
                setBookingStatusFilter(value);
                setBookingsPage(0);
              }}
            >
              <SelectTrigger className='w-44'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                <SelectItem value='HOLD'>Job holds</SelectItem>
                <SelectItem value='CONFIRMED'>Confirmed</SelectItem>
                <SelectItem value='RELEASED'>Released</SelectItem>
                <SelectItem value='CANCELLED'>Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <span className='text-muted-foreground text-sm'>{totalBookings} bookings</span>
          </div>

          {bookingsQuery.isLoading ? (
            <Skeleton className='h-48 w-full' />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              variant='card'
              title='No bookings'
              description='Holds appear here when a job posting reserves this resource; confirmed bookings appear when classes are scheduled into it.'
            />
          ) : (
            <div className='overflow-x-auto rounded-lg border'>
              <table className='w-full min-w-[720px] text-sm'>
                <thead>
                  <tr className='bg-muted/50 text-muted-foreground text-left text-xs uppercase'>
                    <th className='px-4 py-2.5 font-medium'>Window</th>
                    <th className='px-4 py-2.5 font-medium'>Status</th>
                    <th className='px-4 py-2.5 font-medium'>Source</th>
                    <th className='px-4 py-2.5 font-medium'>Units</th>
                    <th className='px-4 py-2.5 font-medium'>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.uuid} className='border-t'>
                      <td className='px-4 py-2.5'>
                        <div className='text-foreground font-medium'>
                          {dayjs(booking.start_time).format('ddd, D MMM YYYY')}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {dayjs(booking.start_time).format('HH:mm')} –{' '}
                          {dayjs(booking.end_time).format('HH:mm')}
                        </div>
                      </td>
                      <td className='px-4 py-2.5'>
                        <Badge
                          variant='outline'
                          className={bookingStatusStyles[booking.status ?? ''] ?? ''}
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className='text-muted-foreground px-4 py-2.5'>
                        {booking.source_type === 'MARKETPLACE_JOB'
                          ? 'Job posting'
                          : booking.source_type === 'CLASS_DEFINITION'
                            ? 'Class session'
                            : 'Manual'}
                      </td>
                      <td className='text-muted-foreground px-4 py-2.5'>{booking.quantity ?? 1}</td>
                      <td className='text-muted-foreground max-w-56 truncate px-4 py-2.5 text-xs'>
                        {booking.release_reason ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalBookingPages > 1 ? (
            <div className='flex items-center justify-end gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={bookingsPage === 0}
                onClick={() => setBookingsPage(page => Math.max(0, page - 1))}
              >
                Previous
              </Button>
              <span className='text-muted-foreground text-sm'>
                Page {bookingsPage + 1} of {totalBookingPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={bookingsPage + 1 >= totalBookingPages}
                onClick={() => setBookingsPage(page => page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <Sheet open={isRuleSheetOpen} onOpenChange={setIsRuleSheetOpen}>
        <SheetContent
          side='right'
          className='flex w-[min(98vw,520px)] max-w-none flex-col overflow-y-auto p-4 sm:max-w-none sm:p-6'
        >
          <SheetHeader className='space-y-2 pr-10 text-left'>
            <SheetTitle>{editingRule ? 'Edit availability rule' : 'Add availability rule'}</SheetTitle>
            <SheetDescription>
              Open-hours rules define when the resource may be booked; blackout rules block
              bookings, either on a recurring schedule or as a one-off window.
            </SheetDescription>
          </SheetHeader>

          <div className='mt-4 grid gap-4'>
            <div className='grid gap-2'>
              <Label>Rule type *</Label>
              <Select
                value={ruleForm.rule_type}
                onValueChange={value => {
                  updateRuleField('rule_type', value as RuleTypeEnum);
                  if (value === RuleTypeEnum.OPEN_HOURS) updateRuleField('mode', 'recurring');
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RuleTypeEnum.OPEN_HOURS}>Open hours</SelectItem>
                  <SelectItem value={RuleTypeEnum.BLACKOUT}>Blackout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ruleForm.rule_type === RuleTypeEnum.BLACKOUT ? (
              <div className='grid gap-2'>
                <Label>Window kind</Label>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    variant={ruleForm.mode === 'recurring' ? 'default' : 'outline'}
                    onClick={() => updateRuleField('mode', 'recurring')}
                  >
                    Recurring
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant={ruleForm.mode === 'one_off' ? 'default' : 'outline'}
                    onClick={() => updateRuleField('mode', 'one_off')}
                  >
                    One-off
                  </Button>
                </div>
              </div>
            ) : null}

            {ruleForm.mode === 'one_off' ? (
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label>From *</Label>
                  <Input
                    type='datetime-local'
                    value={ruleForm.specific_start}
                    onChange={event => updateRuleField('specific_start', event.target.value)}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label>Until *</Label>
                  <Input
                    type='datetime-local'
                    value={ruleForm.specific_end}
                    onChange={event => updateRuleField('specific_end', event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className='grid gap-2'>
                  <Label>Days of week</Label>
                  <div className='flex flex-wrap gap-1.5'>
                    {weekdayOptions.map(option => (
                      <Button
                        key={option.value}
                        type='button'
                        size='sm'
                        variant={
                          ruleForm.days_of_week.includes(option.value) ? 'default' : 'outline'
                        }
                        onClick={() => toggleRuleDay(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    Leave all days unselected to apply the rule every day.
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='grid gap-2'>
                    <Label>Start time *</Label>
                    <Input
                      type='time'
                      value={ruleForm.start_time}
                      onChange={event => updateRuleField('start_time', event.target.value)}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>End time *</Label>
                    <Input
                      type='time'
                      value={ruleForm.end_time}
                      onChange={event => updateRuleField('end_time', event.target.value)}
                    />
                  </div>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='grid gap-2'>
                    <Label>Effective from</Label>
                    <Input
                      type='date'
                      value={ruleForm.effective_start_date}
                      onChange={event => updateRuleField('effective_start_date', event.target.value)}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Effective until</Label>
                    <Input
                      type='date'
                      value={ruleForm.effective_end_date}
                      onChange={event => updateRuleField('effective_end_date', event.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className='grid gap-2'>
              <Label>Notes</Label>
              <Textarea
                value={ruleForm.notes}
                rows={2}
                placeholder='e.g. Public holiday, maintenance…'
                onChange={event => updateRuleField('notes', event.target.value)}
              />
            </div>

            <Button onClick={handleRuleSubmit} disabled={isSavingRule} className='mt-2'>
              {isSavingRule ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              {editingRule ? 'Save rule' : 'Add rule'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
