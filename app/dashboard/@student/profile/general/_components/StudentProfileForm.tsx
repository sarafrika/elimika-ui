'use client';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
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
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import useMultiMutations from '@/hooks/use-multi-mutations';
import { cn } from '@/lib/utils';
import { tanstackClient } from '@/services/api/tanstack-client';
import { updateUserMutation } from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircleIcon, CalendarIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const qc = useQueryClient();
  const user = useUserProfile();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

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

  const { errors } = useMultiMutations([userMutation]);

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

  const [profileUrl, setProfileUrl] = useState<string | null>(user?.profile_image_url ?? null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSubmit = (data: StudentProfileType) => {
    requestConfirmation({
      title: 'Save profile changes?',
      description: 'This will update your learner details for instructors and guardians.',
      confirmLabel: 'Save changes',
      cancelLabel: 'Keep editing',
      onConfirm: async () => {
        try {
          await userMutation.mutateAsync(
            {
              body: {
                ...data,
                dob: data.dob ?? '',
                active: user?.active as boolean,
              },
              path: { uuid: user?.uuid as string },
            },
            {
              onSuccess: data => {
                qc.invalidateQueries({ queryKey: ['profile'] });
                toast.success(data?.message);
                disableEditing();
              },
            }
          );
        } catch (_error) {
          // handled by toast inside mutation
        }
      },
    });
  };

  const initials =
    `${(user?.first_name?.[0] ?? '').toUpperCase()}${(user?.last_name?.[0] ?? '').toUpperCase()}` ||
    'ST';

  const domainBadges =
    // @ts-expect-error
    user?.user_domain?.map(domain =>
      domain
        .split('_')
        .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  return (
    <ProfileFormShell
      eyebrow='Student'
      title='General Information'
      description='Keep your learner profile current so instructors and guardians have the right details.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {errors && errors.length > 0 ? (
            <Alert
              variant='destructive'
              className='border-destructive/40 bg-destructive/10 text-destructive'
            >
              <AlertCircleIcon className='h-4 w-4' />
              <AlertTitle>We couldn&apos;t save your changes</AlertTitle>
              <AlertDescription>
                <ul className='ml-4 list-disc space-y-1 text-sm'>
                  {errors.map((error: any, i: number) => (
                    <li key={i}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <ProfileFormSection
            title='Profile photo'
            description='This image appears on your classes, bookings, and certificates.'
          >
            <FormField
              control={form.control}
              name='profile_image_url'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8'>
                      <Avatar className='ring-background shadow-primary/5 h-24 w-24 shadow-lg ring-4'>
                        {profileUrl ? <AvatarImage src={profileUrl} alt='Profile photo' /> : null}
                        <AvatarFallback className='bg-primary/10 text-primary text-base font-semibold'>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className='space-y-3'>
                        <p className='text-muted-foreground text-sm'>
                          Square images work best. Maximum size is 5MB.
                        </p>
                        <div className='flex flex-wrap gap-3'>
                          <input
                            ref={fileInputRef}
                            type='file'
                            accept='image/*'
                            className='hidden'
                            onChange={event => {
                              const file = event.target.files?.[0];
                              if (!file) return;

                              uploadProfileImage(
                                file,
                                user?.uuid as string,
                                pictureMutation.mutate,
                                url => {
                                  setProfileUrl(url);
                                  toast.success('Profile photo updated');
                                  field.onChange(url);
                                },
                                () => toast.error('Failed to upload profile photo')
                              );
                            }}
                          />
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Change photo
                          </Button>
                          {profileUrl ? (
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                setProfileUrl(null);
                                field.onChange('');
                              }}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </ProfileFormSection>

          <ProfileFormSection
            title='Personal details'
            description='Core identity information linked to your learner record.'
          >
            <div className='grid gap-6 sm:grid-cols-3'>
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder='Jane' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='middle_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle name</FormLabel>
                    <FormControl>
                      <Input placeholder='Wanjiru' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='last_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder='Kamau' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='gender'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name='dob'
                render={({ field }) => (
                  <FormItem>
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
                            {field.value ? format(new Date(field.value), 'PPP') : 'Select date'}
                            <CalendarIcon className='ml-2 h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value ? new Date(field.value) : undefined}
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
          </ProfileFormSection>

          <ProfileFormSection
            title='Contact & access'
            description='Details we use to reach you and secure your account.'
            footer={
              <Button
                type='submit'
                className='min-w-36'
                disabled={
                  !isEditing || userMutation.isPending || pictureMutation.isPending || isConfirming
                }
              >
                {userMutation.isPending || pictureMutation.isPending || isConfirming ? (
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
            <div className='grid gap-6 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
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
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input type='tel' placeholder='+254712345678' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder='yourusername' {...field} />
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
