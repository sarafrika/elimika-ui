'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Button } from '@/components/ui/button';
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
  searchTrainingApplicationsOptions,
  searchTrainingProgramsOptions,
  updateClassDefinitionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type FieldErrors, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CustomLoadingState } from '../../../@course_creator/_components/loading-state';
import {
  type ClassFormValues,
  classSchema,
  RecurrenceDialog,
} from '../../_components/class-management-form';

interface ClassDetailsProps {
  handleNextStep: () => void;
  onPrev: () => void;
  classData: any;
  createdClassId: string | null;
  setCreatedClassId: (id: string) => void;
  combinedRecurrenceData: any;
  isLoading: boolean;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
}

export default function ClassDetailsForm({
  handleNextStep,
  classData,
  combinedRecurrenceData,
  isLoading,
  onPrev,
}: ClassDetailsProps) {
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

  const [_recurringUuid, setRecurringUuid] = useState<string | null>(null);
  const [_recurringData, setRecurringData] = useState<any | null>(null);
  const [openAddRecurrenceModal, setOpenAddRecurrenceModal] = useState(false);

  const [editingRecurrenceId, _setEditingRecurrenceId] = useState<string | null>(null);

  const parseDateValue = (value?: string | Date | null) => {
    if (!value) return undefined;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const buildSessionTemplates = (values: ClassFormValues) => {
    const startTime = parseDateValue(values.default_start_time ?? classData?.default_start_time);
    const endTime = parseDateValue(values.default_end_time ?? classData?.default_end_time);

    if (!startTime || !endTime) {
      return classData?.session_templates ?? [];
    }

    const availabilityDays = combinedRecurrenceData?.payload?.availability
      ?.filter((slot: any) => slot?.enabled)
      ?.map((slot: any) => slot.day?.toString().toUpperCase());

    const recurrence =
      combinedRecurrenceData?.payload?.recurrence ||
      classData?.session_templates?.[0]?.recurrence ||
      (availabilityDays?.length
        ? {
            recurrence_type: 'WEEKLY',
            interval_value: 1,
            days_of_week: availabilityDays.join(','),
          }
        : undefined);

    const conflictResolution = classData?.session_templates?.[0]?.conflict_resolution || 'FAIL';

    return [
      {
        start_time: startTime,
        end_time: endTime,
        recurrence,
        conflict_resolution: conflictResolution,
      },
    ];
  };

  const createClassDefinition = useMutation(createClassDefinitionMutation());
  const updateClassDefinition = useMutation(updateClassDefinitionMutation());

  const handleError = (_errors: FieldErrors) => {
    toast.error('Form validation errors');
  };

  const handleSubmit = async (values: ClassFormValues) => {
    const resolvedStartTime = values.default_start_time || classData?.default_start_time || null;
    const resolvedEndTime = values.default_end_time || classData?.default_end_time || null;
    const sessionTemplates = buildSessionTemplates(values);
    const locationType =
      combinedRecurrenceData?.payload?.location_type ||
      values.location_type ||
      classData?.location_type ||
      'ONLINE';

    const classTimeValidity =
      resolvedStartTime && resolvedEndTime
        ? `${Math.ceil(
            (new Date(resolvedEndTime).getTime() - new Date(resolvedStartTime).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )} months`
        : undefined;

    const payload = {
      ...values,
      course_uuid: values.course_uuid || classData?.course_uuid,
      max_participants: values.max_participants || classData?.max_participants,
      default_instructor_uuid: instructor?.uuid || classData?.default_instructor_uuid,
      location_type: locationType,
      location_name: combinedRecurrenceData?.payload?.location_name ?? classData?.location_name,
      location_latitude:
        combinedRecurrenceData?.payload?.location_latitude ?? classData?.location_latitude,
      location_longitude:
        combinedRecurrenceData?.payload?.location_longitude ?? classData?.location_longitude,
      default_start_time: resolvedStartTime,
      default_end_time: resolvedEndTime,
      session_templates: sessionTemplates.length
        ? sessionTemplates
        : classData?.session_templates || [],
      class_time_validity: classTimeValidity,
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

            handleNextStep();
          },
          onError: (error: any) => {
            toast.error(error?.message);
          },
        }
      );
    }
  };

  const computeTrainingRate = () => {
    if (!selectedCourseProgram?.application?.rate_card) return 0;

    const rates = selectedCourseProgram.application.rate_card;
    const sessionFormat = form.watch('session_format'); // GROUP / PRIVATE
    const visibility = form.watch('class_visibility'); // PUBLIC / PRIVATE

    if (visibility === 'PRIVATE' && sessionFormat === 'PRIVATE') {
      return rates.private_inperson_rate;
    }
    if (visibility === 'PRIVATE' && sessionFormat === 'GROUP') {
      return rates.private_online_rate;
    }
    if (visibility === 'PUBLIC' && sessionFormat === 'PRIVATE') {
      return rates.group_inperson_rate;
    }
    if (visibility === 'PUBLIC' && sessionFormat === 'GROUP') {
      return rates.group_online_rate;
    }

    return 0;
  };

  useEffect(() => {
    if (!selectedCourseProgram?.application?.rate_card) return;
    const newRate = computeTrainingRate();
    form.setValue('training_fee', newRate);
  }, [selectedCourseProgram, form.watch('class_visibility'), form.watch('session_format')]);

  useEffect(() => {
    if (!classData || !approvedCourses?.length) return;

    form.reset({
      title: classData.title ?? '',
      description: classData.description ?? '',
      course_uuid: classData.course_uuid ?? '',
      categories: classData.categories ?? ['none'],
      organisation_uuid: classData.organisation_uuid ?? '',

      default_start_time: toDateTimeLocal(classData.default_start_time),
      default_end_time: toDateTimeLocal(classData.default_end_time),

      training_fee: classData.training_fee ?? 0,
      max_participants: classData.max_participants ?? 0,
      recurrence_pattern_uuid: classData.recurrence_pattern_uuid ?? '',
      location_type: classData.location_type ?? '',
      class_visibility: classData.class_visibility ?? 'PUBLIC',
      session_format: classData.session_format ?? 'GROUP',
      is_active: classData.is_active ?? false,
    });
  }, [classData, approvedCourses, form]);

  return (
    <main className=''>
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

            <div className='flex flex-col gap-4 md:flex-row'>
              {/* CLASS VISIBILITY */}
              <FormField
                control={form.control}
                name='class_visibility'
                render={({ field }) => (
                  <FormItem className='w-full flex-1'>
                    <FormLabel>Class Visibility</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select visibility' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='PUBLIC'>PUBLIC</SelectItem>
                        <SelectItem value='PRIVATE'>PRIVATE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SESSION FORMAT */}
              <FormField
                control={form.control}
                name='session_format'
                render={({ field }) => (
                  <FormItem className='w-full flex-1'>
                    <FormLabel>Session Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select session format' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='GROUP'>GROUP</SelectItem>
                        <SelectItem value='PRIVATE'>PRIVATE</SelectItem>
                        <SelectItem value='HYBRID'>HYBRID</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex flex-col items-start gap-6 sm:flex-row'>
              <FormField
                control={form.control}
                name='default_start_time'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type='datetime-local' {...field} />
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
                      <Input type='datetime-local' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='training_fee'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Fee (Auto-calculated)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
                      value={field.value}
                      readOnly
                      className='cursor-not-allowed bg-gray-100'
                    />
                  </FormControl>

                  <FormDescription>
                    Based on: <br />
                    Visibility: <strong>{form.watch('class_visibility')}</strong> &nbsp;|&nbsp;
                    Format: <strong>{form.watch('session_format')}</strong>
                  </FormDescription>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Required Toggle */}
            {/* <FormField
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
            /> */}

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
        initialValues={
          combinedRecurrenceData?.payload?.recurrence ||
          classData?.session_templates?.[0]?.recurrence
        }
        onSuccess={(data: any) => {
          setRecurringUuid(data?.data?.uuid as string);
          setRecurringData(data?.data);
        }}
      />
    </main>
  );
}
