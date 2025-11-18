export type ClassData = {
  id?: string;
  courseTitle: string;
  classTitle: string;
  subtitle?: string;
  category: string;
  targetAudience: string[];
  description: string;
  coverImage?: string;
  academicPeriod: {
    startDate: Date;
    endDate: Date;
  };
  registrationPeriod: {
    startDate: Date;
    endDate?: Date;
  };
  timetable: {
    selectedDays: string[];
    timeSlots: { day: string; startTime: string; endTime: string }[];
    duration: string;
    timezone: string;
    classType: 'online' | 'in-person' | 'hybrid';
    location?: string;
  };
  schedule: {
    instructor: string;
    skills: Array<{
      id: string;
      title: string;
      lessons: Array<{
        id: string;
        title: string;
        duration: string;
        date?: Date;
        time?: string;
      }>;
    }>;
  };
  visibility: {
    publicity: 'public' | 'private';
    enrollmentLimit: number;
    price: number;
    isFree: boolean;
  };
  resources: Array<{
    id: string;
    type: 'file' | 'video' | 'link';
    name: string;
    url: string;
  }>;
  assessments: Array<{
    id: string;
    type: 'quiz' | 'assignment';
    title: string;
    description: string;
  }>;
  status: 'draft' | 'published';
};

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';

import {
  scheduleClassMutation,
  scheduleRecurringClassFromDefinitionMutation,
  updateClassDefinitionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useInstructor } from '../../../../../context/instructor-context';

function _formatToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function convertToCustomDateTimeString(
  dateInput: string | Date,
  time = '09:00:00' // default time
): string {
  const date = new Date(dateInput);

  // Extract date components in UTC
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');

  // Combine with provided time
  return `${yyyy}-${mm}-${dd}T${time}`;
}

interface AcademicFormProps {
  onNext: () => void;
  onPrev: () => void;
  classId: string;
  classData: any;
}

const academicPeriodSchema = z.object({
  academicPeriod: z.object({
    startDate: z.date({ required_error: 'Start date is required' }),
    endDate: z.date({ required_error: 'End date is required' }),
  }),
  registrationPeriod: z.object({
    startDate: z.date({ required_error: 'Registration start date is required' }),
    endDate: z.date().optional(),
  }),
});

type AcademicPeriodFormValues = z.infer<typeof academicPeriodSchema>;

export function AcademicPeriodForm({ onNext, onPrev, classId, classData }: AcademicFormProps) {
  const form = useForm<AcademicPeriodFormValues>({
    resolver: zodResolver(academicPeriodSchema),
    defaultValues: {
      academicPeriod: {
        startDate: new Date(),
        endDate: new Date(),
      },
      registrationPeriod: {
        startDate: new Date(),
        endDate: undefined,
      },
    },
  });

  const instructor = useInstructor();

  const [continuousRegistration, setContinuousRegistration] = useState(false);
  const _updateClassMutation = useMutation(updateClassDefinitionMutation());

  const _createClassSchdeule = useMutation(scheduleRecurringClassFromDefinitionMutation());
  const scheduleClass = useMutation(scheduleClassMutation());

  const onSubmit = (values: AcademicPeriodFormValues) => {
    // if (!classId) return;
    // updateClassMutation.mutate({
    //   body: {
    //     ...classData,
    //     default_start_time: "2025-11-02",
    //     default_end_time: "2025-12-19"
    //     // default_start_time: new Date(values?.academicPeriod?.startDate),
    //     // default_end_time: new Date(values?.academicPeriod?.endDate)
    //     // registration_start_period: values?.registrationPeriod?.startDate
    //     // registration_end_period: values?.registrationPeriod?.endDate
    //   },
    //   path: { uuid: classId }
    // }, {
    //   onSuccess: () => {
    //     // onNext();
    //   }
    // })

    scheduleClass.mutate(
      {
        body: {
          class_definition_uuid: classData?.uuid,
          instructor_uuid:
            (classData?.default_instructor_uuid as string) || (instructor?.uuid as string),
          // @ts-expect-error
          start_time: convertToCustomDateTimeString(values?.academicPeriod?.startDate, '09:00:00'),
          // @ts-expect-error
          end_time: convertToCustomDateTimeString(values?.academicPeriod?.endDate, '10:30:00'),
          timezone: 'UTC',
        },
      },
      {
        onSuccess: data => {
          toast.success(data?.message);
          onNext();
        },
      }
    );

    // onNext();
  };

  const onError = (errors: any) => {
    toast.error(errors || 'Form validation failed');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className='space-y-6'>
        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>Academic Period</h3>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Start Date */}
            <FormField
              control={form.control}
              name='academicPeriod.startDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant='outline' className='w-full justify-start'>
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {field.value ? format(field.value, 'PPP') : 'Select start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={date => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name='academicPeriod.endDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date *</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant='outline' className='w-full justify-start'>
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {field.value ? format(field.value, 'PPP') : 'Select end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={date => {
                            const start = form.watch('academicPeriod.startDate');
                            return date < (start || new Date());
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Registration Period */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>Registration Period</h3>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Registration Start */}
            <FormField
              control={form.control}
              name='registrationPeriod.startDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Start Date *</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant='outline' className='w-full justify-start'>
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {field.value ? format(field.value, 'PPP') : 'Select start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={date => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Registration End */}
            <FormField
              control={form.control}
              name='registrationPeriod.endDate'
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-center justify-between'>
                    <FormLabel>Registration End Date</FormLabel>
                    <div className='flex items-center space-x-2'>
                      <span className='text-sm'>Continuous</span>
                      <Switch
                        checked={continuousRegistration}
                        onCheckedChange={checked => {
                          setContinuousRegistration(checked);
                          field.onChange(checked ? undefined : new Date());
                        }}
                      />
                    </div>
                  </div>
                  <FormControl>
                    {!continuousRegistration ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant='outline' className='w-full justify-start'>
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {field.value ? format(field.value, 'PPP') : 'Select end date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={date => {
                              const regStart = form.watch('registrationPeriod.startDate');
                              const academicEnd = form.watch('academicPeriod.endDate');
                              return (
                                (regStart && date < regStart) || (academicEnd && date > academicEnd)
                              );
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className='text-muted-foreground bg-muted rounded-md p-3 text-sm'>
                        Students can register at any time until the class ends
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit */}
        <div className='flex justify-between'>
          <Button variant='outline' onClick={onPrev} className='gap-2'>
            <ChevronLeft className='h-4 w-4' /> Previous
          </Button>

          <div className='flex flex-row items-center gap-4'>
            <Button type='submit'>Save & Continue</Button>
            <Button type='button' onClick={onNext}>
              Next: Timetable
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
