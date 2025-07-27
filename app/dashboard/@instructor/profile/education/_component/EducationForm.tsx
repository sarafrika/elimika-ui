'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { useUserProfile } from '@/context/profile-context';
import useMultiMutations from '@/hooks/use-multi-mutations';
import { InstructorEducation } from '@/services/api/schema';
import { deleteInstructorEducation } from '@/services/client';
import { addInstructorEducationMutation, updateInstructorEducationMutation } from '@/services/client/@tanstack/react-query.gen';
import { zInstructorEducation } from "@/services/client/zod.gen";
import { useMutation } from '@tanstack/react-query';
import { Grip, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DEGREE_OPTIONS = {
  'Ph.D.': 'Ph.D.',
  "Master's": "Master's",
  "Bachelor's": "Bachelor's",
  "Associate's": "Associate's",
  Diploma: 'Diploma',
  Certificate: 'Certificate',
  Other: 'Other',
} as const;

const edSchema = zInstructorEducation.omit({
  created_date: true,
  updated_date: true,
  updated_by: true
}).merge(
  z.object({
    uuid: z.string().optional(),
    field_of_study: z.string(),
    year_started: z.string(),
    year_completed: z.string().optional()
  })
);

const educationSchema = z.object({
  educations: z.array(edSchema),
});

type EducationFormValues = z.infer<typeof educationSchema>;
type EdType = z.infer<typeof edSchema>;

export default function EducationSettings() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'education',
        title: 'Education',
        url: '/dashboard/profile/education',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const user = useUserProfile();
  const { instructor, invalidateQuery } = user!
  const instructorEducation = instructor!.educations as Omit<InstructorEducation, "created_date" | "updated_date">[];

  const defaultEducation: EdType = {
    school_name: 'University of Nairobi',
    qualification: "Bachelor's",
    field_of_study: 'Computer Science',
    year_started: '2018',
    year_completed: "2022",
    is_recent_qualification: false,
    full_description: 'Graduated with First Class Honours.',
    certificate_number: 'CERT12345',
    instructor_uuid: instructor ? (instructor.uuid as string) : crypto.randomUUID(),
  };

  const passEducation = (ed: Omit<InstructorEducation, "created_date" | "updated_date">) => ({
    ...defaultEducation,
    ...ed,
    year_completed: ed.year_completed?.toString(),
    instructor_uuid: instructor!.uuid!,
  });

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      //@ts-ignore
      educations:
        instructorEducation.length > 0
          ? instructorEducation.map(passEducation)
          : [defaultEducation],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'educations',
  });

  //console.log(form.formState.errors);

  const addEdMutation = useMutation(addInstructorEducationMutation());
  const updateMutation = useMutation(updateInstructorEducationMutation());
  const { errors, submitting } = useMultiMutations([addEdMutation, updateMutation]);

  const onSubmit = async (data: EducationFormValues) => {

    data.educations.forEach(async (ed, index) => {
      const options = {
        path: { instructorUuid: instructor!.uuid as string },
        //@ts-ignore
        body: { ...ed, year_completed: Number(ed.year_completed) },
      };

      if (!ed.uuid) {
        const resp = await addEdMutation.mutateAsync(options);
        const eds = form.getValues('educations');
        eds[index] = passEducation(resp.data!);
        form.setValue('educations', eds);
      } else {
        updateMutation.mutateAsync({
          ...options,
          path: {
            ...options.path,
            educationUuid: ed.uuid,
          },
        });
      }
      invalidateQuery!();
    });
  };

  async function onRemove(index: number) {
    const shouldRemove = confirm('Are you sure you want to remove?');
    if (shouldRemove) {
      const edUUID = form.getValues('educations')[index]!.uuid;
      remove(index);
      if (edUUID) {
        const resp = await deleteInstructorEducation({
          path: {
            educationUuid: edUUID,
            instructorUuid: instructor!.uuid!
          }
        });
        if (resp.error) return;
      }

      invalidateQuery!();
      toast('Education removed successfully');
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Education</h1>
        <p className='text-muted-foreground text-sm'>
          Add your educational background and qualifications
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <Card>
            <CardContent className='space-y-6 pt-6'>
              <div className='space-y-4'>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className='bg-card group hover:bg-accent/5 relative rounded-md border transition-all'
                  >
                    <div className='space-y-5 p-5'>
                      {/* Header with institution and degree */}
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex items-start gap-2'>
                          <Grip className='text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100' />
                          <div>
                            <h3 className='text-base font-medium'>
                              {form.watch(`educations.${index}.school_name`) || 'New Institution'}
                            </h3>
                            <div className='flex items-center gap-2'>
                              <p className='text-muted-foreground text-sm'>
                                {form.watch(`educations.${index}.qualification`)} in{' '}
                                {form.watch(`educations.${index}.field_of_study`)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => onRemove(index)}
                          className='hover:bg-destructive-foreground h-8 w-8 cursor-pointer transition-colors'
                        >
                          <Trash2 className='text-destructive h-4 w-4' />
                        </Button>
                      </div>

                      {/* Institution and Degree */}
                      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`educations.${index}.school_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Institution</FormLabel>
                              <FormControl>
                                <Input placeholder='e.g. University of Nairobi' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`educations.${index}.qualification`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Degree</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select degree' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(DEGREE_OPTIONS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Field of Study */}
                      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`educations.${index}.field_of_study`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field of Study</FormLabel>
                              <FormControl>
                                <Input placeholder='e.g. Computer Science' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`educations.${index}.certificate_number`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Certificate No.</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='e.g. CERT12345'
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Year Range */}
                      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`educations.${index}.year_started`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Year</FormLabel>
                              <FormControl>
                                <Input type='number' placeholder='YYYY' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`educations.${index}.year_completed`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Year</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  placeholder='YYYY'
                                  disabled={form.watch(`educations.${index}.is_complete`)}
                                  {...field}
                                />
                              </FormControl>
                              <div className='mt-2'>
                                <FormField
                                  control={form.control}
                                  name={`educations.${index}.is_recent_qualification`}
                                  render={({ field }) => (
                                    <FormItem className='flex flex-row items-center space-x-2'>
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className='font-normal'>
                                        Currently studying here
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name={`educations.${index}.full_description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Information</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='e.g. Honors, GPA, thesis title...'
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Add any notable achievements or specializations.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Education Button */}
              <Button
                type='button'
                variant='outline'
                className='flex w-full items-center justify-center gap-2'
                onClick={() => append(defaultEducation)}
              >
                <PlusCircle className='h-4 w-4' />
                Add Another Education
              </Button>

              {/* Submit Button */}
              <div className='flex justify-end pt-2'>
                <Button type='submit' className='px-6' disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
