'use client';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useUserProfile } from '../../../context/profile-context';
import { createInstructor, createOrganisation, createStudent, updateUser } from '../../../services/client';
import { zUser } from '../../../services/client/zod.gen';

const genders = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

// Base schema for shared onboarding
export const SharedOnboardingSchema = zUser.omit({
  created_date: true,
  updated_date: true,
  updated_by: true,
  middle_name: true,
  profile_image_url: true,
  user_domain: true
}).merge(z.object({
  dob: z.date()
}));

export type SharedOnboardingFormData = z.infer<typeof SharedOnboardingSchema>;

export function SharedOnboardingForm({
  userType
}: {
  userType: "instructor" | "student" | "organisation"
}) {

  const router = useRouter();
  const user = useUserProfile();

  const form = useForm<SharedOnboardingFormData>({
    resolver: zodResolver(SharedOnboardingSchema),
    defaultValues: {
      ...user,
      dob: new Date(user?.dob ?? Date.now())
    },
  });

  const getTitle = () => {
    return 'Organisation Registration';
  };

  const getDescription = () => {
    return 'Complete your organisation profile to start offering courses on our platform';
  };


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);

  // Auto-create student/instructor accounts in background
  useEffect(() => {
    const autoCreateAccount = async () => {
      if (userType === 'organisation' || !user?.uuid || isAutoCreating) return;
      
      setIsAutoCreating(true);
      try {
        if (userType === 'student') {
          await createStudent({
            body: {
              user_uuid: user.uuid
            }
          });
        } else if (userType === 'instructor') {
          await createInstructor({
            body: {
              user_uuid: user.uuid
            }
          });
        }
        
        await user.invalidateQuery?.();
        toast.success('Account created successfully!');
        router.replace('/dashboard/overview');
      } catch (error) {
        toast.error('Failed to create account');
        setIsAutoCreating(false);
      }
    };

    autoCreateAccount();
  }, [userType, user?.uuid, router, user, isAutoCreating]);

  // Show loading state for student/instructor auto-creation
  if (userType !== 'organisation' && isAutoCreating) {
    return (
      <div className='mx-auto max-w-2xl p-6'>
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <div className='mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
          <h2 className='mb-2 text-xl font-semibold'>Setting up your account...</h2>
          <p className='text-gray-600'>Please wait while we create your {userType} profile.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (profData: SharedOnboardingFormData) => {
    setIsSubmitting(true);
    try {
      // Only handle organization creation since student/instructor are handled automatically
      await createOrganisation({
        body: {
          user_uuid: user!.uuid!,
          name: "",
          active: true
        }
      });

      const updateUserResp = await updateUser({
        path: {
          uuid: user!.uuid!
        },
        body: profData
      });

      if (updateUserResp.error) {
        throw new Error(updateUserResp.error.message || 'Failed to update user');
      }
      toast.success('Registration completed successfully!');
      await user!.invalidateQuery!()
      router.replace('/dashboard/overview');

    }
    catch (e) {
      toast.error("Error submitting form");
      setIsSubmitting(false);
    }
  };

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <div className='mb-8 text-center'>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>{getTitle()}</h1>
        <p className='text-gray-600'>{getDescription()}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* Date of Birth */}
          <Card>
            <CardHeader>
              <CardTitle>Date of Birth</CardTitle>
              <CardDescription>Please enter your date of birth</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name='dob'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>
                      Date of Birth <span className='text-red-500'>*</span>
                    </FormLabel>
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date() || date < new Date('1920-01-01')
                          }
                          fromYear={1900}
                          toYear={new Date().getFullYear()}
                          captionLayout='dropdown'
                          className='rounded-md border shadow-sm'
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Your date of birth helps us verify your eligibility
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Phone className='h-5 w-5 text-green-600' />
                Contact Information
              </CardTitle>
              <CardDescription>How we can reach you</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='phone_number'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone Number <span className='text-red-500'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='+1 234 567 8900' {...field} />
                    </FormControl>
                    <FormDescription>
                      Include country code for international numbers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='gender'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Gender <span className='text-red-500'>*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select gender' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genders.map(gender => (
                          <SelectItem key={gender} value={gender.toUpperCase()}>
                            {gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Complete Registration'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default SharedOnboardingForm;
