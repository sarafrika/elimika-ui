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
import { useUserProfile } from '@/context/profile-context';
import { createOrganisation } from '@/services/client';
import { zOrganisation } from '@/services/client/zod.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import LocationInput from '../../../components/locationInput';

const OrganizationOnboardingSchema = zOrganisation.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
});

type OrganizationOnboardingFormData = z.infer<typeof OrganizationOnboardingSchema>;

const _organizationTypes = [
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
      licence_no: '',
      location: '',
      country: '',
    },
  });

  const latitudeWatch = form.watch('latitude');
  const longitudeWatch = form.watch('longitude');

  const normalizeCoordinate = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const watchedCoordinates = {
    latitude: normalizeCoordinate(latitudeWatch),
    longitude: normalizeCoordinate(longitudeWatch),
  };

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (!error || typeof error !== 'object') return fallback;
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    if ('error' in error && typeof (error as any).error?.message === 'string') {
      return (error as any).error.message;
    }
    if ('data' in error && typeof (error as any).data?.message === 'string') {
      return (error as any).data.message;
    }
    return fallback;
  };

  const handleSubmit = async (data: OrganizationOnboardingFormData) => {
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createOrganisation({
        body: data,
        // ensure API errors are surfaced
        throwOnError: true,
      });

      if (response?.error) {
        throw new Error(response.error.message || 'Failed to register organization.');
      }

      // Invalidate organization-related queries
      await queryClient.invalidateQueries({ queryKey: ['organisations', 'profile'] });
      if (user.invalidateQuery) {
        await user.invalidateQuery();
      }

      const successMessage =
        (response as any)?.message ||
        (response as any)?.data?.message ||
        'Organization registered successfully!';
      toast.success(successMessage);
      router.replace('/dashboard/overview');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to register organization. Please try again.'));
    }
    setIsSubmitting(false);
  };

  return (
    <div className='mx-auto max-w-3xl space-y-8 rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur-sm'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20'>
          <Building2 className='h-8 w-8' />
        </div>
        <h1 className='mb-2 text-3xl font-bold text-foreground'>Organization Registration</h1>
        <p className='text-muted-foreground'>
          Register your organization to start offering courses
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
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
                      Organization Name <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='Elimika Training Institute' {...field} />
                    </FormControl>
                    <FormDescription>Official name of your organization</FormDescription>
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
                    <FormDescription>Official license or registration number</FormDescription>
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
                      <LocationInput
                        {...field}
                        coordinates={watchedCoordinates}
                        onSuggest={result => {
                          const feature = result.features[0];
                          const coordinates = feature?.properties?.coordinates;
                          const contextCountry =
                            (feature?.properties?.context as any)?.country?.name ??
                            feature?.properties?.context?.country_name;

                          if (
                            typeof coordinates?.latitude === 'number' &&
                            typeof coordinates?.longitude === 'number'
                          ) {
                            form.setValue('latitude', coordinates.latitude);
                            form.setValue('longitude', coordinates.longitude);
                          }
                          if (contextCountry) {
                            form.setValue('country', contextCountry);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>Physical location or address of your organization</FormDescription>
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
                    <FormDescription>Country where your organization is located</FormDescription>
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
                      Provide additional context about your organization&apos;s purpose and activities
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className='border-primary/20 bg-primary/5'>
            <CardContent className='space-y-1'>
              <h3 className='font-medium text-foreground'>Next Steps</h3>
              <p className='text-sm text-muted-foreground'>
                After registration, you&apos;ll be able to create training branches, invite
                instructors and students, and start offering courses through your organization.
              </p>
            </CardContent>
          </Card>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Registering Organization...' : 'Complete Organization Registration'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
