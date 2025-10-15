import { zodResolver } from '@hookform/resolvers/zod';
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
import { updateClassDefinitionMutation } from '@/services/client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Clock, MapPin } from 'lucide-react';

interface TimetableFormProps {
  classId: string;
  data: any;
  onNext: () => void;
  onPrev: () => void;
}

const daysOfWeek = [
  { id: 'monday', label: 'Mon', full: 'Monday' },
  { id: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { id: 'thursday', label: 'Thu', full: 'Thursday' },
  { id: 'friday', label: 'Fri', full: 'Friday' },
  { id: 'saturday', label: 'Sat', full: 'Saturday' },
  { id: 'sunday', label: 'Sun', full: 'Sunday' },
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

// Zod schema for the form data
const SlotSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time'),
});

const AvailabilityDaySchema = z.object({
  day: z.string(),
  enabled: z.boolean(),
  slots: z.array(SlotSchema).refine(slots => slots.every(slot => slot.start < slot.end), {
    message: 'Start time must be before end time',
  }),
});

const TimetableSchema = z.object({
  location_type: z.any(),
  location: z.string().optional(),
  duration: z.any(),
  timezone: z.string(),
  availability: z.array(AvailabilityDaySchema),
});

type TimetableFormData = z.infer<typeof TimetableSchema>;

export function TimetableForm({ classId, data, onNext, onPrev }: TimetableFormProps) {
  const defaultValues: TimetableFormData = {
    location_type: data?.location_type ?? '',
    location: data?.location_type ?? '',
    duration: data?.duration_minutes ?? '',
    timezone: data.timetable?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    availability:
      daysOfWeek.map(day => {
        const existing = data.timetable?.availability?.find((d: any) => d.day === day.full);
        return (
          existing ?? {
            day: day.full,
            enabled: false,
            slots: [{ start: '08:00', end: '10:00' }],
          }
        );
      }) ?? [],
  };

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<TimetableFormData>({
    resolver: zodResolver(TimetableSchema),
    defaultValues,
    mode: 'onBlur',
  });
  const watchedValues = watch();

  const {
    fields: availabilityFields,
    append,
    remove,
    update,
  } = useFieldArray({
    control,
    name: 'availability',
  });

  const totalSessions =
    watchedValues?.availability
      ?.filter(day => day.enabled)
      .reduce((sum, day) => sum + (day.slots?.length ?? 0), 0) ?? 0;

  const estimatedTotalDuration = totalSessions * (Number(watchedValues?.duration) ?? 0);
  const hours = Math.floor(estimatedTotalDuration / 60);
  const minutes = estimatedTotalDuration % 60;

  const addSlot = (dayIndex: number) => {
    const day = availabilityFields[dayIndex];
    update(dayIndex, {
      day: day?.day ?? '', // <-- Provide default empty string if undefined
      enabled: day?.enabled ?? false,
      slots: [...(day?.slots ?? []), { start: '09:00', end: '10:00' }],
    });
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const day = availabilityFields[dayIndex];
    update(dayIndex, {
      day: day?.day ?? '',
      enabled: day?.enabled ?? false,
      slots: (day?.slots ?? []).filter((_, idx) => idx !== slotIndex),
    });
  };

  const toggleDay = (dayIndex: number) => {
    const day = availabilityFields[dayIndex];
    update(dayIndex, {
      day: day?.day ?? '',
      enabled: !day?.enabled,
      slots: day?.slots ?? [],
    });
  };

  const updateClassMutation = useMutation(updateClassDefinitionMutation())
  const onSubmit = (values: TimetableFormData) => {
    if (!classId) return

    // onNext();

    updateClassMutation.mutate({
      body: {
        ...data,
        location_type: values?.location_type || data?.location_type,
        duration_minutes: values?.duration || data?.duration_minutes,
      },
      path: { uuid: classId }
    }, {
      onSuccess: () => {
        onNext();
      }
    })
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {/* Class Type */}
      <div className='w-full space-y-2'>
        <Label>Class Type *</Label>
        <Controller
          name='location_type'
          control={control}
          render={({ field }) => (
            <div className='w-full'>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ONLINE'>ONLINE</SelectItem>
                  <SelectItem value='IN_PERSON'>IN_PERSON</SelectItem>
                  <SelectItem value='HYBRID'>HYBRID</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {['IN_PERSON', 'HYBRID'].includes(watchedValues.location_type) && (
        <div className='space-y-2'>
          <Label>Location *</Label>
          <div className='flex gap-2'>
            <MapPin className='text-muted-foreground mt-1 h-5 w-5' />
            <Controller
              name='location'
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder='Enter classroom or venue address' />
              )}
            />
          </div>
          {errors.location && <p className='text-destructive text-sm'>{errors.location.message}</p>}
        </div>
      )}

      {/* Availability Schedule */}
      <Card className='space-y-4 p-4 pb-20'>
        {availabilityFields.map((day, dayIndex) => (
          <div
            key={day.id}
            className={`flex flex-col items-start justify-between gap-12 rounded-md border p-4 sm:flex-row ${day.enabled ? 'bg-white' : 'bg-gray-100 opacity-60'
              }`}
          >
            {/* Day Toggle */}
            <div className='mb-2 flex min-w-[150px] items-center justify-between'>
              <Label className='flex cursor-pointer items-center gap-2 select-none'>
                <input
                  type='checkbox'
                  checked={day.enabled}
                  onChange={() => toggleDay(dayIndex)}
                  className='sr-only'
                  id={`day-toggle-${dayIndex}`}
                />
                <Switch
                  checked={day.enabled}
                  onCheckedChange={() => toggleDay(dayIndex)}
                  id={`day-switch-${dayIndex}`}
                />
                <span className='font-medium'>{day.day}</span>
              </Label>
            </div>

            {/* Time Slots */}
            <div className='flex flex-col items-end gap-2'>
              <AnimatePresence initial={false}>
                {day.enabled &&
                  day.slots.map((slot, slotIndex) => (
                    <motion.div
                      key={slotIndex}
                      className='mb-2 flex flex-row items-center gap-6'
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Controller
                        name={`availability.${dayIndex}.slots.${slotIndex}.start` as const}
                        control={control}
                        render={({ field }) => (
                          <Input {...field} type='time' className='rounded border p-1' />
                        )}
                      />
                      <span>-</span>
                      <Controller
                        name={`availability.${dayIndex}.slots.${slotIndex}.end` as const}
                        control={control}
                        render={({ field }) => (
                          <Input {...field} type='time' className='rounded border p-1' />
                        )}
                      />
                      <div>
                        {day.slots.length > 1 && (
                          <Button
                            type='button'
                            onClick={() => removeSlot(dayIndex, slotIndex)}
                            className='border border-gray-200 bg-inherit text-red-500 hover:bg-red-200 hover:text-red-700'
                          >
                            🗑
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>

              {/* Add Slot Button */}
              {day.enabled && (
                <Button
                  type='button'
                  onClick={() => addSlot(dayIndex)}
                  className='mt-2 border border-gray-200 bg-inherit text-sm text-black'
                >
                  + Add slot
                </Button>
              )}
            </div>
          </div>
        ))}
        {errors.availability && (
          <p className='text-destructive text-sm'>{(errors.availability as any)?.message}</p>
        )}
      </Card>

      {/* Duration and Timezone */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label>Average Duration per Session (minutes) *</Label>
          <div className='flex items-center gap-2'>
            <Clock className='text-muted-foreground mt-1 h-5 w-5' />
            <Controller
              name='duration'
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type='number'
                  min={15}
                  max={480}
                  placeholder='60'
                  className='flex-1' // Take remaining width
                />
              )}
            />
          </div>
          {/* {errors.duration && <p className='text-destructive text-sm'>{errors.duration.message}</p>} */}
        </div>

        <div className='space-y-2'>
          <Label>Timezone</Label>
          <Controller
            name='timezone'
            control={control}
            render={({ field }) => (
              <div className='w-full'>
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
      </div>

      {/* Summary */}
      {watchedValues.availability.some(d => d.enabled) && (
        <div className='rounded-lg bg-gray-50 p-4'>
          <h4 className='mb-2 font-medium'>Schedule Summary</h4>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>Selected Days:</span>
              <div className='font-medium'>
                {watchedValues.availability
                  .filter(d => d.enabled)
                  .map(d => d.day.slice(0, 3))
                  .join(', ')}
              </div>
            </div>
            <div>
              <span className='text-muted-foreground'>Duration:</span>
              <div className='font-medium'>{watchedValues.duration} minutes per session</div>
            </div>
            <div>
              <span className='text-muted-foreground'>Estimated Total Sessions:</span>
              <div className='font-medium'>{totalSessions}</div>
            </div>
            <div>
              <span className='text-muted-foreground'>Estimated Total Hours:</span>
              <div className='font-medium'>{`${hours} hours ${minutes} minutes`}</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className='flex justify-between'>
        <Button variant='outline' onClick={onPrev} className='gap-2'>
          <ChevronLeft className='h-4 w-4' />
          Previous
        </Button>
        <Button type='submit'>Next: Schedule</Button>
      </div>
    </form>
  );
}
