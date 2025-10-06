'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import {
  createClassDefinitionMutation,
  getAllCoursesOptions,
  getClassRecurrencePatternOptions,
  searchTrainingProgramsOptions,
  updateClassDefinitionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FieldErrors, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { tanstackClient } from '../../../../../services/api/tanstack-client';
import {
  ClassFormValues,
  classSchema,
  RecurrenceDialog,
} from '../../_components/class-management-form';
import { UploadOptions } from '../../_components/course-creation-form';

interface ClassDetailsProps {
  handleNextStep: () => void;
  classData: any;
  isLoading: boolean;
}

export default function ClassDetailsForm({
  handleNextStep,
  classData,
  isLoading,
}: ClassDetailsProps) {
  const router = useRouter();
  const instructor = useInstructor();
  const searchParams = new URLSearchParams(location.search);
  const classId = searchParams.get('id');
  const qc = useQueryClient();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const { data: courses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));
  const { data: programs } = useQuery(
    searchTrainingProgramsOptions({
      query: { pageable: {}, searchParams: { instructorUuid: instructor?.uuid } },
    })
  );

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'trainings',
        title: 'Training Classes',
        url: '/dashboard/trainings',
      },
      {
        id: 'manage-training',
        title: 'Manage Training',
        url: `/dashboard/trainings/create-new?id=${classId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, classId]);

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      title: '',
      sub_title: '',
      description: '',
      course_uuid: '',
      categories: ['none'],
      organisation_uuid: '',
      default_start_time: '',
      default_end_time: '',
      max_participants: 0,
      recurrence_pattern_uuid: '',
      location_type: '',
      is_active: false,
    },
  });

  const {
    // fields: categoryFields,
    append: appendCategory,
    remove: removeCategory,
  } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  const [recurringUuid, setRecurringUuid] = useState<string | null>(null);
  const [recurringData, setRecurringData] = useState<any | null>(null);
  const [openAddRecurrenceModal, setOpenAddRecurrenceModal] = useState(false);

  const [editingRecurrenceId, setEditingRecurrenceId] = useState<string | null>(null);
  const { data: recurrenceData, isLoading: recurrenceLoading } = useQuery({
    ...getClassRecurrencePatternOptions({
      path: { uuid: classData?.recurrence_pattern_uuid as string },
    }),
    enabled: !!classData?.recurrence_pattern_uuid,
  });

  const createAssignment = useMutation(createClassDefinitionMutation());
  const updateAssignment = useMutation(updateClassDefinitionMutation());

  const handleError = (errors: FieldErrors) => {
    // console.error("Form validation errors:", errors);
    // You can add toast notifications, loggers, or UI feedback here
  };

  const handleSubmit = async (values: ClassFormValues) => {
    const payload = {
      ...values,
      course_uuid: values?.course_uuid || classData?.course_uuid,
      max_participants: values?.max_participants || classData?.max_participants,
      location_type: values?.location_type || classData?.location_type,
      recurrence_pattern_uuid: classData?.recurrence_pattern_uuid || (recurringUuid as string),
      default_instructor_uuid: instructor?.uuid as string,
    };

    handleNextStep();

    // if (classId) {
    //   updateAssignment.mutate(
    //     { path: { uuid: classId }, body: payload as any },
    //     {
    //       onSuccess: data => {
    //         qc.invalidateQueries({
    //           queryKey: getClassDefinitionsForInstructorQueryKey({
    //             path: { instructorUuid: instructor?.uuid as string },
    //           }),
    //         });
    //         qc.invalidateQueries({
    //           queryKey: getClassDefinitionQueryKey({
    //             path: { uuid: classId as string },
    //           }),
    //         });
    //         toast.success(data?.message);
    //         router.push('/dashboard/trainings');
    //       },
    //     }
    //   );
    // } else {
    //   createAssignment.mutate(
    //     { body: payload as any },
    //     {
    //       onSuccess: data => {
    //         qc.invalidateQueries({
    //           queryKey: getClassDefinitionsForInstructorQueryKey({
    //             path: { instructorUuid: instructor?.uuid as string },
    //           }),
    //         });
    //         toast.success(data?.message);
    //         router.push('/dashboard/trainings');
    //       },
    //     }
    //   );
    // }
  };

  const courseBannerMutation = tanstackClient.useMutation('post', '/api/v1/courses/{uuid}/banner');
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<{
    class_banner?: string;
  }>({});
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    { key, setPreview, mutation, onChange }: UploadOptions
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const schema = z.object({ [key]: z.instanceof(File) });
      schema.parse({ [key]: file });
    } catch (err) {
      toast.error('Invalid file type.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    const formData = new FormData();
    formData.append(key, file);

    mutation(
      { body: formData, params: { path: { uuid: classId as string } } },
      {
        onSuccess: (data: any) => {
          onChange(previewUrl);
          toast.success(data?.message);

          const urls = data?.data;

          setUploadedUrls(prev => ({
            ...prev,
            [key]: urls?.[`${key}_url`],
          }));
        },
        onError: (error: any) => {
          if (error?.response?.status === 413) {
            toast.error('Video file is too large. Please upload a smaller file.');
          } else {
            toast.error('Failed to upload file.');
          }
        },
      }
    );
  };

  useEffect(() => {
    if (classData && courses?.data?.content) {
      form.reset({
        title: classData.title ?? '',
        description: classData.description ?? '',
        course_uuid: classData.course_uuid ?? '',
        organisation_uuid: classData.organisation_uuid ?? '',
        default_start_time: classData.default_start_time ?? '',
        default_end_time: classData.default_end_time ?? '',
        max_participants: classData.max_participants ?? 0,
        recurrence_pattern_uuid: classData.recurrence_pattern_uuid ?? '',
        location_type: classData.location_type ?? '',
        is_active: classData.is_active,
      });
    }
  }, [classData, courses?.data?.content, programs?.data?.content, form, bannerPreview]);

  return (
    <main className=''>
      {/* <div className='mb-10 block lg:flex lg:items-start lg:space-x-4'>
        <div className='w-full'>
          <h3 className='text-2xl leading-none font-semibold tracking-tight'>
            Class Detials
          </h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            Basic information about your class
          </p>
        </div>
      </div> */}

      {isLoading ? (
        <div className='mx-auto items-center justify-center'>
          <Spinner />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleError)} className={`space-y-8`}>
            <FormField
              control={form.control}
              name='course_uuid'
              render={({ field }) => (
                <FormItem className='w-full flex-1'>
                  <FormLabel>Assign Course or Program</FormLabel>
                  <Select
                    onValueChange={value => {
                      field.onChange(value); // Set selected UUID

                      // Try to find the selected course or program
                      const selectedCourse = courses?.data?.content?.find(
                        course => course.uuid === value
                      );
                      const selectedProgram = programs?.data?.content?.find(
                        program => program.uuid === value
                      );

                      const maxParticipants =
                        selectedCourse?.class_limit ?? selectedProgram?.class_limit;

                      if (maxParticipants !== undefined) {
                        form.setValue('max_participants', maxParticipants);
                      }
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a course' />
                    </SelectTrigger>
                    <SelectContent className='pb-4'>
                      <p className='py-2 pl-3'>Courses</p>
                      {courses?.data?.content?.map(course => (
                        <SelectItem
                          className='pb-1'
                          key={course.uuid}
                          value={course.uuid as string}
                        >
                          {course.name}
                        </SelectItem>
                      ))}
                      <Separator className='my-2' />
                      <p className='py-2 pl-3'>Programs</p>
                      {programs?.data?.content?.map(program => (
                        <SelectItem
                          className='pb-1'
                          key={program.uuid}
                          value={program.uuid as string}
                        >
                          {program.title}
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
              name='organisation_uuid'
              render={({ field }) => (
                <FormItem className='w-full flex-1'>
                  <FormLabel>Organisation (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select organisation (if youre creating class for an organisation)' />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.data?.content?.map(course => (
                        <SelectItem key={course.uuid} value={course.uuid as string}>
                          {course.name}
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
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Title</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter class title' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='sub_title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle/Tagline (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='Brief subtitle or tagline' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <div className='flex flex-col items-start gap-6 sm:flex-row'>
              <FormField
                control={form.control}
                name='default_start_time'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Start Time</FormLabel>
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

              <FormField
                control={form.control}
                name='default_end_time'
                render={({ field }) => (
                  <FormItem className='w-full'>
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
            </div> */}

            {/* <FormField
              control={form.control}
              name='max_participants'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Class Limit</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='e.g. 25'
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {/* <div className='flex flex-row items-end gap-4'>
              <FormField
                control={form.control}
                name='recurrence_pattern_uuid'
                render={({ field }) => (
                  <FormItem className='w-full flex-1 items-center'>
                    <FormLabel>Recurrence (Frequency)</FormLabel>
                    {recurrenceData && <RecurringDisplay data={recurrenceData?.data} />}

                    {recurringData && <RecurringDisplay data={recurrenceData} />}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {recurrenceData ? <Button
                onClick={() => { setOpenAddRecurrenceModal(true), setEditingRecurrenceId(recurrenceData?.data?.uuid as string) }}
                type='button'
                className='mt-[22px] h-10'
              >
                Edit Recurrence
              </Button> : <Button
                onClick={() => setOpenAddRecurrenceModal(true)}
                type='button'
                className='mt-[22px] h-10'
              >
                Add New
              </Button>}
            </div> */}

            {/* <FormField
              control={form.control}
              name='location_type'
              render={({ field }) => (
                <FormItem className='w-full flex-1'>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select location type' />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LocationTypeEnum)
                        .map(([key, value]) => ({
                          key,
                          value,
                        }))
                        .map(option => (
                          <SelectItem key={option.key} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <SimpleEditor value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='class_banner'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Banner</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <div className='relative flex h-48 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 p-6'>
                        {bannerPreview ? (
                          <div className='relative h-full w-full'>
                            <Image
                              src={bannerPreview}
                              alt='Banner Preview'
                              fill
                              className='rounded-lg object-cover'
                            />
                            <Button
                              type='button'
                              size='sm'
                              variant='destructive'
                              className='absolute top-2 right-2 z-10'
                              onClick={() => {
                                setBannerPreview('');
                                field.onChange(null);
                              }}
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </div>
                        ) : (
                          <div className='pointer-events-none text-center text-gray-600'>
                            <Upload className='mx-auto mb-2 h-12 w-12 text-gray-400' />
                            <p className='text-sm'>Click to upload or drag and drop</p>
                            <p className='text-xs text-gray-500'>PNG, JPG up to 10MB</p>
                          </div>
                        )}

                        {/* Invisible file input over the entire box */}
                        <input
                          type='file'
                          accept='image/*'
                          onChange={e =>
                            handleFileUpload(e, {
                              key: 'banner',
                              setPreview: setBannerPreview,
                              mutation: courseBannerMutation.mutate,
                              onChange: field.onChange,
                            })
                          }
                          className='absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0'
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Required Toggle */}
            <FormField
              control={form.control}
              name='is_active'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Is Active</FormLabel>
                  <div className='flex items-center gap-2'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Set this class training to active?</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2 pt-6'>
              <Button type='button' variant='outline' onClick={handleNextStep}>
                Next
              </Button>

              <Button
                type='submit'
                className='flex min-w-[120px] items-center justify-center gap-2'
                disabled={createAssignment.isPending || updateAssignment.isPending}
              >
                {(createAssignment.isPending || updateAssignment.isPending) && <Spinner />}
                {classId ? 'Update Class Traninig' : 'Create Class Traninig'}
              </Button>
            </div>
          </form>
        </Form>
      )}

      <RecurrenceDialog
        isOpen={openAddRecurrenceModal}
        setOpen={setOpenAddRecurrenceModal}
        onCancel={() => setOpenAddRecurrenceModal(false)}
        editingRecurrenceId={editingRecurrenceId}
        initialValues={recurrenceData?.data}
        onSuccess={(data: any) => {
          setRecurringUuid(data?.data?.uuid as string);
          setRecurringData(data?.data);
        }}
      />
    </main>
  );
}
