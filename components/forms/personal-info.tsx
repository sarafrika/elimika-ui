import { zUser } from '@/services/client/zod.gen';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, User } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User as userSchema } from '@/services/client';

const userFormSchema = zUser.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
  created_by: true,
  updated_by: true,
  display_name: true,
  full_name: true,
  profile_image_url: true,
  keycloak_id: true,
});

export type UserFormData = z.infer<typeof userFormSchema>;

export default function PersonalInfoForm({
  userData,
  onSubmit,
  isSubmitting,
}: {
  userData?: userSchema;
  onSubmit: (data: UserFormData) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: userData?.first_name || '',
      middle_name: userData?.middle_name || '',
      last_name: userData?.last_name || '',
      email: userData?.email || '',
      username: userData?.username || '',
      dob: userData?.dob ? new Date(userData.dob).toISOString().split('T')[0] : '',
      phone_number: userData?.phone_number || '',
      gender: userData?.gender || 'PREFER_NOT_TO_SAY',
      active: true,
      user_domain: ['instructor'],
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        first_name: userData.first_name || '',
        middle_name: userData.middle_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        username: userData.username || '',
        dob: userData.dob ? new Date(userData.dob).toISOString().split('T')[0] : '',
        phone_number: userData.phone_number || '',
        gender: userData.gender || 'PREFER_NOT_TO_SAY',
        active: true,
        user_domain: ['instructor'],
      });
    }
  }, [userData, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='h-5 w-5 text-[#1976D2]' />
          Personal Information
        </CardTitle>
        <CardDescription>
          Please provide your basic information to create your Elimika account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Name Fields */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      First Name <span className='text-red-500'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='John' disabled={isSubmitting} {...field} />
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
                      <Input placeholder='Optional' disabled={isSubmitting} {...field} />
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
                    <FormLabel>
                      Last Name <span className='text-red-500'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='Doe' disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email Address <span className='text-red-500'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='john.doe@example.com'
                        disabled={isSubmitting}
                        {...field}
                      />
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
                      <Input placeholder='johndoe' disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date of Birth */}
            <FormField
              control={form.control}
              name='dob'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Date of Birth <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='date'
                      disabled={isSubmitting}
                      min='1920-01-01'
                      max={new Date().toISOString().split('T')[0]}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone and Gender */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='phone_number'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone Number <span className='text-red-500'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='+254 712 345 678' disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormDescription>Must be a valid Kenyan phone number</FormDescription>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select gender' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='MALE'>Male</SelectItem>
                        <SelectItem value='FEMALE'>Female</SelectItem>
                        <SelectItem value='OTHER'>Other</SelectItem>
                        <SelectItem value='PREFER_NOT_TO_SAY'>Prefer Not To Say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex justify-end'>
              <Button
                type='submit'
                className='bg-[#1976D2] hover:bg-[#1976D2]/90'
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
                {!isSubmitting && <ArrowRight className='ml-2 h-4 w-4' />}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}