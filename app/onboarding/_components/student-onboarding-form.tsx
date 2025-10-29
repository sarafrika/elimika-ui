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
import { createStudent } from '@/services/client';
import { zStudent } from '@/services/client/zod.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const StudentOnboardingSchema = zStudent
  .omit({
    uuid: true,
    created_date: true,
    created_by: true,
    updated_date: true,
    updated_by: true,
    secondaryGuardianContact: true,
    primaryGuardianContact: true,
    allGuardianContacts: true,
  })
  .extend({
    // Override phone number validation to allow empty strings
    first_guardian_mobile: z.string().max(20).optional(),
    second_guardian_mobile: z.string().max(20).optional(),
  });

type StudentOnboardingFormData = z.infer<typeof StudentOnboardingSchema>;

export function StudentOnboardingForm() {
  const router = useRouter();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StudentOnboardingFormData>({
    resolver: zodResolver(StudentOnboardingSchema),
    defaultValues: {
      user_uuid: user?.uuid || '',
      first_guardian_name: '',
      first_guardian_mobile: '',
      second_guardian_name: '',
      second_guardian_mobile: '',
    },
  });

  const handleSubmit = async (data: StudentOnboardingFormData) => {
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStudent({
        body: data,
      });

      // Invalidate student-related queries
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['searchStudents'] });

      // Invalidate and refetch user profile to get updated user_domain
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await user.invalidateQuery?.();

      toast.success('Student account created successfully!');
    } catch (error) {
      toast.error('Failed to create student account. Please try again.');
      setIsSubmitting(false);
    } finally {
      router.replace('/dashboard/overview');
    }
  };

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <div className='mb-8 text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
          <GraduationCap className='h-8 w-8 text-blue-600' />
        </div>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>Student Registration</h1>
        <p className='text-gray-600'>
          Set up your student profile - all fields are optional and can be completed later
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
              <CardDescription>
                Primary guardian/parent details for emergency contact (all fields optional)
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='first_guardian_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Guardian Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='John Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='first_guardian_mobile'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Guardian Mobile (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Phone number (optional)' {...field} />
                    </FormControl>
                    <FormDescription>Phone number (any format accepted)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='second_guardian_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Guardian Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Jane Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='second_guardian_mobile'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Guardian Mobile (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Phone number (optional)' {...field} />
                    </FormControl>
                    <FormDescription>Phone number (any format accepted)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className='rounded-lg bg-blue-50 p-4'>
            <h3 className='font-medium text-blue-900'>Optional Setup</h3>
            <p className='mt-1 text-sm text-blue-700'>
              You can complete this form now or skip it and add guardian information later in your
              profile settings. All fields are optional and can be updated anytime.
            </p>
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Student Account'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
