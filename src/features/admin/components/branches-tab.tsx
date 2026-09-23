'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SectionCard, StatusBadge } from '@/components/data-display';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import type { Organisation, TrainingBranch } from '@/services/client';
import { ConfirmDialog } from './confirm-dialog';
import { FormSheet } from './form-sheet';
import { SectionBoundary } from './section-boundary';
import { useDeleteBranch, useSaveBranch } from '../hooks/use-organisation-admin-actions';

/** Coordinates stay strings in the form so the inputs behave; they convert on submit. */
const coordinate = (limit: number, name: string) =>
  z
    .string()
    .trim()
    .refine(value => {
      if (!value) return true;
      const parsed = Number(value);
      return Number.isFinite(parsed) && Math.abs(parsed) <= limit;
    }, `${name} runs from −${limit} to ${limit}`);

const branchSchema = z
  .object({
    branch_name: z.string().trim().min(1, 'Name the branch').max(200),
    address: z.string().trim().max(500).optional(),
    poc_name: z.string().trim().min(1, 'Who is the contact?').max(200),
    poc_email: z.string().trim().email('Enter a valid email'),
    poc_telephone: z.string().trim().min(1, 'A contact number is required'),
    latitude: coordinate(90, 'Latitude'),
    longitude: coordinate(180, 'Longitude'),
    active: z.boolean(),
  })
  .refine(values => Boolean(values.latitude) === Boolean(values.longitude), {
    message: 'Send both coordinates or neither',
    path: ['longitude'],
  });

type BranchValues = z.infer<typeof branchSchema>;

const toCoordinate = (value: string) => (value.trim() ? Number(value) : null);

interface BranchesTabProps {
  organisation: Organisation;
  branches: TrainingBranch[];
  branchesQuery: { isLoading: boolean; error: unknown; refetch: () => void };
}

const EMPTY: BranchValues = {
  branch_name: '',
  address: '',
  poc_name: '',
  poc_email: '',
  poc_telephone: '',
  latitude: '',
  longitude: '',
  active: true,
};

/** Where an organisation teaches: the branches, their contacts and their map pins. */
export function BranchesTab({ organisation, branches, branchesQuery }: BranchesTabProps) {
  const organisationUuid = organisation.uuid ?? '';
  const [editing, setEditing] = useState<TrainingBranch | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [deleting, setDeleting] = useState<TrainingBranch | null>(null);

  const save = useSaveBranch();
  const remove = useDeleteBranch();

  const form = useForm<BranchValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: EMPTY,
    mode: 'onChange',
  });

  const openSheet = (branch: TrainingBranch | null) => {
    setEditing(branch);
    form.reset(
      branch
        ? {
            branch_name: branch.branch_name,
            address: branch.address ?? '',
            poc_name: branch.poc_name,
            poc_email: branch.poc_email,
            poc_telephone: branch.poc_telephone,
            latitude: branch.latitude === null || branch.latitude === undefined ? '' : String(branch.latitude),
            longitude:
              branch.longitude === null || branch.longitude === undefined
                ? ''
                : String(branch.longitude),
            active: branch.active,
          }
        : EMPTY
    );
    setSheetOpen(true);
  };

  const askToSave = async () => {
    const valid = await form.trigger();
    if (valid) setConfirmSave(true);
  };

  const commitSave = () => {
    const values = form.getValues();
    save.mutate(
      {
        organisationUuid,
        branchUuid: editing?.uuid,
        values: {
          ...values,
          latitude: toCoordinate(values.latitude),
          longitude: toCoordinate(values.longitude),
        },
      },
      {
        onSuccess: () => {
          setConfirmSave(false);
          setSheetOpen(false);
          setEditing(null);
        },
      }
    );
  };

  return (
    <>
      <SectionCard
        title='Branches'
        description='Each branch carries its own contact and map pin.'
        actions={
          <Button className='rounded-md' onClick={() => openSheet(null)}>
            <Plus className='mr-2 size-4' />
            Add branch
          </Button>
        }
      >
        <SectionBoundary
          label='the branches'
          loading={branchesQuery.isLoading}
          error={branchesQuery.error}
          empty={branches.length === 0}
          onRetry={branchesQuery.refetch}
          emptyTitle='No branches yet'
          emptyDescription='Add the first place this organisation teaches.'
        >
          <ul className='flex flex-col gap-2'>
            {branches.map(branch => {
              const pinMissing = branch.latitude === null || branch.longitude === null;
              return (
                <li
                  key={branch.uuid}
                  className='border-border/60 flex flex-wrap items-start gap-3 rounded-md border px-3 py-2.5'
                >
                  <div className='min-w-0 flex-1 space-y-1'>
                    <p className='text-foreground text-sm font-medium'>{branch.branch_name}</p>
                    <p className='text-muted-foreground text-xs'>
                      {branch.address || 'No address recorded'}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {branch.poc_name} · {branch.poc_email} ·{' '}
                      <span className='font-mono'>{branch.poc_telephone}</span>
                    </p>
                  </div>
                  <div className='flex flex-wrap items-center gap-2'>
                    {pinMissing ? (
                      <StatusBadge label='Pin missing' tone='warning' />
                    ) : (
                      <span className='text-muted-foreground flex items-center gap-1 font-mono text-xs'>
                        <MapPin className='size-3' />
                        {branch.latitude}, {branch.longitude}
                      </span>
                    )}
                    <StatusBadge status={branch.active ? 'active' : 'inactive'} />
                    <Button
                      variant='outline'
                      size='sm'
                      className='rounded-md'
                      onClick={() => openSheet(branch)}
                    >
                      <Pencil className='mr-1.5 size-3.5' />
                      Edit
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='border-destructive/40 text-destructive rounded-md'
                      onClick={() => setDeleting(branch)}
                    >
                      <Trash2 className='mr-1.5 size-3.5' />
                      Remove
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionBoundary>
      </SectionCard>

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? `Edit ${editing.branch_name}` : 'Add a branch'}
        description='The contact and pin are what instructors and students rely on.'
        isDirty={form.formState.isDirty}
        isPending={save.isPending}
        submitLabel={editing ? 'Save branch' : 'Create branch'}
        onSubmit={askToSave}
      >
        <Form {...form}>
          <form className='space-y-4' onSubmit={event => event.preventDefault()}>
            <FormField
              control={form.control}
              name='branch_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Branch name <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} className='rounded-md' placeholder='Westlands campus' />
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} className='rounded-md' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='poc_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contact name <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className='rounded-md' />
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
                      Contact number <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className='rounded-md font-mono' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='poc_email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Contact email <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type='email' className='rounded-md' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='latitude'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input {...field} className='rounded-md font-mono' placeholder='-1.2641' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='longitude'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input {...field} className='rounded-md font-mono' placeholder='36.8078' />
                    </FormControl>
                    <FormDescription>Send both coordinates, or neither.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='active'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between gap-4'>
                  <div>
                    <FormLabel>Active</FormLabel>
                    <FormDescription>Inactive branches stay on the record.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </FormSheet>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        action={editing ? 'updateBranch' : 'createBranch'}
        subject={{
          name: form.getValues('branch_name') || 'this branch',
          detail: organisation.name,
        }}
        isPending={save.isPending}
        onConfirm={commitSave}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={open => {
          if (!open) setDeleting(null);
        }}
        action='deleteBranch'
        subject={{
          name: deleting?.branch_name ?? '',
          detail: organisation.name,
          confirmValue: deleting?.branch_name ?? '',
        }}
        isPending={remove.isPending}
        onConfirm={() => {
          if (!deleting?.uuid) return;
          remove.mutate(
            {
              organisationUuid,
              branchUuid: deleting.uuid,
              branchName: deleting.branch_name,
            },
            { onSuccess: () => setDeleting(null) }
          );
        }}
      />
    </>
  );
}
