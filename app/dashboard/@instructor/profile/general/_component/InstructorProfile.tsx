'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import ImageSelector, { ImageType } from '@/components/image-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
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
import { cn, profilePicSvg } from '@/lib/utils';
import { zInstructor, zUser } from '@/services/client/zod.gen';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import LocationInput from '../../../../../../components/locationInput';
import { useUserProfile } from '../../../../../../context/profile-context';
import {
  createInstructor,
  updateInstructor,
  updateUser,
  uploadProfileImage,
} from '../../../../../../services/client';
import { client } from '../../../../../../services/client/client.gen';

const generalProfileSchema = z.object({
  user: zUser
    .omit({
      created_date: true,
      updated_date: true,
      updated_by: true,
      user_domain: true,
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

  /** For handling profile picture preview */
  const fileElmentRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<ImageType>({
    url: user!.profile_image_url ?? profilePicSvg,
  });

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
      fd.append('profile_image', profilePic.file as Blob, fileName);

      client.put({
        url: '',
      });
      uploadProfilePicResp = await uploadProfileImage({
        path: {
          userUuid: user!.uuid!,
        },
        //@ts-ignore
        body: fd,
        headers: {
          'Content-Type': 'multipart/form-data',
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
    await invalidateQuery!();
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>General Info</h1>
        <p className='text-muted-foreground text-sm'>Update your basic profile information</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information displayed on your profile</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex flex-col items-start gap-8 sm:flex-row'>
                <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4'>
                  <Avatar className='bg-primary-50 h-24 w-24'>
                    <AvatarImage src={profilePic.url} alt='Avatar' />
                    <AvatarFallback className='bg-blue-50 text-xl text-blue-600'>
                      {`${user!.first_name!.length > 0 ? user!.first_name![0]?.toUpperCase() : ''}${user!.last_name!.length > 0 ? user!.last_name![0]?.toUpperCase() : ''}`}
                    </AvatarFallback>
                  </Avatar>
                  <div className='space-y-2'>
                    <div className='text-muted-foreground text-sm'>
                      Square images work best.
                      <br />
                      Max size: 5MB
                    </div>
                    <div className='flex space-x-2'>
                      <ImageSelector onSelect={setProfilePic} {...{ fileElmentRef }}>
                        <Button
                          variant='outline'
                          size='sm'
                          type='button'
                          onClick={() => fileElmentRef.current?.click()}
                        >
                          Change
                        </Button>
                      </ImageSelector>
                      <Button
                        variant='outline'
                        size='sm'
                        type='button'
                        className='text-destructive hover:text-destructive-foreground hover:bg-destructive hover:shadow-xs'
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid gap-6'>
                <div className='grid w-full grid-cols-1 items-start gap-8 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='user.first_name'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. Oliver' className='h-10' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='user.last_name'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. Mwangi' className='h-10' {...field} />
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
                    <FormItem className='flex-1'>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Kimani'
                          className='h-10'
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex w-full flex-col items-start gap-8 sm:flex-row'>
                  <FormField
                    control={form.control}
                    name='user.phone_number'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type='tel'
                            placeholder='e.g. +254712345678'
                            className='h-10'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='user.dob'
                    render={({ field }) => (
                      <FormItem className='flex flex-1 flex-col'>
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
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
                <div className='flex w-full flex-col items-start gap-8 sm:flex-row'>
                  <FormField
                    control={form.control}
                    name='user.gender'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a gender' />
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
                  <div className='flex-1 space-y-2'>
                    <Label>Email Address</Label>
                    <Input placeholder='name@example.com' readOnly value={user!.email} disabled />
                    <p className='text-muted-foreground text-[0.8rem]'>
                      Contact support to change your email address
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name='instructor.location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <LocationInput
                          {...field}
                          onSuggest={loc => {
                            if (loc.features.length > 0) {
                              form.setValue(
                                'instructor.latitude',
                                loc.features[0]!.properties.coordinates.latitude
                              );

                              form.setValue(
                                'instructor.longitude',
                                loc.features[0]!.properties.coordinates.longitude
                              );
                            }
                            return loc;
                          }}
                        />
                      </FormControl>
                      <FormDescription>Search and select your physical localaion</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='instructor.professional_headline'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Headline</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Mathematics Professor with 10+ years experience'
                          className='h-10'
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription className='text-xs'>
                        A short headline that appears under your name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='instructor.website'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='https://yourwebsite.com'
                            className='h-10'
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* <FormField
                                        control={form.control}
                                        name="instructor.location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Nairobi, Kenya"
                                                        className="h-10"
                                                        {...field} value={""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    /> */}
                </div>

                <FormField
                  control={form.control}
                  name='instructor.bio'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Me</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Tell us about yourself...'
                          className='min-h-32 resize-y'
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription className='text-xs'>
                        Brief description that will appear on your public profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end pt-2'>
                <Button type='submit' className='cursor-pointer px-6' disabled={submitting}>
                  {submitting ? <Spinner /> : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
