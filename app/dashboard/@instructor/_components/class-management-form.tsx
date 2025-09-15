'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import {
  createClassDefinitionMutation,
  createClassRecurrencePatternMutation,
  getAllActiveClassDefinitionsQueryKey,
  getAllCoursesOptions,
  getClassRecurrencePatternQueryKey,
  scheduleClassMutation,
  scheduleRecurringClassFromDefinitionMutation,
  updateClassDefinitionMutation,
  updateClassRecurrencePatternMutation,
  updateRecurringClassScheduleMutation,
  updateScheduledInstanceStatusMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { LocationTypeEnum, RecurrenceTypeEnum, StatusEnum3 } from '@/services/client/types.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const SUBMISSION_TYPES = ['PDF', 'AUDIO', 'TEXT'];
const WEEK_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const classSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  default_instructor_uuid: z.string().optional(),
  organisation_uuid: z.string().optional(),
  course_uuid: z.string().optional(),
  // duration_minutes: z.any().optional(),
  default_start_time: z.any().optional(),
  default_end_time: z.any().optional(),
  location_type: z.string().optional(),
  max_participants: z.coerce.number().optional(),
  allow_waitlist: z.boolean().default(false),
  recurrence_pattern_uuid: z.string().optional(),
  is_active: z.boolean().default(false),
});

export type ClassFormValues = z.infer<typeof classSchema>;

function ClassForm({
  onSuccess,
  initialValues,
  classId,
  onCancel,
  className,
}: {
  classId?: string;
  initialValues?: ClassFormValues;
  onSuccess: any;
  onCancel: () => void;
  className: any;
}) {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      ...initialValues,
    },
  });

  const qc = useQueryClient();
  const user = useUserProfile();

  const [openAddRecurrenceModal, setOpenAddRecurrenceModal] = useState(false);

  const { data: courses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));

  const createAssignment = useMutation(createClassDefinitionMutation());
  const updateAssignment = useMutation(updateClassDefinitionMutation());

  const handleSubmit = async (values: ClassFormValues) => {
    const payload = {
      ...values,
      // updated_by: user?.email,
      // additional class info
      recurrence_pattern_uuid: '6afa111e-d783-42ec-9276-95dfeaddc423',
      default_instructor_uuid: '',
    };

    if (classId) {
      updateAssignment.mutate(
        { path: { uuid: classId }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getAllActiveClassDefinitionsQueryKey(),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    } else {
      createAssignment.mutate(
        { body: payload as any },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getAllActiveClassDefinitionsQueryKey(),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Title</FormLabel>
              <FormControl>
                <Input placeholder='Enter class title' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <SimpleEditor value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='course_uuid'
          render={({ field }) => (
            <FormItem className='w-full flex-1'>
              <FormLabel>Assign Course</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select course' />
                </SelectTrigger>
                <SelectContent>
                  {courses?.data?.content?.map(course => (
                    <SelectItem key={course.uuid} value={course.uuid as string}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='organisation_uuid'
          render={({ field }) => (
            <FormItem className='w-full flex-1'>
              <FormLabel>Organisation here</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select organisation' />
                </SelectTrigger>
                <SelectContent>
                  {courses?.data?.content?.map(course => (
                    <SelectItem key={course.uuid} value={course.uuid as string}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='default_start_time'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input
                    type='time'
                    step='60'
                    {...field}
                    onChange={e => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='default_end_time'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input
                    type='time'
                    step='60'
                    {...field}
                    onChange={e => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='max_participants'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Class Limit</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  placeholder='e.g. 25'
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex flex-row items-end gap-4'>
          <FormField
            control={form.control}
            name='recurrence_pattern_uuid'
            render={({ field }) => (
              <FormItem className='w-full flex-1'>
                <FormLabel>Recurrence (Frequency)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select recurrence pattern' />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.data?.content?.map(course => (
                      <SelectItem key={course.uuid} value={course.uuid as string}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            onClick={() => setOpenAddRecurrenceModal(true)}
            type='button'
            className='mt-[22px] h-10'
          >
            Add New
          </Button>
        </div>

        <FormField
          control={form.control}
          name='location_type'
          render={({ field }) => (
            <FormItem className='w-full flex-1'>
              <FormLabel>Location</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select location type' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LocationTypeEnum)
                    .map(([key, value]) => ({
                      key,
                      value,
                    }))
                    .map(option => (
                      <SelectItem key={option.key} value={option.value}>
                        {option.value}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type='submit'
            className='flex min-w-[120px] items-center justify-center gap-2'
            disabled={createAssignment.isPending || updateAssignment.isPending}
          >
            {(createAssignment.isPending || updateAssignment.isPending) && <Spinner />}
            {initialValues ? 'Update Assignment' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export const recurrenceSchema = z.object({
  recurrence_type: z.string().min(1, 'Recurrence type is required'),
  interval_value: z.any().optional(),
  days_of_week: z.any().optional(),
  day_of_month: z.number().optional(),
  end_date: z.any().optional(), // Accepts strings like "2024-12-31"
  occurrence_count: z.number().int().positive().optional(),
});

export type RecurrenceFormValues = z.infer<typeof recurrenceSchema>;

function RecurrencForm({
  onSuccess,
  recurrenceId,
  initialValues,
  onCancel,
  className,
}: {
  recurrenceId?: string;
  onSuccess: any;
  onCancel: () => void;
  initialValues: any;
  className: any;
}) {
  const form = useForm<RecurrenceFormValues>({
    resolver: zodResolver(recurrenceSchema),
    defaultValues: {},
  });

  const qc = useQueryClient();
  const user = useUserProfile();

  const createClassRecurrence = useMutation(createClassRecurrencePatternMutation());
  const updateClassRecurrence = useMutation(updateClassRecurrencePatternMutation());

  // "recurrence_uuid": "ef03be37-e977-47c6-b19c-83d27e27fea8",
  const handleSubmit = async (values: RecurrenceFormValues) => {
    const payload = {
      ...values,
      days_of_week: Array.isArray(values.days_of_week)
        ? values.days_of_week.join(',')
        : values.days_of_week,
    };

    if (recurrenceId) {
      updateClassRecurrence.mutate(
        { path: { uuid: recurrenceId }, body: payload as any },
        {
          onSuccess: (data) => {
            qc.invalidateQueries({
              queryKey: getClassRecurrencePatternQueryKey({ path: { uuid: '' } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess(data);
          },
        }
      );
    } else {
      createClassRecurrence.mutate(
        { body: payload as any },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getClassRecurrencePatternQueryKey({ path: { uuid: '' } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess(data);
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        <FormField
          control={form.control}
          name='recurrence_type'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recurrence Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select recurrence type' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RecurrenceTypeEnum).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='interval_value'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interval Value</FormLabel>
              <FormControl>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='e.g 2 to mean every 2 Days or 2 Weeks or 2 Months'
                    {...field}
                  />
                </FormControl>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='days_of_week'
            render={() => (
              <FormItem className='w-full'>
                <FormLabel>Days of Week</FormLabel>

                <div className='mb-1 flex items-center gap-2'>
                  <Select
                    onValueChange={day => {
                      const current = form.watch('days_of_week') || [];
                      if (day && !current.includes(day)) {
                        form.setValue('days_of_week', [...current, day]);
                      }
                    }}
                  >
                    <FormControl className='w-full'>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a day' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WEEK_DAYS.filter(
                        day => !(form.watch('days_of_week') || []).includes(day)
                      ).map(day => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show selected days as removable badges */}
                <div className='flex flex-wrap gap-2'>
                  {(form.watch('days_of_week') || []).map((day: string, index: number) => (
                    <Badge key={day} variant='secondary' className='flex items-center gap-1'>
                      {day}
                      <button
                        type='button'
                        className='ml-2'
                        onClick={() => {
                          const current = form.watch('days_of_week') || [];
                          const updated = current.filter((i: any) => i !== index);
                          form.setValue('days_of_week', updated);
                        }}
                        aria-label={`Remove day ${day}`}
                      >
                        <XIcon className='h-3 w-3' />
                      </button>
                    </Badge>
                  ))}
                </div>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='day_of_month'
          render={({ field }) => (
            <FormItem className='w-full flex-1'>
              <FormItem>
                <FormLabel>Day of month</FormLabel>
                <FormControl>
                  <FormControl>
                    <Input type='number' placeholder='...' />
                    {/* <Input type='number' placeholder="e.g. 1, 2" {...field} /> */}
                  </FormControl>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='end_date'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input
                  placeholder='e.g. 2025-12-12'
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='occurrence_count'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Occurence Count</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  placeholder='e.g. 25'
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type='submit'
            className='flex min-w-[120px] items-center justify-center gap-2'
            disabled={createClassRecurrence.isPending || updateClassRecurrence.isPending}
          >
            {(createClassRecurrence.isPending || updateClassRecurrence.isPending) && <Spinner />}
            {initialValues ? 'Update Recurrence' : 'Create Recurrence'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export const scheduleSchema = z.object({
  uuid: z.any().optional(),
  start_date: z.any().optional(), // e.g. "2024-12-31"
  end_date: z.any().optional(), // e.g. "2024-12-31"
});

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;

function ScheduleForm({
  onSuccess,
  scheduleId,
  classId,
  initialValues,
  onCancel,
  className,
}: {
  scheduleId?: string;
  onSuccess: any;
  classId?: string;
  onCancel: () => void;
  initialValues: any;
  className: any;
}) {
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {},
  });

  const qc = useQueryClient();
  const user = useUserProfile();

  const createClassSchedule = useMutation(scheduleRecurringClassFromDefinitionMutation());
  const updateClassSchedule = useMutation(updateRecurringClassScheduleMutation());

  const handleSubmit = async (values: ScheduleFormValues) => {
    const payload = {
      ...values,
    };

    if (scheduleId) {
      updateClassSchedule.mutate(
        { path: { uuid: classId as string } },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getClassRecurrencePatternQueryKey({ path: { uuid: '' } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    } else {
      createClassSchedule.mutate(
        {
          path: { uuid: classId as string },
          query: { startDate: payload.start_date, endDate: payload.end_date },
        },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getClassRecurrencePatternQueryKey({ path: { uuid: '' } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        <FormField
          control={form.control}
          name='start_date'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input
                  placeholder='e.g. 2025-12-12'
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='end_date'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input
                  placeholder='e.g. 2025-12-12'
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type='submit'
            className='flex min-w-[120px] items-center justify-center gap-2'
            disabled={createClassSchedule.isPending || updateClassSchedule.isPending}
          >
            {(createClassSchedule.isPending || updateClassSchedule.isPending) && <Spinner />}
            {initialValues ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export const timetableScheduleSchema = z.object({
  start_time: z.any(), // e.g. "2024-12-31"
  end_time: z.any(), // e.g. "2024-12-31"
  timezone: z.any()
});

export type TimetableScheduleFormValues = z.infer<typeof timetableScheduleSchema>;

function TimetableScheduleForm({
  onSuccess,
  timetableScheduleId,
  classId,
  initialValues,
  onCancel,
  className,
  status
}: {
  timetableScheduleId?: string;
  onSuccess: any;
  classId?: string;
  onCancel: () => void;
  initialValues: any;
  className: any;
  status: StatusEnum3
}) {
  const form = useForm<TimetableScheduleFormValues>({
    resolver: zodResolver(timetableScheduleSchema),
    defaultValues: {},
  });

  const qc = useQueryClient();
  const instructor = useInstructor();

  const createTimetableSchedule = useMutation(scheduleClassMutation());
  const updateTimetableSchedule = useMutation(updateScheduledInstanceStatusMutation());

  const handleSubmit = async (values: TimetableScheduleFormValues) => {
    const payload = {
      ...values,
      class_definition_uuid: classId,
      instructor_uuid: instructor?.uuid as string
    };

    if (timetableScheduleId) {
      updateTimetableSchedule.mutate(
        { path: { instanceUuid: timetableScheduleId as string }, query: { status } },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getClassRecurrencePatternQueryKey({ path: { uuid: '' } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
          onError: (error: any) => {
            toast.error(error?.message)
          }
        }
      );
    } else {
      createTimetableSchedule.mutate(
        { body: payload as any },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getClassRecurrencePatternQueryKey({ path: { uuid: '' } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
          onError: (error: any) => {
            toast.error(error?.message)
          }
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        <FormField
          control={form.control}
          name='start_time'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  step="60" // 1-minute steps; adjust as needed
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='end_time'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  step="60" // 1-minute steps; adjust as needed
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='timezone'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Time Zone</FormLabel>
              <FormControl>
                <Input
                  placeholder='e.g. UTC'
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type='submit'
            className='flex min-w-[120px] items-center justify-center gap-2'
            disabled={createTimetableSchedule.isPending || updateTimetableSchedule.isPending}
          >
            {(createTimetableSchedule.isPending || updateTimetableSchedule.isPending) && <Spinner />}
            {initialValues ? 'Update Timetable Schedule' : 'Create Timetable Schedule'}
          </Button>
        </div>
      </form>
    </Form>
  );
}


interface ClassDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  editingClassId?: string;
  initialValues?: Partial<ClassFormValues>;
  onSuccess?: any;
  onCancel: () => any;
}

function ClassDialog({
  isOpen,
  setOpen,
  editingClassId,
  initialValues,
  onSuccess,
  onCancel,
}: ClassDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {editingClassId ? 'Edit Class' : 'Add Class'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {editingClassId ? 'Edit Class' : 'Create a new class'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-12rem)]'>
          <ClassForm
            onCancel={onCancel}
            initialValues={initialValues as any}
            className='px-6 pb-6'
            classId={editingClassId}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface RecurrenceDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: any;
  editingRecurrenceId?: any;
  initialValues?: any;
  onCancel: () => any;
}

function RecurrenceDialog({
  isOpen,
  setOpen,
  onSuccess,
  editingRecurrenceId,
  initialValues,
  onCancel,
}: RecurrenceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {editingRecurrenceId ? 'Edit Recurrence' : 'Add Recurrence'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {editingRecurrenceId ? 'Edit Recurrence' : 'Create a new recurrence'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-12rem)]'>
          <RecurrencForm
            onCancel={onCancel}
            initialValues={initialValues as any}
            className='px-6 pb-6'
            recurrenceId={editingRecurrenceId}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ScheduleDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: any;
  editingScheduleId?: string;
  editingClassId?: string;
  initialValues?: any;
  onCancel: () => any;
}

function ScheduleDialog({
  isOpen,
  setOpen,
  onSuccess,
  editingScheduleId,
  editingClassId,
  initialValues,
  onCancel,
}: ScheduleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {editingScheduleId
              ? 'Edit Recurring Class Schedule'
              : 'Create Recurring Class Schedule'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {editingScheduleId
              ? 'Edit class recurring schedule'
              : 'Create a new class recurring schedule'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[300px]'>
          <ScheduleForm
            onCancel={onCancel}
            initialValues={initialValues as any}
            className='px-6 pb-6'
            scheduleId={editingScheduleId}
            classId={editingClassId}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


interface TimetableScheduleDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: any;
  timetableScheduleId?: string;
  editingClassId?: string;
  initialValues?: any;
  onCancel: () => any;
  status: StatusEnum3
}

function TimetableScheduleDialog({
  isOpen,
  setOpen,
  onSuccess,
  timetableScheduleId,
  editingClassId,
  initialValues,
  onCancel,
  status
}: TimetableScheduleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {timetableScheduleId
              ? 'Edit Class Timetable Schedule'
              : 'Create Class Timetable Schedule'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {timetableScheduleId
              ? 'Edit class timetable schedule'
              : 'Create a new class timetable schedule'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-auto'>
          <TimetableScheduleForm
            onCancel={onCancel}
            initialValues={initialValues as any}
            className='px-6 pb-6'
            timetableScheduleId={timetableScheduleId}
            classId={editingClassId}
            onSuccess={onSuccess}
            status={status}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export { ClassDialog, RecurrenceDialog, ScheduleDialog, TimetableScheduleDialog };

