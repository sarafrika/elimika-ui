'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const trainingCenterSchema = z.object({
  name: z.string().min(1, 'Organisation name is required'),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  code: z.string().optional(),
});

type TrainingCenterFormValues = z.infer<typeof trainingCenterSchema>;

export default function TrainingCenterPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'account', title: 'Account', url: '/dashboard/account' },
      {
        id: 'training-center',
        title: 'Training Center',
        url: '/dashboard/account/training-center',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const form = useForm<TrainingCenterFormValues>({
    resolver: zodResolver(trainingCenterSchema),
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
      email: '',
      phoneNumber: '',
      website: '',
      address: '',
      domain: '',
      code: '',
    },
  });

  const onSubmit = (data: TrainingCenterFormValues) => {
    // TODO: Implement submission logic, including file upload for the logo
    //console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Training Center Profile</CardTitle>
            <CardDescription>
              Manage your organisation&apos;s core details, branding, and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-8'>
            <FormField
              control={form.control}
              name='logoUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation Logo</FormLabel>
                  <div className='flex items-center gap-x-4'>
                    <Avatar className='h-20 w-20 rounded-lg'>
                      <AvatarImage src={field.value ?? undefined} />
                      <AvatarFallback className='rounded-lg'>Logo</AvatarFallback>
                    </Avatar>
                    <FormControl>
                      <Input
                        type='file'
                        className='max-w-xs'
                        onChange={e => {
                          // Handle file upload preview
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              form.setValue('logoUrl', reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Elimika' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Your Organisation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Tell us a little about your organisation'
                      className='resize-none'
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='contact@elimika.org' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder='+254 700 000 000' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='website'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder='https://elimika.org' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Address</FormLabel>
                    <FormControl>
                      <Input placeholder='123 Elimika St, Nairobi' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='domain'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input placeholder='elimika.org' {...field} />
                    </FormControl>
                    <FormDescription>
                      Your organisation&apos;s primary domain for students and instructors.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisation Code</FormLabel>
                    <FormControl>
                      <Input placeholder='ELK-001' {...field} />
                    </FormControl>
                    <FormDescription>
                      An internal or unique code for your organisation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className='flex justify-end'>
          <Button type='submit'>Update Profile</Button>
        </div>
      </form>
    </Form>
  );
}
