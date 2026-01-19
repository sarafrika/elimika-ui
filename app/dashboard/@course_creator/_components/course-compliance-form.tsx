'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import Spinner from '@/components/ui/spinner';
import { useStepper } from '@/components/ui/stepper';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useInstructor } from '@/context/instructor-context';
import {
  getCourseByUuidQueryKey,
  updateCourseMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type * as z from 'zod';
import { Checkbox } from '../../../../components/ui/checkbox';
import { courseCreationSchema } from './course-creation-types';

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

export const CourseComplianceForm = forwardRef<CourseFormRef, CourseFormProps>(
  ({ showSubmitButton, initialValues, editingCourseId, successResponse }, _ref) => {
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
          training_requirements: '',
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
            onSuccess(data, _variables, _context) {
              const respObj = data?.data;
              const errorObj = data?.error;

              if (respObj) {
                // @ts-expect-error
                toast.success(data?.data?.message);
                // if (typeof successResponse === "function") {
                //   // @ts-expect-error
                //   successResponse(data?.data)
                // }

                queryClient.invalidateQueries({
                  queryKey: getCourseByUuidQueryKey({ path: { uuid: editingCourseId as string } }),
                });
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
                // @ts-expect-error
              } else if (data?.message) {
                // @ts-expect-error
                toast.error('Course updated successfully' || data.message);
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

    const onError = (_errors: any) => {
      // console.log(errors, "er")
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className='space-y-6'>
          <div className="space-y-6 py-10 px-6 border-border border-1 rounded-3xl">
            <FormField
              control={form.control}
              name="compliance.copyright_confirmed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Copyright ownership confirmed</FormLabel>
                    <FormDescription>
                      You own the content or have the rights to distribute it
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compliance.accessibility_captions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Accessibility captions added</FormLabel>
                    <FormDescription>
                      Captions or transcripts are available where required
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compliance.certificate_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Certificate enabled</FormLabel>
                    <FormDescription>
                      Learners will receive a certificate upon completion
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

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

CourseComplianceForm.displayName = 'CourseComplianceForm';

export default CourseComplianceForm;
