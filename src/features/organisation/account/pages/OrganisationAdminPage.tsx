'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  AdminCredentialsCard,
  AdminPersonalInformationCard,
} from '@/src/features/organisation/account/components/AdminProfileSections';
import {
  type AdminProfileFormValues,
  adminProfileSchema,
} from '@/src/features/organisation/account/forms/admin-profile';
import { useOrganisationAccountBreadcrumb } from '@/src/features/organisation/account/hooks/useOrganisationAccountBreadcrumb';

export default function AdminProfile() {
  useOrganisationAccountBreadcrumb('admin', 'Admin', '/dashboard/account/admin');

  const form = useForm<AdminProfileFormValues>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: {
      first_name: 'John',
      middle_name: '',
      last_name: 'Doe',
      email: 'admin@example.com',
      phone_number: '+1 (555) 000-0000',
      username: 'admin_username',
      gender: 'PREFER_NOT_TO_SAY',
    },
  });

  function onSubmit(_values: AdminProfileFormValues) {
    //console.log(values);
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Administrator Profile</h1>
        <p className='text-muted-foreground'>
          Manage your personal information and access credentials
        </p>
      </div>

      <Alert>
        <ShieldCheck className='h-4 w-4' />
        <AlertTitle>Administrator Account</AlertTitle>
        <AlertDescription>
          As the administrator of this training center, you have full access to manage courses,
          instructors, and students.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <AdminPersonalInformationCard form={form} />
          <AdminCredentialsCard form={form} />

          <div className='flex justify-end pt-2'>
            <Button type='submit' className='px-6'>
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
