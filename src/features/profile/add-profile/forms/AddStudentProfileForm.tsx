'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { getErrorMessage } from '@/lib/error-utils';
import { createStudent } from '@/services/client';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { StudentGuardianFields } from '@/src/features/profile/forms/shared/components/StudentGuardianFields';
import {
  type StudentProfileFormData,
  studentProfileSchema,
} from '@/src/features/profile/forms/shared/student-profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function AddStudentProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserProfile();
  const userDomain = useUserDomain();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = searchParams.get('next');
  const returnPath =
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null;

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

    const payload = {
      ...data,
      user_uuid: data.user_uuid || user.uuid,
    };

    setIsSubmitting(true);
    try {
      const response = await createStudent({
        body: payload,
      });

      if (response.error) {
        throw response.error;
      }

      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['searchStudents'] });

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await user.invalidateQuery?.();

      toast.success('Student profile added successfully!');

      userDomain.setActiveDomain('student');
      router.replace(buildDashboardSwitchPath('student', returnPath || undefined));
    } catch (error) {
      // @ts-ignore
      toast.error(error?.message)
      toast.error(getErrorMessage(error, 'Failed to create student profile. Please try again.'));
    } finally {
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
        <div className='bg-primary/10 text-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
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
              <StudentGuardianFields form={form} variant='add-profile' />

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
