import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useBreadcrumb } from '../../../../../context/breadcrumb-provider';
import { useInstructor } from '../../../../../context/instructor-context';
import {
  getAllCoursesOptions,
  getAllDifficultyLevelsOptions,
  searchTrainingApplicationsOptions,
} from '../../../../../services/client/@tanstack/react-query.gen';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

import { toast } from 'sonner';
import z from 'zod';
import { ClassDetails } from './page';

const classSchema = z.object({
  course_uuid: z.string().min(1, 'Course is required'),
  title: z.string().min(1, 'Title is required'),
  categories: z.any().optional(),
  class_type: z.string().min(1, 'Class type is required'),
  rate_card: z.any().optional(),
  location_type: z.string().min(1, 'Location type is required'),
  location_name: z.string().optional(),
  class_limit: z.any().optional(),
});

type ClassFormValues = z.infer<typeof classSchema>;

const CLASS_TYPE_OPTIONS = [
  { label: 'Group (In-person)', value: 'group_inperson_rate' },
  { label: 'Group (Online)', value: 'group_online_rate' },
  { label: 'Private (In-person)', value: 'private_inperson_rate' },
  { label: 'Private (Online)', value: 'private_online_rate' },
] as const;

const LOCATION_OPTIONS = [
  { label: 'Online', value: 'online' },
  { label: 'In-person', value: 'in_person' },
  { label: 'Hybrid', value: 'hybrid' },
] as const;

export const ClassDetailsFormPage = ({
  data,
  onChange,
  onNext,
  isActive = true,
}: {
  data: ClassDetails;
  onChange: (updates: Partial<ClassDetails>) => void;
  onNext: () => void;
  isActive?: boolean;
}) => {
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      course_uuid: '',
      title: '',
      categories: [],
      class_type: '',
      rate_card: '',
      location_type: '',
      location_name: '',
      class_limit: undefined,
    },
  });

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'trainings', title: 'Training Classes', url: '/dashboard/trainings' },
    ]);
  }, [replaceBreadcrumbs]);

  const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels = difficulty?.data;

  const getDifficultyNameFromUUID = (uuid: string): string | undefined => {
    return difficultyLevels?.find(level => level.uuid === uuid)?.name;
  };

  const { data: courses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: { applicant_uuid_eq: instructor?.uuid as string },
      },
    }),
    enabled: !!instructor?.uuid,
  });

  const approvedCourses = useMemo(() => {
    if (!courses?.data?.content || !appliedCourses?.data?.content) return [];

    const approvedApplicationMap = new Map(
      appliedCourses.data.content
        .filter(app => app.status === 'approved')
        .map(app => [app.course_uuid, app])
    );

    return courses.data.content
      .filter(course => approvedApplicationMap.has(course.uuid))
      .map(course => ({
        ...course,
        application: approvedApplicationMap.get(course.uuid),
      }));
  }, [courses, appliedCourses]);

  const selectedCourseUuid = form.watch('course_uuid');
  const selectedClassType = form.watch('class_type');

  const selectedCourse = useMemo(() => {
    return approvedCourses.find(course => course.uuid === selectedCourseUuid);
  }, [approvedCourses, selectedCourseUuid]);

  // Sync form with parent data whenever it changes or page becomes active
  useEffect(() => {
    // Only sync if we have approved courses loaded and data exists
    if (!approvedCourses.length || !data?.course_uuid) return;

    const exists = approvedCourses.some(c => c.uuid === data.course_uuid);
    if (!exists) return;

    // Only update if page is active to avoid unnecessary re-renders
    if (!isActive) return;

    // Get current form values
    const currentValues = form.getValues();

    // Check if parent data differs from current form state
    const hasChanges =
      currentValues.course_uuid !== data.course_uuid ||
      currentValues.title !== data.title ||
      currentValues.class_type !== data.class_type ||
      currentValues.location_type !== data.location_type ||
      currentValues.location_name !== data.location_name;

    // Only update if there are actual changes
    if (hasChanges) {
      form.reset({
        course_uuid: data.course_uuid,
        title: data.title || '',
        categories: Array.isArray(data.categories)
          ? data.categories
          : data.categories
            ? [data.categories]
            : [],
        class_type: data.class_type || '',
        rate_card: data.rate_card || '',
        location_type: data.location_type || '',
        location_name: data.location_name || '',
        class_limit: data.class_limit,
      });
    }
  }, [data, approvedCourses, form, isActive]);

  // Auto-populate rate card when class type changes
  useEffect(() => {
    if (!selectedClassType || !selectedCourse?.application?.rate_card) return;

    const rate =
      selectedCourse.application.rate_card[
        selectedClassType as keyof typeof selectedCourse.application.rate_card
      ];

    if (rate !== undefined) {
      form.setValue('rate_card', rate);
    }
  }, [selectedClassType, selectedCourse, form]);

  // Auto-populate categories from selected course
  useEffect(() => {
    if (!selectedCourse) return;
    form.setValue('categories', selectedCourse.category_names ?? []);
  }, [selectedCourse, form]);

  const onSubmit = (values: ClassFormValues) => {
    // Update parent state with all form values
    onChange({
      course_uuid: values.course_uuid,
      title: values.title,
      categories: Array.isArray(values.categories)
        ? values.categories
        : values.categories
          ? [values.categories]
          : [],
      class_type: values.class_type,
      rate_card: values.rate_card,
      location_type: values.location_type,
      location_name: values.location_name || '',
      class_limit: selectedCourse?.class_limit || 0,
      targetAudience: getDifficultyNameFromUUID(selectedCourse?.difficulty_uuid || '') || '',
    });

    // Proceed to next page
    onNext();
  };

  const onSubmitError = (errors: any) => {
    toast.error('Form validation errors:', errors);
  };

  return (
    <div className='mx-auto max-w-4xl'>
      <div className='mb-8'>
        <h2 className='text-foreground mb-2 text-xl font-bold'>Class Details</h2>
        <p className='text-muted-foreground'>Configure your class course, type, and location</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onSubmitError)}
          className='border-border bg-card overflow-hidden rounded-lg border'
        >
          <Table>
            <TableBody>
              {/* Course */}
              <TableRow className='border-border border-b'>
                <TableCell className='bg-muted w-1/3 font-semibold'>Course Title</TableCell>
                <TableCell className='bg-card'>
                  <FormField
                    control={form.control}
                    name='course_uuid'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className='w-full'>
                              <SelectValue>
                                {selectedCourse ? selectedCourse.name : 'Select a course'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {approvedCourses.map(course => (
                                <SelectItem key={course.uuid} value={course.uuid}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
              </TableRow>

              {/* Title */}
              <TableRow className='border-border border-b'>
                <TableCell className='bg-muted font-semibold'>Class Title</TableCell>
                <TableCell className='bg-card'>
                  <FormField
                    control={form.control}
                    name='title'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder='Enter class title' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
              </TableRow>

              {/* Tagline */}
              <TableRow className='border-border border-b'>
                <TableCell className='bg-muted font-semibold'>Category/Tagline</TableCell>
                <TableCell className='bg-card'>
                  <FormField
                    control={form.control}
                    name='categories'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder='Optional (comma separated)'
                            value={
                              Array.isArray(field.value)
                                ? field.value.join(', ')
                                : field.value || ''
                            }
                            onChange={e =>
                              field.onChange(e.target.value.split(',').map(s => s.trim()))
                            }
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
              </TableRow>

              {/* Audience */}
              <TableRow className='border-border border-b'>
                <TableCell className='bg-muted font-semibold'>Target Audience</TableCell>
                <TableCell className='bg-card space-y-1'>
                  <p className='text-foreground text-sm'>
                    {getDifficultyNameFromUUID(selectedCourse?.difficulty_uuid || '') || '–'}
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    Ages {selectedCourse?.age_lower_limit ?? '–'} -{' '}
                    {selectedCourse?.age_upper_limit ?? '–'}
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    {selectedCourse?.class_limit ?? '–'} max participants
                  </p>
                </TableCell>
              </TableRow>

              {/* Type + Rate */}
              <TableRow className='border-border border-b'>
                <TableCell className='bg-muted font-semibold'>Class Type</TableCell>
                <TableCell className='bg-card flex gap-4'>
                  <FormField
                    control={form.control}
                    name='class_type'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Select class type' />
                            </SelectTrigger>
                            <SelectContent>
                              {CLASS_TYPE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='rate_card'
                    render={({ field }) => (
                      <FormItem className='w-40'>
                        <FormControl>
                          <Input
                            {...field}
                            type='number'
                            readOnly
                            placeholder='Rate'
                            className='bg-muted cursor-not-allowed'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
              </TableRow>

              {/* Location Type */}
              <TableRow className='border-border border-b'>
                <TableCell className='bg-muted font-semibold'>Location Type</TableCell>
                <TableCell className='bg-card'>
                  <FormField
                    control={form.control}
                    name='location_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Select location type' />
                            </SelectTrigger>
                            <SelectContent>
                              {LOCATION_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
              </TableRow>

              {/* Classroom/Meeting Link */}
              <TableRow>
                <TableCell className='bg-muted font-semibold'>Classroom/Meeting Link</TableCell>
                <TableCell className='bg-card'>
                  <FormField
                    control={form.control}
                    name='location_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder='Room number or meeting link' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className='border-border bg-muted/50 flex justify-end gap-3 border-t p-6'>
            <Button type='submit'>Save & Continue</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
