'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { UserInfoCard } from '@/src/features/profile/forms/shared/components/UserInfoCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import {
  createStudent,
  getCurrentUser,
  type UpdateUserData,
  type User,
  updateUser,
} from '@/services/client';
import { useRefreshSessionIdentity } from '@/src/features/auth/use-refresh-session-identity';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { StudentGuardianFields } from '@/src/features/profile/forms/shared/components/StudentGuardianFields';
import {
  type StudentProfileFormData,
  studentProfileSchema,
} from '@/src/features/profile/forms/shared/student-profile';

export function StudentOnboardingForm() {
  const router = useRouter();
  const refreshSessionIdentity = useRefreshSessionIdentity();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The student age gate needs a date of birth; Keycloak sign-up does not always collect one.
  // Read it from /users/me: the profile context fills a missing date of birth with today.
  const { data: account } = useQuery({
    queryKey: ['onboarding', 'raw-current-user'],
    // Raw JSON: the generated transformer turns a null date of birth into 1970-01-01.
    queryFn: async () => {
      const response = await getCurrentUser({ responseTransformer: undefined });
      return (response.data?.data ?? null) as User | null;
    },
    retry: false,
  });
  const needsDob = Boolean(account) && !account?.dob;
  const [dob, setDob] = useState('');
  const today = new Date().toISOString().slice(0, 10);

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

  // The profile can load after mount (e.g. a reload); an empty user_uuid fails validation silently.
  useEffect(() => {
    if (user?.uuid && !form.getValues('user_uuid')) {
      form.setValue('user_uuid', user.uuid);
    }
  }, [user?.uuid, form]);

  const handleSubmit = async (data: StudentProfileFormData) => {
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    if (needsDob && !dob) {
      toast.error('Enter your date of birth to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (needsDob) {
        // PUT replaces every field, so send the current record with the new date of birth.
        const body = {
          first_name: account?.first_name,
          middle_name: account?.middle_name,
          last_name: account?.last_name,
          email: account?.email,
          username: account?.username,
          phone_number: account?.phone_number,
          active: account?.active ?? true,
          gender: account?.gender,
          dob,
        } as unknown as UpdateUserData['body'];
        const userResponse = await updateUser({ path: { uuid: user.uuid }, body });
        if (userResponse.error) {
          throw userResponse.error;
        }
      }

      const response = await createStudent({
        body: data,
      });

      if (response.error) {
        throw response.error;
      }

      // Invalidate student-related queries
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['searchStudents'] });

      // Invalidate and refetch user profile to get updated user_domain
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await user.invalidateQuery?.();

      toast.success('Student account created successfully!');
      await refreshSessionIdentity();
      router.replace(buildDashboardSwitchPath('student'));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create student account. Please try again.'));
      setIsSubmitting(false);
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
          <UserInfoCard user={user} />

          {needsDob && (
            <Card>
              <CardHeader>
                <CardTitle>Date of birth</CardTitle>
                <CardDescription>
                  Required so we can apply the right age rules to your account.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                <Label htmlFor='student-dob'>Date of birth</Label>
                <Input
                  id='student-dob'
                  type='date'
                  max={today}
                  required
                  value={dob}
                  onChange={event => setDob(event.target.value)}
                />
              </CardContent>
            </Card>
          )}

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
            {isSubmitting ? (
              <>
                <Spinner />
                Creating account…
              </>
            ) : (
              'Create Student Account'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
