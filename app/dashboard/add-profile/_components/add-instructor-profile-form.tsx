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
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '@/context/profile-context';
import { createInstructor } from '@/services/client';
import { zInstructor } from '@/services/client/zod.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const InstructorOnboardingSchema = zInstructor
  .omit({
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
  })
  .extend({
    website: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
    bio: z.string().max(2000).optional(),
    professional_headline: z.string().max(150).optional(),
  });

type InstructorOnboardingFormData = z.infer<typeof InstructorOnboardingSchema>;

export default function AddInstructorProfileForm() {
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

    if (!data.user_uuid) {
      data.user_uuid = user.uuid;
    }

    const cleanedData = {
      ...data,
      website: data.website === '' ? undefined : data.website,
      bio: data.bio === '' ? undefined : data.bio,
      professional_headline:
        data.professional_headline === '' ? undefined : data.professional_headline,
    };

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

      if (user.setActiveDomain) {
        user.setActiveDomain('instructor');
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      router.replace('/dashboard/overview');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create instructor profile. Please try again.';
      toast.error(errorMessage);
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
        error => {
          toast.error('Failed to get current location. Please enter manually.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

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

  if (!user?.uuid) {
    return (
      <div className='mx-auto max-w-2xl p-6'>
        <div className='flex h-64 flex-col items-center justify-center'>
          <div className='mb-4 text-red-600'>
            <BookOpen className='h-16 w-16' />
          </div>
          <h2 className='mb-2 text-xl font-semibold text-gray-900'>Unable to Load Profile</h2>
          <p className='text-gray-600'>
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
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
          <BookOpen className='h-8 w-8 text-green-600' />
        </div>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>Add Instructor Profile</h1>
        <p className='text-gray-600'>Complete your instructor profile to start teaching</p>
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
              <FormField
                control={form.control}
                name='professional_headline'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Headline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., Experienced Software Development Instructor'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief professional headline (max 150 characters)
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
                      <Textarea
                        placeholder='Tell students about your teaching experience, expertise, and approach...'
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe your background and teaching philosophy (max 2000 characters)
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
                        placeholder='https://yourwebsite.com'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Your personal or professional website</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
              <div className='flex gap-4'>
                <FormField
                  control={form.control}
                  name='latitude'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='any'
                          placeholder='e.g., -1.286389'
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
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
                    <FormItem className='flex-1'>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='any'
                          placeholder='e.g., 36.817223'
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type='button'
                variant='outline'
                onClick={handleGetCurrentLocation}
                className='w-full'
              >
                <MapPin className='mr-2 h-4 w-4' />
                Detect Current Location
              </Button>
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