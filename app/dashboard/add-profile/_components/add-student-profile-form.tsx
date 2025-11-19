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
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/context/profile-context';
import { createStudent } from '@/services/client';
import { zStudent } from '@/services/client/zod.gen';

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

export default function AddStudentProfileForm() {
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

      toast.success('Student profile added successfully!');

      // Set the new domain as active and redirect
      if (user.setActiveDomain) {
        user.setActiveDomain('student');
      }

      // Small delay to allow context to update
      await new Promise(resolve => setTimeout(resolve, 300));
      router.replace('/dashboard/overview');
    } catch (_error) {
      toast.error('Failed to create student profile. Please try again.');
      setIsSubmitting(false);
    }
  };

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
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <GraduationCap className='h-8 w-8' />
        </div>
        <h1 className='text-foreground mb-2 text-3xl font-bold'>Add Student Profile</h1>
        <p className='text-muted-foreground'>
          Set up your student profile - all fields are optional and can be completed later
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>
            Add guardian information if needed. All fields are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
              {/* Primary Guardian */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Primary Guardian (Optional)</h3>

                <FormField
                  control={form.control}
                  name='first_guardian_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter guardian name' {...field} />
                      </FormControl>
                      <FormDescription>Full name of your primary guardian</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='first_guardian_mobile'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder='+254 700 000 000' {...field} />
                      </FormControl>
                      <FormDescription>Mobile number of your primary guardian</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Secondary Guardian */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Secondary Guardian (Optional)</h3>

                <FormField
                  control={form.control}
                  name='second_guardian_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter guardian name' {...field} />
                      </FormControl>
                      <FormDescription>Full name of your secondary guardian</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='second_guardian_mobile'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder='+254 700 000 000' {...field} />
                      </FormControl>
                      <FormDescription>Mobile number of your secondary guardian</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  {isSubmitting ? 'Creating Profile...' : 'Add Student Profile'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
