'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  AvailabilityAcademicPeriodCard,
  AvailabilitySchedulingLinkCard,
} from '@/src/features/organisation/account/components/AvailabilitySettingsSections';
import {
  type AvailabilitySettingsFormValues,
  availabilitySettingsSchema,
} from '@/src/features/organisation/account/forms/availability-settings';
import { useOrganisationAccountBreadcrumb } from '@/src/features/organisation/account/hooks/useOrganisationAccountBreadcrumb';

export default function AvailabilityPage() {
  useOrganisationAccountBreadcrumb(
    'availability',
    'Availability',
    '/dashboard/account/availability'
  );

  const form = useForm<AvailabilitySettingsFormValues>({
    resolver: zodResolver(availabilitySettingsSchema),
    defaultValues: {
      calComLink: '',
      academicPeriod: 'Term',
      academicDuration: 12,
    },
  });

  const onSubmit = (_data: AvailabilitySettingsFormValues) => {
    // TODO: Implement submission logic
    //console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <div className='space-y-6'>
          <AvailabilitySchedulingLinkCard form={form} />
          <AvailabilityAcademicPeriodCard form={form} />
        </div>

        <div className='flex justify-end'>
          <Button type='submit'>Save Availability Settings</Button>
        </div>
      </form>
    </Form>
  );
}
