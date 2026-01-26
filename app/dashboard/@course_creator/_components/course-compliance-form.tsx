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
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useInstructor } from '@/context/instructor-context';
import {
  getCourseByUuidQueryKey,
  updateCourseMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { forwardRef, useState } from 'react';
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

export const complianceSchema = z.object({
  compliance: z
    .object({
      copyright_confirmed: z.boolean().default(false),
      accessibility_captions: z.boolean().default(false),
      certificate_enabled: z.boolean().default(false),
    })
    .default({
      copyright_confirmed: false,
      accessibility_captions: false,
      certificate_enabled: false,
    }),
});

type ComplianceFormValues = z.infer<typeof complianceSchema>;

export const CourseComplianceForm = forwardRef<CourseFormRef, CourseFormProps>(
  ({ showSubmitButton, initialValues, editingCourseId, successResponse }, _ref) => {
    const form = useForm<ComplianceFormValues>({
      resolver: zodResolver(complianceSchema),
      defaultValues: {
        compliance: {
          copyright_confirmed: false,
          accessibility_captions: false,
          certificate_enabled: false,
        },
        ...initialValues,
      },
      mode: 'onChange',
    });

    const queryClient = useQueryClient();
    const instructor = useInstructor();
    const courseCreatorContext = useOptionalCourseCreator();
    const courseCreatorProfile = courseCreatorContext?.profile;
    const authorUuid = courseCreatorProfile?.uuid ?? instructor?.uuid ?? '';
    const [showSuccessUI, setShowSuccessUI] = useState(false);

    const updateCourse = useMutation(updateCourseMutation());

    const onSubmit = (data: ComplianceFormValues) => {
      if (!editingCourseId) return;

      if (editingCourseId) {
        const editBody = {
          course_creator_uuid: authorUuid,
          status: 'draft',
          ...initialValues,
          compliance: data?.compliance,
        };

        updateCourse.mutate(
          { body: editBody as any, path: { uuid: editingCourseId as string } },
          {
            onSuccess(data, _variables, _context) {
              const respObj = data?.data;
              const errorObj = data?.error;

              if (respObj) {
                toast.success(data?.message || 'Course updated successfully');

                queryClient.invalidateQueries({
                  queryKey: getCourseByUuidQueryKey({ path: { uuid: editingCourseId as string } }),
                });

                setShowSuccessUI(true);

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

    const onError = (errors: any) => {
      toast.error(errors);
    };

    return (
      <Form {...form}>
        {showSuccessUI && (
          <div className='border-border bg-background flex flex-col items-center justify-center space-y-6 rounded-3xl border px-6 py-16 text-center'>
            <CheckCircle className='h-14 w-14 text-green-500' />

            <div className='space-y-2'>
              <h2 className='text-2xl font-semibold'>Your course is ready 🎉</h2>
              <p className='text-muted-foreground max-w-md'>
                You’ve completed all required steps. You can now preview your course and publish it
                when you’re ready.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit, onError)} className='space-y-6'>
          <div className='border-border space-y-6 rounded-3xl border-1 px-6 py-10'>
            <FormField
              control={form.control}
              name='compliance.copyright_confirmed'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
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
              name='compliance.accessibility_captions'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
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
              name='compliance.certificate_enabled'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
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
