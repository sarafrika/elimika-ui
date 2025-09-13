'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import useMultiMutations from '@/hooks/use-multi-mutations';
import { cn } from '@/lib/utils';
import { tanstackClient } from '@/services/api/tanstack-client';
import {
  updateUserMutation
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircleIcon, CalendarIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const StudentProfileSchema = z.object({
  first_name: z.string(),
  middle_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone_number: z.string(),
  profile_image_url: z.string(),
  dob: z.any(),
  username: z.string(),
  gender: z.any(),
});

type StudentProfileType = z.infer<typeof StudentProfileSchema>;

export default function StudentProfileGeneralForm() {
  const qc = useQueryClient()
  const user = useUserProfile();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'general-info',
        title: 'General Information',
        url: '/dashboard/profile/genera',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const form = useForm<StudentProfileType>({
    resolver: zodResolver(StudentProfileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      middle_name: user?.middle_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      profile_image_url: user?.profile_image_url || '',
      dob: user?.dob as any,
      username: user?.username || '',
      gender: user?.gender as any,
    },
  });

  const userMutation = useMutation(updateUserMutation());
  const pictureMutation = tanstackClient.useMutation(
    'post',
    '/api/v1/users/{userUuid}/profile-image'
  );

  const { errors, resetErrors } = useMultiMutations([userMutation]);

  // ✅ Proper error setting on form fields
  if (errors && errors.length > 0) {
    errors.forEach((error: any) => {
      if (error?.error && typeof error.error === 'object') {
        for (const key in error.error) {
          const value = error.error[key];
          if (key in user!) {
            form.setError(`user.${key}` as any, {
              type: 'manual',
              message: value,
            });
          }
        }
      }
    });
  }

  const [profileUrl, setProfileUrl] = useState<string | null>(user?.profile_image_url as string)

  async function uploadProfileImage(
    file: File,
    userUuid: string,
    uploadMutation: (args: any, options: any) => void,
    onSuccess: (url: string) => void,
    onError: (error?: any) => void
  ) {
    if (!file) {
      onError?.(new Error('No file provided'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.(new Error('File size should be less than 5MB'));
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    uploadMutation(
      { body: formData, params: { path: { userUuid } } },
      {
        onSuccess: (data: any) => {
          const url = data?.profile_image_url;
          if (url) {
            onSuccess(url);
          } else {
            onError?.(new Error('No image URL returned'));
          }
        },
      }
    );
  }

  const onSubmit = async (data: StudentProfileType) => {
    try {
      await userMutation.mutateAsync({
        body: {
          ...data,
          dob: data.dob ?? '',
          active: user?.active as boolean
        },
        path: { uuid: user!.uuid as string },
      }, {
        onSuccess: (data) => {
          qc.invalidateQueries({ queryKey: ['profile'] });
          toast.success(data?.message)
        }
      });
    } catch (error) {
      // console.error('Error updating user profile:', error);
    }
  };

  return (
    <div className='w-full sm:max-w-3/4'>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold'>General Info</h1>
        <p className='text-muted-foreground text-sm'>
          Update your basic profile information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          {errors && errors.length > 0 && (
            <Alert variant='destructive' className='text-red-600'>
              <AlertCircleIcon />
              <AlertTitle>Error processing form</AlertTitle>
              <AlertDescription>
                <ul>
                  {errors.map((error: any, i: number) => (
                    <li key={i}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Avatar  */}
              <FormField
                control={form.control}
                name='profile_image_url'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className='flex flex-col items-center gap-4 mb-8'>
                        <Input
                          type="file"
                          accept="image/*"
                          className='hidden'
                          id="profile-image-input"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            uploadProfileImage(
                              file,
                              user?.uuid as string,
                              pictureMutation.mutate,
                              (url) => {
                                setProfileUrl(url);
                                toast.success('Uploaded successfully');
                                field.onChange(url);
                              },
                              (error) => { }
                            );
                          }}
                        />

                        <div className='flex flex-row items-center gap-4' >
                          {/* Avatar preview or initials */}
                          {profileUrl ? (
                            <div className='h-32 w-32 overflow-hidden rounded-full border border-gray-300'>
                              <Image
                                src={profileUrl}
                                alt='Profile Preview'
                                height={128}
                                width={128}
                                className='h-full w-full object-cover rounded-full'
                              />
                            </div>
                          ) : (
                            <div className='flex h-32 w-32 items-center justify-center rounded-full border border-gray-300 bg-gray-200 text-4xl font-semibold text-gray-600'>
                              {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')}
                            </div>
                          )}

                          <p className='text-muted-foreground text-sm text-center'>
                            Square images work best.<br />
                            Max size: 5MB
                          </p>
                        </div>

                        <label
                          htmlFor="profile-image-input"
                          className='cursor-pointer border rounded-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                          Change
                        </label>

                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <div className='flex flex-col gap-5 md:flex-row'>
                <FormField
                  control={form.control}
                  name='first_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder='John' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='middle_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Adams' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='last_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Adams' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='flex flex-col gap-5 md:flex-row'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type='email' placeholder='name@example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='phone_number'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type='tel' placeholder='+254712345678' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='flex flex-col gap-5 md:flex-row'>
                <FormField
                  control={form.control}
                  name='gender'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select your gender' />
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
                  name='dob'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
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
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={new Date(field.value)}
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

            </CardContent>
          </Card>

          <div className='flex justify-end pt-2'>
            <Button type='submit' className='px-6 min-w-30'>
              {userMutation.isPending ? <Spinner /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

