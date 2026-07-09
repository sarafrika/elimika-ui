'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { type Path, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import CustomLoader from '@/components/custom-loader';
import ImageSelector, { type ImageType } from '@/components/image-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { asRecord, getFieldErrorMessage } from '@/lib/error-utils';
import { profilePicSvg } from '@/lib/utils';
import { type Organisation, type User, updateOrganisation, updateUser } from '@/services/client';
import { useOrganisationAccountBreadcrumb } from '@/src/features/organisation/account/hooks/useOrganisationAccountBreadcrumb';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import {
  OrganisationCountryField,
  OrganisationIdentityFields,
  OrganisationLocationField,
} from '@/src/features/organisation/forms/shared/components/OrganisationFields';
import {
  normalizeCoordinateValue,
  organisationProfileSchema,
} from '@/src/features/organisation/forms/shared/organisation-profile';
import {
  ProfileFormSection,
  ProfileFormShell,
} from '@/src/features/profile/components/profile-form-layout';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useProfileFormMode } from '@/src/features/profile/context/profile-form-mode-context';

const trainingCenterSchema = organisationProfileSchema.merge(
  z.object({
    contactPersonEmail: z.string().optional().or(z.literal('')),
    contactPersonPhone: z.string().optional().or(z.literal('')),
  })
);

type TrainingCenterFormValues = z.infer<typeof trainingCenterSchema>;

const getContextCountryName = (context: unknown): string | undefined => {
  const contextRecord = asRecord(context);
  if (!contextRecord) {
    return undefined;
  }

  const nestedCountryName = asRecord(contextRecord.country)?.name;
  return (
    (typeof contextRecord.country_name === 'string' ? contextRecord.country_name : undefined) ??
    (typeof nestedCountryName === 'string' ? nestedCountryName : undefined)
  );
};

export default function TrainingCenterForm() {
  useOrganisationAccountBreadcrumb(
    'training-center',
    'Training Center',
    '/dashboard/account/training-center'
  );

  const userProfile = useUserProfile();

  const domainBadges = (
    Array.isArray(userProfile?.user_domain)
      ? userProfile.user_domain
      : userProfile?.user_domain
        ? [userProfile.user_domain]
        : []
  ).map(domain =>
    domain
      .split('_')
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );

  if (userProfile?.isLoading) {
    return <CustomLoader />;
  }

  return (
    <ProfileFormShell
      eyebrow='Organisation'
      title='Training centre profile'
      description='Keep your organisation details current so learners and partners know who they are working with.'
      badges={domainBadges}
    >
      <TrainingCentreFormBody />
    </ProfileFormShell>
  );
}

/**
 * Rendered as a child of ProfileFormShell so it consumes the shell's live
 * ProfileFormMode context (edit toggle / confirmation / disableEditing).
 */
function TrainingCentreFormBody() {
  const queryClient = useQueryClient();
  const userProfile = useUserProfile();
  const organisation = useOrganisation();
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  const fileElmentRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<ImageType>({
    url: userProfile?.profile_image_url ?? profilePicSvg,
  });

  const form = useForm<TrainingCenterFormValues>({
    resolver: zodResolver(trainingCenterSchema),
    defaultValues: {
      ...(organisation ?? {}),
      contactPersonEmail: userProfile?.email,
      contactPersonPhone: userProfile?.phone_number ?? '',
      active: true,
    },
  });

  const latitudeWatch = useWatch({ control: form.control, name: 'latitude' });
  const longitudeWatch = useWatch({ control: form.control, name: 'longitude' });

  const watchedCoordinates = {
    latitude: normalizeCoordinateValue(latitudeWatch),
    longitude: normalizeCoordinateValue(longitudeWatch),
  };

  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = (orgData: TrainingCenterFormValues) => {
    requestConfirmation({
      title: 'Update training centre profile?',
      description: 'These details will be shared with learners and partners across Elimika.',
      confirmLabel: 'Update profile',
      cancelLabel: 'Keep editing',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          // Only send columns the Organisation actually persists.
          const body: Partial<Organisation> = {
            name: orgData.name,
            description: orgData.description,
            active: orgData.active ?? true,
            licence_no: orgData.licence_no,
            location: orgData.location,
            country: orgData.country,
            latitude: normalizeCoordinateValue(orgData.latitude),
            longitude: normalizeCoordinateValue(orgData.longitude),
          };

          const updateResponse = await updateOrganisation({
            path: { uuid: organisation?.uuid! },
            body: body as Organisation,
          });

          if (updateResponse.error) {
            toast.error('Error while updating institution');
            const responseErrors = asRecord(
              asRecord(updateResponse.error)?.error ?? updateResponse.error
            );

            if (responseErrors) {
              Object.keys(responseErrors).forEach(key => {
                form.setError(key as Path<TrainingCenterFormValues>, {
                  type: 'server',
                  message: getFieldErrorMessage(updateResponse.error, key) ?? 'Invalid value',
                });
              });
            }
            return;
          }

          if (!userProfile?.phone_number && orgData.contactPersonPhone) {
            await updateUser({
              path: { uuid: userProfile?.uuid! },
              body: {
                ...(userProfile as User),
                phone_number: orgData.contactPersonPhone,
              },
            });
          }

          disableEditing();
          queryClient.invalidateQueries({ queryKey: ['organization'] });
          toast.success('Saved successfully');
        } catch (_error) {
          toast.error('Unable to save your organisation details right now. Please try again.');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <ProfileFormSection
          title='Branding & identity'
          description='Upload your official logo and share a short overview of your centre.'
        >
          <FormItem>
            <FormLabel>Organisation logo</FormLabel>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6'>
              <Avatar className='ring-background shadow-primary/5 h-20 w-20 rounded-lg shadow-lg ring-4'>
                <AvatarImage src={profilePic.url!} />
                <AvatarFallback className='rounded-lg text-sm font-medium'>Logo</AvatarFallback>
              </Avatar>
              <FormControl>
                <ImageSelector onSelect={setProfilePic} {...{ fileElmentRef }}>
                  <Button
                    variant='outline'
                    type='button'
                    onClick={() => fileElmentRef.current?.click()}
                  >
                    Change logo
                  </Button>
                </ImageSelector>
              </FormControl>
            </div>
          </FormItem>

          <OrganisationIdentityFields
            form={form}
            namePlaceholder='Elimika Skills Centre'
            licencePlaceholder='E12345/2024'
            descriptionPlaceholder='Introduce your training centre, target learners, and key programmes.'
            descriptionRows={6}
          />
        </ProfileFormSection>

        <ProfileFormSection
          title='Contact person'
          description='We use these details when reaching out about your organisation.'
        >
          <div className='grid gap-6 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='contactPersonEmail'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email</FormLabel>
                  <FormControl>
                    <Input type='email' placeholder='contact@elimika.org' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='contactPersonPhone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact phone number</FormLabel>
                  <FormControl>
                    <Input placeholder='+254 700 000 000' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ProfileFormSection>

        <ProfileFormSection
          title='Location & presence'
          description='Let learners know where to find you and how to stay connected.'
          footer={
            <Button type='submit' disabled={!isEditing || isSaving || isConfirming}>
              {isSaving || isConfirming ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Updating…
                </span>
              ) : (
                'Update profile'
              )}
            </Button>
          }
        >
          <OrganisationLocationField
            form={form}
            coordinates={watchedCoordinates}
            onSuggest={result => {
              const feature = result.features[0];
              if (!feature) return;
              const coordinates = feature.properties?.coordinates;
              const countryName = getContextCountryName(feature.properties?.context);
              if (
                typeof coordinates?.latitude === 'number' &&
                typeof coordinates?.longitude === 'number'
              ) {
                form.setValue('latitude', coordinates.latitude);
                form.setValue('longitude', coordinates.longitude);
              }
              if (countryName) {
                form.setValue('country', countryName);
              }
            }}
          />

          <OrganisationCountryField form={form} placeholder='Kenya' />
        </ProfileFormSection>
      </form>
    </Form>
  );
}
