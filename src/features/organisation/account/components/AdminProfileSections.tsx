'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import {
  type AdminProfileFormValues,
  adminGenderOptions,
} from '@/src/features/organisation/account/forms/admin-profile';

type AdminProfileSectionsProps = {
  form: UseFormReturn<AdminProfileFormValues>;
};

export function AdminPersonalInformationCard({ form }: AdminProfileSectionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Your personal details as the center administrator</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4'>
          <Avatar className='h-24 w-24'>
            <AvatarImage src='' alt='Admin Avatar' />
            <AvatarFallback className='text-2xl'>AD</AvatarFallback>
          </Avatar>
          <div className='space-y-2'>
            <div className='text-muted-foreground text-sm'>
              Upload your profile picture.
              <br />
              Square images work best. Max size: 5MB
            </div>
            <div className='flex space-x-2'>
              <Button variant='outline' size='sm' type='button'>
                Change
              </Button>
              <Button
                variant='outline'
                size='sm'
                type='button'
                className='text-destructive hover:text-destructive'
              >
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div className='grid gap-6 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='first_name'
            render={({ field }) => (
              <FormItem>
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
            name='last_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder='Doe' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='middle_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Middle Name</FormLabel>
              <FormControl>
                <Input placeholder='Quincy' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid gap-6 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder='admin@example.com' {...field} />
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
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder='+1 (555) 000-0000' {...field} />
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
                      <SelectValue placeholder='Select a gender' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {adminGenderOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='date_of_birth'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={field.value}
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
      </CardContent>
    </Card>
  );
}

export function AdminCredentialsCard({ form }: AdminProfileSectionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login Credentials</CardTitle>
        <CardDescription>Manage your administrator login details</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='admin_username' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='space-y-2'>
          <FormLabel>Password</FormLabel>
          <div className='flex items-center space-x-2'>
            <Input type='password' disabled value='..........' className='flex-1' />
            <Button variant='outline' type='button'>
              Change Password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
