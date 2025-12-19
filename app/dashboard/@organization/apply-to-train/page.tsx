'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getCourseByUuidOptions,
  submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { ApplicantTypeEnum } from '@/services/client/types.gen';
import { useOrganisation } from '@/context/organisation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  Send,
} from 'lucide-react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { toast } from 'sonner';

const applicationSchema = z.object({
  private_online_rate: z.coerce.number().min(0, 'Rate must be positive'),
  private_inperson_rate: z.coerce.number().min(0, 'Rate must be positive'),
  group_online_rate: z.coerce.number().min(0, 'Rate must be positive'),
  group_inperson_rate: z.coerce.number().min(0, 'Rate must be positive'),
  currency: z.string().default('USD'),
  application_notes: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function ApplyToTrainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseUuid = searchParams.get('courseId');
  const organisation = useOrganisation();
  const { difficultyMap } = useDifficultyLevels();
  const [submitting, setSubmitting] = useState(false);

  // Fetch course details
  const { data: courseData, isLoading: loadingCourse } = useQuery({
    ...getCourseByUuidOptions({
      path: { uuid: courseUuid as string },
    }),
    enabled: !!courseUuid,
  });
  const course = courseData?.data;

  const submitMutation = useMutation(submitTrainingApplicationMutation());

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      private_online_rate: 0,
      private_inperson_rate: 0,
      group_online_rate: 0,
      group_inperson_rate: 0,
      currency: 'USD',
      application_notes: '',
    },
  });

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!courseUuid || !organisation?.uuid) {
      toast.error('Missing required information');
      return;
    }

    setSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        path: { courseUuid },
        body: {
          applicant_type: ApplicantTypeEnum.ORGANISATION,
          applicant_uuid: organisation.uuid,
          rate_card: {
            currency: values.currency,
            private_online_rate: values.private_online_rate,
            private_inperson_rate: values.private_inperson_rate,
            group_online_rate: values.group_online_rate,
            group_inperson_rate: values.group_inperson_rate,
          },
          application_notes: values.application_notes,
        },
      });

      toast.success('Application submitted successfully!');
      router.push('/dashboard/my-applications');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!courseUuid) {
    return (
      <div className='mx-auto max-w-4xl p-6'>
        <Alert variant='destructive'>
          <AlertTitle>No Course Selected</AlertTitle>
          <AlertDescription>
            Please select a course to apply for training from the courses catalog.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loadingCourse) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!course) {
    return (
      <div className='mx-auto max-w-4xl p-6'>
        <Alert variant='destructive'>
          <AlertTitle>Course Not Found</AlertTitle>
          <AlertDescription>The selected course could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-start gap-4'>
        <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg border'>
          <FileText className='text-primary h-6 w-6' />
        </div>
        <div className='flex-1'>
          <h1 className='text-2xl font-bold'>Apply to Train Course</h1>
          <p className='text-muted-foreground'>
            Submit your organization's training application for this course
          </p>
        </div>
      </div>

      {/* Course Information */}
      <Card className='border-primary/20 bg-primary/5'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BookOpen className='h-5 w-5' />
            Course Details
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <h3 className='text-xl font-semibold'>{course.name}</h3>
            <div className='text-muted-foreground mt-2 text-sm'>
              <RichTextRenderer htmlString={course.description || ''} maxChars={200} />
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {course.category_names?.map((category: string, index: number) => (
              <Badge key={index} variant='outline'>
                {category}
              </Badge>
            ))}
            {difficultyMap && course.difficulty_uuid && (
              <Badge variant='secondary'>{difficultyMap[course.difficulty_uuid]}</Badge>
            )}
            {course.total_duration_display && (
              <Badge variant='outline'>
                <Calendar className='mr-1 h-3 w-3' />
                {course.total_duration_display}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5' />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <span className='text-muted-foreground text-sm'>Organization Name</span>
              <p className='font-medium'>{organisation?.name || 'Not available'}</p>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Registration Number</span>
              <p className='font-medium'>{organisation?.registration_number || 'Not available'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Rate Card */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <DollarSign className='h-5 w-5' />
                Training Rate Card
              </CardTitle>
              <p className='text-muted-foreground text-sm'>
                Provide your hourly rates for different training formats. All rates are per learner
                per hour.
              </p>
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                control={form.control}
                name='currency'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder='USD' {...field} className='max-w-xs' />
                    </FormControl>
                    <FormDescription>ISO currency code (e.g., USD, EUR, GBP)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className='space-y-4'>
                <h4 className='font-semibold'>Private Session Rates (1:1)</h4>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='private_online_rate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Online Rate</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' placeholder='0.00' {...field} />
                        </FormControl>
                        <FormDescription>Per learner, per hour (online)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='private_inperson_rate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>In-Person Rate</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' placeholder='0.00' {...field} />
                        </FormControl>
                        <FormDescription>Per learner, per hour (in-person)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <h4 className='font-semibold'>Group Session Rates</h4>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='group_online_rate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Online Rate</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' placeholder='0.00' {...field} />
                        </FormControl>
                        <FormDescription>Per learner, per hour (online)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='group_inperson_rate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>In-Person Rate</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' placeholder='0.00' {...field} />
                        </FormControl>
                        <FormDescription>Per learner, per hour (in-person)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes (Optional)</CardTitle>
              <p className='text-muted-foreground text-sm'>
                Provide any additional information to support your application
              </p>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name='application_notes'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder='Share relevant experience, resources, or any other information that would help evaluate your application...'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert>
            <CheckCircle2 className='h-4 w-4' />
            <AlertTitle>Before You Submit</AlertTitle>
            <AlertDescription>
              <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                <li>Review all rate information for accuracy</li>
                <li>Ensure your organization details are up to date</li>
                <li>Your application will be reviewed by the course creator</li>
                <li>You will be notified via email once a decision is made</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <div className='flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className='mr-2 h-4 w-4' />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
