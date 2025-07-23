'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// Simplified schema for student onboarding - only guardian information
export const StudentOnboardingSchema = z
  .object({
    // User reference
    user_uuid: z.string(),

    // Date of birth
    date_of_birth: z.date({
      required_error: 'Please enter your date of birth',
    }),

    // Phone number (for students 18+)
    phone_number: z.string().optional(),

    // Guardian information (required for students under 18)
    first_guardian_name: z.string().optional(),
    first_guardian_mobile: z
      .string()
      .regex(/^\+?[\d\s-()]*$/, 'Please enter a valid mobile number')
      .optional(),

    second_guardian_name: z.string().optional(),
    second_guardian_mobile: z
      .string()
      .regex(/^\+?[\d\s-()]*$/, 'Please enter a valid mobile number')
      .optional(),
  })
  .refine(
    data => {
      const today = new Date();
      const birthDate = new Date(data.date_of_birth);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const isAdult = age > 18 || (age === 18 && monthDiff >= 0);

      // If under 18, require guardian information and consent
      if (!isAdult) {
        return data.first_guardian_name && data.first_guardian_mobile;
      }
      // If 18 or over, require phone number
      return !!data.phone_number;
    },
    {
      message: 'Please fill in all required fields based on age',
    }
  );

export type StudentOnboardingFormData = z.infer<typeof StudentOnboardingSchema>;

interface StudentOnboardingFormProps {
  userUuid: string;
  isSubmitting: boolean;
  onSubmit: (data: StudentOnboardingFormData) => Promise<void>;
}

export function StudentOnboardingForm({
  userUuid,
  isSubmitting,
  onSubmit,
}: StudentOnboardingFormProps) {
  const form = useForm<StudentOnboardingFormData>({
    resolver: zodResolver(StudentOnboardingSchema),
    defaultValues: {
      user_uuid: userUuid,
      date_of_birth: undefined,
      phone_number: '',
      first_guardian_name: '',
      first_guardian_mobile: '',
      second_guardian_name: '',
      second_guardian_mobile: '',
    },
  });

  const dateOfBirth = form.watch('date_of_birth');
  const isAdult = dateOfBirth
    ? (() => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        return age > 18 || (age === 18 && monthDiff >= 0);
      })()
    : false;
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      form.setValue('date_of_birth', newDate);
    }
  };

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <div className='mb-8 text-center'>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>Student Registration</h1>
        <p className='text-gray-600'>Please provide your information to complete the enrollment.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Date of Birth Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Date of Birth</CardTitle>
              <CardDescription>
                Please enter your date of birth to proceed with the appropriate registration form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name='date_of_birth'
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
                          onSelect={handleDateSelect}
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
                      Your date of birth helps us determine the appropriate registration process
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Only show the rest of the form if date of birth is entered */}
          {dateOfBirth && (
            <>
              {/* Adult Phone Number Form */}
              {isAdult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Please provide your contact information</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              )}

              {/* Guardian Information - Only show if under 18 */}
              {dateOfBirth && !isAdult && (
                <>
                  {/* Primary Guardian Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Users className='h-5 w-5 text-blue-600' />
                        Primary Guardian Information
                      </CardTitle>
                      <CardDescription>
                        This guardian will be the main emergency contact for the student
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='first_guardian_name'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Full Name <span className='text-red-500'>*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Guardian's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='first_guardian_mobile'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Mobile Number <span className='text-red-500'>*</span>
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
                    </CardContent>
                  </Card>

                  {/* Secondary Guardian Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Users className='h-5 w-5 text-gray-600' />
                        Secondary Guardian Information
                        <Badge variant='secondary'>Optional</Badge>
                      </CardTitle>
                      <CardDescription>
                        Additional emergency contact for the student
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='second_guardian_name'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Second guardian's full name (optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='second_guardian_mobile'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input placeholder='+1 234 567 8900 (optional)' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Submit Button - Only show if date of birth is entered */}
              {dateOfBirth && (
                <div className='flex justify-center'>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    size='lg'
                    className='w-full max-w-md'
                  >
                    {isSubmitting ? (
                      <div className='flex items-center gap-2'>
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                        Completing Registration...
                      </div>
                    ) : (
                      <div className='flex items-center gap-2'>
                        Complete Student Registration
                        <CheckCircle2 className='h-4 w-4' />
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </form>
      </Form>
    </div>
  );
}
