'use client';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import { useStudent } from '@/context/student-context';
import { useUserProfile } from '@/context/profile-context';
import {
  getStudentByIdOptions,
  getStudentByIdQueryKey,
  updateStudentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const guardianInfoSchema = z.object({
  first_guardian_name: z.string().optional(),
  first_guardian_mobile: z.string().optional(),
  second_guardian_name: z.string().optional(),
  second_guardian_mobile: z.string().optional(),
});

type GuardianInfoFormValues = z.infer<typeof guardianInfoSchema>;

function CertificationsSettingsContent() {
  const qc = useQueryClient();
  const userProfile = useUserProfile();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  const student = useStudent();
  const updateGuardianInfo = useMutation(updateStudentMutation());
  const { data } = useQuery(getStudentByIdOptions({ path: { uuid: student?.uuid as string } }));
  // @ts-ignore
  const studentInfo = data?.data;

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'guardian-info',
        title: 'Guardian Information',
        url: '/dashboard/profile/guardian-information',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const form = useForm<GuardianInfoFormValues>({
    resolver: zodResolver(guardianInfoSchema),
    defaultValues: {
      first_guardian_mobile: '',
      first_guardian_name: '',
      second_guardian_mobile: '',
      second_guardian_name: '',
    },
  });

  useEffect(() => {
    if (studentInfo) {
      form.reset({
        first_guardian_mobile: studentInfo?.first_guardian_mobile || '',
        first_guardian_name: studentInfo?.first_guardian_name || '',
        second_guardian_mobile: studentInfo?.second_guardian_mobile || '',
        second_guardian_name: studentInfo?.second_guardian_name || '',
      });
    }
  }, [studentInfo, form]);

  const onSubmit = (data: GuardianInfoFormValues) => {
    requestConfirmation({
      title: 'Save guardian information?',
      description: 'These contacts will be used for urgent updates and must stay accurate.',
      confirmLabel: 'Save guardians',
      cancelLabel: 'Keep editing',
      onConfirm: async () => {
        try {
          await updateGuardianInfo.mutateAsync(
            {
              body: {
                ...(data as any),
                user_uuid: student?.user_uuid as string,
                updated_by: student?.user_uuid,
              },
              path: { uuid: student?.uuid as string },
            },
            {
              onSuccess: (response: any) => {
                qc.invalidateQueries({
                  queryKey: getStudentByIdQueryKey({ path: { uuid: student?.uuid as string } }),
                });
                toast.success(response?.message || 'Information updated successfully');
                disableEditing();
              },
              onError: (error: any) => {
                const errorMessage = error?.error
                  ? Object.values(error.error)[0]
                  : error?.message || 'An error occurred';

                toast.error(errorMessage);
              },
            }
          );
        } catch (error) {
          // handled by toast inside mutation callbacks
        }
      },
    });
  };

  const domainBadges =
    userProfile?.user_domain?.map(domain =>
      domain
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  return (
    <ProfileFormShell
      eyebrow='Student'
      title='Guardian information'
      description='Add or update guardian contact details for learners under 18.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ProfileFormSection
            title='Emergency contacts'
            description='We reach out to these contacts for important updates and emergencies.'
            footer={
              <Button
                type='submit'
                className='min-w-32'
                disabled={!isEditing || updateGuardianInfo.isPending || isConfirming}
              >
                {updateGuardianInfo.isPending || isConfirming ? (
                  <span className='flex items-center gap-2'>
                    <Spinner className='h-4 w-4' />
                    Saving…
                  </span>
                ) : (
                  'Save guardians'
                )}
              </Button>
            }
          >
            <div className='grid gap-6 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='first_guardian_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary guardian full name</FormLabel>
                    <FormControl>
                      <Input placeholder='Jane Doe' {...field} />
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
                    <FormLabel>Primary guardian mobile number</FormLabel>
                    <FormControl>
                      <Input placeholder='+254700000000' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='second_guardian_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary guardian full name</FormLabel>
                    <FormControl>
                      <Input placeholder='John Doe' {...field} />
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
                    <FormLabel>Secondary guardian mobile number</FormLabel>
                    <FormControl>
                      <Input placeholder='+254711111111' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ProfileFormSection>
        </form>
      </Form>
    </ProfileFormShell>
  );
}

function CertificationsSettingsSkeleton() {
  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8'>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-24 rounded-full' />
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-72' />
      </div>
      <div className='space-y-4'>
        <Skeleton className='h-52 w-full rounded-xl' />
        <div className='flex justify-end'>
          <Skeleton className='h-10 w-36 rounded-full' />
        </div>
      </div>
    </div>
  );
}

export default function CertificationsSettings() {
  return (
    <Suspense fallback={<CertificationsSettingsSkeleton />}>
      <CertificationsSettingsContent />
    </Suspense>
  );
}
