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
import { useState } from 'react';
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
      user_uuid: user?.uuid || '',
      latitude: undefined,
      longitude: undefined,
      website: '',
      bio: '',
      professional_headline: '',
    },
  });

  const handleSubmit = async (data: InstructorOnboardingFormData) => {
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createInstructor({
        body: data
      });

      // Invalidate instructor-related queries
      await queryClient.invalidateQueries({ queryKey: ['instructors'] });
      await queryClient.invalidateQueries({ queryKey: ['searchInstructors'] });
      
      // Invalidate and refetch user profile to get updated user_domain
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await user.invalidateQuery?.();

      toast.success('Instructor account created successfully!');
      router.replace('/dashboard/overview');
    } catch (error) {
      toast.error('Failed to create instructor account. Please try again.');
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