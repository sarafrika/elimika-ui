'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { createStudent } from '@/services/client';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { StudentGuardianFields } from '@/src/features/profile/forms/shared/components/StudentGuardianFields';
import {
  type StudentProfileFormData,
  studentProfileSchema,
} from '@/src/features/profile/forms/shared/student-profile';

export function StudentOnboardingForm() {
  const router = useRouter();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      user_uuid: user?.uuid || '',
      first_guardian_name: '',
      first_guardian_mobile: '',
      second_guardian_name: '',
      second_guardian_mobile: '',
    },
  });

  const handleSubmit = async (data: StudentProfileFormData) => {
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
    } catch (_error) {
      toast.error('Failed to create student account. Please try again.');
      setIsSubmitting(false);
    } finally {
      router.replace('/dashboard/overview');
    }
  };

  return (
    <div className='border-border/60 bg-card/80 mx-auto max-w-3xl space-y-8 rounded-3xl border p-8 shadow-sm backdrop-blur-sm'>
      <div className='text-center'>
        <div className='bg-primary/10 text-primary ring-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ring-1'>
          <GraduationCap className='h-8 w-8' />
        </div>
        <h1 className='text-foreground mb-2 text-3xl font-bold'>Student Registration</h1>
        <p className='text-muted-foreground'>
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
              <StudentGuardianFields form={form} variant='onboarding' />
            </CardContent>
          </Card>

          <Card className='bg-muted/40'>
            <CardContent className='space-y-1'>
              <h3 className='text-foreground font-medium'>Optional Setup</h3>
              <p className='text-muted-foreground text-sm'>
                You can complete this form now or skip it and add guardian information later in your
                profile settings. All fields are optional and can be updated anytime.
              </p>
            </CardContent>
          </Card>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Student Account'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
