'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

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

const rateCardHeaders: {
  key: keyof FeesSchedulingFormValues['rateCard'][0];
  label: string;
}[] = [
  { key: 'course', label: 'Course' },
  { key: 'classType', label: 'Class Type' },
  { key: 'method', label: 'Method' },
  { key: 'rate', label: 'Rate/Hr (USD)' },
];

const scheduleHeaders: {
  key: keyof FeesSchedulingFormValues['schedule'][0];
  label: string;
}[] = [
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
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'account', title: 'Account', url: '/dashboard/account' },
      {
        id: 'fees-scheduling',
        title: 'Fees & Scheduling',
        url: '/dashboard/account/fees-scheduling',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

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
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <CardTitle>Rate Card</CardTitle>
                <CardDescription>
                  Define the hourly rates for different courses and class types.
                </CardDescription>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => appendRate({ course: '', classType: '', method: '', rate: 0 })}
              >
                <PlusCircle className='mr-2 h-4 w-4' />
                Add Rate
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto rounded-md border'>
              <table className='min-w-full text-sm'>
                <thead className='bg-muted/50'>
                  <tr className='border-b'>
                    {rateCardHeaders.map(header => (
                      <th key={header.key} className='h-12 px-4 text-left align-middle font-medium'>
                        {header.label}
                      </th>
                    ))}
                    <th className='w-16 p-4'></th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {rateCardFields.map((field, index) => (
                    <tr key={field.id}>
                      {rateCardHeaders.map(header => (
                        <td key={header.key} className='p-2 align-middle'>
                          <FormField
                            control={form.control}
                            name={`rateCard.${index}.${header.key}` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>{renderInput(field, header.key)}</FormControl>
                                <FormMessage className='text-xs' />
                              </FormItem>
                            )}
                          />
                        </td>
                      ))}
                      <td className='p-2 text-center align-middle'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => removeRate(index)}
                          className='h-8 w-8'
                        >
                          <Trash2 className='text-destructive h-4 w-4' />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <CardTitle>Training Schedule & Fees Structure</CardTitle>
                <CardDescription>
                  Detail the fees and structure for specific training programs.
                </CardDescription>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
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
              >
                <PlusCircle className='mr-2 h-4 w-4' />
                Add Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto rounded-md border'>
              <table className='min-w-full text-sm'>
                <thead className='bg-muted/50'>
                  <tr className='border-b'>
                    {scheduleHeaders.map(header => (
                      <th key={header.key} className='h-12 px-4 text-left align-middle font-medium'>
                        {header.label}
                      </th>
                    ))}
                    <th className='w-16 p-4'></th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {scheduleFields.map((field, index) => (
                    <tr key={field.id}>
                      {scheduleHeaders.map(header => (
                        <td key={header.key} className='p-2 align-middle'>
                          <FormField
                            control={form.control}
                            name={`schedule.${index}.${header.key}` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>{renderInput(field, header.key)}</FormControl>
                                <FormMessage className='text-xs' />
                              </FormItem>
                            )}
                          />
                        </td>
                      ))}
                      <td className='p-2 text-center align-middle'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => removeSchedule(index)}
                          className='h-8 w-8'
                        >
                          <Trash2 className='text-destructive h-4 w-4' />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className='flex justify-end'>
          <Button type='submit'>Save Fees & Schedule</Button>
        </div>
      </form>
    </Form>
  );
}
