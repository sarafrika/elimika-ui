import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Calendar, MapPin } from 'lucide-react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClassRecurrencePatternMutation } from '@/services/client/@tanstack/react-query.gen';
import { useEffect } from 'react';

interface TimetableFormProps {
  classId: string;
  data: any;
  onPrev: () => void;
  onNext: (data: { response: any; payload: any }) => void;
}

const SlotSchema = z.object({
  start: z.string(),
  end: z.string(),
});

const AvailabilityDaySchema = z.object({
  day: z.string(),
  enabled: z.boolean(),
  slots: z.array(SlotSchema),
});

const TimetableSchema = z.object({
  location_type: z.string(),
  location: z.string().optional(),
  duration: z.coerce.number(),
  timezone: z.string(),
  availability: z.array(AvailabilityDaySchema),
  // 🆕 Recurrence fields
  recurrence_type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('WEEKLY'),
  interval_value: z.coerce.number().min(1).default(1),
  end_date: z.string().optional(),
  occurrence_count: z.coerce.number().optional().nullable(),
  day_of_month: z.number().nullable().optional(),
});

type TimetableFormData = z.infer<typeof TimetableSchema>;

export function TimetableForm({ data, onNext, classId }: TimetableFormProps) {
  const recurrence = data?.recurrence ?? {};
  const recurrenceEndDate = recurrence?.end_date
    ? new Date(recurrence.end_date).toISOString().split('T')[0]
    : '';

  const defaultValues: TimetableFormData = {
    location_type: data?.location_type ?? '',
    location: data?.location ?? '',
    duration: data?.duration_minutes ?? '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    availability: daysOfWeek.map(day => ({
      day: day.full,
      enabled: false,
      slots: [],
    })),
    recurrence_type: recurrence?.recurrence_type || 'WEEKLY',
    interval_value: recurrence?.interval_value || 1,
    day_of_month: null,
    end_date: (recurrenceEndDate as string) || '2026-12-31',
    occurrence_count: recurrence?.occurrence_count || 0,
  };

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TimetableFormData>({
    resolver: zodResolver(TimetableSchema),
    defaultValues,
  });

  const { fields: availabilityFields, update } = useFieldArray({
    control,
    name: 'availability',
  });

  useEffect(() => {
    if (data) {
      const recurrence = data?.recurrence ?? {};
      const recurrenceEndDate = recurrence?.end_date
        ? new Date(recurrence.end_date).toISOString().split("T")[0]
        : "";

      reset({
        location_type: data?.location_type ?? "",
        location: data?.location ?? "",
        duration: data?.duration_minutes ?? "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        availability: daysOfWeek.map(day => ({
          day: day.full,
          enabled: false,
          slots: [],
        })),
        recurrence_type: recurrence?.recurrence_type || "WEEKLY",
        interval_value: recurrence?.interval_value || 1,
        day_of_month: null,
        end_date: recurrenceEndDate || "2026-12-31",
        occurrence_count: recurrence?.occurrence_count || 0,
      });
    }
  }, [data, reset]);

  const createTimetable = useMutation(createClassRecurrencePatternMutation());

  const toggleDay = (dayIndex: number) => {
    const day = availabilityFields[dayIndex];
    // @ts-expect-error
    update(dayIndex, { ...day, enabled: !day.enabled });
  };

  const onSubmit = (values: TimetableFormData) => {
    const enabledDays = values.availability
      .filter(d => d.enabled)
      .map(d => d.day.toUpperCase());

    const payload = {
      ...values,
      recurrence: {
        recurrence_type: values.recurrence_type,
        interval_value: values.interval_value,
        days_of_week: enabledDays.join(','),
        day_of_month: values.day_of_month ?? null,
        end_date: values.end_date ?? null,
        occurrence_count: values.occurrence_count ?? null,
      },
    };

    if (classId) {
      // ✅ FIXED: pass the actual data forward
      onNext({
        response: null,
        payload,
      });
    } else {
      createTimetable.mutate(
        { body: payload.recurrence as any },
        {
          onSuccess: data => {
            onNext({
              response: data?.data ?? null,
              payload,
            });
          },
        }
      );
    }
  };


  const _handleNextStep = () => {
    onNext({
      response: null,
      payload: { ...recurrence, data },
    });
  };

  const watched = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='flex flex-col items-start gap-8 md:flex-row'>
        <div className='flex-1 space-y-2'>
          <Label>Class Type *</Label>
          <Controller
            name='location_type'
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ONLINE'>Online</SelectItem>
                  <SelectItem value='IN_PERSON'>In Person</SelectItem>
                  <SelectItem value='HYBRID'>Hybrid</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* --- Location --- */}
        {['IN_PERSON', 'HYBRID'].includes(watched.location_type) && (
          <div className='flex-1 space-y-2'>
            <Label>Location *</Label>
            <div className='flex items-center gap-2'>
              <MapPin className='text-muted-foreground h-5 w-5' />
              <Controller
                name='location'
                control={control}
                render={({ field }) => <Input {...field} placeholder='Enter location' />}
              />
            </div>
          </div>
        )}
      </div>

      {/* --- Availability Days --- */}
      <Card className='space-y-4 p-4'>
        <h3 className='font-medium'>Days & Time Slots</h3>
        {availabilityFields.map((day, idx) => (
          <div
            key={day.id}
            className={`flex items-center justify-between rounded-md border p-3 ${day.enabled ? '' : 'opacity-50'}`}
          >
            <Label className='flex items-center gap-2'>
              <Switch checked={day.enabled} onCheckedChange={() => toggleDay(idx)} />
              {day.day}
            </Label>
          </div>
        ))}
      </Card>

      {/* --- Duration / Timezone --- */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Controller
          name='duration'
          control={control}
          render={({ field }) => (
            <div className='space-y-1'>
              <Label>Duration (minutes)</Label>
              <Input {...field} type='number' placeholder='60' />
            </div>
          )}
        />

        <Controller
          name='timezone'
          control={control}
          render={({ field }) => (
            <div className='space-y-1'>
              <Label>Timezone</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* --- Recurrence Fields --- */}
      <Card className='space-y-4 p-4'>
        <h3 className='flex items-center gap-2 font-medium'>
          <Calendar className='h-4 w-4' /> Recurrence Settings
        </h3>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Controller
            name='recurrence_type'
            control={control}
            render={({ field }) => (
              <div className='space-y-1'>
                <Label>Recurrence Type</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='DAILY'>Daily</SelectItem>
                    <SelectItem value='WEEKLY'>Weekly</SelectItem>
                    <SelectItem value='MONTHLY'>Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <Controller
            name='interval_value'
            control={control}
            render={({ field }) => (
              <div className='space-y-1'>
                <Label>Interval</Label>
                <Input {...field} type='number' min={1} />
              </div>
            )}
          />

          <Controller
            name='occurrence_count'
            control={control}
            render={({ field }) => (
              <div className='space-y-1'>
                <Label>Occurrence Count</Label>
                {/* @ts-ignore */}
                <Input {...field} type='number' min={1} />
              </div>
            )}
          />

          <Controller
            name='end_date'
            control={control}
            render={({ field }) => (
              <div className='space-y-1'>
                <Label>End Date</Label>
                <Input {...field} type='date' />
              </div>
            )}
          />
        </div>
      </Card>

      <div className='flex justify-end gap-4'>
        <Button type='submit'>Save & Continue</Button>

        {/* <Button type='button' variant='outline' onClick={handleNextStep}>
          Next
        </Button> */}
      </div>
    </form>
  );
}

const daysOfWeek = [
  { id: 'monday', label: 'Mon', full: 'MONDAY' },
  { id: 'tuesday', label: 'Tue', full: 'TUESDAY' },
  { id: 'wednesday', label: 'Wed', full: 'WEDNESDAY' },
  { id: 'thursday', label: 'Thu', full: 'THURSDAY' },
  { id: 'friday', label: 'Fri', full: 'FRIDAY' },
  { id: 'saturday', label: 'Sat', full: 'SATURDAY' },
  { id: 'sunday', label: 'Sun', full: 'SUNDAY' },
];

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];
