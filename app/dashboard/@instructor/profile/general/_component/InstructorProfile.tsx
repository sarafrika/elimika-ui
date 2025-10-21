'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import ImageSelector, { ImageType } from '@/components/image-selector';
import LocationInput from '@/components/locationInput';
import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
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
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '@/context/profile-context';
import { useReverseGeocode } from '@/hooks/use-reverse-geocode';
import { queryClient } from '@/lib/query-client';
import { cn, profilePicSvg } from '@/lib/utils';
import {
  createInstructor,
  updateInstructor,
  updateUser,
  uploadProfileImage,
} from '@/services/client';
import { zInstructor, zUser } from '@/services/client/zod.gen';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

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
  const { addressComponents } = useReverseGeocode(Number(instructor?.latitude), Number(instructor?.longitude));

  /** For handling profile picture preview */
  const fileElmentRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<ImageType>({
    url: user!.profile_image_url ?? profilePicSvg,
  });

  const domainBadges =
    // @ts-ignore
    user?.user_domain?.map(domain =>
      domain
        .split('_')
        .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
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

  const [submitting, setSubmitting] = useState(false);
  async function onSubmit(updatedProfileData: GeneralProfileFormValues) {
    setSubmitting(true);

    let uploadProfilePicResp;
    if (profilePic.file) {
      const fd = new FormData();
      const fileName = `${crypto.randomUUID()}${profilePic.file.name}`;
      fd.append('profileImage', profilePic.file as Blob, fileName);
      fd.append('profileImage', fileName);

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
    setSubmitting(false);
    let hasErrors = false;

    response.forEach((resp, i) => {
      if (resp.error) {
        const { error } = resp.error as { error: any };
        Object.keys(error).forEach(key => {
          const fieldName = `${i === 0 ? 'user' : 'instructor'}.${key}` as any;
          form.setError(fieldName, error[key]);
        });
        hasErrors = true;
      }
    });
    if (hasErrors) return;

    toast.success('Profile updated successfully');
    await queryClient.invalidateQueries({ queryKey: ['profile', user!.email] });
  }

  return (
    <ProfileFormShell
      eyebrow='Instructor'
      title='General information'
      description='Refresh your instructor profile so learners and organisations know who you are.'
      badges={domainBadges as any}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <ProfileFormSection
            title='Personal profile'
            description='Basic details that appear wherever your instructor profile is shown.'
          >
            <div className='space-y-6'>
              <div className='flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8'>
                <Avatar className='h-24 w-24 ring-4 ring-background shadow-lg shadow-primary/5'>
                  <AvatarImage
                    src={user!.profile_image_url ?? profilePic.url}
                    alt={`${user!.first_name} ${user!.last_name}`}
                  />
                  <AvatarFallback className='bg-primary/10 text-base font-semibold text-primary'>
                    {`${user!.first_name!.length > 0 ? user!.first_name![0]?.toUpperCase() : ''}${user!.last_name!.length > 0 ? user!.last_name![0]?.toUpperCase() : ''}` || 'IN'}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-3'>
                  <p className='text-sm text-muted-foreground'>
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
              <Button type='submit' className='min-w-40' disabled={submitting}>
                {submitting ? (
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
                      onSuggest={loc => {
                        if (loc.features.length > 0) {
                          // form.setValue(
                          //   'instructor.latitude',
                          //   loc.features[0]!.properties.coordinates.latitude
                          // );

                          // form.setValue(
                          //   'instructor.longitude',
                          //   loc.features[0]!.properties.coordinates.longitude
                          // );
                        }
                        return loc;
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
                    <Textarea
                      placeholder='Share your teaching philosophy, specialties, and learner outcomes.'
                      className='min-h-32 resize-y'
                      {...field}
                      value={field.value ?? ''}
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
