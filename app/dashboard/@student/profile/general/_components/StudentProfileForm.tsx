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
import { cn, profilePicSvg } from '@/lib/utils';
import { appStore } from '@/store/app-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { UUID } from 'crypto';
import { format } from 'date-fns';
import { AlertCircleIcon, CalendarIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Student, User } from '@/services/client';
import { zStudent, zUser } from '@/services/client/zod.gen';
import {
  updateUserMutation,
  updateStudentMutation,
} from '@/services/client/@tanstack/react-query.gen';

// User form schema
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

// Student form schema
const studentFormSchema = zStudent.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
  created_by: true,
  updated_by: true,
  secondaryGuardianContact: true,
  primaryGuardianContact: true,
  allGuardianContacts: true,
});

type UserFormValues = z.infer<typeof userFormSchema>;
type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function StudentProfileGeneralForm({
                                                    user,
                                                    student,
                                                  }: {
  user: User;
  student?: Student;
}) {
  const session = useSession();
  const appSrore = appStore();

  /** For handling profile picture preview */
  const fileElmentRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<ImageType>({
    url: user.profile_image_url ?? profilePicSvg,
  });

  // User form
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
      user_domain: ['student'],
      profile_image_url: user.profile_image_url || profilePicSvg,
    },
  });

  // Student form
  const studentForm = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      user_uuid: user.uuid,
      first_guardian_name: student?.first_guardian_name || '',
      first_guardian_mobile: student?.first_guardian_mobile || '',
      second_guardian_name: student?.second_guardian_name || '',
      second_guardian_mobile: student?.second_guardian_mobile || '',
    },
  });

  // React Query Mutations
  const userMutation = useMutation(updateUserMutation());
  const updateStudentMut = useMutation(updateStudentMutation());

  // Check if any mutation is loading
  const submitting = userMutation.isPending || updateStudentMut.isPending;

  // Collect all errors
  const errors = [userMutation.error, updateStudentMut.error].filter(Boolean);

  async function onSubmitUser(data: UserFormValues) {
    try {
      await userMutation.mutateAsync({
        path: {
          uuid: user.uuid as UUID,
        },
        body: {
          ...data,
          dob: new Date(data.dob),
        },
      });

      // Update session
      await session.update({
        ...session.data,
        user: { ...user, ...data }
      });

      toast.success('Personal information updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update personal information';
      toast.error(errorMessage);
    }
  }

  async function onSubmitStudent(data: StudentFormValues) {
    try {
      if (student?.uuid) {
        await updateStudentMut.mutateAsync({
          path: {
            uuid: student.uuid as UUID,
          },
          body: data,
        });

        // Update store
        appSrore.softUpdate('student', { ...student, ...data });

        toast.success('Guardian information updated successfully!');
      }
    } catch (error: unknown) {
      console.error('Error updating student:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update guardian information';
      toast.error(errorMessage);
    }
  }

  return (
    <div className='max-w-3/4'>
      <div>
        <h1 className='text-2xl font-semibold'>General Info</h1>
        <p className='text-muted-foreground text-sm'>Update your basic profile information</p>
      </div>

      {/* Display errors if any */}
      {errors.length > 0 && (
        <Alert variant={'destructive'} className='text-red-600 mb-6'>
          <AlertCircleIcon />
          <AlertTitle>Error processing form</AlertTitle>
          <AlertDescription className='text-red-600'>
            <ul>
              {errors.map((error: unknown, index) => (
                <li className='text-red-600' key={index}>
                  {error instanceof Error ? error.message : 'An error occurred'}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Personal Information Form */}
      <Form {...userForm}>
        <form onSubmit={userForm.handleSubmit(onSubmitUser)} className='space-y-8'>
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Your basic personal information</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex flex-col items-start gap-8 sm:flex-row'>
                <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4'>
                  <Avatar className='bg-primary-50 h-24 w-24'>
                    <AvatarImage src={profilePic.url} alt='Avatar' />
                    <AvatarFallback className='bg-blue-50 text-xl text-blue-600'>
                      {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
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

              <div className='flex flex-col gap-5 md:flex-row'>
                <FormField
                  control={userForm.control}
                  name='first_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder='John' {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name='middle_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Adams'
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
                  control={userForm.control}
                  name='last_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Doe' {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex flex-col gap-5 md:flex-row'>
                <FormField
                  control={userForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='name@example.com'
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
                  name='phone_number'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type='tel'
                          placeholder='+254712345678'
                          {...field}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex flex-col gap-5 md:flex-row'>
                <FormField
                  control={userForm.control}
                  name='gender'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={submitting}
                      >
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
                  control={userForm.control}
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
                              disabled={submitting}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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

              <div className='flex justify-end pt-2'>
                <Button type='submit' className='px-6' disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner /> Saving Personal Info
                    </>
                  ) : (
                    'Save Personal Info'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Guardian Information Form */}
      <Form {...studentForm}>
        <form onSubmit={studentForm.handleSubmit(onSubmitStudent)} className='space-y-8'>
          <Card>
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
              <CardDescription>Add guardian details for emergency contact</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex w-full gap-10'>
                <FormField
                  control={studentForm.control}
                  name='first_guardian_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>First Guardian Fullname</FormLabel>
                      <FormControl>
                        <Input
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
                  control={studentForm.control}
                  name='first_guardian_mobile'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>First Guardian Mobile Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex w-full gap-10'>
                <FormField
                  control={studentForm.control}
                  name='second_guardian_name'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Second Guardian Fullname</FormLabel>
                      <FormControl>
                        <Input
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
                  control={studentForm.control}
                  name='second_guardian_mobile'
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormLabel>Second Guardian Mobile Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end pt-2'>
                <Button type='submit' className='px-6' disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner /> Saving Guardian Info
                    </>
                  ) : (
                    'Save Guardian Info'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}