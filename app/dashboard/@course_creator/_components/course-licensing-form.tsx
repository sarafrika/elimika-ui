'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { useStepper } from '@/components/ui/stepper';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useInstructor } from '@/context/instructor-context';
import { getCourseByUuidQueryKey, updateCourseMutation } from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { FormSection } from './course-creation-form';
import {
  courseCreationSchema,
} from './course-creation-types';

type CourseCreationFormValues = z.infer<typeof courseCreationSchema> & { [key: string]: any };

export type CourseFormProps = {
  showSubmitButton?: boolean;
  initialValues?: Partial<CourseCreationFormValues>;
  editingCourseId?: string;
  courseId?: string;
  successResponse?: (data: any) => void;
};

export type CourseFormRef = {
  submit: () => void;
};

export const CourseLicensingForm = forwardRef<CourseFormRef, CourseFormProps>(
  ({ showSubmitButton, initialValues, editingCourseId, successResponse }, ref) => {
    const form = useForm<CourseCreationFormValues>({
      resolver: zodResolver(courseCreationSchema),
      defaultValues: {
        class_limit: 1,
        age_lower_limit: 1,
        age_upper_limit: 1,
        ...initialValues,
      },
      mode: 'onChange',
    });

    const queryClient = useQueryClient();
    const instructor = useInstructor();
    const courseCreatorContext = useOptionalCourseCreator();
    const courseCreatorProfile = courseCreatorContext?.profile;
    const authorName = courseCreatorProfile?.full_name ?? instructor?.full_name ?? '';
    const authorUuid = courseCreatorProfile?.uuid ?? instructor?.uuid ?? '';
    const { setActiveStep } = useStepper();

    const updateCourse = useMutation(updateCourseMutation());

    const onSubmit = (data: CourseCreationFormValues) => {
      if (!editingCourseId) return;

      if (editingCourseId) {
        const editBody = {
          total_duration_display: '',
          created_by: authorName,
          updated_by: authorName,
          course_creator_uuid: authorUuid,
          name: data?.name,
          description: data?.description,
          objectives: data?.objectives,
          thumbnail_url: data?.thumbnail_url,
          banner_url: data?.banner_url,
          intro_video_url: data?.intro_video_url,
          category_uuids: data?.categories,
          difficulty_uuid: data?.difficulty,
          prerequisites: data?.prerequisites,
          duration_hours: data?.duration_hours,
          duration_minutes: data?.duration_minutes,
          class_limit: data?.class_limit,
          minimum_training_fee: data?.minimum_training_fee,
          creator_share_percentage: data?.creator_share_percentage,
          instructor_share_percentage: data?.instructor_share_percentage,
          revenue_share_notes: data?.revenue_share_notes,
          training_requirements: "",
          status: 'draft',
          active: false,
          is_free: data?.is_free,
          is_published: false,
          is_draft: true,
          age_lower_limit: data?.age_lower_limit,
          age_upper_limit: data?.age_upper_limit,
        };

        updateCourse.mutate(
          { body: editBody as any, path: { uuid: editingCourseId as string } },
          {
            onSuccess(data, variables, context) {
              const respObj = data?.data;
              const errorObj = data?.error;

              if (respObj) {
                // @ts-ignore
                toast.success(data?.data?.message);
                // if (typeof successResponse === "function") {
                //   // @ts-ignore
                //   successResponse(data?.data)
                // }

                queryClient.invalidateQueries({ queryKey: getCourseByUuidQueryKey({ path: { uuid: editingCourseId as string } }) });
                setActiveStep(7);
                return;
              }

              if (errorObj && typeof errorObj === 'object') {
                Object.values(errorObj).forEach(errorMsg => {
                  if (typeof errorMsg === 'string') {
                    toast.error(errorMsg);
                  }
                });
                return;
                // @ts-ignore
              } else if (data?.message) {
                // @ts-ignore
                toast.error(data.message);
                return;
              } else {
                toast.error('An unknown error occurred.');
                return;
              }
            },
          }
        );
      }
    };

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          {/* Class Limit */}
          <FormSection
            title='Class Limit'
            description='Set the maximum number of students allowed to enroll'
          >
            <FormField
              control={form.control}
              name='class_limit'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type='number'
                      min='1'
                      placeholder='Maximum number of students'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Age Limit */}
          <FormSection title='Age Limit' description='Set the age limit for your course'>
            <div className='space-y-0'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='age_lower_limit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Lower Limit</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='age_upper_limit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Upper Limit</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          {/* Course Duration */}
          <FormSection title='Course Duration' description='Set the time duration for your course'>
            <div className='space-y-0'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='duration_hours'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration Hours</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='duration_minutes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration Minutes</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          {/* Submit Button */}
          {showSubmitButton && (
            <div className='flex flex-col justify-center gap-4 pt-6 sm:flex-row sm:justify-end'>
              <Button type='submit' className='min-w-32'>
                {updateCourse.isPending ? <Spinner /> : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

CourseLicensingForm.displayName = 'CourseLicensingForm';

export default CourseLicensingForm;
