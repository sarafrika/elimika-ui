'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { getErrorMessage } from '@/lib/error-utils';
import { createCourseCreator, updateCourseCreator } from '@/services/client';
import { useRefreshSessionIdentity } from '@/src/features/auth/use-refresh-session-identity';
import { ApplicationSubmissionDate } from '@/src/features/onboarding/components/ApplicationSubmissionDate';
import { useApplicationDraft } from '@/src/features/onboarding/hooks/use-application-draft';
import { acceptedProfileUuid } from '@/src/features/onboarding/lib/application-draft';
import { routeAfterDomainOnboarding } from '@/src/features/onboarding/lib/after-domain-onboarding';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { CourseCreatorProfileFields } from '@/src/features/profile/forms/shared/components/CourseCreatorProfileFields';
import { UserInfoCard } from '@/src/features/profile/forms/shared/components/UserInfoCard';
import {
  buildCourseCreatorFullName,
  type CourseCreatorProfileFormData,
  courseCreatorProfileSchema,
  normalizeCourseCreatorProfileData,
} from '@/src/features/profile/forms/shared/course-creator-profile';

export function CourseCreatorOnboardingForm() {
  const router = useRouter();
  const refreshSessionIdentity = useRefreshSessionIdentity();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CourseCreatorProfileFormData>({
    resolver: zodResolver(courseCreatorProfileSchema),
    defaultValues: {
      user_uuid: '',
      full_name: '',
      bio: '',
      professional_headline: '',
      website: '',
    },
  });

  const application = useApplicationDraft({
    userUuid: user?.uuid,
    role: 'course-creator',
    form,
    schema: courseCreatorProfileSchema,
  });

  // Update user_uuid and full_name when user profile loads
  useEffect(() => {
    if (user?.uuid && !form.getValues('user_uuid')) {
      form.setValue('user_uuid', user.uuid);
    }
    // Construct full name from first_name and last_name
    if (user?.first_name && user?.last_name && !form.getValues('full_name')) {
      const fullName = buildCourseCreatorFullName(user);
      form.setValue('full_name', fullName);
    }
  }, [user?.uuid, user?.first_name, user?.middle_name, user?.last_name, form]);

  const handleSubmit = async (data: CourseCreatorProfileFormData) => {
    if (application.isLoading || application.isError) {
      toast.error('Please wait for your saved application to load, or refresh to try again.');
      return;
    }
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    // Ensure user_uuid is set
    if (!data.user_uuid) {
      data.user_uuid = user.uuid;
    }

    // Clean up optional fields - remove empty strings
    const cleanedData = normalizeCourseCreatorProfileData(data);

    setIsSubmitting(true);
    try {
      const response = application.profileUuid
        ? await updateCourseCreator({ path: { uuid: application.profileUuid }, body: cleanedData })
        : await createCourseCreator({ body: cleanedData });
      const profileUuid = acceptedProfileUuid(response);
      application.save(data, profileUuid);

      // Invalidate course creator-related queries
      await queryClient.invalidateQueries({ queryKey: ['courseCreators'] });
      await queryClient.invalidateQueries({ queryKey: ['searchCourseCreators'] });

      // Invalidate and refetch user profile to get updated user_domain
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user.invalidateQuery) {
        await user.invalidateQuery();
      }

      await refreshSessionIdentity();
      await routeAfterDomainOnboarding('course_creator', 'Course Creator', path =>
        router.replace(path)
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'Failed to create course creator account. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while user profile is loading
  if (user?.isLoading) {
    return (
      <div className='border-border/60 bg-card/80 mx-auto max-w-3xl rounded-3xl border p-8 shadow-sm backdrop-blur-sm'>
        <div className='flex h-64 items-center justify-center'>
          <div className='flex animate-pulse flex-col items-center gap-3'>
            <div className='bg-muted h-12 w-12 rounded-full' />
            <div className='bg-muted h-4 w-32 rounded' />
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user
  if (!user?.uuid) {
    return (
      <div className='border-border/60 bg-card/80 mx-auto max-w-3xl rounded-3xl border p-8 shadow-sm backdrop-blur-sm'>
        <div className='flex h-64 flex-col items-center justify-center text-center'>
          <div className='text-destructive mb-4'>
            <GraduationCap className='h-16 w-16' />
          </div>
          <h2 className='text-foreground mb-2 text-xl font-semibold'>Unable to Load Profile</h2>
          <p className='text-muted-foreground'>
            Please refresh the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='border-border/60 bg-card/80 mx-auto max-w-3xl space-y-8 rounded-3xl border p-8 shadow-sm backdrop-blur-sm'>
      <ApplicationSubmissionDate
        submittedAt={application.submittedAt}
        isLoading={application.isLoading}
        isError={application.isError}
      />
      <div className='text-center'>
        <div className='bg-primary/10 text-primary ring-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ring-1'>
          <GraduationCap className='h-8 w-8' />
        </div>
        <h1 className='text-foreground mb-2 text-3xl font-bold'>Course Creator Registration</h1>
        <p className='text-muted-foreground'>Complete your profile to start creating courses</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          <UserInfoCard user={user} />

          {/* Course Creator Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Course Creator Profile</CardTitle>
              <CardDescription>
                Complete your course creator profile to start creating courses
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <CourseCreatorProfileFields
                form={form}
                professionalHeadlinePlaceholder='e.g. Expert Course Creator & Educational Content Designer'
                bioDescription='Share your background, expertise, and course creation philosophy. Rich text is supported.'
                websitePlaceholder='https://your-portfolio.com'
                websiteDescription='Professional website or portfolio URL'
              />
            </CardContent>
          </Card>

          <Card className='bg-muted/40'>
            <CardContent className='space-y-1'>
              <h3 className='text-foreground font-medium'>What&apos;s Next?</h3>
              <p className='text-muted-foreground text-sm'>
                After registration, your account will need to be verified by an administrator before
                you can start creating and publishing courses. You&apos;ll receive a notification
                once your account is verified.
              </p>
            </CardContent>
          </Card>

          <Button
            type='submit'
            className='w-full'
            disabled={isSubmitting || application.isLoading || application.isError}
          >
            {isSubmitting ? 'Creating Account...' : 'Complete Course Creator Registration'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
