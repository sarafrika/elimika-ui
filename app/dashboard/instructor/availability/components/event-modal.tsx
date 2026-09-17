// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useInstructor } from '@/context/instructor-context';
import { dayjs } from '@/lib/date';
import { findOverlappingWindow, JOB_HOLD_BLOCK_REASON } from '@/lib/instructor-job-time';
import {
  blockInstructorTimeMutation,
  getClassDefinitionsForInstructorQueryKey,
  getInstructorCalendarQueryKey,
  getInstructorScheduleQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, BookOpen, Calendar, Coffee, Lock, MapPin, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import { toast } from 'sonner';
import Spinner from '../../../../../components/ui/spinner';
import { calendarDisplayZone, type CalendarEvent, toCalendarInstants } from './types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  selectedSlot?: {
    day: string;
    time: string;
    date: Date;
  } | null;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  /** Windows a hired job holds; availability may not overlap them. */
  jobHolds?: Array<{ start: string | Date; end: string | Date }>;
}

interface DateTimeItem {
  date: string;
  startTime: string;
  endTime: string;
}

interface OutputItem {
  start_time: string;
  end_time: string;
  color_code: string;
}

type EventType = 'BLOCKED' | 'AVAILABILITY' | 'SCHEDULED_INSTANCE';

type FormState = Partial<CalendarEvent> & {
  entry_type: EventType;
};

const DEFAULT_EVENT_TYPE: EventType = 'AVAILABILITY';

const eventTypes: Array<{
  value: EventType;
  label: string;
  description: string;
  icon: typeof Calendar;
  badgeVariant: 'default' | 'secondary' | 'success' | 'warning' | 'outline' | 'destructive';
}> = [
  {
    value: 'SCHEDULED_INSTANCE',
    label: 'Class Schedule Instance',
    description: 'Review a scheduled class session on the calendar.',
    icon: BookOpen,
    badgeVariant: 'default',
  },
  {
    value: 'BLOCKED',
    label: 'Blocked Time',
    description: 'Prevent students from booking across one or many dates.',
    icon: Coffee,
    badgeVariant: 'warning',
  },
  {
    value: 'AVAILABILITY',
    label: 'Availability',
    description: 'Add or adjust an available slot in the local calendar view.',
    icon: Calendar,
    badgeVariant: 'success',
  },
];

const baseFormState = (entryType: EventType = DEFAULT_EVENT_TYPE): FormState => ({
  title: '',
  description: '',
  entry_type: entryType,
  startTime: '',
  endTime: '',
  startDateTime: '',
  endDateTime: '',
  location: '',
  attendees: 1,
  isRecurring: false,
  recurringDays: [],
  status: 'SCHEDULED',
  reminders: [15],
  notes: '',
});

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTimeInput(date: Date) {
  return `${formatDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endMinutes = minutes + 60;
  if (endMinutes >= 60) {
    return `${pad(hours + 1)}:${pad(endMinutes - 60)}`;
  }
  return `${pad(hours)}:${pad(endMinutes)}`;
}

// The blocked-period inputs are `type='time'`, i.e. wall clock in the instructor's own browser
// zone - this form offers no zone picker - so local parsing is the correct reading before UTC.
function convertDates(dates: DateTimeItem[]): OutputItem[] {
  return dates.map(item => ({
    start_time: dayjs(`${item.date}T${item.startTime}`).toISOString(),
    end_time: dayjs(`${item.date}T${item.endTime}`).toISOString(),
    color_code: '',
  }));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      message?: string;
      error?: string | { message?: string };
      body?: { message?: string };
    };

    if (typeof maybeError.message === 'string' && maybeError.message) {
      return maybeError.message;
    }

    if (typeof maybeError.error === 'string' && maybeError.error) {
      return maybeError.error;
    }

    if (
      typeof maybeError.error === 'object' &&
      maybeError.error !== null &&
      typeof maybeError.error.message === 'string'
    ) {
      return maybeError.error.message;
    }

    if (typeof maybeError.body?.message === 'string' && maybeError.body.message) {
      return maybeError.body.message;
    }
  }

  return fallback;
}

export function EventModal({
  isOpen,
  onClose,
  event,
  selectedSlot,
  onSave,
  onDelete,
  jobHolds = [],
}: EventModalProps) {
  const [formData, setFormData] = useState<FormState>(baseFormState());
  const [blockDates, setBlockDates] = useState<DateTimeItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const instructor = useInstructor();
  const queryClient = useQueryClient();
  const blockTimeForInstructor = useMutation(blockInstructorTimeMutation());

  const selectedEventType = useMemo(
    () =>
      eventTypes.find(type => type.value === formData.entry_type) ??
      eventTypes.find(type => type.value === DEFAULT_EVENT_TYPE)!,
    [formData.entry_type]
  );

  // Blocking time over a hold is harmless; offering it as availability is not.
  const heldClashReason = useMemo(() => {
    if (jobHolds.length === 0) return null;
    if (formData.entry_type !== 'AVAILABILITY' || !formData.startDateTime || !formData.endDateTime) {
      return null;
    }
    const zone = calendarDisplayZone();
    const window = {
      start: dayjs.tz(formData.startDateTime, zone).toDate(),
      end: dayjs.tz(formData.endDateTime, zone).toDate(),
    };
    return findOverlappingWindow(jobHolds, window) ? JOB_HOLD_BLOCK_REASON : null;
  }, [formData.endDateTime, formData.entry_type, formData.startDateTime, jobHolds]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (event) {
      const baseDate = new Date(event.startDateTime || event.date);
      const endDate = new Date(event.endDateTime || event.date);
      const initialType = event.entry_type || DEFAULT_EVENT_TYPE;

      setFormData({
        ...baseFormState(initialType),
        ...event,
        entry_type: initialType,
        date: new Date(event.date),
        startDateTime: formatDateTimeInput(baseDate),
        endDateTime: formatDateTimeInput(endDate),
        startTime: event.startTime,
        endTime: event.endTime,
      });
      setBlockDates(
        event.entry_type === 'BLOCKED'
          ? [
              {
                date: formatDateInput(new Date(event.date)),
                startTime: event.startTime,
                endTime: event.endTime,
              },
            ]
          : []
      );
      setErrors({});
      return;
    }

    if (selectedSlot) {
      const endTime = getEndTime(selectedSlot.time);
      const startDateTime = `${formatDateInput(selectedSlot.date)}T${selectedSlot.time}`;
      const endDateTime = `${formatDateInput(selectedSlot.date)}T${endTime}`;
      setFormData({
        ...baseFormState(DEFAULT_EVENT_TYPE),
        day: selectedSlot.day,
        date: selectedSlot.date,
        startTime: selectedSlot.time,
        endTime,
        startDateTime,
        endDateTime,
      });
      setBlockDates([
        {
          date: formatDateInput(selectedSlot.date),
          startTime: selectedSlot.time,
          endTime,
        },
      ]);
      setErrors({});
      return;
    }

    setFormData(baseFormState(DEFAULT_EVENT_TYPE));
    setBlockDates([]);
    setErrors({});
  }, [event, isOpen, selectedSlot]);

  const handleDatesChange = (selectedDates: Array<{ toDate: () => Date }>) => {
    const newDates: DateTimeItem[] = selectedDates.map(item => {
      const date = item.toDate();
      return {
        date: formatDateInput(date),
        startTime: blockDates[0]?.startTime || formData.startTime || '09:00',
        endTime: blockDates[0]?.endTime || formData.endTime || '10:00',
      };
    });

    setBlockDates(newDates);
  };

  const updateTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setBlockDates(previous => {
      const next = [...previous];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validateStandardEvent = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      nextErrors.title = 'Title is required';
    }

    if (!formData.startDateTime) {
      nextErrors.startDateTime = 'Start date and time is required';
    }

    if (!formData.endDateTime) {
      nextErrors.endDateTime = 'End date and time is required';
    }

    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDateTime);
      if (end <= start) {
        nextErrors.endDateTime = 'End time must be after the start time';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateBlockedTime = () => {
    const nextErrors: Record<string, string> = {};

    if (blockDates.length === 0) {
      nextErrors.blockDates = 'Select at least one date to block';
    }

    const invalidPeriod = blockDates.find(item => item.endTime <= item.startTime);
    if (invalidPeriod) {
      nextErrors.blockDates = 'Each blocked range must end after it starts';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // A reserved period reaches the instructor's surfaces through three feeds - the merged
  // availability calendar, the raw timetable the scheduler reads and the class list. Keys are built
  // path-only so every cached date window matches, not just the range this modal happens to know.
  const invalidateInstructorScheduleQueries = async (instructorUuid: string) => {
    await Promise.all(
      [
        getInstructorCalendarQueryKey({ path: { instructorUuid } }),
        getInstructorScheduleQueryKey({ path: { instructorUuid } }),
        getClassDefinitionsForInstructorQueryKey({ path: { instructorUuid } }),
      ].map(queryKey => queryClient.invalidateQueries({ queryKey }))
    );
  };

  const handleBlockedSubmit = () => {
    const targetInstructorUuid = instructor?.uuid;

    if (!targetInstructorUuid) {
      toast.error('Instructor profile is required before blocking time');
      return;
    }

    if (!validateBlockedTime()) {
      return;
    }

    blockTimeForInstructor.mutate(
      {
        path: { instructorUuid: targetInstructorUuid },
        body: { periods: convertDates(blockDates) as never },
      },
      {
        onSuccess: async response => {
          await invalidateInstructorScheduleQueries(targetInstructorUuid);
          toast.success(response?.message || 'Time blocked successfully');
          onClose();
        },
        onError: error => {
          toast.error(getErrorMessage(error, 'Failed to block selected dates'));
        },
      }
    );
  };

  const handleStandardSubmit = () => {
    if (!validateStandardEvent()) {
      return;
    }

    // The `datetime-local` inputs carry no offset, so they are read as wall clock in the zone the
    // calendar renders - the same zone the API-fed events are converted into.
    const zone = calendarDisplayZone();
    const start = dayjs.tz(formData.startDateTime!, zone);
    const end = dayjs.tz(formData.endDateTime!, zone);

    const eventData: CalendarEvent = {
      id: event?.id || `event-${Date.now()}`,
      title: formData.title || '',
      description: formData.description,
      entry_type: formData.entry_type,
      ...toCalendarInstants(start.toDate(), end.toDate(), zone),
      location: formData.location,
      attendees: formData.attendees,
      isRecurring: Boolean(formData.isRecurring),
      recurringDays: formData.recurringDays || [],
      status: (formData.status || 'SCHEDULED') as CalendarEvent['status'],
      reminders: formData.reminders || [15],
      notes: formData.notes,
    };

    onSave(eventData);
    toast.success(event ? 'Event updated locally' : 'Event added locally');
    onClose();
  };

  const handleSave = async () => {
    if (heldClashReason) {
      toast.error(heldClashReason);
      return;
    }

    if (selectedEventType.value === 'BLOCKED') {
      handleBlockedSubmit();
      return;
    }

    handleStandardSubmit();
  };

  const handleDelete = () => {
    if (event?.id && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const isSaving = blockTimeForInstructor.isPending;
  const canDelete = Boolean(event?.id && onDelete);
  const sheetTitle = event ? 'Edit calendar item' : 'Create calendar item';

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent className='flex w-full flex-col overflow-hidden border-l p-0 sm:max-w-2xl lg:max-w-4xl'>
        <SheetHeader className='border-b px-6 py-5'>
          <div className='flex items-start justify-between gap-4 pr-8'>
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-2xl border'>
                  <selectedEventType.icon className='h-5 w-5' />
                </div>
                <div>
                  <SheetTitle className='text-xl'>{sheetTitle}</SheetTitle>
                  <SheetDescription>{selectedEventType.description}</SheetDescription>
                </div>
              </div>
            </div>
            <Badge variant={selectedEventType.badgeVariant}>{selectedEventType.label}</Badge>
          </div>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-6 py-6'>
          <div className='space-y-6'>
            {heldClashReason ? (
              <Alert className='border-warning/60 bg-job-hold'>
                <Lock className='h-4 w-4' />
                <AlertTitle>Held for a job you were hired for</AlertTitle>
                <AlertDescription>{heldClashReason}</AlertDescription>
              </Alert>
            ) : null}
            <Card className='gap-0 py-0'>
              <CardHeader className='border-b px-6 py-5'>
                <CardTitle className='text-base'>Entry type</CardTitle>
                <CardDescription>Choose what this calendar action represents.</CardDescription>
              </CardHeader>
              <CardContent className='px-6 py-5'>
                <Select
                  value={formData.entry_type}
                  onValueChange={value =>
                    setFormData(previous => ({
                      ...previous,
                      entry_type: value as EventType,
                    }))
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select event type' />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className='flex items-center gap-2'>
                          <type.icon className='h-4 w-4' />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedEventType.value === 'BLOCKED' && (
              <Card className='gap-0 py-0'>
                <CardHeader className='border-b px-6 py-5'>
                  <CardTitle className='text-base'>Blocked periods</CardTitle>
                  <CardDescription>
                    Pick one or more dates, then define the start and end time for each blocked
                    period.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-5 px-6 py-5'>
                  <div className='space-y-2'>
                    <Label>Select dates</Label>
                    <div className='max-w-sm'>
                      <DatePicker
                        multiple
                        value={blockDates.map(item => item.date)}
                        onChange={handleDatesChange}
                        format='YYYY-MM-DD'
                        placeholder='Pick one or more dates'
                        style={{
                          borderRadius: '1rem',
                          padding: '16px',
                          fontSize: '14px',
                          width: '100%',
                        }}
                      />
                    </div>
                    {errors.blockDates && (
                      <p className='text-destructive flex items-center gap-1 text-sm'>
                        <AlertCircle className='h-3 w-3' />
                        {errors.blockDates}
                      </p>
                    )}
                  </div>

                  {blockDates.length > 0 && (
                    <div className='space-y-2'>
                      {blockDates.map((item, index) => (
                        <div
                          key={`${item.date}-${index}`}
                          className='bg-card flex items-center gap-3 rounded-xl border px-3 py-2'
                        >
                          <div className='min-w-0 flex-1'>
                            <p className='truncate font-medium'>
                              {dayjs(item.date).format('ddd, MMM D')}
                            </p>
                          </div>

                          <Input
                            type='time'
                            className='w-28'
                            value={item.startTime}
                            onChange={e => updateTime(index, 'startTime', e.target.value)}
                          />

                          <span className='text-muted-foreground text-sm'>–</span>

                          <Input
                            type='time'
                            className='w-28'
                            value={item.endTime}
                            onChange={e => updateTime(index, 'endTime', e.target.value)}
                          />

                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() =>
                              setBlockDates(prev => prev.filter((_, i) => i !== index))
                            }
                          >
                            <Trash2 className='text-destructive h-4 w-4' />
                          </Button>
                        </div>
                      ))}

                      <Button variant='outline' size='sm' onClick={() => setBlockDates([])}>
                        Clear selected dates
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedEventType.value !== 'BLOCKED' && (
              <Card className='gap-0 py-0'>
                <CardHeader className='border-b px-6 py-5'>
                  <CardTitle className='text-base'>Event details</CardTitle>
                  <CardDescription>
                    Capture the core information for this calendar item.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-5 px-6 py-5'>
                  <div className='space-y-2'>
                    <Label htmlFor='title'>Title</Label>
                    <Input
                      id='title'
                      value={formData.title || ''}
                      onChange={event =>
                        setFormData(previous => ({ ...previous, title: event.target.value }))
                      }
                      placeholder='Enter an event title'
                    />
                    {errors.title && (
                      <p className='text-destructive flex items-center gap-1 text-sm'>
                        <AlertCircle className='h-3 w-3' />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description || ''}
                      onChange={event =>
                        setFormData(previous => ({
                          ...previous,
                          description: event.target.value,
                        }))
                      }
                      placeholder='Add context for this event'
                      rows={4}
                    />
                  </div>

                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label>Start date and time</Label>
                      <Input
                        type='datetime-local'
                        value={formData.startDateTime || ''}
                        onChange={event =>
                          setFormData(previous => ({
                            ...previous,
                            startDateTime: event.target.value,
                          }))
                        }
                      />
                      {errors.startDateTime && (
                        <p className='text-destructive flex items-center gap-1 text-sm'>
                          <AlertCircle className='h-3 w-3' />
                          {errors.startDateTime}
                        </p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label>End date and time</Label>
                      <Input
                        type='datetime-local'
                        value={formData.endDateTime || ''}
                        onChange={event =>
                          setFormData(previous => ({
                            ...previous,
                            endDateTime: event.target.value,
                          }))
                        }
                      />
                      {errors.endDateTime && (
                        <p className='text-destructive flex items-center gap-1 text-sm'>
                          <AlertCircle className='h-3 w-3' />
                          {errors.endDateTime}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label>Location</Label>
                      <Input
                        value={formData.location || ''}
                        onChange={event =>
                          setFormData(previous => ({
                            ...previous,
                            location: event.target.value,
                          }))
                        }
                        placeholder='Online, classroom, studio, or address'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label>Expected attendees</Label>
                      <Input
                        type='number'
                        min={1}
                        value={formData.attendees || 1}
                        onChange={event =>
                          setFormData(previous => ({
                            ...previous,
                            attendees: Number(event.target.value) || 1,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label>Internal notes</Label>
                    <Textarea
                      value={formData.notes || ''}
                      onChange={event =>
                        setFormData(previous => ({ ...previous, notes: event.target.value }))
                      }
                      placeholder='Optional notes for this calendar item'
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className='space-y-6'>
              <Card className='gap-0 py-0'>
                <CardHeader className='border-b px-6 py-5'>
                  <CardTitle className='text-base'>Summary</CardTitle>
                  <CardDescription>
                    Review the key details before you save or submit.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 px-6 py-5'>
                  {selectedEventType.value === 'BLOCKED' ? (
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between gap-3'>
                        <span className='text-muted-foreground text-sm'>Selected dates</span>
                        <Badge variant='outline'>{blockDates.length}</Badge>
                      </div>
                      {blockDates.slice(0, 5).map(item => (
                        <div
                          key={`${item.date}-${item.startTime}-${item.endTime}`}
                          className='bg-muted/20 rounded-2xl border px-3 py-2 text-sm'
                        >
                          {item.date} • {item.startTime} - {item.endTime}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='space-y-3 text-sm'>
                      <div className='flex items-start gap-3'>
                        <Calendar className='text-muted-foreground mt-0.5 h-4 w-4' />
                        <div>
                          <div className='font-medium'>
                            {formData.startDateTime
                              ? dayjs(formData.startDateTime).format('dddd, MMM D, YYYY')
                              : 'No date selected'}
                          </div>
                          <p className='text-muted-foreground'>
                            {formData.startDateTime && formData.endDateTime
                              ? `${dayjs(formData.startDateTime).format('h:mm A')} - ${dayjs(
                                  formData.endDateTime
                                ).format('h:mm A')}`
                              : 'Choose a start and end time'}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-3'>
                        <MapPin className='text-muted-foreground mt-0.5 h-4 w-4' />
                        <div>
                          <div className='font-medium'>Location</div>
                          <p className='text-muted-foreground'>
                            {formData.location || 'No location provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <SheetFooter className='border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex gap-2'>
            {canDelete && (
              <Button variant='destructive' onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={isSaving || Boolean(heldClashReason)}
              className='min-w-[160px]'
            >
              {isSaving ? (
                <span className='flex items-center gap-2'>
                  <Spinner className='h-4 w-4' />
                  Saving
                </span>
              ) : selectedEventType.value === 'BLOCKED' ? (
                'Block time'
              ) : event ? (
                'Save changes'
              ) : (
                'Create event'
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export type { EventType };
