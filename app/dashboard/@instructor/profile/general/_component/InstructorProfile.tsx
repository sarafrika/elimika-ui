'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import ImageSelector, { ImageType } from '@/components/image-selector';
import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { cn, profilePicSvg } from '@/lib/utils';
import { zInstructor, zUser } from '@/services/client/zod.gen';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import LocationInput from '../../../../../../components/locationInput';
import { useUserProfile } from '../../../../../../context/profile-context';
import { useProfileFormMode } from '../../../../../../context/profile-form-mode-context';
import { queryClient } from '../../../../../../lib/query-client';
import {
  createInstructor,
  updateInstructor,
  updateUser,
  uploadProfileImage,
} from '../../../../../../services/client';

const generalProfileSchema = z.object({
  user: zUser
    .omit({
      created_date: true,
      updated_date: true,
      updated_by: true,
      user_domain: true,
      organisation_affiliations: true,
    })
    .merge(z.object({ dob: z.date() })),
  instructor: zInstructor
    .merge(
      z.object({
        location: z.string().optional(),
      })
    )
    .omit({
      created_date: true,
      updated_date: true,
      updated_by: true,
    }),
});

type GeneralProfileFormValues = z.infer<typeof generalProfileSchema>;

export default function InstructorProfile() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'general',
        title: 'General',
        url: '/dashboard/profile/general',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const user = useUserProfile();
  const { instructor, invalidateQuery } = user!;

  /** For handling profile picture preview */
  const fileElmentRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<ImageType>({
    url: user!.profile_image_url ?? profilePicSvg,
  });

  const domainBadges =
    (user?.user_domain as string[] | undefined)?.map(domain =>
      domain
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];


  const form = useForm<GeneralProfileFormValues>({
    resolver: zodResolver(generalProfileSchema),
    defaultValues: {
      user: {
        ...user,
        dob: new Date(user!.dob ?? Date.now()),
        profile_image_url: user!.profile_image_url ?? 'https://profilepic.jpg',
      },
      instructor: {
        ...instructor,
        latitude: -1.2921,
        longitude: 36.8219,
        full_name: `${user!.first_name} ${user!.last_name}`,
        user_uuid: user!.uuid,
        formatted_location: '-1.292100, 36.821900',
      },
    },
  });

  const instructorLatitude = form.watch('instructor.latitude');
  const instructorLongitude = form.watch('instructor.longitude');

  const normalizeCoordinate = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const instructorCoordinates = {
    latitude: normalizeCoordinate(instructorLatitude),
    longitude: normalizeCoordinate(instructorLongitude),
  };

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (updatedProfileData: GeneralProfileFormValues) => {
    requestConfirmation({
      title: 'Save instructor profile changes?',
      description: 'These updates will be visible to learners, organisations, and fellow instructors.',
      confirmLabel: 'Save changes',
      cancelLabel: 'Keep editing',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          let uploadProfilePicResp;
          if (profilePic.file) {
            uploadProfilePicResp = await uploadProfileImage({
              path: {
                userUuid: user!.uuid!,
              },
              body: {
                profileImage: profilePic.file,
              },
            });
          }

          const manageInstructor = () =>
            instructor
              ? updateInstructor({
                path: {
                  uuid: instructor.uuid!,
                },
                body: updatedProfileData.instructor,
              })
              : createInstructor({
                body: updatedProfileData.instructor,
              });

          const response = await Promise.all([
            updateUser({
              path: {
                uuid: user!.uuid!,
              },
              body: {
                ...updatedProfileData.user,
                profile_image_url:
                  uploadProfilePicResp && !uploadProfilePicResp.error
                    ? uploadProfilePicResp.data!.profile_image_url
                    : user!.profile_image_url,
              },
            }),
            manageInstructor(),
          ]);

          let hasErrors = false;

          response.forEach((resp, i) => {
            if (resp.error) {
              const { error } = resp.error as { error: Record<string, string> };
              Object.keys(error).forEach(key => {
                const fieldName = `${i === 0 ? 'user' : 'instructor'}.${key}` as any;
                form.setError(fieldName, error[key] as any);
              });
              hasErrors = true;
            }
          });

          if (hasErrors) {
            return;
          }

          toast.success('Profile updated successfully');
          disableEditing();
          await queryClient.invalidateQueries({ queryKey: ['profile', user!.email] });
        } catch (error) {
          toast.error('Unable to update your profile right now. Please try again.');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  return (
    <ProfileFormShell
      eyebrow='Instructor'
      title='General information'
      description='Refresh your instructor profile so learners and organisations know who you are.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <ProfileFormSection
            title='Personal profile'
            description='Basic details that appear wherever your instructor profile is shown.'
          >
            <div className='space-y-6'>
              <div className='flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8'>
                <Avatar className='ring-background shadow-primary/5 h-24 w-24 shadow-lg ring-4'>
                  <AvatarImage
                    src={user!.profile_image_url ?? profilePic.url}
                    alt={`${user!.first_name} ${user!.last_name}`}
                  />
                  <AvatarFallback className='bg-primary/10 text-primary text-base font-semibold'>
                    {`${user!.first_name!.length > 0 ? user!.first_name![0]?.toUpperCase() : ''}${user!.last_name!.length > 0 ? user!.last_name![0]?.toUpperCase() : ''}` ||
                      'IN'}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-3'>
                  <p className='text-muted-foreground text-sm'>
                    Square images work best. Maximum size is 5MB.
                  </p>
                  <div className='flex flex-wrap gap-3'>
                    <ImageSelector onSelect={setProfilePic} {...{ fileElmentRef }}>
                      <Button
                        variant='outline'
                        size='sm'
                        type='button'
                        onClick={() => fileElmentRef.current?.click()}
                      >
                        Change photo
                      </Button>
                    </ImageSelector>
                    <Button
                      variant='ghost'
                      size='sm'
                      type='button'
                      onClick={() => {
                        setProfilePic({ url: profilePicSvg });
                        form.setValue('user.profile_image_url', '');
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              <div className='grid gap-6 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='user.first_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder='Oliver' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='user.last_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder='Mwangi' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='user.middle_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle name</FormLabel>
                    <FormControl>
                      <Input placeholder='Kimani' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-6 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='user.phone_number'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input type='tel' placeholder='+254712345678' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='user.dob'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Date of birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn(
                                'w-full justify-between text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : 'Select date'}
                              <CalendarIcon className='ml-2 h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout='dropdown'
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            disabled={date => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-6 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='user.gender'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select gender' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='MALE'>Male</SelectItem>
                          <SelectItem value='FEMALE'>Female</SelectItem>
                          <SelectItem value='OTHER'>Other</SelectItem>
                          <SelectItem value='PREFER_NOT_TO_SAY'>Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='user.email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input readOnly disabled {...field} />
                      </FormControl>
                      <p className='text-muted-foreground text-xs'>
                        Contact support to change your email address.
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </ProfileFormSection>

          <ProfileFormSection
            title='Professional summary'
            description='Introduce your expertise and help learners understand how you teach.'
            footer={
              <Button
                type='submit'
                className='min-w-40'
                disabled={!isEditing || submitting || isConfirming}
              >
                {submitting || isConfirming ? (
                  <span className='flex items-center gap-2'>
                    <Spinner className='h-4 w-4' />
                    Saving…
                  </span>
                ) : (
                  'Save changes'
                )}
              </Button>
            }
          >
            <FormField
              control={form.control}
              name='instructor.location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary location</FormLabel>
                  <FormControl>
                    <LocationInput
                      {...field}
                      coordinates={instructorCoordinates}
                      onSuggest={loc => {
                        const feature = loc.features[0];
                        const coords = feature?.properties?.coordinates;
                        if (
                          typeof coords?.latitude === 'number' &&
                          typeof coords?.longitude === 'number'
                        ) {
                          form.setValue('instructor.latitude', coords.latitude as any);
                          form.setValue('instructor.longitude', coords.longitude as any);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>Search by town, city, or neighbourhood.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-6 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='instructor.professional_headline'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional headline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Mathematics facilitator with 10+ years experience'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription className='text-xs'>
                      Appears underneath your name across Elimika.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='instructor.website'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website or portfolio</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://yourwebsite.com'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='instructor.bio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About you</FormLabel>
                  <FormControl>
                    <SimpleEditor
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      isEditable={isEditing}
                      showToolbar={isEditing}
                    />
                  </FormControl>
                  <FormDescription className='text-xs'>
                    This appears on your instructor profile and course listings.
                  </FormDescription>
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
