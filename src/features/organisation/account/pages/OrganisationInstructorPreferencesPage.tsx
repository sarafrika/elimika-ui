'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  type EditableFieldArrayColumn,
  EditableFieldArrayTableCard,
} from '@/src/features/organisation/account/components/EditableFieldArrayTableCard';
import { useOrganisationAccountBreadcrumb } from '@/src/features/organisation/account/hooks/useOrganisationAccountBreadcrumb';

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

const preferenceHeaders: EditableFieldArrayColumn<
  keyof InstructorPrefsFormValues['preferences'][0]
>[] = [
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
  useOrganisationAccountBreadcrumb(
    'instructor-preferences',
    'Instructor Preferences',
    '/dashboard/account/instructor-preferences'
  );

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

  const onSubmit = (_data: InstructorPrefsFormValues) => {
    // TODO: Implement submission logic
    //console.log(data);
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

        <EditableFieldArrayTableCard
          title='Instructor Search Preferences'
          description='Set filters to find the ideal instructors for your needs.'
          columns={preferenceHeaders}
          rows={fields}
          addLabel='Add Preference'
          onAdd={() => append({ course: '' })}
          onRemove={remove}
          renderCell={(index, key) => (
            <FormField
              control={form.control}
              name={`preferences.${index}.${key}` as const}
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
          <Button type='submit'>Save Preferences</Button>
        </div>
      </form>
    </Form>
  );
}
