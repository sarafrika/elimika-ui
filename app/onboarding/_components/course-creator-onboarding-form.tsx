'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
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
    // Construct full name from first_name and last_name
    if (user?.first_name && user?.last_name && !form.getValues('full_name')) {
      const fullName =
        `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ''} ${user.last_name}`.trim();
      form.setValue('full_name', fullName);
    }
  }, [user?.uuid, user?.first_name, user?.middle_name, user?.last_name, form]);

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
      <div className='mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur-sm'>
        <div className='flex h-64 items-center justify-center'>
          <div className='flex animate-pulse flex-col items-center gap-3'>
            <div className='h-12 w-12 rounded-full bg-muted' />
            <div className='h-4 w-32 rounded bg-muted' />
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user
  if (!user?.uuid) {
    return (
      <div className='mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur-sm'>
        <div className='flex h-64 flex-col items-center justify-center text-center'>
          <div className='mb-4 text-destructive'>
            <GraduationCap className='h-16 w-16' />
          </div>
          <h2 className='mb-2 text-xl font-semibold text-foreground'>Unable to Load Profile</h2>
          <p className='text-muted-foreground'>
            Please refresh the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-3xl space-y-8 rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur-sm'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20'>
          <GraduationCap className='h-8 w-8' />
        </div>
        <h1 className='mb-2 text-3xl font-bold text-foreground'>Course Creator Registration</h1>
        <p className='text-muted-foreground'>Complete your profile to start creating courses</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* User Information (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>
                This information is from your user profile and cannot be changed here
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <FormLabel className='text-muted-foreground'>Full Name</FormLabel>
                  <div className='bg-muted mt-2 rounded-md border px-3 py-2 text-sm'>
                    {user?.first_name} {user?.middle_name} {user?.last_name}
                  </div>
                </div>
                <div>
                  <FormLabel className='text-muted-foreground'>Email</FormLabel>
                  <div className='bg-muted mt-2 rounded-md border px-3 py-2 text-sm'>
                    {user?.email}
                  </div>
                </div>
                <div>
                  <FormLabel className='text-muted-foreground'>Username</FormLabel>
                  <div className='bg-muted mt-2 rounded-md border px-3 py-2 text-sm'>
                    {user?.username}
                  </div>
                </div>
                <div>
                  <FormLabel className='text-muted-foreground'>Phone Number</FormLabel>
                  <div className='bg-muted mt-2 rounded-md border px-3 py-2 text-sm'>
                    {user?.phone_number}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Creator Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Course Creator Profile</CardTitle>
              <CardDescription>
                Complete your course creator profile to start creating courses
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Hidden field for full_name */}
              <FormField
                control={form.control}
                name='full_name'
                render={({ field }) => (
                  <FormItem className='hidden'>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
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
                      <SimpleEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        showToolbar
                        isEditable
                      />
                    </FormControl>
                    <FormDescription>
                      Share your background, expertise, and course creation philosophy. Rich text is
                      supported.
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

          <Card className='bg-muted/40'>
            <CardContent className='space-y-1'>
              <h3 className='font-medium text-foreground'>What&apos;s Next?</h3>
              <p className='text-sm text-muted-foreground'>
                After registration, your account will need to be verified by an administrator before
                you can start creating and publishing courses. You&apos;ll receive a notification
                once your account is verified.
              </p>
            </CardContent>
          </Card>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Complete Course Creator Registration'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
