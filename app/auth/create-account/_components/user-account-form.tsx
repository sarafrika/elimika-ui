'use client';

import { z } from 'zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
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
import { ArrowRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { format } from 'date-fns';

export const ProfessionalBodySchema = z.object({
  id: z.string().nullish(),
  body_name: z.string().min(1, 'Professional body name is required'),
  membership_no: z.string().min(1, 'Membership number is required'),
  member_since: z.date(),
  current: z.boolean().default(true),
  end_year: z.date().nullish(),
  certificate_url: z.string().url('Please enter a valid URL').nullish(),
  description: z.string().nullish(),
});

export const UserFormSchema = z.object({
  uuid: z.string().optional(),
  active: z.boolean().default(true),
  created_date: z.string().optional(),
  modified_date: z.string().optional(),
  organisation_uuid: z.string().optional(),
  middle_name: z.string().optional().nullish(),
  last_name: z.string().min(1, 'Last name is required'),
  first_name: z.string().min(1, 'First name is required'),
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  accept_terms: z.boolean().refine(val => val, {
    message: 'You must accept the terms and conditions',
  }),
  dob: z.preprocess(
    arg => {
      if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg);
      }
      return arg;
    },
    z.date({ required_error: 'Date of birth is required' })
  ),

  phone_number: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits'),
  professional_bodies: ProfessionalBodySchema.nullish(),
});

export type User = z.infer<typeof UserFormSchema>;

interface UserAccountFormProps {
  title?: string;
  description?: string;
  isSubmitting: boolean;
  organisationUuid: string | null;

  onSubmit(data: User): Promise<void>;
}

export function UserAccountForm({
  onSubmit,
  isSubmitting,
  organisationUuid,
  title = 'Personal Information',
  description = 'Enter your details to create your account',
}: UserAccountFormProps) {
  const userAccountForm = useForm<User>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      email: '',
      active: true,
      username: '',
      last_name: '',
      first_name: '',
      middle_name: '',
      accept_terms: false,
      phone_number: '',
      organisation_uuid: organisationUuid || '',
      dob: undefined,
    },
  });

  const renderBaseAccountFormFields = (form: UseFormReturn<User>) => {
    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='first_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  First Name <span className='text-red-500'>*</span>
                </FormLabel>
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
              <FormItem>
                <FormLabel>Middle Name</FormLabel>
                <FormControl>
                  <Input placeholder='William' {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='last_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Last Name <span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder='Doe' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Username <span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder='johndoe' {...field} />
              </FormControl>
              <FormDescription className='text-xs'>
                Username must be at least 3 characters long
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email <span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Input type='email' placeholder='john.doe@example.com' {...field} />
              </FormControl>
              <FormDescription className='text-xs'>
                We&apos;ll never share your email with anyone else.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='phone_number'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Phone Number <span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder='+1234567890' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='dob'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input
                  type='date'
                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                  onChange={e =>
                    field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  const renderAcceptTermsFormField = (form: UseFormReturn<User>) => {
    return (
      <FormField
        control={form.control}
        name='accept_terms'
        render={({ field }) => (
          <FormItem className='flex items-start space-y-0 space-x-2'>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className='leading-none'>
              <FormLabel className='text-xs text-gray-600'>
                I agree to the{' '}
                <Link href='#' className='text-blue-500 hover:underline'>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href='#' className='text-blue-500 hover:underline'>
                  Privacy Policy
                </Link>
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    );
  };

  const handleSubmit = async (data: User) => {
    if (!organisationUuid) {
      return;
    }

    const userData = {
      ...data,
      organisation_uuid: organisationUuid,
    };

    await onSubmit(userData);
  };

  return (
    <Form {...userAccountForm}>
      <form onSubmit={userAccountForm.handleSubmit(handleSubmit)} className='space-y-6'>
        <div className='rounded-md border bg-white p-6'>
          <h2 className='mb-1 text-lg font-medium'>{title}</h2>
          <p className='mb-4 text-sm text-gray-500'>{description}</p>
          {renderBaseAccountFormFields(userAccountForm)}
        </div>

        <div className='pt-4'>
          {renderAcceptTermsFormField(userAccountForm)}
          <div className='mt-6 flex items-center justify-end space-x-4'>
            <Button type='submit' disabled={isSubmitting} className='flex-1' size='lg'>
              {isSubmitting ? (
                <div className='flex items-center gap-2'>
                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  Processing...
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  Create Account
                  <ArrowRight className='h-4 w-4' />
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
