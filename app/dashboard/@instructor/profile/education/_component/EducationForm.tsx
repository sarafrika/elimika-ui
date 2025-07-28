'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import {
  addInstructorEducationMutation,
  deleteInstructorEducationMutation,
  updateInstructorEducationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zInstructorEducation } from '@/services/client/zod.gen';
import { InstructorEducation } from '@/services/client/types.gen';
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
};

const educationFormSchema = zInstructorEducation.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
  created_by: true,
  updated_by: true,
  full_description: true,
  is_recent_qualification: true,
  years_since_completion: true,
  education_level: true,
  has_certificate_number: true,
  formatted_completion: true,
  is_complete: true,
});

const formSchema = z.object({
  educations: z.array(
    educationFormSchema.extend({
      uuid: z.string().optional(),
      is_currently_studying: z.boolean().optional(),
    })
  ),
});

type EducationFormValues = z.infer<typeof formSchema>;
type EdType = z.infer<typeof educationFormSchema> & {
  uuid?: string;
  is_currently_studying?: boolean;
};

interface Props {
  instructor: { uuid: string };
  instructorEducation: any[];
}

export default function EducationSettings({ instructor, instructorEducation }: Props) {
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

  const defaultEducation: EdType = {
    instructor_uuid: instructor.uuid,
    school_name: '',
    qualification: "Bachelor's",
    year_completed: undefined,
    certificate_number: undefined,
    is_currently_studying: false,
  };

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      educations: [defaultEducation],
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (instructorEducation.length > 0) {
      const formattedEducations = instructorEducation.map((ed: any) => ({
        uuid: ed.uuid,
        instructor_uuid: instructor.uuid,
        school_name: ed.school_name || '',
        qualification: ed.qualification || "Bachelor's",
        year_completed: ed.year_completed,
        certificate_number: ed.certificate_number,
        is_currently_studying: !ed.year_completed,
      }));

      form.reset({ educations: formattedEducations });
    }
  }, [instructorEducation, instructor.uuid, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'educations',
  });

  const addEducationMut = useMutation(addInstructorEducationMutation());
  const updateEducationMut = useMutation(updateInstructorEducationMutation());
  const deleteEducationMut = useMutation(deleteInstructorEducationMutation());

  const isSubmitting = addEducationMut.isPending || updateEducationMut.isPending;

  const onSubmit = async (data: EducationFormValues) => {
    try {
      const promises = data.educations.map(async (education, index) => {
        const { is_currently_studying, uuid, ...apiData } = education;

        const finalData = {
          ...apiData,
          year_completed: is_currently_studying ? undefined : apiData.year_completed,
        } as InstructorEducation;

        if (uuid) {
          return updateEducationMut.mutateAsync({
            path: {
              instructorUuid: instructor.uuid,
              educationUuid: uuid,
            },
            body: finalData,
          });
        } else {
          const response = await addEducationMut.mutateAsync({
            path: { instructorUuid: instructor.uuid },
            body: finalData,
          });

          const updatedEducations = form.getValues('educations');
          if (response.data?.uuid) {
            updatedEducations[index] = {
              ...education,
              uuid: response.data.uuid,
            };
            form.setValue('educations', updatedEducations);
          }

          return response;
        }
      });

      await Promise.all(promises);
      toast.success('Education information saved successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save education information');
    }
  };

  const onRemove = async (index: number) => {
    const education = form.getValues('educations')[index];

    if (!education) return;

    const shouldRemove = confirm('Are you sure you want to remove this education?');
    if (!shouldRemove) return;

    try {
      if (education.uuid) {
        await deleteEducationMut.mutateAsync({
          path: {
            instructorUuid: instructor.uuid,
            educationUuid: education.uuid,
          },
        });
      }

      remove(index);
      toast.success('Education removed successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove education');
    }
  };

  if (!instructorEducation) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Spinner />
      </div>
    );
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
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex items-start gap-2'>
                          <Grip className='text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100' />
                          <div>
                            <h3 className='text-base font-medium'>
                              {form.watch(`educations.${index}.school_name`) || 'New Institution'}
                            </h3>
                            <p className='text-muted-foreground text-sm'>
                              {form.watch(`educations.${index}.qualification`)}
                            </p>
                          </div>
                        </div>

                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => onRemove(index)}
                          className='hover:bg-destructive-foreground h-8 w-8 cursor-pointer transition-colors'
                          disabled={deleteEducationMut.isPending}
                        >
                          <Trash2 className='text-destructive h-4 w-4' />
                        </Button>
                      </div>

                      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`educations.${index}.school_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Institution *</FormLabel>
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
                              <FormLabel>Degree *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
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

                      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
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
                                  value={field.value || ''}
                                />
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
                              <FormLabel>Year Completed</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  placeholder='YYYY'
                                  disabled={form.watch(`educations.${index}.is_currently_studying`)}
                                  {...field}
                                  value={field.value || ''}
                                  onChange={e =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value) : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <div className='mt-2'>
                                <FormField
                                  control={form.control}
                                  name={`educations.${index}.is_currently_studying`}
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
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type='button'
                variant='outline'
                className='flex w-full items-center justify-center gap-2'
                onClick={() => append(defaultEducation)}
              >
                <PlusCircle className='h-4 w-4' />
                Add Another Education
              </Button>

              <div className='flex justify-end pt-2'>
                <Button type='submit' className='px-6' disabled={isSubmitting}>
                  {isSubmitting ? (
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