'use client';

import * as z from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useEffect } from 'react';

const instructorPrefsSchema = z.object({
  revenueSplit: z
    .object({
      instructor: z.number().min(0, 'Must be between 0-100').max(100, 'Must be between 0-100'),
      organisation: z.number().min(0, 'Must be between 0-100').max(100, 'Must be between 0-100'),
    })
    .refine(data => data.instructor + data.organisation === 100, {
      message: 'The two splits must add up to 100%',
      path: ['organisation'],
    }),
  preferences: z.array(
    z.object({
      id: z.string().optional(),
      course: z.string().min(1, 'Required'),
      type: z.string().optional(),
      gender: z.string().optional(),
      classType: z.string().optional(),
      method: z.string().optional(),
      educationLevel: z.string().optional(),
      experienceYears: z.number().min(0).optional(),
      skills: z.string().optional(),
      professionalBody: z.string().optional(),
      availabilityDay: z.string().optional(),
      availabilityTime: z.string().optional(),
      maxFee: z.number().min(0).optional(),
    })
  ),
});

type InstructorPrefsFormValues = z.infer<typeof instructorPrefsSchema>;

const preferenceHeaders: {
  key: keyof InstructorPrefsFormValues['preferences'][0];
  label: string;
}[] = [
  { key: 'course', label: 'Course' },
  { key: 'type', label: 'Type' },
  { key: 'gender', label: 'Gender' },
  { key: 'classType', label: 'Class Type' },
  { key: 'method', label: 'Method' },
  { key: 'educationLevel', label: 'Edu. Level' },
  { key: 'experienceYears', label: 'Exp. (Yrs)' },
  { key: 'skills', label: 'Skills' },
  { key: 'professionalBody', label: 'Pro. Body' },
  { key: 'availabilityDay', label: 'Day' },
  { key: 'availabilityTime', label: 'Time' },
  { key: 'maxFee', label: 'Max Fee (USD)' },
];

export default function InstructorPreferencesPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'account', title: 'Account', url: '/dashboard/account' },
      {
        id: 'instructor-preferences',
        title: 'Instructor Preferences',
        url: '/dashboard/account/instructor-preferences',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const form = useForm<InstructorPrefsFormValues>({
    resolver: zodResolver(instructorPrefsSchema),
    defaultValues: {
      revenueSplit: {
        instructor: 70,
        organisation: 30,
      },
      preferences: [{ course: 'Music', type: 'Vocal', gender: 'Any', maxFee: 50 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'preferences',
  });

  const onSubmit = (data: InstructorPrefsFormValues) => {
    // TODO: Implement submission logic
    console.log(data);
  };

  const renderInput = (
    field: any,
    headerKey: keyof InstructorPrefsFormValues['preferences'][0]
  ) => {
    const isNumeric = ['experienceYears', 'maxFee'].includes(headerKey);
    return (
      <Input
        type={isNumeric ? 'number' : 'text'}
        placeholder={preferenceHeaders.find(h => h.key === headerKey)?.label}
        {...field}
        onChange={e => field.onChange(isNumeric ? Number(e.target.value) : e.target.value)}
        className='h-9 w-full min-w-[100px] text-sm'
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Split Ratio</CardTitle>
            <CardDescription>
              Set the default revenue split between instructors and your organisation for classes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid max-w-md grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='revenueSplit.instructor'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor (%)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        max='100'
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='revenueSplit.organisation'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisation (%)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        max='100'
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='space-y-1'>
                <CardTitle>Instructor Search Preferences</CardTitle>
                <CardDescription>
                  Set filters to find the ideal instructors for your needs.
                </CardDescription>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => append({ course: '' })}
                className='w-full sm:w-auto'
              >
                <PlusCircle className='mr-2 h-4 w-4' />
                Add Preference
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto rounded-md border'>
              <table className='min-w-full text-sm'>
                <thead className='bg-muted/50'>
                  <tr className='border-b'>
                    {preferenceHeaders.map(header => (
                      <th key={header.key} className='h-12 px-4 text-left align-middle font-medium'>
                        {header.label}
                      </th>
                    ))}
                    <th className='w-16 p-4'></th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      {preferenceHeaders.map(header => (
                        <td key={header.key} className='p-2 align-middle'>
                          <FormField
                            control={form.control}
                            name={`preferences.${index}.${header.key}` as const}
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
                          onClick={() => remove(index)}
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
          <Button type='submit'>Save Preferences</Button>
        </div>
      </form>
    </Form>
  );
}
