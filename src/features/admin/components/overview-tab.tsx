'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { DetailGrid, SectionCard, SectionCardSkeleton, StatusBadge } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/date';
import type { GenderEnum, User } from '@/services/client';
import { useAdminFlags } from '../hooks/use-person-record';
import { useSavePerson } from '../hooks/use-person-actions';
import { adminRoutes } from '../lib/admin-routes';
import { ConfirmDialog } from './confirm-dialog';
import { SectionBoundary } from './section-boundary';

const GENDERS: GenderEnum[] = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];

const identitySchema = z.object({
  first_name: z.string().trim().min(1, 'A first name is required.').max(50),
  middle_name: z.string().trim().max(50).optional(),
  last_name: z.string().trim().min(1, 'A last name is required.').max(50),
  email: z.string().trim().email('That is not a valid email address.'),
  username: z.string().trim().min(1, 'A username is required.').max(50),
  dob: z.string().min(1, 'A date of birth is required.'),
  phone_number: z.string().trim().max(20).optional(),
  gender: z.string().optional(),
});

type IdentityForm = z.infer<typeof identitySchema>;

const asDateInput = (value?: Date | string | null) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : date.toISOString().slice(0, 10);
};

const FIELD_LABELS: Record<keyof IdentityForm, string> = {
  first_name: 'First name',
  middle_name: 'Middle name',
  last_name: 'Last name',
  email: 'Email',
  username: 'Username',
  dob: 'Date of birth',
  phone_number: 'Phone number',
  gender: 'Gender',
};

export function OverviewTab({
  person,
  loading,
  error,
  onRetry,
}: {
  person: User | null;
  loading: boolean;
  error?: unknown;
  onRetry?: () => void;
}) {
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <SectionBoundary
        label='the identity details'
        loading={loading}
        error={error}
        onRetry={onRetry}
        skeleton={<SectionCardSkeleton rows={5} />}
      >
        {person ? <IdentityForm person={person} /> : null}
      </SectionBoundary>

      <div className='flex flex-col gap-4'>
        <SectionBoundary
          label='the roles and affiliations'
          loading={loading}
          skeleton={<SectionCardSkeleton rows={3} />}
        >
          <RolesPanel person={person} />
        </SectionBoundary>

        <SectionBoundary label='the account facts' loading={loading} skeleton={<SectionCardSkeleton rows={3} />}>
          <AccountPanel person={person} />
        </SectionBoundary>
      </div>
    </div>
  );
}

function IdentityForm({ person }: { person: User }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  /** Frozen at submit, so the modal lists exactly what will be sent. */
  const [pending, setPending] = useState<IdentityForm | null>(null);
  const { save, isPending } = useSavePerson(person);

  const defaults = useMemo<IdentityForm>(
    () => ({
      first_name: person.first_name ?? '',
      middle_name: person.middle_name ?? '',
      last_name: person.last_name ?? '',
      email: person.email ?? '',
      username: person.username ?? '',
      dob: asDateInput(person.dob),
      phone_number: person.phone_number ?? '',
      gender: person.gender ?? '',
    }),
    [person]
  );

  const form = useForm<IdentityForm>({
    resolver: zodResolver(identitySchema),
    defaultValues: defaults,
    values: defaults,
    mode: 'onSubmit',
  });

  const changes = useMemo(() => {
    if (!pending) return [];
    return (Object.keys(FIELD_LABELS) as Array<keyof IdentityForm>)
      .filter(field => (pending[field] ?? '') !== (defaults[field] ?? ''))
      .map(field => ({
        label: FIELD_LABELS[field],
        before: defaults[field] || '—',
        after: pending[field] || '—',
      }));
  }, [pending, defaults]);

  const name = person.full_name ?? `${person.first_name} ${person.last_name}`.trim();
  const gender = useWatch({ control: form.control, name: 'gender' });

  const commit = () => {
    if (!pending) return;
    save(
      {
        first_name: pending.first_name,
        middle_name: pending.middle_name || null,
        last_name: pending.last_name,
        email: pending.email,
        username: pending.username,
        dob: new Date(pending.dob),
        phone_number: pending.phone_number || null,
        gender: (pending.gender || undefined) as GenderEnum | undefined,
      },
      {
        successMessage: 'Details saved',
        onDone: () => {
          setConfirmOpen(false);
          setPending(null);
        },
      }
    );
  };

  return (
    <SectionCard
      title='Identity & contact'
      description='Saving replaces the whole record, so every field is sent'
    >
      <form
        className='flex flex-col gap-4'
        onSubmit={form.handleSubmit(values => {
          setPending(values);
          setConfirmOpen(true);
        })}
      >
        <div className='grid gap-3 sm:grid-cols-2'>
          <Field form={form} name='first_name' label={FIELD_LABELS.first_name} required />
          <Field form={form} name='last_name' label={FIELD_LABELS.last_name} required />
          <Field form={form} name='middle_name' label={FIELD_LABELS.middle_name} />
          <Field form={form} name='username' label={FIELD_LABELS.username} required />
          <Field form={form} name='email' label={FIELD_LABELS.email} type='email' required />
          <Field form={form} name='phone_number' label={FIELD_LABELS.phone_number} />
          <Field form={form} name='dob' label={FIELD_LABELS.dob} type='date' required />

          <div className='space-y-1.5'>
            <Label htmlFor='gender' className='text-sm font-semibold'>
              {FIELD_LABELS.gender}
            </Label>
            <Select
              value={gender || 'unset'}
              onValueChange={value => form.setValue('gender', value === 'unset' ? '' : value)}
            >
              <SelectTrigger id='gender' className='border-input h-9 w-full rounded-md'>
                <SelectValue placeholder='Not set' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='unset'>Not set</SelectItem>
                {GENDERS.map(gender => (
                  <SelectItem key={gender} value={gender}>
                    {gender.replace(/_/g, ' ').toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button type='submit' className='rounded-md' disabled={isPending}>
            Save changes
          </Button>
          <Button
            type='button'
            variant='outline'
            className='rounded-md'
            onClick={() => form.reset(defaults)}
            disabled={isPending}
          >
            Reset
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={open => {
          setConfirmOpen(open);
          if (!open) setPending(null);
        }}
        action='saveIdentity'
        subject={{ name: name || 'this person' }}
        isPending={isPending}
        onConfirm={commit}
      >
        {changes.length ? (
          <ul className='border-border/60 divide-border/60 divide-y rounded-md border text-sm'>
            {changes.map(change => (
              <li key={change.label} className='flex flex-wrap gap-2 px-3 py-2'>
                <span className='text-muted-foreground w-32 shrink-0'>{change.label}</span>
                <span className='text-muted-foreground line-through'>{change.before}</span>
                <span className='text-foreground font-medium'>{change.after}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-muted-foreground text-sm'>Nothing changed — saving will re-send the record as it is.</p>
        )}
      </ConfirmDialog>
    </SectionCard>
  );
}

function Field({
  form,
  name,
  label,
  type = 'text',
  required,
}: {
  form: ReturnType<typeof useForm<IdentityForm>>;
  name: keyof IdentityForm;
  label: string;
  type?: string;
  required?: boolean;
}) {
  const error = form.formState.errors[name]?.message;

  return (
    <div className='space-y-1.5'>
      <Label htmlFor={name} className='text-sm font-semibold'>
        {label}
        {required ? <span className='text-destructive ml-0.5'>*</span> : null}
      </Label>
      <Input id={name} type={type} className='rounded-md' {...form.register(name)} />
      {error ? <p className='text-destructive text-xs'>{String(error)}</p> : null}
    </div>
  );
}

function RolesPanel({ person }: { person: User | null }) {
  const affiliations = person?.organisation_affiliations ?? [];
  const domains = Array.isArray(person?.user_domain)
    ? (person?.user_domain as string[])
    : person?.user_domain
      ? [person.user_domain as string]
      : [];

  return (
    <SectionCard
      title='Roles & access'
      description='Platform access is granted and removed on Admins & access'
    >
      <div className='flex flex-col gap-4'>
        <div className='flex flex-wrap gap-1.5'>
          {domains.length ? (
            domains.map(domain => <StatusBadge key={domain} tone='info' label={domain} />)
          ) : (
            <p className='text-muted-foreground text-sm'>No platform roles.</p>
          )}
        </div>

        <div>
          <p className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
            Organisation affiliations
          </p>
          {affiliations.length ? (
            <ul className='flex flex-col gap-2'>
              {affiliations.map((affiliation, index) => (
                <li key={index} className='text-foreground text-sm'>
                  {affiliation.organisation_name}
                  <span className='text-muted-foreground'>
                    {' · '}
                    {affiliation.domain_in_organisation}
                    {affiliation.branch_name ? ` · ${affiliation.branch_name}` : ''}
                    {affiliation.active === false ? ' · inactive' : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground text-sm'>No organisation affiliations.</p>
          )}
        </div>

        <a href={adminRoutes.access()} className='text-primary text-sm font-semibold'>
          Manage platform access →
        </a>
      </div>
    </SectionCard>
  );
}

function AccountPanel({ person }: { person: User | null }) {
  const { isAdmin, isSystemAdmin } = useAdminFlags(person?.uuid ?? '', Boolean(person?.uuid));

  return (
    <SectionCard title='Account'>
      <DetailGrid
        columns={2}
        items={[
          { label: 'User no.', value: <span className='font-mono'>{person?.user_no ?? '—'}</span> },
          { label: 'UUID', value: <span className='font-mono text-xs'>{person?.uuid ?? '—'}</span> },
          {
            label: 'Joined',
            value: person?.created_date ? formatDate(person.created_date) : '—',
          },
          {
            label: 'Last updated',
            value: person?.updated_date ? formatDate(person.updated_date) : '—',
          },
          { label: 'Platform admin', value: isAdmin ? 'Yes' : 'No' },
          { label: 'System admin', value: isSystemAdmin ? 'Yes' : 'No' },
        ]}
      />
    </SectionCard>
  );
}
