'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import LocationInput from '@/components/locationInput';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { PhoneInput } from '@/components/ui/phone-input';
import { Switch } from '@/components/ui/switch';
import { extractEntity } from '@/lib/api-helpers';
import { coordinatesFromPlace } from '@/lib/location-types';
import type { TrainingBranch } from '@/services/client';
import {
  createTrainingBranch1Mutation,
  getTrainingBranchesByOrganisationQueryKey,
  updateTrainingBranch1Mutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';

/**
 * Capacity is typed as a string so an empty input stays empty instead of
 * coercing to `0` and tripping a "must be positive" error on an optional field.
 */
const branchFormSchema = z.object({
  branch_name: z.string().trim().min(1, 'Branch name is required').max(200),
  address: z.string().trim().max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  poc_name: z.string().trim().min(1, 'Point of contact name is required').max(200),
  poc_email: z.string().trim().email('Enter a valid email address').max(320),
  poc_telephone: z.string().trim().min(1, 'Point of contact phone is required').max(50),
  active: z.boolean(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;

function toFormValues(branch?: TrainingBranch): BranchFormValues {
  return {
    branch_name: branch?.branch_name ?? '',
    address: branch?.address ?? '',
    latitude: branch?.latitude ?? undefined,
    longitude: branch?.longitude ?? undefined,
    poc_name: branch?.poc_name ?? '',
    poc_email: branch?.poc_email ?? '',
    poc_telephone: branch?.poc_telephone ?? '',
    active: branch?.active ?? true,
  };
}

export type CreateEditBranchformProps = {
  branch?: TrainingBranch;
  /**
   * Called with the saved branch. Supplying it also suppresses the
   * navigate-to-detail-page behaviour, so the form can live inside an overlay.
   */
  onSave?: (branch: TrainingBranch | null) => void;
  /** Renders a Cancel button that calls back instead of linking away. */
  onCancel?: () => void;
  /**
   * `page` keeps the standalone Card chrome used by the branch detail route;
   * `embedded` drops it so the form can sit inside a Dialog.
   */
  variant?: 'page' | 'embedded';
};

export default function CreateEditBranchform({
  branch,
  onSave,
  onCancel,
  variant = 'page',
}: CreateEditBranchformProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = branch?.organisation_uuid ?? organisation?.uuid ?? '';

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: toFormValues(branch),
  });

  const createBranch = useMutation(createTrainingBranch1Mutation());
  const updateBranch = useMutation(updateTrainingBranch1Mutation());
  const isSaving = createBranch.isPending || updateBranch.isPending;

  async function onSubmit(values: BranchFormValues) {
    if (!organisationUuid) {
      toast.warning('No organisation loaded');
      return;
    }

    const body: TrainingBranch = {
      organisation_uuid: organisationUuid,
      branch_name: values.branch_name,
      address: values.address || null,
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
      poc_name: values.poc_name,
      poc_email: values.poc_email,
      poc_telephone: values.poc_telephone,
      active: values.active,
    };

    try {
      const response = branch?.uuid
        ? await updateBranch.mutateAsync({
            path: { uuid: organisationUuid, branchUuid: branch.uuid },
            body,
          })
        : await createBranch.mutateAsync({ path: { uuid: organisationUuid }, body });

      const saved = extractEntity<TrainingBranch>(response);

      toast.success(branch?.uuid ? 'Branch updated' : 'Branch created');

      await queryClient.invalidateQueries({
        queryKey: getTrainingBranchesByOrganisationQueryKey({
          path: { uuid: organisationUuid },
          query: { pageable: { page: 0, size: 100 } },
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ['organization'] });

      if (onSave) {
        onSave(saved);
        return;
      }

      if (saved?.uuid) {
        router.push(`/dashboard/organisation/branches/${saved.uuid}`);
      }
    } catch {
      toast.error(branch?.uuid ? 'Unable to update this branch' : 'Unable to create this branch');
    }
  }

  const fields = (
    <div className='flex flex-col gap-5'>
      <FormField
        control={form.control}
        name='branch_name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Branch name</FormLabel>
            <FormControl>
              <Input placeholder='e.g. Westlands Campus' {...field} />
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
            <FormLabel>Location</FormLabel>
            <FormControl>
              <LocationInput
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder='Search for the address — e.g. 123 Waiyaki Way'
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

      <div className='grid gap-5 sm:grid-cols-2'>
        <FormField
          control={form.control}
          name='poc_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Point of contact</FormLabel>
              <FormControl>
                <Input placeholder='Point of contact name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='poc_email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Point of contact email</FormLabel>
              <FormControl>
                <Input type='email' placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='poc_telephone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Point of contact phone</FormLabel>
              <FormControl>
                <PhoneInput {...field} placeholder='+254 700 000 000' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='active'
          render={({ field }) => (
            <FormItem className='flex flex-col justify-end gap-2'>
              <FormLabel>Status</FormLabel>
              <div className='flex items-center gap-3'>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label='Branch is active'
                  />
                </FormControl>
                <span className='text-muted-foreground text-sm'>
                  {field.value ? 'Active and bookable' : 'Inactive and hidden'}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const actions = (
    <>
      <Button type='submit' disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Saving…
          </>
        ) : branch?.uuid ? (
          'Save branch'
        ) : (
          'Create branch'
        )}
      </Button>
      {onCancel ? (
        <Button type='button' variant='outline' onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      ) : (
        <Button type='button' variant='ghost' asChild>
          <Link href='/dashboard/organisation/settings?tab=branches'>Cancel</Link>
        </Button>
      )}
    </>
  );

  if (variant === 'embedded') {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {fields}
          <div className='flex flex-row-reverse gap-3'>{actions}</div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className='max-w-[80%]'>
          <CardHeader>
            <CardTitle>{branch ? `Edit ${branch.branch_name}` : 'New branch'}</CardTitle>
            <CardDescription>Manage branch details</CardDescription>
          </CardHeader>
          <CardContent>{fields}</CardContent>
          <CardFooter className='flex flex-row-reverse gap-3'>{actions}</CardFooter>
        </Card>
      </form>
    </Form>
  );
}
