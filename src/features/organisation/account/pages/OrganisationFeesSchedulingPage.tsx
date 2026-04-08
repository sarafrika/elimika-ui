'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  type EditableFieldArrayColumn,
  EditableFieldArrayTableCard,
} from '@/src/features/organisation/account/components/EditableFieldArrayTableCard';
import { useOrganisationAccountBreadcrumb } from '@/src/features/organisation/account/hooks/useOrganisationAccountBreadcrumb';

const feesSchedulingSchema = z.object({
  rateCard: z.array(
    z.object({
      id: z.string().optional(),
      course: z.string().min(1, 'Required'),
      classType: z.string().min(1, 'Required'),
      method: z.string().min(1, 'Required'),
      rate: z.number().min(0, 'Positive'),
    })
  ),
  schedule: z.array(
    z.object({
      id: z.string().optional(),
      course: z.string().min(1, 'Required'),
      instructor: z.string().optional(),
      lessons: z.number().min(1, 'Min 1'),
      hours: z.number().min(1, 'Min 1'),
      hourlyFee: z.number().min(0, 'Positive'),
      totalFee: z.number().min(0, 'Positive'),
      materialFee: z.number().min(0, 'Positive').optional(),
      academicPeriods: z.string().min(1, 'Required'),
      feePerPeriod: z.number().min(0, 'Positive'),
    })
  ),
});

type FeesSchedulingFormValues = z.infer<typeof feesSchedulingSchema>;

const rateCardHeaders: EditableFieldArrayColumn<keyof FeesSchedulingFormValues['rateCard'][0]>[] = [
  { key: 'course', label: 'Course' },
  { key: 'classType', label: 'Class Type' },
  { key: 'method', label: 'Method' },
  { key: 'rate', label: 'Rate/Hr (USD)' },
];

const scheduleHeaders: EditableFieldArrayColumn<keyof FeesSchedulingFormValues['schedule'][0]>[] = [
  { key: 'course', label: 'Course/Program' },
  { key: 'instructor', label: 'Instructor' },
  { key: 'lessons', label: 'No. Lessons' },
  { key: 'hours', label: '# Hrs' },
  { key: 'hourlyFee', label: 'Hourly Fee' },
  { key: 'totalFee', label: 'Total Fee' },
  { key: 'materialFee', label: 'Material Fee' },
  { key: 'academicPeriods', label: 'Acad. Periods' },
  { key: 'feePerPeriod', label: 'Fee/Period' },
];

export default function FeesSchedulingPage() {
  useOrganisationAccountBreadcrumb(
    'fees-scheduling',
    'Fees & Scheduling',
    '/dashboard/account/fees-scheduling'
  );

  const form = useForm<FeesSchedulingFormValues>({
    resolver: zodResolver(feesSchedulingSchema),
    defaultValues: {
      rateCard: [{ course: '', classType: '', method: '', rate: 0 }],
      schedule: [
        {
          course: '',
          instructor: '',
          lessons: 10,
          hours: 1,
          hourlyFee: 0,
          totalFee: 0,
          materialFee: 0,
          academicPeriods: '',
          feePerPeriod: 0,
        },
      ],
    },
  });

  const {
    fields: rateCardFields,
    append: appendRate,
    remove: removeRate,
  } = useFieldArray({
    control: form.control,
    name: 'rateCard',
  });

  const {
    fields: scheduleFields,
    append: appendSchedule,
    remove: removeSchedule,
  } = useFieldArray({
    control: form.control,
    name: 'schedule',
  });

  const onSubmit = (_data: FeesSchedulingFormValues) => {
    // TODO: Implement submission logic
    //console.log(data);
  };

  const renderInput = (
    field: any,
    headerKey:
      | keyof FeesSchedulingFormValues['rateCard'][0]
      | keyof FeesSchedulingFormValues['schedule'][0]
  ) => {
    const isNumeric = [
      'rate',
      'lessons',
      'hours',
      'hourlyFee',
      'totalFee',
      'materialFee',
      'feePerPeriod',
    ].includes(headerKey);

    return (
      <Input
        type={isNumeric ? 'number' : 'text'}
        placeholder={[...rateCardHeaders, ...scheduleHeaders].find(h => h.key === headerKey)?.label}
        {...field}
        onChange={e => field.onChange(isNumeric ? Number(e.target.value) || 0 : e.target.value)}
        className='h-9 w-full min-w-[100px] text-sm'
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <EditableFieldArrayTableCard
          title='Rate Card'
          description='Define the hourly rates for different courses and class types.'
          columns={rateCardHeaders}
          rows={rateCardFields}
          addLabel='Add Rate'
          onAdd={() => appendRate({ course: '', classType: '', method: '', rate: 0 })}
          onRemove={removeRate}
          renderCell={(index, key) => (
            <FormField
              control={form.control}
              name={`rateCard.${index}.${key}` as const}
              render={({ field }) => (
                <FormItem>
                  <FormControl>{renderInput(field, key)}</FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          )}
        />

        <EditableFieldArrayTableCard
          title='Training Schedule & Fees Structure'
          description='Detail the fees and structure for specific training programs.'
          columns={scheduleHeaders}
          rows={scheduleFields}
          addLabel='Add Schedule'
          onAdd={() =>
            appendSchedule({
              course: '',
              lessons: 0,
              hours: 0,
              hourlyFee: 0,
              totalFee: 0,
              academicPeriods: '',
              feePerPeriod: 0,
            })
          }
          onRemove={removeSchedule}
          renderCell={(index, key) => (
            <FormField
              control={form.control}
              name={`schedule.${index}.${key}` as const}
              render={({ field }) => (
                <FormItem>
                  <FormControl>{renderInput(field, key)}</FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          )}
        />

        <div className='flex justify-end'>
          <Button type='submit'>Save Fees & Schedule</Button>
        </div>
      </form>
    </Form>
  );
}
