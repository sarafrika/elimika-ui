'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { asRecord, getErrorMessage } from '@/lib/error-utils';
import { createOrganisation } from '@/services/client';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import {
  OrganisationCountryField,
  OrganisationIdentityFields,
  OrganisationLocationField,
} from '@/src/features/organisation/forms/shared/components/OrganisationFields';
import {
  normalizeCoordinateValue,
  type OrganisationProfileFormData,
  organisationProfileSchema,
} from '@/src/features/organisation/forms/shared/organisation-profile';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

const _organizationTypes = [
  { value: 'PROFESSIONAL_INSTITUTE', label: 'Professional Institute' },
  { value: 'CERTIFICATION_BODY', label: 'Certification Body' },
  { value: 'INDUSTRY_ASSOCIATION', label: 'Industry Association' },
  { value: 'ACADEMIC_SOCIETY', label: 'Academic Society' },
  { value: 'TRADE_ORGANIZATION', label: 'Trade Organization' },
  { value: 'OTHER', label: 'Other' },
] as const;

const getContextCountryName = (context: unknown): string | undefined => {
  const contextRecord = asRecord(context);
  if (!contextRecord) {
    return undefined;
  }

  return (
    (typeof contextRecord.country_name === 'string' ? contextRecord.country_name : undefined) ??
    (typeof asRecord(contextRecord.country)?.name === 'string'
      ? asRecord(contextRecord.country)?.name
      : undefined)
  );
};

export function OrganizationOnboardingForm() {
  const router = useRouter();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganisationProfileFormData>({
    resolver: zodResolver(organisationProfileSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
      licence_no: '',
      location: '',
      country: '',
    },
  });

  const latitudeWatch = form.watch('latitude');
  const longitudeWatch = form.watch('longitude');

  const watchedCoordinates = {
    latitude: normalizeCoordinateValue(latitudeWatch),
    longitude: normalizeCoordinateValue(longitudeWatch),
  };

  const handleSubmit = async (data: OrganisationProfileFormData) => {
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createOrganisation({
        body: data,
        // ensure API errors are surfaced
        throwOnError: true,
      });

      // Invalidate organization-related queries
      await queryClient.invalidateQueries({ queryKey: ['organisations', 'profile'] });
      if (user.invalidateQuery) {
        await user.invalidateQuery();
      }

      const successMessage = response.data?.message || 'Organization registered successfully!';
      toast.success(successMessage);
      router.replace(buildDashboardSwitchPath('organisation_user'));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to register organization. Please try again.'));
    }
    setIsSubmitting(false);
  };

  return (
    <div className='border-border/60 bg-card/80 mx-auto max-w-3xl space-y-8 rounded-3xl border p-8 shadow-sm backdrop-blur-sm'>
      <div className='text-center'>
        <div className='bg-primary/10 text-primary ring-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ring-1'>
          <Building2 className='h-8 w-8' />
        </div>
        <h1 className='text-foreground mb-2 text-3xl font-bold'>Organization Registration</h1>
        <p className='text-muted-foreground'>
          Register your organization to start offering courses
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <OrganisationIdentityFields
                form={form}
                requiredName
                nameLabel='Organization Name'
                namePlaceholder='Elimika Training Institute'
                nameDescription='Official name of your organization'
                licenceLabel='License Number (Optional)'
                licencePlaceholder='REG-123456'
                licenceDescription='Official license or registration number'
                descriptionLabel='Description'
                descriptionPlaceholder='Describe your organization, its mission, and the types of courses you offer...'
                descriptionDescription="Provide additional context about your organization's purpose and activities"
              />

              <OrganisationLocationField
                form={form}
                coordinates={watchedCoordinates}
                label='Location (Optional)'
                description='Physical location or address of your organization'
                onSuggest={result => {
                  const feature = result.features[0];
                  const coordinates = feature?.properties?.coordinates;
                  const contextCountry = getContextCountryName(feature?.properties?.context);

                  if (
                    typeof coordinates?.latitude === 'number' &&
                    typeof coordinates?.longitude === 'number'
                  ) {
                    form.setValue('latitude', coordinates.latitude);
                    form.setValue('longitude', coordinates.longitude);
                  }
                  if (contextCountry) {
                    form.setValue('country', contextCountry);
                  }
                }}
              />

              <OrganisationCountryField
                form={form}
                label='Country (Optional)'
                placeholder='Kenya'
                description='Country where your organization is located'
              />
            </CardContent>
          </Card>

          <Card className='border-primary/20 bg-primary/5'>
            <CardContent className='space-y-1'>
              <h3 className='text-foreground font-medium'>Next Steps</h3>
              <p className='text-muted-foreground text-sm'>
                After registration, you&apos;ll be able to create training branches, invite
                instructors and students, and start offering courses through your organization.
              </p>
            </CardContent>
          </Card>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Registering Organization...' : 'Complete Organization Registration'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
