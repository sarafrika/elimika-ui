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
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { type FieldErrors, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
      recurrence_pattern_uuid: combinedRecurrenceData?.response?.uuid || values?.recurrence_pattern_uuid,
      default_instructor_uuid: instructor?.uuid as string,
      location_type: combinedRecurrenceData?.payload?.location_type || classData?.location_type,
      location_name: combinedRecurrenceData?.payload?.location || classData?.location_name,
      location_latitude: -1.292066,
      location_longitude: 36.821945,
      duration_minutes: combinedRecurrenceData?.payload?.duration || classData?.duration_minutes,
      default_start_time: '2024-11-05T10:00:00',
      default_end_time: '2024-12-05T12:00:00',
      class_time_validy: '2 months',
    };

    // console.log('Submitting class details with payload:', payload);
    // console.log(values, "Vaues")


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

  const computeTrainingRate = () => {
    if (!selectedCourseProgram?.application?.rate_card) return 0;

    const rates = selectedCourseProgram.application.rate_card;
    const sessionFormat = form.watch("session_format"); // GROUP / PRIVATE
    const visibility = form.watch("class_visibility");  // PUBLIC / PRIVATE

    if (visibility === "PRIVATE" && sessionFormat === "PRIVATE") {
      return rates.private_individual_rate;
    }
    if (visibility === "PRIVATE" && sessionFormat === "GROUP") {
      return rates.private_group_rate;
    }
    if (visibility === "PUBLIC" && sessionFormat === "PRIVATE") {
      return rates.public_individual_rate;
    }
    if (visibility === "PUBLIC" && sessionFormat === "GROUP") {
      return rates.public_group_rate;
    }

    return 0;
  };


  useEffect(() => {
    if (!selectedCourseProgram?.application?.rate_card) return;

    const newRate = computeTrainingRate();

    // Automatically set the training fee (not editable)
    form.setValue("training_fee", newRate);
  }, [
    selectedCourseProgram,
    form.watch("class_visibility"),
    form.watch("session_format")
  ]);


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
                      // const selectedProgram = programs?.data?.content?.find(
                      //   program => program.uuid === value
                      // );
                      // const maxParticipants =
                      //   selectedCourse?.class_limit ?? selectedProgram?.class_limit;

                      const selectedCourse = approvedCourses?.find(course => course.uuid === value);


                      const maxParticipants = selectedCourse?.class_limit;

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
              name="training_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Fee (Auto-calculated)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </FormControl>

                  <FormDescription>
                    Based on: <br />
                    Visibility: <strong>{form.watch("class_visibility")}</strong> &nbsp;|&nbsp;
                    Format: <strong>{form.watch("session_format")}</strong>
                  </FormDescription>

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
