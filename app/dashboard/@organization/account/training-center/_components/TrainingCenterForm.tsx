'use client';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
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
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import CustomLoader from '../../../../../../components/custom-loader';
import ImageSelector, { ImageType } from '../../../../../../components/image-selector';
import LocationInput from '../../../../../../components/locationInput';
import { useUserProfile } from '../../../../../../context/profile-context';
import { useTrainingCenter } from '../../../../../../context/training-center-provide';
import { queryClient } from '../../../../../../lib/query-client';
import { profilePicSvg } from '../../../../../../lib/utils';
import { updateOrganisation, updateUser, User } from '../../../../../../services/client';
import { zOrganisation } from '../../../../../../services/client/zod.gen';

const trainingCenterSchema = zOrganisation
  .omit({
    created_date: true,
    updated_date: true,
  })
  .merge(
    z.object({
      logoUrl: z.string().url().optional().or(z.literal('')),
      contactPersonEmail: z.string(),
      contactPersonPhone: z.string(),
      website: z.string().url().optional().or(z.literal('')),
      address: z.string().optional(),
    })
  );

type TrainingCenterFormValues = z.infer<typeof trainingCenterSchema>;

export default function TrainingCenterForm() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'account', title: 'Account', url: '/dashboard/account' },
      {
        id: 'training-center',
        title: 'Training Center',
        url: '/dashboard/account/training-center',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const userProfile = useUserProfile();
  const organisation = useTrainingCenter();
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  /** For handling profile picture preview */
  const fileElmentRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<ImageType>({
    url: userProfile!.profile_image_url ?? profilePicSvg,
  });

  const form = useForm<TrainingCenterFormValues>({
    resolver: zodResolver(trainingCenterSchema),
    defaultValues: {
      ...(organisation ?? {}),
      contactPersonEmail: userProfile!.email,
      contactPersonPhone: userProfile!.phone_number,
      active: true,
    },
  });

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
          const updateResponse = await updateOrganisation({
            path: {
              uuid: organisation!.uuid!,
            },
            body: orgData,
          });

          if (updateResponse.error) {
            toast.error('Error while updating institution');
            const error = updateResponse.error as Record<string, any>;
            Object.keys(error).forEach((key: any) => form.setError(key, error[key]));
            return;
          }

          if (!userProfile!.phone_number) {
            await updateUser({
              path: {
                uuid: userProfile!.uuid!,
              },
              body: {
                ...(userProfile as User),
                phone_number: orgData.contactPersonPhone,
              },
            });
          }

          disableEditing();
          queryClient.invalidateQueries({ queryKey: ['organization'] });
          toast.success('Saved successfully');
        } catch (error) {
          toast.error('Unable to save your organisation details right now. Please try again.');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  if (userProfile?.isLoading) {
    return <CustomLoader />;
  }

  const domainBadges =
    userProfile?.user_domain?.map(domain =>
      domain
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  return (
    <ProfileFormShell
      eyebrow='Organisation'
      title='Training centre profile'
      description='Keep your organisation details current so learners and partners know who they are working with.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <ProfileFormSection
            title='Branding & identity'
            description='Upload your official logo and share a short overview of your centre.'
          >
            <FormField
              control={form.control}
              name='logoUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation logo</FormLabel>
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6'>
                    <Avatar className='ring-background shadow-primary/5 h-20 w-20 rounded-lg shadow-lg ring-4'>
                      <AvatarImage src={profilePic.url!} />
                      <AvatarFallback className='rounded-lg text-sm font-medium'>
                        Logo
                      </AvatarFallback>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-6 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisation name</FormLabel>
                    <FormControl>
                      <Input placeholder='Elimika Skills Centre' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='licence_no'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Licence number</FormLabel>
                    <FormControl>
                      <Input placeholder='E12345/2024' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About your organisation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Introduce your training centre, target learners, and key programmes.'
                      className='min-h-32 resize-y'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
            <FormField
              control={form.control}
              name='location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical address</FormLabel>
                  <FormControl>
                    <LocationInput
                      {...field}
                      onSuggest={result => {
                        const feature = result.features[0];
                        if (!feature) return;
                        const coordinates = feature.properties?.coordinates;
                        const countryName =
                          (feature.properties?.context as any)?.country?.name ??
                          feature.properties?.context?.country_name;
                        if (coordinates?.latitude && coordinates?.longitude) {
                          form.setValue('latitude', coordinates.latitude);
                          form.setValue('longitude', coordinates.longitude);
                        }
                        if (countryName) {
                          form.setValue('country', countryName);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='website'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder='https://elimika.org' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </ProfileFormSection>
        </form>
      </Form>
    </ProfileFormShell>
  );
}
