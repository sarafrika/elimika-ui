'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
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
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { tanstackClient } from '@/services/api/tanstack-client';
import {
  createClassDefinitionMutation,
  getAllCoursesOptions,
  getClassDefinitionQueryKey,
  getClassDefinitionsForInstructorQueryKey,
  getClassRecurrencePatternOptions,
  searchTrainingApplicationsOptions,
  searchTrainingProgramsOptions,
  updateClassDefinitionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { type FieldErrors, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { CustomLoadingState } from '../../../@course_creator/_components/loading-state';
import {
  type ClassFormValues,
  classSchema,
  RecurrenceDialog,
} from '../../_components/class-management-form';

type ClassUploadOptions = {
  key: 'banner';
  setPreview: (value: string | null) => void;
  mutation: any;
  onChange: (value: string | null) => void;
};

interface ClassDetailsProps {
  handleNextStep: () => void;
  onPrev: () => void;
  classData: any;
  combinedRecurrenceData: any;
  isLoading: boolean;
}

export default function ClassDetailsForm({
  handleNextStep,
  classData,
  combinedRecurrenceData,
  isLoading,
  onPrev,
}: ClassDetailsProps) {
  const _router = useRouter();
  const instructor = useInstructor();
  const searchParams = new URLSearchParams(location.search);
  const classId = searchParams.get('id');

  const [createdClassId, setCreatedClassId] = useState<string | null>(null);
  const resolveId = classId ? (classId as string) : (createdClassId as string);

  const qc = useQueryClient();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const { data: courses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: !!instructor?.uuid,
  });

  const approvedCourses = useMemo(() => {
    if (!courses?.data?.content || !appliedCourses?.data?.content) return [];
    const appliedMap = new Map(
      appliedCourses.data.content
        .filter(app => app.status === 'approved')
        .map(app => [app.course_uuid, app])
    );

    return courses.data.content
      .map(course => ({
        ...course,
        application: appliedMap.get(course.uuid) || null,
      }))
      .filter(course => course.application !== null);
  }, [courses, appliedCourses]);

  const { data: programs } = useQuery(
    searchTrainingProgramsOptions({
      query: { pageable: {}, searchParams: { instructorUuid: instructor?.uuid } },
    })
  );
  const [selectedCourseProgram, setSelectedCourseProgram] = useState<any | null>(null);

  useEffect(() => {
    if (!resolveId) return;

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
        url: `/dashboard/trainings/create-new?id=${resolveId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, resolveId]);

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
      training_fee: 0,
      max_participants: 0,
      recurrence_pattern_uuid: '',
      location_type: '',
      class_visibility: 'PUBLIC',
      session_format: 'GROUP',
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

  const [_recurringUuid, setRecurringUuid] = useState<string | null>(null);
  const [_recurringData, setRecurringData] = useState<any | null>(null);
  const [openAddRecurrenceModal, setOpenAddRecurrenceModal] = useState(false);

  const [editingRecurrenceId, _setEditingRecurrenceId] = useState<string | null>(null);
  const { data: recurrenceData, isLoading: recurrenceLoading } = useQuery({
    ...getClassRecurrencePatternOptions({
      path: { uuid: classData?.recurrence_pattern_uuid as string },
    }),
    enabled: !!classData?.recurrence_pattern_uuid,
  });

  const createClassDefinition = useMutation(createClassDefinitionMutation());
  const updateClassDefinition = useMutation(updateClassDefinitionMutation());

  const handleError = (_errors: FieldErrors) => {
    toast.error('Form validation errors');
  };

  const handleSubmit = async (values: ClassFormValues) => {
    const payload = {
      ...values,
      course_uuid: values?.course_uuid || classData?.course_uuid,
      max_participants: values?.max_participants || classData?.max_participants,
      recurrence_pattern_uuid: combinedRecurrenceData?.response?.uuid,
      default_instructor_uuid: instructor?.uuid as string,
      location_type: combinedRecurrenceData?.payload?.location_type || classData?.location_type,
      duration_minutes: combinedRecurrenceData?.payload?.duration || classData?.duration_minutes,
      default_start_time: '2035-11-05T10:00:00',
      default_end_time: '2035-12-05T12:00:00',
      class_time_validy: '2 months',
    };

    if (resolveId) {
      updateClassDefinition.mutate(
        { path: { uuid: resolveId }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getClassDefinitionsForInstructorQueryKey({
                path: { instructorUuid: instructor?.uuid as string },
              }),
            });
            qc.invalidateQueries({
              queryKey: getClassDefinitionQueryKey({
                path: { uuid: resolveId as string },
              }),
            });
            toast.success(data?.message);
            // router.push('/dashboard/trainings');
            handleNextStep();
          },
          onError: (error: any) => {
            toast.error(JSON.stringify(error?.error));
          },
        }
      );
    } else {
      createClassDefinition.mutate(
        { body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getClassDefinitionsForInstructorQueryKey({
                path: { instructorUuid: instructor?.uuid as string },
              }),
            });
            toast.success(data?.message);
            setCreatedClassId(data?.data?.uuid as string);
            // router.push('/dashboard/trainings');
            handleNextStep();
          },
          onError: (error: any) => {
            toast.error(JSON.stringify(error?.error));
          },
        }
      );
    }
  };

  const courseBannerMutation = tanstackClient.useMutation('post', '/api/v1/courses/{uuid}/banner');
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [_uploadedUrls, setUploadedUrls] = useState<{
    class_banner?: string;
  }>({});
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    { key, setPreview, mutation, onChange }: ClassUploadOptions
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const schema = z.object({ [key]: z.instanceof(File) });
      schema.parse({ [key]: file });
    } catch (_err) {
      toast.error('Invalid file type.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    const formData = new FormData();
    formData.append(key, file);

    mutation(
      { body: formData, params: { path: { uuid: resolveId as string } } },
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
        training_fee: classData?.training_fee ?? 0,
        organisation_uuid: classData.organisation_uuid ?? '',
        default_start_time: classData.default_start_time ?? '',
        default_end_time: classData.default_end_time ?? '',
        max_participants: classData.max_participants ?? 0,
        recurrence_pattern_uuid: classData.recurrence_pattern_uuid ?? '',
        location_type: classData.location_type ?? '',
        is_active: classData.is_active,
      });
    }
  }, [classData, courses?.data?.content, form]);

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
          <CustomLoadingState subHeading='Fetching your class details' />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleError)} className={`space-y-8`}>
            <FormField
              control={form.control}
              name='course_uuid'
              render={({ field }) => (
                <FormItem className='w-full flex-1'>
                  <FormLabel>
                    Assign Course or Program (Select from a list of courses you have been approved
                    to train)
                  </FormLabel>
                  <Select
                    onValueChange={value => {
                      field.onChange(value);

                      const selectedCourse = approvedCourses?.find(course => course.uuid === value);
                      // const selectedProgram = programs?.data?.content?.find(
                      //   program => program.uuid === value
                      // );

                      const maxParticipants = selectedCourse?.class_limit;
                      // const maxParticipants =
                      //   selectedCourse?.class_limit ?? selectedProgram?.class_limit;

                      if (maxParticipants !== undefined) {
                        form.setValue('max_participants', maxParticipants);
                      }

                      setSelectedCourseProgram(selectedCourse);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a course' />
                    </SelectTrigger>
                    <SelectContent className='pb-4'>
                      {approvedCourses?.map(course => (
                        <SelectItem
                          className='pb-1'
                          key={course.uuid}
                          value={course.uuid as string}
                        >
                          {course.name}
                        </SelectItem>
                      ))}
                      {/* <Separator className='my-2' /> */}
                      {/* <p className='py-2 pl-3'>List of programs you are auhtorized to train</p> */}
                      {/* {programs?.data?.content?.map(program => (
                        <SelectItem
                          className='pb-1'
                          key={program.uuid}
                          value={program.uuid as string}
                        >
                          {program.title}
                        </SelectItem>
                      ))} */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
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
            /> */}

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
              name='training_fee'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Fee (Min. rate per hour per head)</FormLabel>
                  <FormControl>
                    <Input type='number' min='0' step='0.01' {...field} />
                  </FormControl>
                  <FormDescription>
                    Instructor-led classes must charge at least this KES{' '}
                    {selectedCourseProgram?.minimum_training_fee}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col md:flex-row gap-4">
              {/* CLASS VISIBILITY */}
              <FormField
                control={form.control}
                name="class_visibility"
                render={({ field }) => (
                  <FormItem className="w-full flex-1">
                    <FormLabel>Class Visibility</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">PUBLIC</SelectItem>
                        <SelectItem value="PRIVATE">PRIVATE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SESSION FORMAT */}
              <FormField
                control={form.control}
                name="session_format"
                render={({ field }) => (
                  <FormItem className="w-full flex-1">
                    <FormLabel>Session Format</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select session format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GROUP">GROUP</SelectItem>
                        <SelectItem value="PRIVATE">PRIVATE</SelectItem>
                        <SelectItem value="HYBRID">HYBRID</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


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

            <div className='flex justify-between gap-2 pt-6'>
              <Button variant='outline' onClick={onPrev}>
                <ChevronLeft className='mr-1 h-4 w-4' /> Previous
              </Button>

              <div className='flex flex-row items-center gap-4'>
                <Button
                  type='submit'
                  className='flex min-w-[120px] items-center justify-center gap-2'
                  disabled={createClassDefinition.isPending || updateClassDefinition.isPending}
                >
                  {(createClassDefinition.isPending || updateClassDefinition.isPending) && (
                    <Spinner />
                  )}
                  {resolveId ? 'Update Class Traninig' : 'Create Class Traninig'}
                </Button>

                <Button type='button' variant='outline' onClick={handleNextStep}>
                  Next
                </Button>
              </div>
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
