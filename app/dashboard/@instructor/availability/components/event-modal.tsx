import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
import {
  blockInstructorTimeMutation,
  createBookingMutation,
  getStudentBookingsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CalendarClock,
  Clock,
  Coffee,
  Info,
  MapPin,
  Repeat,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import { toast } from 'sonner';
import Spinner from '../../../../../components/ui/spinner';
import type { CalendarEvent } from './types';

type RateKey =
  | 'private_online_rate'
  | 'private_inperson_rate'
  | 'group_online_rate'
  | 'group_inperson_rate';

type Rates = {
  currency: string;
} & Partial<Record<RateKey, number>>;

export interface StudentBookingData {
  booking_id?: string;
  student_uuid: string;
  instructor_uuid: string;
  course_uuid: string;
  price_amount?: number;
  rate_key?: RateKey;
  rates?: Rates;
  purpose?: string;
  instructor_name?: string;
  course_name?: string;
}

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
  studentBookingData?: StudentBookingData;
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

interface BookingOccurrence {
  start: Date;
  end: Date;
}

type EventType = 'BLOCKED' | 'AVAILABILITY' | 'SCHEDULED_INSTANCE' | 'BOOKING';

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
    {
      value: 'BOOKING',
      label: 'Student Booking',
      description: 'Request one or more instructor sessions from available slots.',
      icon: Clock,
      badgeVariant: 'secondary',
    },
  ];

const weekdayOptions = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
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

function convertDates(dates: DateTimeItem[]): OutputItem[] {
  return dates.map(item => ({
    start_time: dayjs(`${item.date}T${item.startTime}`).toISOString(),
    end_time: dayjs(`${item.date}T${item.endTime}`).toISOString(),
    color_code: '',
  }));
}

function calculateDurationHours(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

function formatOccurrenceLabel(start: Date, end: Date) {
  return `${start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} • ${start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
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

function buildRecurringOccurrences(
  startDateTime: string,
  endDateTime: string,
  recurrenceEndDate: string,
  selectedWeekdays: number[]
) {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const recurrenceEnd = new Date(`${recurrenceEndDate}T23:59:59`);
  const durationMs = end.getTime() - start.getTime();
  const occurrences: BookingOccurrence[] = [];

  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= recurrenceEnd) {
    if (selectedWeekdays.includes(cursor.getDay())) {
      const occurrenceStart = new Date(cursor);
      occurrenceStart.setHours(start.getHours(), start.getMinutes(), 0, 0);

      if (occurrenceStart >= start) {
        const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
        occurrences.push({ start: occurrenceStart, end: occurrenceEnd });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return occurrences;
}

export function EventModal({
  isOpen,
  onClose,
  event,
  selectedSlot,
  onSave,
  onDelete,
  studentBookingData,
}: EventModalProps) {
  const [formData, setFormData] = useState<FormState>(baseFormState());
  const [blockDates, setBlockDates] = useState<DateTimeItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');
  const [purpose, setPurpose] = useState('');
  const [computedPrice, setComputedPrice] = useState<number>(0);
  const [rateKey, setRateKey] = useState<RateKey | ''>('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState('');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);

  const instructor = useInstructor();
  const queryClient = useQueryClient();
  const blockTimeForInstructor = useMutation(blockInstructorTimeMutation());
  const createBookingForInstructor = useMutation(createBookingMutation());

  const rates = studentBookingData?.rates;
  const isStudentBookingFlow = Boolean(studentBookingData);
  const eventEntryType = event?.entry_type;
  const readOnlyStudentEvent =
    isStudentBookingFlow && eventEntryType && eventEntryType !== 'AVAILABILITY';

  const availableRateOptions = useMemo(
    () =>
      (
        [
          {
            key: 'private_online_rate',
            label: 'Private online',
            description: 'One learner, virtual delivery',
          },
          {
            key: 'private_inperson_rate',
            label: 'Private in person',
            description: 'One learner, onsite delivery',
          },
          {
            key: 'group_online_rate',
            label: 'Group online',
            description: 'Multiple learners, virtual delivery',
          },
          {
            key: 'group_inperson_rate',
            label: 'Group in person',
            description: 'Multiple learners, onsite delivery',
          },
        ] as const
      ).filter(option => typeof rates?.[option.key] === 'number'),
    [rates]
  );

  const visibleEventTypes = useMemo(() => {
    if (isStudentBookingFlow) {
      if (readOnlyStudentEvent && eventEntryType) {
        return eventTypes.filter(type => type.value === eventEntryType);
      }

      return eventTypes.filter(type => type.value === 'BOOKING');
    }

    return eventTypes.filter(type => type.value !== 'BOOKING');
  }, [eventEntryType, isStudentBookingFlow, readOnlyStudentEvent]);

  const selectedEventType = useMemo(() => {
    const fallbackType = isStudentBookingFlow ? 'BOOKING' : DEFAULT_EVENT_TYPE;
    return (
      visibleEventTypes.find(type => type.value === formData.entry_type) ??
      eventTypes.find(type => type.value === fallbackType)!
    );
  }, [formData.entry_type, isStudentBookingFlow, visibleEventTypes]);

  const bookingOccurrences = useMemo(() => {
    if (!bookingStart || !bookingEnd) {
      return [];
    }

    if (!repeatWeekly) {
      return [
        {
          start: new Date(bookingStart),
          end: new Date(bookingEnd),
        },
      ];
    }

    if (!repeatUntil || selectedWeekdays.length === 0) {
      return [];
    }

    return buildRecurringOccurrences(bookingStart, bookingEnd, repeatUntil, selectedWeekdays);
  }, [bookingEnd, bookingStart, repeatUntil, repeatWeekly, selectedWeekdays]);

  const totalBookingPrice = useMemo(
    () => computedPrice * Math.max(bookingOccurrences.length, 1),
    [bookingOccurrences.length, computedPrice]
  );

  useEffect(() => {
    if (!rateKey || !bookingStart || !bookingEnd || !rates) {
      setComputedPrice(0);
      return;
    }

    const start = new Date(bookingStart);
    const end = new Date(bookingEnd);

    if (end <= start) {
      setComputedPrice(0);
      return;
    }

    const ratePerHour = rates[rateKey];
    const hours = calculateDurationHours(start, end);
    setComputedPrice((ratePerHour ?? 0) * hours);
  }, [bookingEnd, bookingStart, rateKey, rates]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const bookingDefaultType: EventType = readOnlyStudentEvent ? eventEntryType! : 'BOOKING';

    if (event) {
      const baseDate = new Date(event.startDateTime || event.date);
      const endDate = new Date(event.endDateTime || event.date);
      const initialType = isStudentBookingFlow
        ? bookingDefaultType
        : event.entry_type || DEFAULT_EVENT_TYPE;

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

      const bookingSourceStart = new Date(
        event.startDateTime || `${formatDateInput(new Date(event.date))}T${event.startTime}`
      );
      const bookingSourceEnd = new Date(
        event.endDateTime || `${formatDateInput(new Date(event.date))}T${event.endTime}`
      );

      setBookingStart(formatDateTimeInput(bookingSourceStart));
      setBookingEnd(formatDateTimeInput(bookingSourceEnd));
      setPurpose(studentBookingData?.purpose || '');
      setRateKey(studentBookingData?.rate_key || '');
      setRepeatWeekly(false);
      setRepeatUntil(formatDateInput(bookingSourceStart));
      setSelectedWeekdays([bookingSourceStart.getDay()]);
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
      const initialType = isStudentBookingFlow ? 'BOOKING' : DEFAULT_EVENT_TYPE;

      setFormData({
        ...baseFormState(initialType),
        day: selectedSlot.day,
        date: selectedSlot.date,
        startTime: selectedSlot.time,
        endTime,
        startDateTime,
        endDateTime,
      });
      setBookingStart(startDateTime);
      setBookingEnd(endDateTime);
      setPurpose(studentBookingData?.purpose || '');
      setRateKey(studentBookingData?.rate_key || '');
      setRepeatWeekly(false);
      setRepeatUntil(formatDateInput(selectedSlot.date));
      setSelectedWeekdays([selectedSlot.date.getDay()]);
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

    const initialType = isStudentBookingFlow ? 'BOOKING' : DEFAULT_EVENT_TYPE;
    setFormData(baseFormState(initialType));
    setBookingStart('');
    setBookingEnd('');
    setPurpose(studentBookingData?.purpose || '');
    setRateKey(studentBookingData?.rate_key || '');
    setRepeatWeekly(false);
    setRepeatUntil('');
    setSelectedWeekdays([]);
    setBlockDates([]);
    setErrors({});
  }, [
    event,
    eventEntryType,
    isOpen,
    isStudentBookingFlow,
    readOnlyStudentEvent,
    selectedSlot,
    studentBookingData?.purpose,
    studentBookingData?.rate_key,
  ]);

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

  const toggleWeekday = (value: number, checked: boolean) => {
    setSelectedWeekdays(previous => {
      if (checked) {
        return [...previous, value].sort((left, right) => left - right);
      }

      return previous.filter(item => item !== value);
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

  const validateBooking = () => {
    const nextErrors: Record<string, string> = {};

    if (!bookingStart) {
      nextErrors.bookingStart = 'Start date and time is required';
    }

    if (!bookingEnd) {
      nextErrors.bookingEnd = 'End date and time is required';
    }

    if (bookingStart && bookingEnd) {
      const start = new Date(bookingStart);
      const end = new Date(bookingEnd);
      if (end <= start) {
        nextErrors.bookingEnd = 'End time must be after the start time';
      }
    }

    if (!rateKey) {
      nextErrors.rateKey = 'Choose a session type';
    }

    if (repeatWeekly) {
      if (!repeatUntil) {
        nextErrors.repeatUntil = 'Choose when the recurring schedule should stop';
      } else {
        const finalDate = new Date(`${repeatUntil}T23:59:59`);
        if (bookingStart && finalDate < new Date(bookingStart)) {
          nextErrors.repeatUntil = 'The recurrence end date must be on or after the first session';
        }
      }

      if (selectedWeekdays.length === 0) {
        nextErrors.selectedWeekdays = 'Select at least one weekday';
      }
    }

    if (bookingOccurrences.length === 0) {
      nextErrors.bookingOccurrences = repeatWeekly
        ? 'The selected pattern does not produce any valid sessions'
        : 'Booking details are incomplete';
    }

    if (bookingOccurrences.length > 60) {
      nextErrors.bookingOccurrences = 'Limit recurring requests to 60 sessions or fewer';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const invalidateBookingQueries = async () => {
    const targetInstructorUuid = studentBookingData?.instructor_uuid || instructor?.uuid;

    await queryClient.invalidateQueries({
      predicate: query =>
        Boolean(
          (query.queryKey?.[0] as { _id?: string; path?: { instructorUuid?: string } })?._id ===
          'getInstructorCalendar' &&
          (query.queryKey?.[0] as { path?: { instructorUuid?: string } })?.path
            ?.instructorUuid === targetInstructorUuid
        ),
    });

    await queryClient.invalidateQueries({
      queryKey: getStudentBookingsQueryKey({
        path: { studentUuid: studentBookingData?.student_uuid ?? '' },
        query: { pageable: {}, status: '' },
      }),
    });
  };

  const handleBookingSubmit = async () => {
    if (!studentBookingData) {
      toast.error('Booking context is missing');
      return;
    }

    if (!validateBooking()) {
      return;
    }

    const failures: string[] = [];
    let successCount = 0;

    for (const occurrence of bookingOccurrences) {
      try {
        await createBookingForInstructor.mutateAsync({
          body: {
            instructor_uuid: studentBookingData.instructor_uuid,
            student_uuid: studentBookingData.student_uuid,
            course_uuid: studentBookingData.course_uuid,
            start_time: dayjs(occurrence.start).toISOString() as unknown as Date,
            end_time: dayjs(occurrence.end).toISOString() as unknown as Date,
            currency: rates?.currency || 'KES',
            price_amount: computedPrice,
            purpose: purpose.trim() || undefined,
          },
        });
        successCount += 1;
      } catch (error) {
        failures.push(
          getErrorMessage(error, formatOccurrenceLabel(occurrence.start, occurrence.end))
        );
      }
    }

    if (successCount > 0) {
      await invalidateBookingQueries();
    }

    if (successCount === bookingOccurrences.length) {
      toast.success(
        bookingOccurrences.length === 1
          ? 'Booking request created successfully'
          : `${bookingOccurrences.length} booking requests created successfully`
      );
      onClose();
      return;
    }

    if (successCount > 0) {
      toast.error(
        `${successCount} booking request${successCount === 1 ? '' : 's'} created, ${failures.length} failed`
      );
      onClose();
      return;
    }

    toast.error(failures[0] || 'Failed to create booking request');
  };

  const handleBlockedSubmit = () => {
    const targetInstructorUuid = studentBookingData?.instructor_uuid || instructor?.uuid;

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
          await queryClient.invalidateQueries({
            predicate: query =>
              Boolean(
                (query.queryKey?.[0] as { _id?: string; path?: { instructorUuid?: string } })
                  ?._id === 'getInstructorCalendar' &&
                (query.queryKey?.[0] as { path?: { instructorUuid?: string } })?.path
                  ?.instructorUuid === targetInstructorUuid
              ),
          });
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

    const start = new Date(formData.startDateTime!);
    const end = new Date(formData.endDateTime!);

    const eventData: CalendarEvent = {
      id: event?.id || `event-${Date.now()}`,
      title: formData.title || '',
      description: formData.description,
      entry_type: formData.entry_type,
      startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
      startDateTime: formData.startDateTime!,
      endDateTime: formData.endDateTime!,
      date: start,
      day: start.toLocaleDateString('en-US', { weekday: 'long' }),
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
    if (selectedEventType.value === 'BOOKING') {
      await handleBookingSubmit();
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

  const isSaving = createBookingForInstructor.isPending || blockTimeForInstructor.isPending;
  const canDelete = Boolean(event?.id && onDelete && !isStudentBookingFlow);
  const sheetTitle = readOnlyStudentEvent
    ? 'View schedule details'
    : event
      ? 'Edit calendar item'
      : isStudentBookingFlow
        ? 'Request instructor booking'
        : 'Create calendar item';

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
          <div className='grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_320px]'>
            <div className='space-y-6'>
              {!isStudentBookingFlow && (
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
                        {visibleEventTypes.map(type => (
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
              )}

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
                      <div className='space-y-3'>
                        {blockDates.map((item, index) => (
                          <div
                            key={`${item.date}-${index}`}
                            className='bg-card grid gap-4 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_140px_140px_auto]'
                          >
                            <div>
                              <div className='font-medium'>
                                {new Date(`${item.date}T00:00:00`).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <p className='text-muted-foreground text-sm'>{item.date}</p>
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-xs'>Start</Label>
                              <Input
                                type='time'
                                value={item.startTime}
                                onChange={event =>
                                  updateTime(index, 'startTime', event.target.value)
                                }
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-xs'>End</Label>
                              <Input
                                type='time'
                                value={item.endTime}
                                onChange={event => updateTime(index, 'endTime', event.target.value)}
                              />
                            </div>
                            <div className='flex items-end justify-end'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() =>
                                  setBlockDates(previous =>
                                    previous.filter((_, currentIndex) => currentIndex !== index)
                                  )
                                }
                              >
                                <Trash2 className='text-destructive h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button variant='outline' onClick={() => setBlockDates([])}>
                          Clear selected dates
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedEventType.value === 'BOOKING' && (
                <Card className='gap-0 py-0'>
                  <CardHeader className='border-b px-6 py-5'>
                    <CardTitle className='text-base'>Booking details</CardTitle>
                    <CardDescription>
                      Choose the first session, then optionally repeat that same time every week on
                      one or more weekdays.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-5 px-6 py-5'>
                    {readOnlyStudentEvent ? (
                      <Alert>
                        <Info className='h-4 w-4' />
                        <AlertTitle>This slot is not open for booking</AlertTitle>
                        <AlertDescription>
                          You can only request bookings from available slots. Review the timing here
                          and choose another opening from the timetable.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className='grid gap-4 md:grid-cols-2'>
                          <div className='space-y-2'>
                            <Label>First session starts</Label>
                            <Input
                              type='datetime-local'
                              value={bookingStart}
                              onChange={event => {
                                const nextValue = event.target.value;
                                setBookingStart(nextValue);
                                if (!repeatUntil && nextValue) {
                                  setRepeatUntil(nextValue.slice(0, 10));
                                }
                              }}
                            />
                            {errors.bookingStart && (
                              <p className='text-destructive flex items-center gap-1 text-sm'>
                                <AlertCircle className='h-3 w-3' />
                                {errors.bookingStart}
                              </p>
                            )}
                          </div>

                          <div className='space-y-2'>
                            <Label>First session ends</Label>
                            <Input
                              type='datetime-local'
                              value={bookingEnd}
                              onChange={event => setBookingEnd(event.target.value)}
                            />
                            {errors.bookingEnd && (
                              <p className='text-destructive flex items-center gap-1 text-sm'>
                                <AlertCircle className='h-3 w-3' />
                                {errors.bookingEnd}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label>Session type</Label>
                          <Select
                            value={rateKey}
                            onValueChange={value => setRateKey(value as RateKey)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select a rate option' />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRateOptions.map(option => (
                                <SelectItem key={option.key} value={option.key}>
                                  {option.label} ({rates?.currency ?? 'KES'} {rates?.[option.key]}
                                  /hr)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.rateKey && (
                            <p className='text-destructive flex items-center gap-1 text-sm'>
                              <AlertCircle className='h-3 w-3' />
                              {errors.rateKey}
                            </p>
                          )}
                        </div>

                        <div className='space-y-2'>
                          <Label>Purpose</Label>
                          <Textarea
                            value={purpose}
                            onChange={event => setPurpose(event.target.value)}
                            placeholder='Tell the instructor what you want this booking to focus on'
                            rows={4}
                          />
                        </div>

                        <Separator />

                        <div className='space-y-4'>
                          <div className='bg-muted/20 flex items-start justify-between gap-4 rounded-2xl border p-4'>
                            <div className='space-y-1'>
                              <div className='flex items-center gap-2 font-medium'>
                                <Repeat className='h-4 w-4' />
                                Repeat weekly
                              </div>
                              <p className='text-muted-foreground text-sm'>
                                Use this when you want the same session time every week, such as
                                Mondays and Fridays.
                              </p>
                            </div>
                            <Checkbox
                              checked={repeatWeekly}
                              onCheckedChange={checked => setRepeatWeekly(Boolean(checked))}
                            />
                          </div>

                          {repeatWeekly && (
                            <div className='space-y-4 rounded-2xl border p-4'>
                              <div className='space-y-2'>
                                <Label>Repeat on</Label>
                                <div className='flex flex-wrap gap-2'>
                                  {weekdayOptions.map(option => {
                                    const checked = selectedWeekdays.includes(option.value);
                                    return (
                                      <label
                                        key={option.value}
                                        className='border-border hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm'
                                      >
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={nextChecked =>
                                            toggleWeekday(option.value, Boolean(nextChecked))
                                          }
                                        />
                                        <span>{option.label}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                {errors.selectedWeekdays && (
                                  <p className='text-destructive flex items-center gap-1 text-sm'>
                                    <AlertCircle className='h-3 w-3' />
                                    {errors.selectedWeekdays}
                                  </p>
                                )}
                              </div>

                              <div className='space-y-2 md:max-w-[220px]'>
                                <Label>Repeat until</Label>
                                <Input
                                  type='date'
                                  value={repeatUntil}
                                  onChange={event => setRepeatUntil(event.target.value)}
                                />
                                {errors.repeatUntil && (
                                  <p className='text-destructive flex items-center gap-1 text-sm'>
                                    <AlertCircle className='h-3 w-3' />
                                    {errors.repeatUntil}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {errors.bookingOccurrences && (
                            <p className='text-destructive flex items-center gap-1 text-sm'>
                              <AlertCircle className='h-3 w-3' />
                              {errors.bookingOccurrences}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedEventType.value !== 'BLOCKED' && selectedEventType.value !== 'BOOKING' && (
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
            </div>

            <div className='space-y-6'>
              <Card className='gap-0 py-0'>
                <CardHeader className='border-b px-6 py-5'>
                  <CardTitle className='text-base'>Summary</CardTitle>
                  <CardDescription>
                    Review the key details before you save or submit.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 px-6 py-5'>
                  {selectedEventType.value === 'BOOKING' ? (
                    <>
                      <div className='space-y-1'>
                        <p className='text-muted-foreground text-sm'>Instructor</p>
                        <p className='font-medium'>
                          {studentBookingData?.instructor_name || 'Selected instructor'}
                        </p>
                      </div>
                      <div className='space-y-1'>
                        <p className='text-muted-foreground text-sm'>Course</p>
                        <p className='font-medium'>
                          {studentBookingData?.course_name || 'Selected course'}
                        </p>
                      </div>
                      <Separator />
                      <div className='grid gap-3'>
                        <div className='flex items-center justify-between gap-3'>
                          <span className='text-muted-foreground text-sm'>Sessions</span>
                          <Badge variant='outline'>{bookingOccurrences.length || 0}</Badge>
                        </div>
                        <div className='flex items-center justify-between gap-3'>
                          <span className='text-muted-foreground text-sm'>Per session</span>
                          <span className='font-medium'>
                            {rates?.currency ?? 'KES'} {computedPrice || 0}
                          </span>
                        </div>
                        <div className='flex items-center justify-between gap-3'>
                          <span className='text-muted-foreground text-sm'>Total estimate</span>
                          <span className='font-medium'>
                            {rates?.currency ?? 'KES'} {totalBookingPrice || 0}
                          </span>
                        </div>
                      </div>
                      {bookingOccurrences.length > 0 && (
                        <>
                          <Separator />
                          <div className='space-y-3'>
                            <div className='flex items-center gap-2 font-medium'>
                              <CalendarClock className='h-4 w-4' />
                              Proposed schedule
                            </div>
                            <div className='max-h-64 space-y-2 overflow-y-auto pr-1'>
                              {bookingOccurrences.map(occurrence => (
                                <div
                                  key={occurrence.start.toISOString()}
                                  className='bg-muted/20 rounded-2xl border px-3 py-2 text-sm'
                                >
                                  {formatOccurrenceLabel(occurrence.start, occurrence.end)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : selectedEventType.value === 'BLOCKED' ? (
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
                              ? new Date(formData.startDateTime).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                              : 'No date selected'}
                          </div>
                          <p className='text-muted-foreground'>
                            {formData.startDateTime && formData.endDateTime
                              ? `${new Date(formData.startDateTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })} - ${new Date(formData.endDateTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}`
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
              disabled={isSaving || readOnlyStudentEvent}
              className='min-w-[160px]'
            >
              {isSaving ? (
                <span className='flex items-center gap-2'>
                  <Spinner className='h-4 w-4' />
                  Saving
                </span>
              ) : selectedEventType.value === 'BOOKING' ? (
                repeatWeekly ? (
                  'Submit schedule'
                ) : (
                  'Request booking'
                )
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
