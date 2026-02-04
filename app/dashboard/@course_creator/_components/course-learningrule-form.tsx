'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
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
import * as z from 'zod';
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

export const learningRulesSchema = z.object({
  learning_rules: z.object({
    prerequisites_required: z.boolean().default(false),
    drip_schedule_enabled: z.boolean().default(false),
    completion_rules_enabled: z.boolean().default(false),
  }),
});

type LearningRulesFormValues = z.infer<typeof learningRulesSchema>;

export const CourseLearningRulesForm = forwardRef<CourseFormRef, CourseFormProps>(
  ({ showSubmitButton, initialValues, editingCourseId, successResponse }, _ref) => {
    const form = useForm<LearningRulesFormValues>({
      resolver: zodResolver(learningRulesSchema),
      defaultValues: {
        learning_rules: {
          prerequisites_required: false,
          drip_schedule_enabled: false,
          completion_rules_enabled: false,
        },
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

    const onSubmit = (data: LearningRulesFormValues) => {
      if (!editingCourseId) return;

      const editBody = {
        course_creator_uuid: authorUuid,
        status: 'draft',
        ...initialValues,
        learning_rules: data?.learning_rules,
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
              setActiveStep(4);
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
    };

    const onError = (errors: any) => {
      toast.error(errors);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className='space-y-6'>
          {/* Course Learning Rules */}
          <div className='border-border space-y-6 rounded-3xl  py-10'>
            {/* Prerequisites */}
            <FormField
              control={form.control}
              name='learning_rules.prerequisites_required'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Prerequisites required</FormLabel>
                    <FormDescription>
                      Learners must complete previous lessons before unlocking the next
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Drip schedule */}
            <FormField
              control={form.control}
              name='learning_rules.drip_schedule_enabled'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Drip schedule enabled</FormLabel>
                    <FormDescription>
                      Lessons unlock after a specified number of days (e.g., Lesson 2 after 7 days)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Completion rules */}
            <FormField
              control={form.control}
              name='learning_rules.completion_rules_enabled'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Completion requirements enforced</FormLabel>
                    <FormDescription>
                      Course completion requires at least 80% content viewed and a final quiz score
                      of 70% or higher
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
                {updateCourse.isPending ? <Spinner /> : 'Save Learning Rules'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

CourseLearningRulesForm.displayName = 'CourseLearningRulesForm';

export default CourseLearningRulesForm;
