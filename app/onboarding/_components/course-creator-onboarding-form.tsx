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
import { useUserProfile } from '@/context/profile-context';
import { createCourseCreator } from '@/services/client';
import { zCourseCreator } from '@/services/client/zod.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const CourseCreatorOnboardingSchema = zCourseCreator
  .omit({
    uuid: true,
    admin_verified: true,
    created_date: true,
    created_by: true,
    updated_date: true,
    updated_by: true,
  })
  .extend({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    bio: z.string().max(2000).optional(),
    professional_headline: z.string().max(150).optional(),
    website: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
  });

type CourseCreatorOnboardingFormData = z.infer<typeof CourseCreatorOnboardingSchema>;

export function CourseCreatorOnboardingForm() {
  const router = useRouter();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CourseCreatorOnboardingFormData>({
    resolver: zodResolver(CourseCreatorOnboardingSchema),
    defaultValues: {
      user_uuid: '',
      full_name: '',
      bio: '',
      professional_headline: '',
      website: '',
    },
  });

  // Update user_uuid and full_name when user profile loads
  useEffect(() => {
    if (user?.uuid && !form.getValues('user_uuid')) {
      form.setValue('user_uuid', user.uuid);
    }
    if (user?.name && !form.getValues('full_name')) {
      form.setValue('full_name', user.name);
    }
  }, [user?.uuid, user?.name, form]);

  const handleSubmit = async (data: CourseCreatorOnboardingFormData) => {
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
      professional_headline:
        data.professional_headline === '' ? undefined : data.professional_headline,
    };

    setIsSubmitting(true);
    try {
      const response = await createCourseCreator({
        body: cleanedData,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create course creator account');
      }

      // Invalidate course creator-related queries
      await queryClient.invalidateQueries({ queryKey: ['courseCreators'] });
      await queryClient.invalidateQueries({ queryKey: ['searchCourseCreators'] });

      // Invalidate and refetch user profile to get updated user_domain
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user.invalidateQuery) {
        await user.invalidateQuery();
      }

      toast.success('Course Creator account created successfully!');
      router.replace('/dashboard/overview');
    } catch (error: any) {
      const errorMessage =
        error?.message || 'Failed to create course creator account. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
            <GraduationCap className='h-16 w-16' />
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
      <div className='mb-8 text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
          <GraduationCap className='h-8 w-8 text-blue-600' />
        </div>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>Course Creator Registration</h1>
        <p className='text-gray-600'>Complete your profile to start creating courses</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                This information will be displayed on your creator profile
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='full_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter your full name' {...field} />
                    </FormControl>
                    <FormDescription>Your complete name as course creator</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='professional_headline'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Headline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Expert Course Creator & Educational Content Designer'
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
                        className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                        placeholder='Tell learners about your background, expertise, and course creation philosophy...'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Professional biography describing your expertise and content creation approach
                      (max 2000 characters)
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
                      <Input type='url' placeholder='https://your-portfolio.com' {...field} />
                    </FormControl>
                    <FormDescription>Professional website or portfolio URL</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className='rounded-lg bg-blue-50 p-4'>
            <h3 className='font-medium text-blue-900'>What&apos;s Next?</h3>
            <p className='mt-1 text-sm text-blue-700'>
              After registration, your account will need to be verified by an administrator before
              you can start creating and publishing courses. You&apos;ll receive a notification once
              your account is verified.
            </p>
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Complete Course Creator Registration'}
          </Button>
        </form>
      </Form>
    </div>
  );
}