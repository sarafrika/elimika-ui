'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/context/profile-context';
import { createOrganisation } from '@/services/client';
import { zOrganisation } from '@/services/client/zod.gen';

const OrganizationOnboardingSchema = zOrganisation.omit({ 
  uuid: true,
  domain: true, 
  created_date: true, 
  updated_date: true,
});

type OrganizationOnboardingFormData = z.infer<typeof OrganizationOnboardingSchema>;

const organizationTypes = [
  { value: 'PROFESSIONAL_INSTITUTE', label: 'Professional Institute' },
  { value: 'CERTIFICATION_BODY', label: 'Certification Body' },
  { value: 'INDUSTRY_ASSOCIATION', label: 'Industry Association' },
  { value: 'ACADEMIC_SOCIETY', label: 'Academic Society' },
  { value: 'TRADE_ORGANIZATION', label: 'Trade Organization' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function OrganizationOnboardingForm() {
  const router = useRouter();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganizationOnboardingFormData>({
    resolver: zodResolver(OrganizationOnboardingSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
      code: '',
      licence_no: '',
      user_uuid: user?.uuid || '',
      location: '',
      country: '',
    },
  });

  const handleSubmit = async (data: OrganizationOnboardingFormData) => {
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrganisation({
        body: data
      });

      // Invalidate organization-related queries
      await queryClient.invalidateQueries({ queryKey: ['organisations'] });
      
      // Invalidate and refetch user profile to get updated user_domain
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await user.invalidateQuery?.();

      toast.success('Organization registered successfully!');
      router.replace('/dashboard/overview');
    } catch (error) {
      toast.error('Failed to register organization. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <div className='mb-8 text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100'>
          <Building2 className='h-8 w-8 text-purple-600' />
        </div>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>Organization Registration</h1>
        <p className='text-gray-600'>Register your organization to start offering courses</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization Name <span className='text-red-500'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='Elimika Training Institute' {...field} />
                    </FormControl>
                    <FormDescription>
                      Official name of your organization
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
                    <FormLabel>Organization Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='ELI' {...field} />
                    </FormControl>
                    <FormDescription>
                      Short code or abbreviation for your organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='licence_no'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='REG-123456' {...field} />
                    </FormControl>
                    <FormDescription>
                      Official license or registration number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='location'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='123 Main Street, Downtown' {...field} />
                    </FormControl>
                    <FormDescription>
                      Physical location or address of your organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='country'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Kenya' {...field} />
                    </FormControl>
                    <FormDescription>
                      Country where your organization is located
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='Describe your organization, its mission, and the types of courses you offer...'
                        className='resize-none'
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide additional context about your organization's purpose and activities
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className='rounded-lg bg-yellow-50 p-4'>
            <h3 className='font-medium text-yellow-900'>Next Steps</h3>
            <p className='mt-1 text-sm text-yellow-700'>
              After registration, you'll be able to create training branches, invite instructors and students, 
              and start offering courses through your organization.
            </p>
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Registering Organization...' : 'Complete Organization Registration'}
          </Button>
        </form>
      </Form>
    </div>
  );
}