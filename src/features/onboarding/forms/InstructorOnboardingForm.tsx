'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import { createInstructor } from '@/services/client';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { InstructorLocationFields } from '@/src/features/profile/forms/shared/components/InstructorLocationFields';
import { InstructorProfessionalFields } from '@/src/features/profile/forms/shared/components/InstructorProfessionalFields';
import {
  type InstructorProfileFormData,
  instructorProfileSchema,
  normalizeInstructorProfileData,
} from '@/src/features/profile/forms/shared/instructor-profile';

export function InstructorOnboardingForm() {
  const router = useRouter();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InstructorProfileFormData>({
    resolver: zodResolver(instructorProfileSchema),
    defaultValues: {
      user_uuid: '',
      latitude: undefined,
      longitude: undefined,
      website: '',
      bio: '',
      professional_headline: '',
    },
  });

  // Update user_uuid when user profile loads
  useEffect(() => {
    if (user?.uuid && !form.getValues('user_uuid')) {
      form.setValue('user_uuid', user.uuid);
    }
  }, [user?.uuid, form]);

  const handleSubmit = async (data: InstructorProfileFormData) => {
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    // Ensure user_uuid is set
    if (!data.user_uuid) {
      data.user_uuid = user.uuid;
    }

    // Clean up optional fields - remove empty strings
    const cleanedData = normalizeInstructorProfileData(data);

    setIsSubmitting(true);
    try {
      const response = await createInstructor({
        body: cleanedData,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create instructor account');
      }

      // Invalidate instructor-related queries
      await queryClient.invalidateQueries({ queryKey: ['instructors'] });
      await queryClient.invalidateQueries({ queryKey: ['searchInstructors'] });

      // Invalidate and refetch user profile to get updated user_domain
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user.invalidateQuery) {
        await user.invalidateQuery();
      }

      toast.success('Instructor account created successfully!');
      router.replace(buildDashboardSwitchPath('instructor'));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create instructor account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
          toast.success('Location detected successfully!');
        },
        _error => {
          toast.error('Failed to get current location. Please enter manually.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
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
            <BookOpen className='h-16 w-16' />
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
      <div className='text-center'>
        <div className='bg-primary/10 text-primary ring-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ring-1'>
          <BookOpen className='h-8 w-8' />
        </div>
        <h1 className='text-foreground mb-2 text-3xl font-bold'>Instructor Registration</h1>
        <p className='text-muted-foreground'>Complete your instructor profile to start teaching</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>
                Tell students about your expertise and teaching background
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InstructorProfessionalFields
                form={form}
                professionalHeadlinePlaceholder='e.g. Software Engineer & Python Expert'
                bioDescription='Share your background, expertise, and teaching philosophy. Rich text is supported.'
                websitePlaceholder='https://your-portfolio.com'
                websiteDescription='Professional website or portfolio URL'
              />
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Teaching Location (Optional)</CardTitle>
              <CardDescription>
                Provide your primary teaching location to help students find you
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InstructorLocationFields
                form={form}
                onUseCurrentLocation={handleGetCurrentLocation}
                latitudePlaceholder='-1.2921'
                longitudePlaceholder='36.8219'
                buttonLabel='Use Current Location'
                fieldsWrapperClassName='grid grid-cols-1 gap-4 md:grid-cols-2'
                buttonClassName='mx-auto flex'
              />
            </CardContent>
          </Card>

          <Card className='bg-muted/40'>
            <CardContent className='space-y-1'>
              <h3 className='text-foreground font-medium'>What&apos;s Next?</h3>
              <p className='text-muted-foreground text-sm'>
                After registration, you can add your education, experience, skills, and professional
                memberships in your instructor profile to attract more students.
              </p>
            </CardContent>
          </Card>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner />
                Creating account…
              </>
            ) : (
              'Complete Instructor Registration'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
