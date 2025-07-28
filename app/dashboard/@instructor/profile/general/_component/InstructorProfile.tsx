'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';

import ImageSelector, { ImageType } from '@/components/image-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn, profilePicSvg } from '@/lib/utils';
import { appStore } from '@/store/app-store';
import { UUID } from 'crypto';
import { CalendarIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { updateInstructorMutation, updateUserMutation } from '@/services/client/@tanstack/react-query.gen';
import { zInstructor, zUser } from '@/services/client/zod.gen';
import { Instructor, User } from '@/services/client/types.gen';

const userFormSchema = zUser.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
  created_by: true,
  updated_by: true,
  display_name: true,
  full_name: true,
  keycloak_id: true,
}).merge(
  z.object({
    dob: z.date(),
  })
);

const instructorFormSchema = zInstructor.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
  created_by: true,
  updated_by: true,
  full_name: true,
  admin_verified: true,
  has_location_coordinates: true,
  formatted_location: true,
  is_profile_complete: true,
});

type UserFormValues = z.infer<typeof userFormSchema>;
type InstructorFormValues = z.infer<typeof instructorFormSchema>;

interface Props {
  user: User & {
    dob: string;
    created_date: string;
    updated_date: string;
  };
  instructor?: Instructor | null;
}

export default function InstructorProfile({ user, instructor }: Props) {
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

  const fileElmentRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<ImageType>({
    url: user.profile_image_url ?? profilePicSvg,
  });

  const { data: session, update } = useSession();
  const updateSession = update;
  const instructorStore = appStore();

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      username: user.username || '',
      dob: new Date(user.dob),
      phone_number: user.phone_number || '',
      gender: user.gender || 'PREFER_NOT_TO_SAY',
      active: true,
      profile_image_url: user.profile_image_url || profilePicSvg,
    },
  });

  const instructorForm = useForm<InstructorFormValues>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues: {
      user_uuid: user.uuid,
      professional_headline: instructor?.professional_headline || '',
      bio: instructor?.bio || '',
      website: instructor?.website || '',
      latitude: instructor?.latitude || -1.2921,
      longitude: instructor?.longitude || 36.8219,
    },
  });

  const userMutation = useMutation(updateUserMutation());
  const instructorMutation = useMutation(updateInstructorMutation());

  const submitting = userMutation.isPending || instructorMutation.isPending;

  const errors = [
    userMutation.error,
    instructorMutation.error,
  ].filter(Boolean);

  async function onSubmitUser(data: UserFormValues) {
    try {
      await userMutation.mutateAsync({
        path: {
          uuid: user.uuid as UUID,
        },
        body: {
          ...data,
          dob: new Date(data.dob),
          user_domain: [
            ...(user.user_domain ? new Set([...user.user_domain, 'instructor']) : ['instructor']),
          ] as ('student' | 'instructor' | 'admin' | 'organisation_user')[],
        },
      });

      await updateSession({ ...session, user: { ...user, ...data } });

      toast.success('Personal information updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update personal information';
      toast.error(errorMessage);
    }
  }

  async function onSubmitInstructor(data: InstructorFormValues) {
    try {
      if (instructor?.uuid) {
        await instructorMutation.mutateAsync({
          path: {
            uuid: instructor.uuid as UUID,
          },
          body: data,
        });

        await instructorStore.softUpdate('instructor', { ...instructor, ...data });

        toast.success('Professional information updated successfully!');
      }
    } catch (error: unknown) {
      console.error('Error updating instructor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update professional information';
      toast.error(errorMessage);
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>General Info</h1>
        <p className='text-muted-foreground text-sm'>Update your basic profile information</p>
      </div>

      {errors.length > 0 && (
        <div className='rounded-md bg-red-50 p-4'>
          <div className='text-sm text-red-800'>
            {errors.map((error: unknown, index) => (
              <div key={index}>
                {error instanceof Error ? error.message : 'An error occurred'}
              </div>
            ))}
          </div>
        </div>
      )}

      <Form {...userForm}>
        <form onSubmit={userForm.handleSubmit(onSubmitUser)} className='space-y-8'>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic personal details and profile picture</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex flex-col items-start gap-8 sm:flex-row'>
                <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4'>
                  <Avatar className='bg-primary-50 h-24 w-24'>
                    <AvatarImage src={profilePic.url} alt='Avatar' />
                    <AvatarFallback className='bg-blue-50 text-xl text-blue-600'>
                      {`${user.first_name?.[0]?.toUpperCase() || ''}${user.last_name?.[0]?.toUpperCase() || ''}`}
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
                          disabled={submitting}
                        >
                          Change
                        </Button>
                      </ImageSelector>
                      <Button
                        variant='outline'
                        size='sm'
                        type='button'
                        className='text-destructive hover:text-destructive-foreground hover:bg-destructive hover:shadow-xs'
                        disabled={submitting}
                        onClick={() => setProfilePic({ url: profilePicSvg })}
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
                    control={userForm.control}
                    name='first_name'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. Oliver' className='h-10' {...field} disabled={submitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name='last_name'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. Mwangi' className='h-10' {...field} disabled={submitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={userForm.control}
                  name='middle_name'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Kimani'
                          className='h-10'
                          {...field}
                          value={field.value ?? ''}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex w-full flex-col items-start gap-8 sm:flex-row'>
                  <FormField
                    control={userForm.control}
                    name='phone_number'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type='tel'
                            placeholder='e.g. +254712345678'
                            className='h-10'
                            {...field}
                            disabled={submitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name='dob'
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
                                disabled={submitting}
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
                              autoFocus
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
                    control={userForm.control}
                    name='gender'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''} disabled={submitting}>
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
                    <Input placeholder='name@example.com' readOnly value={user.email} disabled />
                    <p className='text-muted-foreground text-[0.8rem]'>
                      Contact support to change your email address
                    </p>
                  </div>
                </div>

                <div className='flex justify-end pt-2'>
                  <Button type='submit' className='cursor-pointer px-6' disabled={submitting}>
                    {submitting ? <Spinner /> : 'Save Personal Info'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <Form {...instructorForm}>
        <form onSubmit={instructorForm.handleSubmit(onSubmitInstructor)} className='space-y-8'>
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Your teaching experience and professional details</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                control={instructorForm.control}
                name='professional_headline'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Headline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Mathematics Professor with 10+ years experience'
                        className='h-10'
                        {...field}
                        value={field.value ?? ''}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormDescription className='text-xs'>
                      A short headline that appears under your name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={instructorForm.control}
                name='website'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://yourwebsite.com'
                        className='h-10'
                        {...field}
                        value={field.value ?? ''}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={instructorForm.control}
                name='bio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Me</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Tell us about yourself...'
                        className='min-h-32 resize-y'
                        {...field}
                        value={field.value ?? ''}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormDescription className='text-xs'>
                      Brief description that will appear on your public profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end pt-2'>
                <Button type='submit' className='cursor-pointer px-6' disabled={submitting}>
                  {submitting ? <Spinner /> : 'Save Professional Info'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}