'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { extractEntity } from '@/lib/api-helpers';
import type { TrainingBranch } from '@/services/client';
import {
  createTrainingBranch1Mutation,
  updateTrainingBranch1Mutation,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { BranchLocationField } from './branch-location-field';

const PIN_REQUIRED = 'Add a pin to create this branch';

export const LOCATION_SOURCES = ['search', 'device', 'manual'] as const;
export type LocationSource = (typeof LOCATION_SOURCES)[number];

const BRANCH_QUERY_IDS = [
  'getTrainingBranchesByOrganisation',
  'getTrainingBranchByUuid',
  'getTrainingBranchByUuid1',
] as const;

const branchFormSchema = z.object({
  branch_name: z.string().trim().min(1, 'Branch name is required').max(200),
  address: z.string().trim().max(500).optional(),
  latitude: z
    .number({ required_error: PIN_REQUIRED, invalid_type_error: PIN_REQUIRED })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({ required_error: PIN_REQUIRED, invalid_type_error: PIN_REQUIRED })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  // Where the pin came from, for the preview chip only — never sent to the server.
  location_source: z.enum(LOCATION_SOURCES).optional(),
  poc_name: z.string().trim().min(1, 'Contact person is required').max(200),
  poc_email: z.string().trim().email('Enter a valid contact email').max(320),
  poc_telephone: z.string().trim().min(1, 'Contact phone is required').max(50),
  active: z.boolean(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;

function toFormValues(branch?: TrainingBranch): Partial<BranchFormValues> {
  return {
    branch_name: branch?.branch_name ?? '',
    address: branch?.address ?? '',
    latitude: branch?.latitude ?? undefined,
    longitude: branch?.longitude ?? undefined,
    location_source: undefined,
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
      latitude: values.latitude,
      longitude: values.longitude,
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

      await Promise.all([
        invalidateGeneratedQueryIds(queryClient, BRANCH_QUERY_IDS),
        queryClient.invalidateQueries({ queryKey: ['organization'] }),
      ]);

      if (onSave) {
        onSave(saved);
        return;
      }

      if (saved?.uuid) {
        router.push(dashboardUrl('organisation', `branches/${saved.uuid}`));
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
            <FormLabel>
              Branch name <span className='text-destructive'>*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder='e.g. Westlands Campus' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <BranchLocationField />

      <div className='grid gap-5 sm:grid-cols-2'>
        <FormField
          control={form.control}
          name='poc_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contact person <span className='text-destructive'>*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder='Full name' {...field} />
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
              <FormLabel>
                Contact email <span className='text-destructive'>*</span>
              </FormLabel>
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
              <FormLabel>
                Contact phone <span className='text-destructive'>*</span>
              </FormLabel>
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
    <BranchFormActions isEdit={Boolean(branch?.uuid)} isSaving={isSaving} onCancel={onCancel} />
  );

  if (variant === 'embedded') {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {fields}
          <div className='border-border/70 border-t pt-4'>{actions}</div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='mx-auto w-full max-w-3xl px-3 py-4'>
        <Card>
          <CardHeader>
            <CardTitle>{branch ? `Edit ${branch.branch_name}` : 'New branch'}</CardTitle>
            <CardDescription>
              A branch is a physical training site. Its pin is where every class and job at this
              branch takes place.
            </CardDescription>
          </CardHeader>
          <CardContent>{fields}</CardContent>
          <CardFooter className='border-border/70 block border-t pt-4'>{actions}</CardFooter>
        </Card>
      </form>
    </Form>
  );
}

/** Subscribes to the pin alone so the rest of the form doesn't re-render when it moves. */
function BranchFormActions({
  isEdit,
  isSaving,
  onCancel,
}: {
  isEdit: boolean;
  isSaving: boolean;
  onCancel?: () => void;
}) {
  const { control } = useFormContext<BranchFormValues>();
  const [latitude, longitude] = useWatch({ control, name: ['latitude', 'longitude'] });
  const hasPin = Number.isFinite(latitude) && Number.isFinite(longitude);

  return (
    <div className='flex flex-wrap items-center justify-end gap-2'>
      {!hasPin ? (
        <span className='text-muted-foreground mr-auto flex items-center gap-1.5 text-xs'>
          <Info className='h-3.5 w-3.5' />
          {isEdit ? 'Add a pin to save this branch' : PIN_REQUIRED}
        </span>
      ) : null}
      {onCancel ? (
        <Button type='button' variant='outline' onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      ) : (
        <Button type='button' variant='outline' asChild>
          <Link href={dashboardUrl('organisation', 'branches')}>Cancel</Link>
        </Button>
      )}
      <Button type='submit' disabled={isSaving || !hasPin}>
        {isSaving ? <Spinner className='h-4 w-4' /> : null}
        {isSaving ? 'Saving…' : isEdit ? 'Save branch' : 'Create branch'}
      </Button>
    </div>
  );
}
