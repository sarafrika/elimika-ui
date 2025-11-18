import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form';
import { Input } from '../../../../components/ui/input';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { useInstructor } from '../../../../context/instructor-context';
import { daysOfWeekOptions } from '../../../../lib/day-of-week';
import { AvailabilityTypeEnum } from '../../../../services/client';

export const availabilitySlotSchema = z.object({
  availability_type: z.string(),
  day_of_week: z.number(),
  day_of_month: z.any().optional(),
  specific_date: z.any().optional(),
  start_time: z.any().optional(),
  end_time: z.any().optional(),
  custom_pattern: z.any().nullable().optional(),
  is_available: z.boolean().optional(),
  recurrence_interval: z.number().optional(),
  effective_start_date: z.string().optional(),
  effective_end_date: z.string().optional(),
});

export type AvailabilitySlotFormValues = z.infer<typeof availabilitySlotSchema>;

function AvailabilitySlotForm({
  onSuccess,
  slotId,
  initialValues,
  onCancel,
  className,
}: {
  onSuccess: any;
  slotId?: string;
  onCancel: () => void;
  initialValues: any;
  className: any;
}) {
  const form = useForm<AvailabilitySlotFormValues>({
    resolver: zodResolver(availabilitySlotSchema),
    defaultValues: initialValues || {},
  });

  const _qc = useQueryClient();
  const instructor = useInstructor();

  // const createSlot = useMutation(createInstructorAvailabilitySlotMutation());
  // const updateSlot = useMutation(updateInstructorAvailabilitySlotMutation());
  // const deleteSlot = useMutation(deleteInstructorAvailabilitySlotMutation());

  const handleSubmit = async (values: AvailabilitySlotFormValues) => {
    const _payload = {
      ...values,
      uuid: slotId as string,
      instructor_uuid: instructor?.uuid as string,
    };

    // if (slotId) {
    //     updateSlot.mutate(
    //         { path: { uuid: slotId as string }, body: payload as any },
    //         {
    //             onSuccess: (data: any) => {
    //                 qc.invalidateQueries({ queryKey: getInstructorAvailabilityQueryKey({ path: { instructorUuid: instructor?.uuid as string } }) })
    //                 toast.success(data?.message);
    //                 onSuccess();
    //             },
    //             onError: (error: any) => {
    //                 toast.error(error?.message)
    //             }
    //         }
    //     );
    // } else {
    //     createSlot.mutate(
    //         { body: payload as any },
    //         {
    //             onSuccess: (data: any) => {
    //                 qc.invalidateQueries({ queryKey: getInstructorAvailabilityQueryKey({ path: { instructorUuid: instructor?.uuid as string } }) })
    //                 toast.success(data?.message);
    //                 onSuccess();
    //             },
    //             onError: (error: any) => {
    //                 toast.error(error?.message)
    //             }
    //         }
    //     );
    // }
  };

  const handleDelete = () => {
    if (!slotId) return;

    // deleteSlot.mutate({ path: { uuid: slotId as string } }, {
    //     onSuccess: () => {
    //         qc.invalidateQueries({ queryKey: getInstructorAvailabilityQueryKey({ path: { instructorUuid: instructor?.uuid as string } }) })
    //         toast.success("Availability Slot deleted Successfully")
    //     }
    // })
  };

  const availabilityOptions = Object.entries(AvailabilityTypeEnum).map(([key, value]) => ({
    id: value,
    label: key.charAt(0) + key.slice(1).toLowerCase(), // "DAILY" -> "Daily"
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        <FormField
          control={form.control}
          name='availability_type'
          render={({ field }) => (
            <FormItem className='w-full flex-1'>
              <FormLabel>Availability Type</FormLabel>
              <Select
                onValueChange={value => {
                  field.onChange(value);
                  // If you want to do something on selection, do it here
                }}
                value={field.value}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select availability type' />
                </SelectTrigger>

                <SelectContent className='pb-4'>
                  {availabilityOptions.map(({ id, label }) => (
                    <SelectItem key={id} value={id}>
                      {label}
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
          name='day_of_week'
          render={({ field }) => (
            <FormItem className='w-full flex-1'>
              <FormLabel>Day of Week</FormLabel>

              <Select
                onValueChange={value => {
                  field.onChange(Number(value)); // Convert back to number when selected
                }}
                value={field.value?.toString()}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a day' />
                </SelectTrigger>

                <SelectContent className='pb-4'>
                  {daysOfWeekOptions.map(({ id, label }) => (
                    <SelectItem key={id} value={id}>
                      {label}
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
          name='specific_date'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Specific Date</FormLabel>
              <FormControl>
                <Input type='date' {...field} onChange={e => field.onChange(e.target.value)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: 16 }}>
          <FormField
            control={form.control}
            name='start_time'
            render={({ field }) => (
              <FormItem className='flex-1'>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input
                    type='time'
                    step='60' // 1-minute steps
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
              <FormItem className='flex-1'>
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

        {/* Required Toggle */}
        <FormField
          control={form.control}
          name='is_available'
          render={({ field }) => (
            <FormItem className='flex items-center gap-2'>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Is this slot available?</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='recurrence_interval'
          render={({ field }) => (
            <FormItem className='w-full max-w-xs'>
              <FormLabel>Recurrence Interval</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min={1}
                  {...field}
                  onChange={e => {
                    const value = e.target.value;
                    // Convert empty string to undefined/null if needed
                    field.onChange(value === '' ? undefined : Number(value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: 16 }}>
          <FormField
            control={form.control}
            name='effective_start_date'
            render={({ field }) => (
              <FormItem className='flex-1'>
                <FormLabel>Effective Start Date</FormLabel>
                <FormControl>
                  <Input type='date' {...field} onChange={e => field.onChange(e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='effective_end_date'
            render={({ field }) => (
              <FormItem className='flex-1'>
                <FormLabel>Effective End Date</FormLabel>
                <FormControl>
                  <Input type='date' {...field} onChange={e => field.onChange(e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex items-center justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel} className='min-w-[100px]'>
            Cancel
          </Button>

          {slotId && (
            <Button
              type='button'
              variant='destructive'
              onClick={handleDelete}
              className='min-w-[100px]'
            >
              Delete
            </Button>
          )}

          <Button
            type='submit'
            className='flex min-w-[180px] items-center justify-center gap-2'
            // disabled={createSlot.isPending || updateSlot.isPending}
          >
            {/* {(createSlot.isPending || updateSlot.isPending) && <Spinner />} */}
            {initialValues ? 'Update Availability Slot' : 'Create Availability Slot'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface AvailabilitySlotDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: any;
  slotId?: string;
  initialValues?: any;
  onCancel: () => any;
}

function AvailabilitySlotDialog({
  isOpen,
  setOpen,
  onSuccess,
  slotId,
  initialValues,
  onCancel,
}: AvailabilitySlotDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {slotId ? 'Edit Avaialability Slot' : 'Add New Availability Slot'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {slotId ? 'Edit current availability' : 'Create a new availability slot'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-auto'>
          <AvailabilitySlotForm
            onCancel={onCancel}
            initialValues={initialValues as any}
            className='px-6 pb-6'
            slotId={slotId}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export { AvailabilitySlotDialog };
