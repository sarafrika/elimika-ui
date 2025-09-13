'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { LocationTypeEnum } from '@/services/client';
import {
  createClassDefinitionMutation,
  getAllCoursesOptions,
  getClassDefinitionOptions,
  getClassDefinitionsForInstructorQueryKey,
  searchTrainingProgramsOptions,
  updateClassDefinitionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ClassFormValues,
  classSchema,
  RecurrenceDialog,
} from '../../_components/class-management-form';

export default function ClassCreationPage() {
  const router = useRouter();
  const instructor = useInstructor();
  const searchParams = new URLSearchParams(location.search);
  const classId = searchParams.get('id');
  const qc = useQueryClient();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { data: courses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));
  const { data: programs } = useQuery(searchTrainingProgramsOptions({ query: { pageable: {}, searchParams: { instructorUuid: instructor?.uuid } } }))

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
      description: '',
      course_uuid: '',
      organisation_uuid: '',
      default_start_time: '',
      default_end_time: '',
      max_participants: 0,
      recurrence_pattern_uuid: '',
      location_type: '',
      is_active: false,
    },
  });

  const [recurringUuid, setRecurringUuid] = useState<string | null>(null)
  const [recurringData, setRecurringData] = useState<any | null>(null)
  const [openAddRecurrenceModal, setOpenAddRecurrenceModal] = useState(false);

  const { data, isLoading } = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
    enabled: !!classId,
  });
  const classData = data?.data;

  const createAssignment = useMutation(createClassDefinitionMutation());
  const updateAssignment = useMutation(updateClassDefinitionMutation());

  const handleSubmit = async (values: ClassFormValues) => {
    const payload = {
      ...values,
      recurrence_pattern_uuid: recurringUuid as string,
      default_instructor_uuid: instructor?.uuid as string,
    };

    if (classId) {
      updateAssignment.mutate(
        { path: { uuid: classId }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getClassDefinitionsForInstructorQueryKey({
                path: { instructorUuid: instructor?.uuid as string },
              }),
            });
            toast.success(data?.message);
            router.push('/dashboard/trainings');
          },
        }
      );
    } else {
      createAssignment.mutate(
        { body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getClassDefinitionsForInstructorQueryKey({
                path: { instructorUuid: instructor?.uuid as string },
              }),
            });
            toast.success(data?.message);
            router.push('/dashboard/trainings');
          },
        }
      );
    }
  };

  useEffect(() => {
    if (classData) {
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
  }, [classData, form]);

  return (
    <Card className='container mx-auto p-6 pb-16'>
      <div className='mb-10 block lg:flex lg:items-start lg:space-x-4'>
        <div className='w-full'>
          <h3 className='text-2xl leading-none font-semibold tracking-tight'>
            Basic Class Training Information
          </h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            This section provides an overview of the fundamental aspects of the training classes
            offered. It includes essential details such as the course objectives, the target
            audience, prerequisites (if any), and the expected outcomes upon completion. The
            training sessions are designed to equip participants with the foundational knowledge and
            practical skills necessary for advancing in their respective fields. Whether you are a
            beginner or looking to refresh your skills, this class offers a structured curriculum to
            support your learning journey.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className='mx-auto items-center justify-center'>
          <Spinner />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8`}>
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

            <FormField
              control={form.control}
              name='course_uuid'
              render={({ field }) => (
                <FormItem className='w-full flex-1'>
                  <FormLabel>Assign Course or Program</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select course or program' />
                    </SelectTrigger>
                    <SelectContent className='pb-4' >
                      <p className='pl-3 py-2'>Courses</p>
                      {courses?.data?.content?.map(course => (
                        <SelectItem className='pb-1' key={course.uuid} value={course.uuid as string}>
                          {course.name}
                        </SelectItem>
                      ))}
                      <Separator className='my-2' />
                      <p className='pl-3 py-2'>Programs</p>
                      {programs?.data?.content?.map(program => (
                        <SelectItem className='pb-1' key={program.uuid} value={program.uuid as string}>
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
                  <FormLabel>Organisation here</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select organisation' />
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

            <div className='flex flex-col items-start gap-6 sm:flex-row'>
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
            </div>

            <FormField
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
            />

            <div className='flex flex-row items-end gap-4'>
              <FormField
                control={form.control}
                name='recurrence_pattern_uuid'
                render={({ field }) => (
                  <FormItem className='w-full flex-1 items-center'>
                    <FormLabel>Recurrence (Frequency)</FormLabel>
                    <div className="rounded-md border p-3.5 bg-muted/30 space-y-2 text-sm text-muted-foreground">

                      {recurringData?.days_of_week && (
                        <div>
                          <span className="font-medium text-foreground">Day(s) of week:</span>{' '}
                          {recurringData?.days_of_week}
                        </div>
                      )}

                      {recurringData?.day_of_month && (
                        <div>
                          <span className="font-medium text-foreground">Day of month:</span>{' '}
                          {recurringData.day_of_month}
                        </div>
                      )}

                      {recurringData?.end_date && (
                        <div>
                          <span className="font-medium text-foreground">Ends on:</span>{' '}
                          {new Date(recurringData?.end_date).toLocaleDateString()}
                        </div>
                      )}

                      {/* {recurringData?.occurrence_count && (
                        <div>
                          <span className="font-medium text-foreground">Occurrences:</span>{' '}
                          {recurringData?.occurrence_count}
                        </div>
                      )} */}

                      {/* <div>
                        <span className="font-medium text-foreground">Status:</span>{' '}
                        {recurringData?.is_active ? 'Active' : 'Inactive'}
                      </div> */}

                      <div className="pt-2 italic text-foreground">
                        {recurringData?.pattern_description}
                      </div>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                onClick={() => setOpenAddRecurrenceModal(true)}
                type='button'
                className='mt-[22px] h-10'
              >
                Add New
              </Button>
            </div>

            <FormField
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
              <Button type='button' variant='outline' onClick={() => { }}>
                Cancel
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
        onSuccess={(data: any) => {
          setRecurringUuid(data?.data?.uuid as string)
          setRecurringData(data?.data)

          // example success response
          // {
          //   success: true,
          //   data: {
          //       uuid: "f6a1984d-fce2-48b3-9947-3813299e90bf",
          //       recurrence_type: "WEEKLY",
          //       interval_value: 1,
          //       days_of_week: "MONDAY,FRIDAY",
          //       day_of_month: null,
          //       end_date: "2025-12-12",
          //       occurrence_count: null,
          //       is_active: true,
          //       is_indefinite: false,
          //       pattern_description: "Every week on MONDAY, FRIDAY until 2025-12-12"
          //    },
          //    message: "Recurrence pattern created successfully"
          // }
        }}
      />
    </Card>
  );
}
