'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/context/profile-context';
import { createInstructor } from '@/services/client';
import { zInstructor } from '@/services/client/zod.gen';

const InstructorOnboardingSchema = zInstructor.omit({ 
  uuid: true,
  full_name: true,
  admin_verified: true,
  created_date: true,
  created_by: true,
  updated_date: true,
  updated_by: true,
  formatted_location: true,
  is_profile_complete: true,
  has_location_coordinates: true,
}).extend({
  // Make website optional and allow empty string or valid URL
  website: z.union([
    z.string().url(),
    z.literal(''),
    z.undefined()
  ]).optional(),
  bio: z.string().max(2000).optional(),
  professional_headline: z.string().max(150).optional()
});

type InstructorOnboardingFormData = z.infer<typeof InstructorOnboardingSchema>;

export function InstructorOnboardingForm() {
  const router = useRouter();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InstructorOnboardingFormData>({
    resolver: zodResolver(InstructorOnboardingSchema),
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

  const handleSubmit = async (data: InstructorOnboardingFormData) => {
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    // Ensure user_uuid is set
    if (!data.user_uuid) {
      data.user_uuid = user.uuid;
    }

    // Clean up optional fields - remove empty strings
    const cleanedData = {
      ...data,
      website: data.website === '' ? undefined : data.website,
      bio: data.bio === '' ? undefined : data.bio,
      professional_headline: data.professional_headline === '' ? undefined : data.professional_headline,
    };

    setIsSubmitting(true);
    try {
      const response = await createInstructor({
        body: cleanedData
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
      router.replace('/dashboard/overview');
    } catch (error: any) {
      console.error('Error creating instructor:', error);
      const errorMessage = error?.message || 'Failed to create instructor account. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
          toast.success('Location detected successfully!');
        },
        (error) => {
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
      <div className='mx-auto max-w-2xl p-6'>
        <div className='flex h-64 items-center justify-center'>
          <div className='flex animate-pulse flex-col items-center'>
            <div className='mb-3 h-12 w-12 rounded-full bg-gray-200'></div>
            <div className='h-4 w-32 rounded bg-gray-200'></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user
  if (!user?.uuid) {
    return (
      <div className='mx-auto max-w-2xl p-6'>
        <div className='flex h-64 flex-col items-center justify-center'>
          <div className='mb-4 text-red-600'>
            <BookOpen className='h-16 w-16' />
          </div>
          <h2 className='mb-2 text-xl font-semibold text-gray-900'>Unable to Load Profile</h2>
          <p className='text-gray-600'>Please refresh the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <div className='mb-8 text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
          <BookOpen className='h-8 w-8 text-green-600' />
        </div>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>Instructor Registration</h1>
        <p className='text-gray-600'>Complete your instructor profile to start teaching</p>
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
              <FormField
                control={form.control}
                name='professional_headline'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Headline</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='e.g. Software Engineer & Python Expert'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief title that summarizes your expertise (max 150 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name='bio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <textarea 
                        className='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        placeholder='Tell students about your background, expertise, and teaching philosophy...'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Professional biography describing your expertise and teaching approach (max 2000 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='website'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type='url'
                        placeholder='https://your-portfolio.com'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Professional website or portfolio URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='latitude'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          type='number' 
                          step='any'
                          placeholder='-1.2921'
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='longitude'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          type='number' 
                          step='any'
                          placeholder='36.8219'
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className='flex justify-center'>
                <Button type='button' variant='outline' onClick={handleGetCurrentLocation}>
                  Use Current Location
                </Button>
              </div>

            </CardContent>
          </Card>

          <div className='rounded-lg bg-blue-50 p-4'>
            <h3 className='font-medium text-blue-900'>What&apos;s Next?</h3>
            <p className='mt-1 text-sm text-blue-700'>
              After registration, you can add your education, experience, skills, and professional memberships 
              in your instructor profile to attract more students.
            </p>
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Complete Instructor Registration'}
          </Button>
        </form>
      </Form>
    </div>
  );
}