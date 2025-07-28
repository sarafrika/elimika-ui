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
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  addInstructorExperienceMutation,
  updateInstructorExperienceMutation,
  deleteInstructorExperienceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zInstructorExperience } from '@/services/client/zod.gen';
import { InstructorExperience } from '@/services/client/types.gen';
import { Grip, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const experienceFormSchema = zInstructorExperience.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
  created_by: true,
  updated_by: true,
  employment_period: true,
  is_long_term_position: true,
  has_responsibilities: true,
  experience_level: true,
  is_recent_experience: true,
  calculated_years: true,
  duration_in_months: true,
  formatted_duration: true,
  summary: true,
  is_complete: true,
});

const formSchema = z.object({
  experiences: z.array(experienceFormSchema.extend({
    uuid: z.string().optional(),
  })),
});

type ExperienceFormValues = z.infer<typeof formSchema>;
type ExpType = z.infer<typeof experienceFormSchema> & {
  uuid?: string;
};

interface Props {
  instructor: { uuid: string };
  instructorExperience: any[];
}

export default function ProfessionalExperienceSettings({ instructor, instructorExperience }: Props) {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'experience',
        title: 'Experience',
        url: '/dashboard/profile/experience',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const defaultExperience: ExpType = {
    instructor_uuid: instructor.uuid,
    position: '',
    organization_name: '',
    responsibilities: undefined,
    years_of_experience: undefined,
    start_date: undefined,
    end_date: undefined,
    is_current_position: false,
  };

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      experiences: [defaultExperience],
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (instructorExperience.length > 0) {
      const formattedExperiences = instructorExperience.map((exp: any) => ({
        uuid: exp.uuid,
        instructor_uuid: instructor.uuid,
        position: exp.position || '',
        organization_name: exp.organization_name || '',
        responsibilities: exp.responsibilities,
        years_of_experience: exp.years_of_experience,
        start_date: exp.start_date ? exp.start_date.split('T')[0] : undefined,
        end_date: exp.end_date ? exp.end_date.split('T')[0] : undefined,
        is_current_position: exp.is_current_position || false,
      }));

      form.reset({ experiences: formattedExperiences });
    }
  }, [instructorExperience, instructor.uuid, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'experiences',
  });

  const addExperienceMut = useMutation(addInstructorExperienceMutation());
  const updateExperienceMut = useMutation(updateInstructorExperienceMutation());
  const deleteExperienceMut = useMutation(deleteInstructorExperienceMutation());

  const isSubmitting = addExperienceMut.isPending || updateExperienceMut.isPending;

  const onSubmit = async (data: ExperienceFormValues) => {
    try {
      const promises = data.experiences.map(async (experience, index) => {
        const { uuid, ...apiData } = experience;

        const finalData = {
          ...apiData,
          start_date: apiData.start_date ? new Date(apiData.start_date) : undefined,
          end_date: apiData.is_current_position ? undefined :
            (apiData.end_date ? new Date(apiData.end_date) : undefined),
        } as InstructorExperience;

        if (uuid) {
          return updateExperienceMut.mutateAsync({
            path: {
              instructorUuid: instructor.uuid,
              experienceUuid: uuid
            },
            body: finalData,
          });
        } else {
          const response = await addExperienceMut.mutateAsync({
            path: { instructorUuid: instructor.uuid },
            body: finalData,
          });

          const updatedExperiences = form.getValues('experiences');
          if (response.data?.uuid) {
            updatedExperiences[index] = {
              ...experience,
              uuid: response.data.uuid,
            };
            form.setValue('experiences', updatedExperiences);
          }

          return response;
        }
      });

      await Promise.all(promises);
      toast.success('Experience information saved successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save experience information');
    }
  };

  const onRemove = async (index: number) => {
    const experience = form.getValues('experiences')[index];

    if (!experience) return;

    const shouldRemove = confirm('Are you sure you want to remove this experience?');
    if (!shouldRemove) return;

    try {
      if (experience.uuid) {
        await deleteExperienceMut.mutateAsync({
          path: {
            instructorUuid: instructor.uuid,
            experienceUuid: experience.uuid
          },
        });
      }

      remove(index);
      toast.success('Experience removed successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove experience');
    }
  };

  if (!instructorExperience) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Professional Experience</h1>
        <p className='text-muted-foreground text-sm'>
          Add your work history and teaching experience
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
                              {form.watch(`experiences.${index}.organization_name`) || 'New Experience'}
                            </h3>
                            <p className='text-muted-foreground text-sm'>
                              {form.watch(`experiences.${index}.position`)}
                            </p>
                          </div>
                        </div>

                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => onRemove(index)}
                          className='hover:bg-destructive-foreground h-8 w-8 cursor-pointer transition-colors'
                          disabled={deleteExperienceMut.isPending}
                        >
                          <Trash2 className='text-destructive h-4 w-4' />
                        </Button>
                      </div>

                      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.organization_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization *</FormLabel>
                              <FormControl>
                                <Input placeholder='e.g. Google Inc.' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.position`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title *</FormLabel>
                              <FormControl>
                                <Input placeholder='e.g. Software Engineer' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.start_date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input
                                  type='date'
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
                          name={`experiences.${index}.end_date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input
                                  type='date'
                                  disabled={form.watch(`experiences.${index}.is_current_position`)}
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <div className='mt-2'>
                                <FormField
                                  control={form.control}
                                  name={`experiences.${index}.is_current_position`}
                                  render={({ field }) => (
                                    <FormItem className='flex flex-row items-center space-x-2'>
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className='font-normal'>
                                        I currently work here
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

                      <FormField
                        control={form.control}
                        name={`experiences.${index}.years_of_experience`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                step='0.1'
                                min='0'
                                max='50'
                                placeholder='e.g. 2.5'
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`experiences.${index}.responsibilities`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Describe your key responsibilities, achievements, and duties...'
                                className='min-h-24 resize-y'
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type='button'
                variant='outline'
                className='flex w-full items-center justify-center gap-2'
                onClick={() => append(defaultExperience)}
              >
                <PlusCircle className='h-4 w-4' />
                Add Another Experience
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