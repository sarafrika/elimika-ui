'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/error-utils';
import { createInstructor } from '@/services/client';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { InstructorLocationFields } from '@/src/features/profile/forms/shared/components/InstructorLocationFields';
import { InstructorProfessionalFields } from '@/src/features/profile/forms/shared/components/InstructorProfessionalFields';
import {
  type InstructorProfileFormData,
  instructorProfileSchema,
  normalizeInstructorProfileData,
} from '@/src/features/profile/forms/shared/instructor-profile';

export default function AddInstructorProfileForm() {
  const router = useRouter();
  const user = useUserProfile();
  const userDomain = useUserDomain();
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

    if (!data.user_uuid) {
      data.user_uuid = user.uuid;
    }

    const cleanedData = normalizeInstructorProfileData(data);

    setIsSubmitting(true);
    try {
      const response = await createInstructor({
        body: cleanedData,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create instructor profile');
      }

      await queryClient.invalidateQueries({ queryKey: ['instructors'] });
      await queryClient.invalidateQueries({ queryKey: ['searchInstructors'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      if (user.invalidateQuery) {
        await user.invalidateQuery();
      }

      toast.success('Instructor profile added successfully!');

      userDomain.setActiveDomain('instructor');
      router.replace(buildDashboardSwitchPath('instructor'));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create instructor profile. Please try again.'));
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

  if (user?.isLoading) {
    return (
      <div className='mx-auto max-w-2xl space-y-4 p-6'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-8 w-56' />
        <div className='border-border/60 bg-card/70 space-y-3 rounded-3xl border p-6 shadow-sm'>
          <Skeleton className='h-5 w-1/2' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-2/3' />
        </div>
      </div>
    );
  }

  if (!user?.uuid) {
    return (
      <div className='mx-auto max-w-2xl p-6'>
        <div className='flex h-64 flex-col items-center justify-center'>
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
    <div className='mx-auto max-w-2xl p-6'>
      <div className='mb-6'>
        <Button
          onClick={() => router.push('/dashboard/add-profile')}
          variant='outline'
          className='gap-2'
        >
          <ArrowLeft className='h-4 w-4' />
          Back
        </Button>
      </div>

      <div className='mb-8 text-center'>
        <div className='bg-success/15 text-success mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
          <BookOpen className='h-8 w-8' />
        </div>
        <h1 className='text-foreground mb-2 text-3xl font-bold'>Add Instructor Profile</h1>
        <p className='text-muted-foreground'>Complete your instructor profile to start teaching</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
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
                professionalHeadlinePlaceholder='e.g., Experienced Software Development Instructor'
                bioDescription='Share your experience and teaching philosophy. Formatting and media supported.'
                websitePlaceholder='https://yourwebsite.com'
                websiteDescription='Your personal or professional website'
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location (Optional)</CardTitle>
              <CardDescription>
                Add your location to help students find local instructors
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InstructorLocationFields
                form={form}
                onUseCurrentLocation={handleGetCurrentLocation}
                latitudePlaceholder='e.g., -1.286389'
                longitudePlaceholder='e.g., 36.817223'
                buttonLabel='Detect Current Location'
                buttonClassName='w-full'
                buttonIcon={MapPin}
                fieldsWrapperClassName='flex gap-4'
                fieldItemClassName='flex-1'
              />
            </CardContent>
          </Card>

          <div className='flex gap-4 pt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/dashboard/add-profile')}
              className='flex-1'
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' className='flex-1' disabled={isSubmitting}>
              {isSubmitting ? 'Creating Profile...' : 'Add Instructor Profile'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
