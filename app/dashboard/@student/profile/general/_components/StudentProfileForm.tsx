'use client';

import ImageSelector, { ImageType } from '@/components/image-selector';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import useMultiMutations from '@/hooks/use-multi-mutations';
import { cn, profilePicSvg } from '@/lib/utils';
import { tanstackClient } from '@/services/api/tanstack-client';
import { schemas } from '@/services/api/zod-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { UUID } from 'crypto';
import { format } from 'date-fns';
import { AlertCircleIcon, CalendarIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useUserProfile } from '../../../../../../context/profile-context';
import { zStudent, zUser } from '../../../../../../services/client/zod.gen';

const StudentProfileSchema = z.object({
  user: zUser.omit({
    user_domain: true,
    created_date: true,
    updated_date: true
  }).merge(z.object({
    dob: z.date(),
  })
  ),

  student: zStudent.omit({
    created_date: true,
    updated_date: true,
    updated_by: true
  })
});

type StudentProfileType = z.infer<typeof StudentProfileSchema>;

export default function StudentProfileGeneralForm() {

  const user = useUserProfile();
  const { student } = user!

  /** For handling profile picture preview */
  const fileElmentRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<ImageType>({
    url: user!.profile_image_url ?? profilePicSvg,
  });

  /** For handling form */
  const form = useForm<StudentProfileType>({
    resolver: zodResolver(StudentProfileSchema),
    defaultValues: {
      user: {
        ...user,
        dob: new Date(user!.dob ?? Date.now()),
        profile_image_url: user!.profile_image_url || profilePicSvg
      },
      /** Students guardian data to be refactored to array */
      student: {
        ...student,
        secondaryGuardianContact: student?.secondaryGuardianContact ?? '',
        user_uuid: user!.uuid
      },
    },
  });

  /** User, student and profile picture mutation handlers */
  const userMutation = tanstackClient.useMutation('put', '/api/v1/users/{uuid}');
  const updateStudentMutation = tanstackClient.useMutation('put', '/api/v1/students/{uuid}');
  //@ts-ignore
  const profilePicUpload = tanstackClient.useMutation('put', '/api/v1/users/{uuid}/profile-image');
  const { errors, datas, submitting, resetErrors } = useMultiMutations([
    userMutation,
    updateStudentMutation,
  ]); //, profilePicUpload

  // //console.log("Ma errors", errors);
  if (errors && errors.length > 0) {
    errors.forEach(error => {
      Object.keys(error.error).forEach(k => {
        if (k in user!) {
          const fieldName = `user.${k}`;
          // @ts-ignore
          form.setError(fieldName, error.error[k]);
        }
      });
    });
  }

  const onSubmit = useCallback(
    async (data: StudentProfileType) => {
      resetErrors([]);

      /** Upload profile picture */
      if (profilePic.file) {
        const fd = new FormData();
        const fileName = `${crypto.randomUUID()}${profilePic.file.name}`;
        fd.append('profile_image', profilePic.file as Blob, fileName);
        profilePicUpload.mutate({
          params: {
            path: {
              uuid: user!.uuid as UUID,
            },
          },
          // @ts-ignore
          body: fd,
        });
      }

      // //console.log("after profile pic upload", datas![1]);

      /** update User */
      await userMutation.mutateAsync({
        params: {
          path: {
            uuid: user!.uuid as UUID,
          },
        },
        body: {
          ...data.user,
          dob: new Date(data.user.dob!).toISOString()
        },
      });

      /** Update student */
      await updateStudentMutation.mutateAsync({
        params: {
          path: {
            uuid: student!.uuid as UUID,
          },
        },
        body: data.student,
      });

      user!.invalidateQuery!();
    },
    [errors, datas]
  );

  /* async function onSubmit(data: StudentProfileType) {

    } */

  // //console.log(form.formState.errors);
  const ref = useRef(submitting);
  useEffect(() => {
    if (ref.current) {
    }
  }, [submitting]);

  return (
    <div className='max-w-3/4'>
      <div>
        <h1 className='text-2xl font-semibold'>General Info</h1>
        <p className='text-muted-foreground text-sm'>Update your basic profile information</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          {errors && errors.length > 0 && (
            <Alert variant={'destructive'} className='text-red-600'>
              <AlertCircleIcon />
              <AlertTitle>Error processing form</AlertTitle>
              <AlertDescription className='text-red-600'>
                <ul>
                  {errors.map((error: any) => (
                    <li className='text-red-600' key={`${error.message}`}>
                      {error.message}
                    </li>
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
              <div className='flex flex-col items-start gap-8 sm:flex-row'>
                <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4'>
                  <Avatar className='bg-primary-50 h-24 w-24'>
                    <AvatarImage src={profilePic.url} alt='Avatar' />
                    <AvatarFallback className='bg-blue-50 text-xl text-blue-600'>
                      {form.getValues('user').first_name?.[0]}
                      {form.getValues('user').last_name?.[0]}
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

                      {/* 
                                            <Input type="file"
                                                ref={fileElmentRef}
                                                accept="image/*"
                                                className="hidden" onChange={handProfilePicChange} /> */}
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
              <div className='flex flex-col gap-5 md:flex-row'>
                <FormField
                  control={form.control}
                  name='user.first_name'
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
                  name='user.middle_name'
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
                  name='user.last_name'
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
                  name='user.email'
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
                  name='user.phone_number'
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
                  name='user.gender'
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
                  name='user.dob'
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

          <Card>
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
              <CardDescription>Add guardian details for students under 18</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex w-full gap-10'>
                <FormField
                  control={form.control}
                  name='student.first_guardian_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>First Guardian Fullname</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='student.first_guardian_mobile'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>First Guardian Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex w-full gap-10'>
                <FormField
                  control={form.control}
                  name='student.second_guardian_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Second Guardian Fullname</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='student.second_guardian_mobile'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Second Guardian Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className='flex justify-end pt-2'>
            <Button type='submit' className='px-6' disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner /> Saving Changes
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
