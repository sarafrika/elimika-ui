'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DetailGrid, SectionCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useTimeZone } from '@/context/timezone-context';
import { formatDate, scheduleTimeZoneLabel, scheduleTimeZoneOptions } from '@/lib/date';
import { ConfirmDialog } from '../components/confirm-dialog';
import { SectionBoundary } from '../components/section-boundary';
import {
  changedFields,
  toProfileForm,
  useOwnAccount,
  useSaveOwnProfile,
  useUploadOwnPhoto,
  type ProfileFormValues,
} from '../hooks/use-admin-settings';
import { adminRoutes } from '../lib/admin-routes';

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

const keycloakAccountUrl = () => {
  const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
  return issuer ? `${issuer.replace(/\/$/, '')}/account` : null;
};

export function AdminSettingsPage() {
  const { account, query } = useOwnAccount();
  const { save, isPending: isSaving } = useSaveOwnProfile();
  const { upload, isPending: isUploading } = useUploadOwnPhoto();

  const baseline = useMemo(() => toProfileForm(account), [account]);
  const [values, setValues] = useState<ProfileFormValues>(baseline);
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValues(baseline);
  }, [baseline]);

  const changes = changedFields(baseline, values);
  const canSave =
    changes.length > 0 &&
    values.first_name.trim().length > 0 &&
    values.last_name.trim().length > 0 &&
    values.username.trim().length > 0 &&
    /.+@.+\..+/.test(values.email.trim()) &&
    values.dob.length > 0;

  const set = (key: keyof ProfileFormValues) => (value: string) =>
    setValues(current => ({ ...current, [key]: value }));

  const accountConsole = keycloakAccountUrl();

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Settings'
          title='Your account'
          description='Your own details, how times are shown to you, and where to change your password.'
        />

        <SectionBoundary
          label='your account'
          loading={query.isLoading && !query.data}
          error={query.error}
          empty={!query.isLoading && !account}
          onRetry={query.refetch}
          emptyTitle='Account unavailable'
          emptyDescription='Your profile could not be read. Try again, or sign out and back in.'
          skeleton={
            <div className='space-y-3'>
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-64 w-full' />
            </div>
          }
        >
          <div className='flex flex-col gap-4'>
            <SectionCard title='Photo' description='Shown next to your name across Elimika.'>
              <div className='flex flex-wrap items-center gap-4'>
                <Avatar className='size-16'>
                  {account?.profile_image_url ? (
                    <AvatarImage src={account.profile_image_url} alt='' />
                  ) : null}
                  <AvatarFallback className='bg-primary/10 text-primary text-base font-semibold'>
                    {[account?.first_name?.[0], account?.last_name?.[0]]
                      .filter(Boolean)
                      .join('')
                      .toUpperCase() || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-1'>
                  <Button
                    variant='outline'
                    className='rounded-md'
                    disabled={isUploading || !account?.uuid}
                    onClick={() => fileInput.current?.click()}
                  >
                    {isUploading ? 'Uploading…' : 'Change photo'}
                  </Button>
                  <p className='text-muted-foreground text-xs'>JPEG or PNG, up to 5 MB.</p>
                </div>
                <input
                  ref={fileInput}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file && account?.uuid) {
                      upload({ userUuid: account.uuid, file }, () => {
                        if (fileInput.current) fileInput.current.value = '';
                      });
                    }
                  }}
                />
              </div>
            </SectionCard>

            <SectionCard
              title='Your details'
              description='Saved to Elimika and to your sign-in account.'
              actions={
                <Button
                  className='rounded-md'
                  disabled={!canSave || isSaving}
                  onClick={() => setConfirming(true)}
                >
                  Save changes
                </Button>
              }
            >
              <div className='grid gap-3 sm:grid-cols-2'>
                <TextField
                  id='settings-first-name'
                  label='First name'
                  required
                  maxLength={50}
                  value={values.first_name}
                  onChange={set('first_name')}
                />
                <TextField
                  id='settings-middle-name'
                  label='Middle name'
                  maxLength={50}
                  value={values.middle_name}
                  onChange={set('middle_name')}
                />
                <TextField
                  id='settings-last-name'
                  label='Last name'
                  required
                  maxLength={50}
                  value={values.last_name}
                  onChange={set('last_name')}
                />
                <TextField
                  id='settings-email'
                  label='Email'
                  required
                  type='email'
                  maxLength={100}
                  value={values.email}
                  onChange={set('email')}
                />
                <TextField
                  id='settings-username'
                  label='Username'
                  required
                  maxLength={50}
                  value={values.username}
                  onChange={set('username')}
                />
                <TextField
                  id='settings-dob'
                  label='Date of birth'
                  required
                  type='date'
                  value={values.dob}
                  onChange={set('dob')}
                />
                <TextField
                  id='settings-phone'
                  label='Phone number'
                  maxLength={20}
                  value={values.phone_number}
                  onChange={set('phone_number')}
                />
                <div className='space-y-1.5'>
                  <Label htmlFor='settings-gender' className='text-sm font-semibold'>
                    Gender
                  </Label>
                  <Select
                    value={values.gender || 'unset'}
                    onValueChange={value => set('gender')(value === 'unset' ? '' : value)}
                  >
                    <SelectTrigger id='settings-gender' className='h-9 rounded-md'>
                      <SelectValue placeholder='Not specified' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='unset'>Not specified</SelectItem>
                      {GENDERS.map(entry => (
                        <SelectItem key={entry.value} value={entry.value}>
                          {entry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>

            <TimeZoneCard />

            <SectionCard
              title='Security'
              description='Passwords, two-factor and sessions live with the sign-in service.'
            >
              <div className='space-y-3 text-sm'>
                {accountConsole ? (
                  <a
                    href={accountConsole}
                    target='_blank'
                    rel='noreferrer'
                    className='text-primary inline-flex items-center gap-1.5 font-medium hover:underline'
                  >
                    Open your sign-in account settings
                    <ExternalLink className='size-3.5' />
                  </a>
                ) : (
                  <Button variant='outline' className='rounded-md' disabled>
                    Sign-in account settings unavailable
                  </Button>
                )}
                <p className='text-muted-foreground'>
                  {accountConsole
                    ? 'Change your password or set up two-factor there; Elimika has no API for either.'
                    : 'The sign-in service address is not configured in this environment, so the link is hidden rather than guessed.'}
                </p>
                <p className='text-muted-foreground'>
                  Your session now renews its own token, so a long day in the console no longer
                  ends in failed requests.
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title='Roles'
              description='What you can reach. Changing access happens on Admins & access.'
            >
              <div className='space-y-3'>
                <div className='flex flex-wrap gap-1.5'>
                  {(Array.isArray(account?.user_domain)
                    ? account?.user_domain
                    : [account?.user_domain]
                  )
                    ?.filter(Boolean)
                    .map(domain => (
                      <StatusBadge key={String(domain)} tone='neutral' label={String(domain)} />
                    ))}
                </div>

                {account?.organisation_affiliations?.length ? (
                  <DetailGrid
                    columns={2}
                    items={account.organisation_affiliations.map(affiliation => ({
                      label: affiliation.organisation_name ?? 'Organisation',
                      value: `${affiliation.domain_in_organisation ?? '—'}${
                        affiliation.branch_name ? ` · ${affiliation.branch_name}` : ''
                      }`,
                    }))}
                  />
                ) : (
                  <p className='text-muted-foreground text-sm'>
                    You are not attached to any organisation.
                  </p>
                )}

                <DetailGrid
                  columns={3}
                  items={[
                    { label: 'User number', value: account?.user_no ?? '—' },
                    { label: 'Joined', value: formatDate(account?.created_date) || '—' },
                    { label: 'Last updated', value: formatDate(account?.updated_date) || '—' },
                  ]}
                />

                <Link
                  href={adminRoutes.access()}
                  className='text-primary text-sm font-medium hover:underline'
                >
                  Open Admins &amp; access
                </Link>
              </div>
            </SectionCard>
          </div>
        </SectionBoundary>
      </div>

      {confirming && account ? (
        <ConfirmDialog
          open
          onOpenChange={value => {
            if (!value) setConfirming(false);
          }}
          action='saveIdentity'
          subject={{ name: account.full_name ?? account.email ?? 'your account' }}
          isPending={isSaving}
          onConfirm={() => save({ account, values }, () => setConfirming(false))}
        >
          <ul className='border-border/60 divide-border/60 divide-y rounded-md border text-sm'>
            {changes.map(change => (
              <li key={change.label} className='flex flex-wrap gap-2 px-3 py-2'>
                <span className='text-muted-foreground w-32 shrink-0'>{change.label}</span>
                <span className='text-muted-foreground line-through'>{change.from}</span>
                <span aria-hidden='true'>→</span>
                <span className='text-foreground font-medium'>{change.to}</span>
              </li>
            ))}
          </ul>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

/** Timezone is a per-device preference; nothing about it is stored on the account. */
function TimeZoneCard() {
  const { zone, source, setPreferredZone } = useTimeZone();
  const options = scheduleTimeZoneOptions(zone);

  return (
    <SectionCard
      title='Times and dates'
      description='How timestamps are shown to you in this console.'
    >
      <div className='space-y-2'>
        <Label htmlFor='settings-timezone' className='text-sm font-semibold'>
          Time zone
        </Label>
        <Select
          value={zone}
          onValueChange={value => setPreferredZone(value === 'detected' ? null : value)}
        >
          <SelectTrigger id='settings-timezone' className='h-9 w-full max-w-sm rounded-md'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='detected'>Use this device’s time zone</SelectItem>
            {options.map(option => (
              <SelectItem key={option} value={option}>
                {scheduleTimeZoneLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className='text-muted-foreground text-xs'>
          {source === 'preference'
            ? 'Saved on this device only — the API has no place to keep it, so another browser will detect its own zone.'
            : 'Detected from this device. Choosing a zone saves it on this device only.'}
        </p>
        <p className='text-muted-foreground text-xs'>There is no language setting yet.</p>
      </div>
    </SectionCard>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  required,
  maxLength,
  type = 'text',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  maxLength?: number;
  type?: string;
}) {
  return (
    <div className='space-y-1.5'>
      <Label htmlFor={id} className='text-sm font-semibold'>
        {label}
        {required ? <span className='text-destructive ml-0.5'>*</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={event => onChange(event.target.value)}
        className='rounded-md'
        autoComplete='off'
      />
    </div>
  );
}
