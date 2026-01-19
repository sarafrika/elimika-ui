'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { ProfileViewList, ProfileViewListItem } from '@/components/profile/profile-view-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import useMultiMutations from '@/hooks/use-multi-mutations';
import type { CourseCreatorEducation } from '@/services/api/schema';
import { deleteCourseCreatorEducation } from '@/services/client';
import {
  addCourseCreatorEducationMutation,
  getCourseCreatorEducationOptions,
  getCourseCreatorEducationQueryKey,
  updateCourseCreatorEducationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zCourseCreatorEducation } from '@/services/client/zod.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

const edSchema = zCourseCreatorEducation
  .omit({
    created_date: true,
    updated_date: true,
    updated_by: true,
  })
  .merge(
    z.object({
      uuid: z.string().optional(),
      field_of_study: z.string(),
      year_started: z.string().min(4, 'Start year is required'),
      year_completed: z.string().optional(),
      is_recent_qualification: z.boolean(),
    })
  )
  .refine(
    data => {
      if (data.is_recent_qualification) return true;
      if (!data.year_completed) return true;

      const start = Number(data.year_started);
      const end = Number(data.year_completed);

      return !Number.isNaN(start) && !Number.isNaN(end) && end >= start;
    },
    {
      path: ['year_completed'],
      message: 'End year must be the same as or after the start year',
    }
  );

const educationSchema = z.object({
  educations: z.array(edSchema),
});

type EducationFormValues = z.infer<typeof educationSchema>;
type EdType = z.infer<typeof edSchema>;

export default function EducationSettings() {
  const qc = useQueryClient();
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
  const { courseCreator, invalidateQuery } = user!;
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  const { data } = useQuery({
    ...getCourseCreatorEducationOptions({
      query: { pageable: {} },
      path: { courseCreatorUuid: courseCreator?.uuid as string },
    }),
    enabled: !!courseCreator?.uuid,
  });

  const courseCreatorEducation = data?.data?.content || [];

  const defaultEducation: EdType = {
    school_name: '',
    qualification: '',
    field_of_study: '',
    year_started: '',
    year_completed: '',
    is_recent_qualification: false,
    full_description: '',
    certificate_number: '',
    course_creator_uuid: courseCreator ? (courseCreator.uuid as string) : crypto.randomUUID(),
  };

  const passEducation = (ed: Omit<CourseCreatorEducation, 'created_date' | 'updated_date'>) => ({
    ...defaultEducation,
    ...ed,
    year_completed: ed.year_completed?.toString(),
    course_creator_uuid: courseCreator?.uuid!,
  });

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      //@ts-expect-error
      educations:
        courseCreatorEducation.length > 0
          ? courseCreatorEducation.map(passEducation)
          : [defaultEducation],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'educations',
  });

  const addEdMutation = useMutation(addCourseCreatorEducationMutation());
  const updateMutation = useMutation(updateCourseCreatorEducationMutation());
  const { errors, submitting } = useMultiMutations([addEdMutation, updateMutation]);

  const saveEducations = async (data: EducationFormValues) => {
    for (const [index, ed] of data.educations.entries()) {
      const options = {
        path: { courseCreatorUuid: courseCreator?.uuid as string },
        //@ts-expect-error
        body: { ...ed, year_completed: Number(ed.year_completed) },
      };

      if (!ed.uuid) {
        const resp = await addEdMutation.mutateAsync(options);
        const eds = form.getValues('educations');
        eds[index] = passEducation(resp.data!);
        form.setValue('educations', eds);
      } else {
        await updateMutation.mutateAsync(
          {
            ...options,
            path: {
              ...options.path,
              educationUuid: ed.uuid,
            },
          },
          {
            onSuccess: () => {
              qc.invalidateQueries({
                queryKey: getCourseCreatorEducationQueryKey({
                  path: { courseCreatorUuid: courseCreator?.uuid as string },
                  query: { pageable: {} },
                }),
              });
            },
          }
        );
      }
    }

    await invalidateQuery?.();
    qc.invalidateQueries({
      queryKey: getCourseCreatorEducationQueryKey({
        path: { courseCreatorUuid: courseCreator?.uuid as string },
        query: { pageable: {} },
      }),
    });
    toast.success('Education updated successfully');
    disableEditing();
  };

  const handleSubmit = (data: EducationFormValues) => {
    requestConfirmation({
      title: 'Save education updates?',
      description: 'This refreshes your academic history for organizations and learners.',
      confirmLabel: 'Save education',
      cancelLabel: 'Keep editing',
      onConfirm: () => saveEducations(data),
    });
  };

  async function onRemove(index: number) {
    if (!isEditing) return;
    const shouldRemove = confirm('Are you sure you want to remove this qualification?');
    if (!shouldRemove) return;

    const edUUID = form.getValues('educations')[index]?.uuid;
    remove(index);

    if (edUUID) {
      const resp = await deleteCourseCreatorEducation({
        path: {
          educationUuid: edUUID,
          courseCreatorUuid: courseCreator?.uuid!,
        },
      });
      if (resp.error) {
        toast.error('Unable to remove the qualification right now.');
        return;
      }
    }

    await invalidateQuery?.();
    qc.invalidateQueries({
      queryKey: getCourseCreatorEducationQueryKey({
        path: { courseCreatorUuid: courseCreator?.uuid as string },
        query: { pageable: {} },
      }),
    });
    toast('Education removed successfully');
  }

  const formatYearRange = (
    startYear?: string | number,
    endYear?: string | number,
    isCurrent?: boolean
  ) => {
    if (!startYear) return 'Years not specified';
    if (isCurrent) return `${startYear} - Present`;
    if (!endYear) return `${startYear}`;
    return `${startYear} - ${endYear}`;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 }, (_, i) => currentYear - i);

  const domainBadges =
    // @ts-expect-error
    user?.data?.user_domain?.map((domain: any) =>
      domain
        .split('_')
        .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  return (
    <ProfileFormShell
      eyebrow='Course Creator'
      title='Education'
      description='Keep your academic history accurate so learners and organizations can trust your expertise.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {errors && errors.length > 0 ? (
            <Alert variant='destructive'>
              <AlertTitle>We couldn&apos;t save your updates</AlertTitle>
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
            title='Qualifications'
            description='Add degrees, diplomas, and certifications you have completed or are currently pursuing.'
            viewContent={
              <ProfileViewList emptyMessage='No education history added yet.'>
                {courseCreatorEducation?.map(edu => (
                  <ProfileViewListItem
                    key={edu.uuid}
                    title={`${edu.qualification} in ${edu.field_of_study ?? '--'}`}
                    subtitle={edu.school_name}
                    description={edu.full_description}
                    badge={edu.is_recent_qualification ? 'Current' : undefined}
                    dateRange={formatYearRange(
                      edu.year_started,
                      edu.year_completed,
                      edu.is_recent_qualification
                    )}
                    year_completed={edu.year_completed}
                  >
                    {edu.certificate_number && (
                      <div className='text-muted-foreground mt-2 text-xs'>
                        Certificate: {edu.certificate_number}
                      </div>
                    )}
                  </ProfileViewListItem>
                ))}
              </ProfileViewList>
            }
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
                      <div className='flex items-start gap-2'>
                        <Grip className='text-muted-foreground mt-1 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100' />
                        <div>
                          <h3 className='text-base font-medium'>
                            {form.watch(`educations.${index}.school_name`) || 'New Institution'}
                          </h3>
                          <p className='text-muted-foreground text-sm'>
                            {form.watch(`educations.${index}.qualification`)} in{' '}
                            {form.watch(`educations.${index}.field_of_study`)}
                          </p>
                        </div>
                      </div>

                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => onRemove(index)}
                        className='hover:bg-destructive-foreground h-8 w-8 transition-colors'
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

                    <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name={`educations.${index}.field_of_study`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field of study</FormLabel>
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
                            <FormLabel>Certificate number</FormLabel>
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

                    <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                      {/* ================= START YEAR ================= */}
                      <FormField
                        control={form.control}
                        name={`educations.${index}.year_started`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start year</FormLabel>

                            <div className='flex gap-2'>
                              <FormControl>
                                <Input
                                  type='number'
                                  placeholder='YYYY'
                                  value={field.value ?? ''}
                                  onChange={e => field.onChange(e.target.value)}
                                />
                              </FormControl>

                              <Select
                                value={field.value?.toString()}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className='w-[110px]'>
                                  <SelectValue placeholder='Select' />
                                </SelectTrigger>
                                <SelectContent>
                                  {years.map(year => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* ================= END YEAR ================= */}
                      <FormField
                        control={form.control}
                        name={`educations.${index}.year_completed`}
                        render={({ field }) => {
                          const isDisabled = form.watch(`educations.${index}.is_complete`);

                          return (
                            <FormItem>
                              <FormLabel>End year</FormLabel>

                              <div className='flex gap-2'>
                                <FormControl>
                                  <Input
                                    type='number'
                                    placeholder='YYYY'
                                    disabled={isDisabled}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value)}
                                  />
                                </FormControl>

                                <Select
                                  disabled={isDisabled}
                                  value={field.value?.toString()}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className='w-[110px]'>
                                    <SelectValue placeholder='Select' />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {years.map(year => (
                                      <SelectItem key={year} value={year.toString()}>
                                        {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

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
                          );
                        }}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`educations.${index}.full_description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional information</FormLabel>
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

            <Button
              type='button'
              variant='outline'
              className='flex w-full items-center justify-center gap-2'
              onClick={() => append(defaultEducation)}
              disabled={!isEditing || submitting || isConfirming}
            >
              <PlusCircle className='h-4 w-4' />
              Add another education
            </Button>
          </ProfileFormSection>
        </form>
      </Form>
    </ProfileFormShell>
  );
}
