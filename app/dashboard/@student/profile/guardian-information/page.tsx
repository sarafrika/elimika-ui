'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import { getStudentByIdOptions, getStudentByIdQueryKey, updateStudentMutation } from '@/services/client/@tanstack/react-query.gen';
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
  const qc = useQueryClient()
  const { replaceBreadcrumbs } = useBreadcrumb();

  const student = useStudent()
  const updateGuardianInfo = useMutation(updateStudentMutation())
  const { data } = useQuery(getStudentByIdOptions({ path: { uuid: student?.uuid as string } }))
  // @ts-ignore
  const studentInfo = data?.data

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
      second_guardian_name: ''
    },
  });

  useEffect(() => {
    if (studentInfo) {
      form.reset({
        first_guardian_mobile: studentInfo?.first_guardian_mobile || '',
        first_guardian_name: studentInfo?.first_guardian_name || '',
        second_guardian_mobile: studentInfo?.second_guardian_mobile || '',
        second_guardian_name: studentInfo?.second_guardian_name || ''
      });
    }
  }, [studentInfo, form]);


  const onSubmit = async (data: GuardianInfoFormValues) => {
    updateGuardianInfo.mutate({
      body:
      {
        ...data as any,
        user_uuid: student?.user_uuid as string,
        updated_by: student?.user_uuid
      },
      path: { uuid: student?.uuid as string }
    }, {
      onSuccess: (data: any) => {
        qc.invalidateQueries({ queryKey: getStudentByIdQueryKey({ path: { uuid: student?.uuid as string } }) })
        toast.success(data?.message || "Information updated successfully")
      },
      onError: (error: any, data) => {
        const errorMessage =
          error?.error
            ? Object.values(error.error)[0]
            : error?.message || "An error occurred";

        toast.error(errorMessage);
      }
    })

  };

  return (
    <div className='space-y-6 w-full sm:max-w-3/4'>
      <div>
        <h1 className='text-2xl font-semibold'>Guardian Information</h1>
        <p className='text-muted-foreground text-sm'>
          Add guardian contact details for students under 18.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
              <CardDescription>
                Add guardian details for students under 18.
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4'>
              <div className='flex w-full gap-10'>
                <FormField
                  control={form.control}
                  name='first_guardian_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>First Guardian Fullname</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='first_guardian_mobile'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>First Guardian Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex w-full gap-10'>
                <FormField
                  control={form.control}
                  name='second_guardian_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Second Guardian Fullname</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='second_guardian_mobile'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Second Guardian Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end pt-4'>
                <Button type='submit' className='min-w-30' >
                  {updateGuardianInfo.isPending ? <Spinner /> : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

function CertificationsSettingsSkeleton() {
  return (
    <div className='space-y-6'>
      <div>
        <Skeleton className='mb-2 h-8 w-48' />
        <Skeleton className='h-4 w-64' />
      </div>
      <div className='space-y-8'>
        <Skeleton className='h-40 w-full rounded-lg' />
        <Skeleton className='h-40 w-full rounded-lg' />
        <div className='flex justify-end pt-2'>
          <Skeleton className='h-10 w-32' />
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
