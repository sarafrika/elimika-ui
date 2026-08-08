'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import LocationInput from '@/components/locationInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
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
import { coordinatesFromPlace } from '@/lib/location-types';
import type { Organisation } from '@/services/client';
import { updateOrganisationMutation } from '@/services/client/@tanstack/react-query.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { formatDate } from '../settings-config';

/**
 * Only the columns `Organisation` actually persists. The Lovable reference also
 * showed Email / Phone / Website inputs — there is no organisation-level column
 * behind any of them, so they are deliberately absent rather than rendered as
 * controls that silently discard what is typed into them.
 */
const institutionProfileSchema = z.object({
  name: z.string().trim().min(1, 'Institution name is required').max(200),
  licence_no: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  location: z.string().trim().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().trim().max(2000).optional(),
});

type InstitutionProfileFormValues = z.infer<typeof institutionProfileSchema>;

function toFormValues(organisation: Organisation | null): InstitutionProfileFormValues {
  return {
    name: organisation?.name ?? '',
    licence_no: organisation?.licence_no ?? '',
    country: organisation?.country ?? '',
    location: organisation?.location ?? '',
    latitude: organisation?.latitude ?? undefined,
    longitude: organisation?.longitude ?? undefined,
    description: organisation?.description ?? '',
  };
}

export function InstitutionProfilePanel() {
  const queryClient = useQueryClient();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const form = useForm<InstitutionProfileFormValues>({
    resolver: zodResolver(institutionProfileSchema),
    defaultValues: toFormValues(organisation),
  });

  const { isDirty } = form.formState;
  const { reset } = form;

  // A primitive snapshot so the effect only re-seeds when the record itself
  // changes, not on every context re-render.
  const snapshot = JSON.stringify(toFormValues(organisation));

  // Re-seed once the organisation query resolves, but never clobber edits in flight.
  useEffect(() => {
    if (!isDirty) {
      reset(JSON.parse(snapshot) as InstitutionProfileFormValues);
    }
  }, [reset, isDirty, snapshot]);

  const updateOrganisation = useMutation(updateOrganisationMutation());

  const onSubmit = async (values: InstitutionProfileFormValues) => {
    if (!organisation?.uuid) {
      toast.error('No organisation is loaded yet.');
      return;
    }

    try {
      await updateOrganisation.mutateAsync({
        path: { uuid: organisation.uuid },
        body: {
          ...organisation,
          name: values.name,
          licence_no: values.licence_no || null,
          country: values.country || null,
          location: values.location || null,
          latitude: values.latitude ?? null,
          longitude: values.longitude ?? null,
          description: values.description || null,
        },
      });

      toast.success('Institution profile updated');
      form.reset(values);
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
    } catch {
      toast.error('Unable to update the institution profile right now.');
    }
  };

  return (
    <div className='grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]'>
      <Card className='border-border/70 rounded-md p-0 shadow-sm'>
        <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
          <CardTitle className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
            <Building2 className='text-primary size-4 sm:size-5' />
            Institution Profile
          </CardTitle>
          <CardDescription>Update your school or institution details.</CardDescription>
        </CardHeader>

        <CardContent className='px-4 py-5 sm:px-5'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution name</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Skills Wallets Campus' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='licence_no'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Licence number</FormLabel>
                      <FormControl>
                        <Input placeholder='Registration or licence number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical address</FormLabel>
                      <FormControl>
                        <LocationInput
                          {...field}
                          placeholder='Search for your address — e.g. Waiyaki Way, Westlands'
                          coordinates={{
                            latitude: form.watch('latitude'),
                            longitude: form.watch('longitude'),
                          }}
                          onSuggest={response => {
                            const { latitude, longitude } = coordinatesFromPlace(response);
                            if (latitude !== undefined) form.setValue('latitude', latitude);
                            if (longitude !== undefined) form.setValue('longitude', longitude);
                            return response;
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='country'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <CountrySelect {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About this institution</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        className='resize-none'
                        placeholder='What your institution does, who it serves…'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Shown to learners and partners across Elimika.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  className='min-w-[140px]'
                  onClick={() => form.reset(toFormValues(organisation))}
                  disabled={!isDirty || updateOrganisation.isPending}
                >
                  Discard changes
                </Button>
                <Button
                  type='submit'
                  className='min-w-[140px]'
                  disabled={!isDirty || updateOrganisation.isPending || !organisationUuid}
                >
                  {updateOrganisation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className='border-border/70 h-fit rounded-md p-0 shadow-sm'>
        <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
          <CardTitle className='text-base font-semibold sm:text-lg'>Record status</CardTitle>
          <CardDescription>Read-only fields the platform maintains for you.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 px-4 py-5 sm:px-5'>
          <div className='border-border/70 flex items-center justify-between gap-4 rounded-[16px] border px-4 py-3.5'>
            <div className='min-w-0'>
              <p className='text-muted-foreground text-[0.78rem] font-medium'>Verification</p>
              <p className='text-foreground text-sm font-semibold'>
                {organisation?.admin_verified ? 'Verified by Elimika' : 'Awaiting review'}
              </p>
            </div>
            <Badge variant={organisation?.admin_verified ? 'success' : 'secondary'}>
              {organisation?.admin_verified ? 'Verified' : 'Pending'}
            </Badge>
          </div>

          <div className='border-border/70 rounded-[16px] border px-4 py-3.5'>
            <p className='text-muted-foreground text-[0.78rem] font-medium'>Created</p>
            <p className='text-foreground text-sm font-semibold'>
              {formatDate(organisation?.created_date ?? null)}
            </p>
          </div>

          <div className='border-border/70 rounded-[16px] border px-4 py-3.5'>
            <p className='text-muted-foreground text-[0.78rem] font-medium'>Public profile slug</p>
            <p className='text-foreground truncate text-sm font-semibold'>
              {organisation?.slug || 'Not generated yet'}
            </p>
          </div>

          <div className='border-border/70 rounded-[16px] border px-4 py-3.5'>
            <p className='text-muted-foreground text-[0.78rem] font-medium'>Status</p>
            <p className='text-foreground text-sm font-semibold'>
              {organisation?.active ? 'Active' : 'Inactive'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
