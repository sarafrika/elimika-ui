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

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface AcademicFormProps {
  onNext: () => void;
  onPrev: () => void;
  classId: string;
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

export function AcademicPeriodForm({ onNext, onPrev, classId }: AcademicFormProps) {
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

  const [continuousRegistration, setContinuousRegistration] = useState(false);

  const onSubmit = (values: AcademicPeriodFormValues) => {
    // console.log("✅ Submitted values:", values, classId);
    onNext();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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
          <Button type='submit'>Next: Timetable</Button>
        </div>
      </form>
    </Form>
  );
}
