'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import { useUserProfile } from '@/context/profile-context';
import useMultiMutations from '@/hooks/use-multi-mutations';
import { useMutation } from '@tanstack/react-query';
import { Grip, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteInstructorExperience,
  InstructorExperience,
} from '../../../../../../services/client';
import {
  addInstructorExperienceMutation,
  updateInstructorExperienceMutation,
} from '../../../../../../services/client/@tanstack/react-query.gen';
import { zInstructorExperience } from '../../../../../../services/client/zod.gen';

const ExperienceSchema = zInstructorExperience
  .omit({
    created_date: true,
    updated_date: true,
    updated_by: true,
    years_of_experience: true,
  })
  .merge(
    z.object({
      start_date: z.string(),
      end_date: z.string(),
    })
  );

const profileExperienceSchema = z.object({
  experiences: z.array(ExperienceSchema),
});

type ExperienceType = z.infer<typeof ExperienceSchema>;
type ProfileExperienceFormValues = z.infer<typeof profileExperienceSchema>;

export default function ProfessionalExperienceSettings() {
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

  const user = useUserProfile();
  const { instructor, invalidateQuery } = user!;
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  const instructorExperience = instructor?.experience as InstructorExperience[];

  const defaultExperience: ExperienceType = {
    organization_name: 'Google',
    position: 'Software Engineer',
    responsibilities: 'Worked on the search algorithm.',
    start_date: '2020-01',
    end_date: '2022-12',
    is_current_position: false,
    instructor_uuid: instructor!.uuid!,
  };

  const passExperiences = (exp: InstructorExperience) => ({
    ...defaultExperience,
    ...exp,
    start_date: new Date(exp.start_date ?? Date.now())
      .toISOString()
      .split('-')
      .slice(0, 2)
      .join('-'),
    end_date: new Date(exp.end_date ?? Date.now()).toISOString().split('-').slice(0, 2).join('-'),
    updated_by: exp.updated_by ?? 'self',
    updated_date: new Date(exp.updated_date ?? Date.now()).toISOString(),
    years_of_experience: exp.years_of_experience ? exp.years_of_experience.toString() : '',
  });

  const form = useForm<ProfileExperienceFormValues>({
    resolver: zodResolver(profileExperienceSchema),
    defaultValues: {
      //@ts-ignore
      experiences:
        instructorExperience && instructorExperience.length > 0
          ? instructorExperience.map(passExperiences)
          : [defaultExperience],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'experiences',
  });

  const updateExpMutation = useMutation(updateInstructorExperienceMutation());
  const addExpMutation = useMutation(addInstructorExperienceMutation());
  const { errors, submitting } = useMultiMutations([updateExpMutation, addExpMutation]);

  const saveExperiences = async (data: ProfileExperienceFormValues) => {
    for (const [index, exp] of data.experiences.entries()) {
      const expData = {
        ...exp,
        start_date: new Date(`${exp.start_date}-01`).toISOString(),
        end_date: new Date(`${exp.end_date}-01`).toISOString(),
      };

      if (exp.uuid) {
        await updateExpMutation.mutateAsync({
          path: {
            instructorUuid: instructor!.uuid!,
            experienceUuid: exp.uuid,
          },
          body: {
            ...expData,
            start_date: new Date(expData.start_date),
            end_date: new Date(expData.end_date),
          },
        });
      } else {
        const resp = await addExpMutation.mutateAsync({
          path: {
            instructorUuid: instructor!.uuid!,
          },
          body: {
            ...expData,
            start_date: new Date(expData.start_date),
            end_date: new Date(expData.end_date),
          },
        });

        if (resp.data) {
          const exps = form.getValues('experiences');
          exps[index] = passExperiences(resp.data as InstructorExperience);
          form.setValue('experiences', exps);
        }
      }
    }

    await invalidateQuery?.();
    toast.success('Experience updated successfully');
    disableEditing();
  };

  const handleSubmit = (data: ProfileExperienceFormValues) => {
    requestConfirmation({
      title: 'Save experience updates?',
      description: 'Learners rely on your work history to understand your expertise.',
      confirmLabel: 'Save experience',
      cancelLabel: 'Keep editing',
      onConfirm: () => saveExperiences(data),
    });
  };

  async function onDelete(index: number) {
    if (!isEditing) return;
    const shouldRemove = confirm('Are you sure you want to remove this experience?');
    if (!shouldRemove) return;

    const expUUID = form.getValues('experiences')[index]?.uuid;
    remove(index);

    if (expUUID) {
      const resp = await deleteInstructorExperience({
        path: {
          instructorUuid: instructor!.uuid!,
          experienceUuid: expUUID,
        },
      });
      if (resp.error) {
        toast.error('Unable to remove this experience right now.');
        return;
      }
    }

    await invalidateQuery?.();
    toast('Experience removed successfully');
  }

  const domainBadges =
    user?.user_domain?.map(domain =>
      domain
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  return (
    <ProfileFormShell
      eyebrow='Instructor'
      title='Professional experience'
      description='Document your work history so learners and organisations can see how you have applied your skills.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {errors && errors.length > 0 ? (
            <Alert variant='destructive'>
              <AlertTitle>Changes could not be saved</AlertTitle>
              <AlertDescription>
                <ul className='ml-4 list-disc space-y-1 text-sm'>
                  {errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <ProfileFormSection
            title='Experience history'
            description='Share the roles and teaching engagements that show your track record.'
            footer={
              <Button
                type='submit'
                className='min-w-36'
                disabled={!isEditing || submitting || isConfirming}
              >
                {submitting || isConfirming ? (
                  <span className='flex items-center gap-2'>
                    <Spinner className='h-4 w-4' />
                    Saving…
                  </span>
                ) : (
                  'Save changes'
                )}
              </Button>
            }
          >
            <div className='space-y-4'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='bg-card group hover:bg-accent/5 relative rounded-md border transition-all'
                >
                  <div className='space-y-5 p-5'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex items-start gap-3'>
                        <Grip className='text-muted-foreground mt-1 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100' />
                        <div>
                          <h3 className='text-base font-medium'>
                            {form.watch(`experiences.${index}.organization_name`) ||
                              'New experience'}
                          </h3>
                          <p className='text-muted-foreground text-sm'>
                            {form.watch(`experiences.${index}.position`) || 'Role not set'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='hover:bg-destructive-foreground h-8 w-8'
                        onClick={() => onDelete(index)}
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
                            <FormLabel>Organisation</FormLabel>
                            <FormControl>
                              <Input placeholder='e.g. WHO' {...field} />
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
                            <FormLabel>Job title</FormLabel>
                            <FormControl>
                              <Input placeholder='e.g. Analyst' {...field} />
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
                            <FormLabel>Start date</FormLabel>
                            <FormControl>
                              <Input type='month' {...field} />
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
                            <FormLabel>End date</FormLabel>
                            <FormControl>
                              <Input
                                type='month'
                                disabled={form.watch(`experiences.${index}.is_current_position`)}
                                {...field}
                              />
                            </FormControl>
                            <div className='mt-2 flex items-center space-x-2'>
                              <FormField
                                control={form.control}
                                name={`experiences.${index}.is_current_position`}
                                render={({ field }) => (
                                  <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className='leading-none'>
                                      <FormLabel>I currently work here</FormLabel>
                                    </div>
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
                      name={`experiences.${index}.responsibilities`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Responsibilities, accomplishments…'
                              className='min-h-24 resize-y'
                              {...field}
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
              onClick={() => append(defaultExperience as ExperienceType)}
              disabled={!isEditing || submitting || isConfirming}
            >
              <PlusCircle className='h-4 w-4' />
              Add another experience
            </Button>
          </ProfileFormSection>
        </form>
      </Form>
    </ProfileFormShell>
  );
}
