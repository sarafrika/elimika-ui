'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { DataTable, SectionCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { User } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FormSheet } from '../components/form-sheet';
import { NoteField, noteToPlainText } from '../components/note-field';
import { SectionBoundary } from '../components/section-boundary';
import { adminRoutes } from '../lib/admin-routes';
import { useGrantAdmin, useCreateAdmin, useRemoveAdmin } from '../hooks/use-access-actions';
import {
  ELIGIBLE_MIN_QUERY,
  useAdminUsers,
  useEligibleUsers,
  useOrganisationAdmins,
  useSystemAdmins,
  type AdminListResult,
} from '../hooks/use-admin-access';
import { enumParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

type AccessTab = 'system' | 'all' | 'organisation';

const TABS: { id: AccessTab; label: string; description: string }[] = [
  {
    id: 'system',
    label: 'System admins',
    description: 'Global platform access. Granted and removed here.',
  },
  {
    id: 'all',
    label: 'All admin access',
    description: 'Everyone the API counts as an admin, platform or organisation.',
  },
  {
    id: 'organisation',
    label: 'Organisation admins',
    description: 'Access scoped to one organisation, set on that organisation.',
  },
];

const tabParam = enumParam<AccessTab>(
  TABS.map(tab => tab.id),
  'system'
);

/** The reason field is required in the console even though the API only logs it. */
const MIN_REASON = 10;

const displayName = (person: User) =>
  [person.first_name, person.last_name].filter(Boolean).join(' ').trim() ||
  person.email ||
  'Unknown';

export function AdminAccessPage() {
  const [tab, setTab] = useSearchState<AccessTab>('tab', tabParam);
  const signedIn = useUserProfile();

  const systemAdmins = useSystemAdmins();
  const allAdmins = useAdminUsers();
  const organisationAdmins = useOrganisationAdmins();

  const [grantOpen, setGrantOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [removeReason, setRemoveReason] = useState('');

  const { remove, isPending: isRemoving } = useRemoveAdmin();

  const active: AdminListResult =
    tab === 'system' ? systemAdmins : tab === 'all' ? allAdmins : organisationAdmins;

  // Guards the API does not have: the last system admin and your own access.
  const isLastSystemAdmin = systemAdmins.people.length <= 1;
  const blockedReason = (person: User) => {
    if (person.uuid && person.uuid === signedIn?.uuid) return 'You can’t remove your own access';
    if (tab === 'system' && isLastSystemAdmin) return 'The last system admin can’t be removed';
    if (tab === 'organisation')
      return 'Organisation access is changed on that organisation’s Members tab';
    return null;
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'person',
        header: 'Person',
        accessorFn: row => displayName(row),
        cell: ({ row }) => (
          <div className='min-w-0'>
            <p className='text-foreground truncate text-sm font-medium'>
              {displayName(row.original)}
            </p>
            <p className='text-muted-foreground truncate text-xs'>{row.original.email}</p>
          </div>
        ),
      },
      {
        id: 'access',
        header: 'Access',
        accessorFn: row => row.user_domain ?? '',
        cell: ({ row }) => (
          <div className='flex flex-wrap gap-1'>
            {(Array.isArray(row.original.user_domain)
              ? row.original.user_domain
              : [row.original.user_domain]
            )
              .filter(Boolean)
              .map(domain => (
                <StatusBadge key={String(domain)} label={String(domain)} tone='neutral' />
              ))}
          </div>
        ),
      },
      {
        id: 'joined',
        header: 'Joined',
        accessorFn: row => row.created_date ?? '',
        cell: ({ row }) => (
          <span className='font-mono text-xs whitespace-nowrap'>
            {formatDate(row.original.created_date) || '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const blocked = blockedReason(row.original);
          return (
            <div className='flex justify-end'>
              <Button
                variant='outline'
                size='sm'
                className='rounded-md'
                disabled={Boolean(blocked)}
                title={blocked ?? undefined}
                onClick={() => {
                  setRemoveReason('');
                  setRemoveTarget(row.original);
                }}
              >
                Remove access
              </Button>
            </div>
          );
        },
      },
    ],
    // blockedReason closes over the current tab and the system-admin count.
    [tab, isLastSystemAdmin, signedIn?.uuid]
  );

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Admins & access'
          title='Who can reach the admin console'
          description='Grant or remove platform access, and invite a new administrator.'
          actions={
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                className='rounded-md'
                onClick={() => setCreateOpen(true)}
              >
                Create administrator
              </Button>
              <Button className='rounded-md' onClick={() => setGrantOpen(true)}>
                Grant access
              </Button>
            </div>
          }
        />

        <div className='border-border/70 flex gap-6 overflow-x-auto border-b'>
          {TABS.map(entry => {
            const isActive = entry.id === tab;
            return (
              <button
                key={entry.id}
                type='button'
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setTab(entry.id)}
                className={cn(
                  '-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
                )}
              >
                {entry.label}
              </button>
            );
          })}
        </div>

        <SectionCard
          title={TABS.find(entry => entry.id === tab)?.label}
          description={TABS.find(entry => entry.id === tab)?.description}
          bodyClassName='p-0'
          bare={false}
        >
          <div className='p-4'>
            <SectionBoundary
              label='this list'
              loading={active.isLoading}
              error={active.error}
              empty={!active.isLoading && active.people.length === 0}
              onRetry={active.refetch}
              emptyTitle='Nobody here yet'
              emptyDescription='Nobody holds this kind of access at the moment.'
              skeleton={
                <div className='space-y-2'>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className='h-12 w-full' />
                  ))}
                </div>
              }
            >
              <DataTable
                columns={columns}
                data={active.people}
                getRowId={row => row.uuid ?? row.email}
                searchPlaceholder='Search this list…'
                emptyTitle='Nothing matches'
                emptyDescription='Adjust the search to find someone.'
                pageSize={15}
              />
            </SectionBoundary>
          </div>
        </SectionCard>

        <SectionCard title='What access means here'>
          <ul className='text-muted-foreground space-y-2 text-sm'>
            <li>Platform admin opens every admin screen, with no per-section permissions.</li>
            <li>A change takes effect on that person’s next request; they are not signed out.</li>
            <li>Nobody is notified, and the reason you give is not stored on the record.</li>
            <li>
              Organisation roles are set on the organisation itself —{' '}
              <Link href={adminRoutes.organisations()} className='text-primary hover:underline'>
                open an organisation
              </Link>{' '}
              and use its Members tab.
            </li>
            <li>
              The console blocks removing your own access and the last system admin. Those are
              guards here, not in the API.
            </li>
          </ul>
        </SectionCard>
      </div>

      <GrantAccessSheet open={grantOpen} onOpenChange={setGrantOpen} />
      <CreateAdminSheet open={createOpen} onOpenChange={setCreateOpen} />

      {removeTarget ? (
        <RemoveAccessDialog
          person={removeTarget}
          reason={removeReason}
          onReasonChange={setRemoveReason}
          isPending={isRemoving}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() =>
            remove(
              {
                userUuid: removeTarget.uuid ?? '',
                reason: removeReason,
                name: displayName(removeTarget),
              },
              () => setRemoveTarget(null)
            )
          }
        />
      ) : null}
    </div>
  );
}

function RemoveAccessDialog({
  person,
  reason,
  onReasonChange,
  isPending,
  onCancel,
  onConfirm,
}: {
  person: User;
  reason: string;
  onReasonChange: (value: string) => void;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const enoughReason = noteToPlainText(reason).length >= MIN_REASON;

  return (
    <ConfirmDialog
      open
      onOpenChange={open => {
        if (!open) onCancel();
      }}
      action='removeAdmin'
      subject={{
        name: displayName(person),
        detail: person.email,
        confirmValue: person.email,
      }}
      isPending={isPending}
      onConfirm={() => {
        if (enoughReason) onConfirm();
      }}
    >
      <NoteField
        id='remove-reason'
        label='Reason'
        required
        value={reason}
        onChange={onReasonChange}
        helper='Sent with the request and kept in the request log.'
        error={
          reason && !enoughReason ? `Say a little more — at least ${MIN_REASON} characters.` : undefined
        }
      />
    </ConfirmDialog>
  );
}

function GrantAccessSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picked, setPicked] = useState<User | null>(null);
  const [level, setLevel] = useState<'platform' | 'organisation'>('platform');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);

  const { grant, isPending } = useGrantAdmin();
  const eligible = useEligibleUsers(debounced);

  // The eligible endpoint scans every user, so it waits for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (open) return;
    setSearch('');
    setDebounced('');
    setPicked(null);
    setLevel('platform');
    setReason('');
    setConfirming(false);
  }, [open]);

  const enoughReason = noteToPlainText(reason).length >= MIN_REASON;
  const canSubmit = level === 'platform' && Boolean(picked?.uuid) && enoughReason;

  return (
    <>
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title='Grant admin access'
        description='Give an existing person access to the admin console.'
        isDirty={Boolean(picked || reason)}
        isPending={isPending}
        submitLabel='Review and grant'
        onSubmit={() => {
          if (canSubmit) setConfirming(true);
        }}
      >
        <div className='space-y-1.5'>
          <Label htmlFor='grant-search' className='text-sm font-semibold'>
            Person<span className='text-destructive ml-0.5'>*</span>
          </Label>
          <Input
            id='grant-search'
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setPicked(null);
            }}
            placeholder='Search by name or email…'
            className='rounded-md'
            autoComplete='off'
          />
          {picked ? (
            <p className='text-muted-foreground text-xs'>
              Selected: <span className='text-foreground font-medium'>{displayName(picked)}</span>{' '}
              · {picked.email}
            </p>
          ) : (
            <p className='text-muted-foreground text-xs'>
              Type at least {ELIGIBLE_MIN_QUERY} characters. This search reads every user, so it
              only runs when you pause.
            </p>
          )}
        </div>

        {eligible.enabled && !picked ? (
          <div className='border-border/70 max-h-64 overflow-y-auto rounded-md border'>
            <SectionBoundary
              label='matching people'
              loading={eligible.isLoading}
              error={eligible.error}
              empty={!eligible.isLoading && eligible.people.length === 0}
              emptyTitle='Nobody matches'
              emptyDescription='Try a different name or email.'
              skeleton={
                <div className='space-y-2 p-3'>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className='h-10 w-full' />
                  ))}
                </div>
              }
            >
              <ul className='divide-border/60 divide-y'>
                {eligible.people.map(person => (
                  <li key={person.uuid ?? person.email}>
                    <button
                      type='button'
                      onClick={() => setPicked(person)}
                      className='hover:bg-muted/40 w-full px-3 py-2 text-left transition-colors'
                    >
                      <p className='text-foreground text-sm font-medium'>{displayName(person)}</p>
                      <p className='text-muted-foreground text-xs'>{person.email}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </SectionBoundary>
          </div>
        ) : null}

        <fieldset className='space-y-2'>
          <legend className='text-sm font-semibold'>Access level</legend>
          <RadioGroup
            value={level}
            onValueChange={value => setLevel(value as 'platform' | 'organisation')}
            className='space-y-2'
          >
            <div className='flex items-start gap-2'>
              <RadioGroupItem value='platform' id='level-platform' className='mt-1' />
              <Label htmlFor='level-platform' className='font-normal'>
                <span className='block text-sm font-medium'>Platform admin</span>
                <span className='text-muted-foreground block text-xs'>
                  Every admin screen, from their next request.
                </span>
              </Label>
            </div>
            <div className='flex items-start gap-2'>
              <RadioGroupItem value='organisation' id='level-organisation' className='mt-1' />
              <Label htmlFor='level-organisation' className='font-normal'>
                <span className='block text-sm font-medium'>Organisation role</span>
                <span className='text-muted-foreground block text-xs'>
                  Set on the organisation’s Members tab — the admin API has no organisation field.
                </span>
              </Label>
            </div>
          </RadioGroup>
          {level === 'organisation' ? (
            <p className='text-muted-foreground text-xs'>
              <Link href={adminRoutes.organisations()} className='text-primary hover:underline'>
                Open an organisation
              </Link>{' '}
              and change the person’s role there.
            </p>
          ) : null}
        </fieldset>

        <NoteField
          id='grant-reason'
          label='Reason'
          required
          value={reason}
          onChange={setReason}
          helper='Travels with the request; the API records it in the request log only.'
          error={
            reason && !enoughReason
              ? `Say a little more — at least ${MIN_REASON} characters.`
              : undefined
          }
        />
      </FormSheet>

      {confirming && picked ? (
        <ConfirmDialog
          open
          onOpenChange={value => {
            if (!value) setConfirming(false);
          }}
          action='grantAdmin'
          subject={{ name: displayName(picked), detail: picked.email }}
          isPending={isPending}
          onConfirm={() =>
            grant({ userUuid: picked.uuid ?? '', reason, name: displayName(picked) }, () => {
              setConfirming(false);
              onOpenChange(false);
            })
          }
        />
      ) : null}
    </>
  );
}

function CreateAdminSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });
  const [confirming, setConfirming] = useState(false);
  const { create, isPending } = useCreateAdmin();

  useEffect(() => {
    if (open) return;
    setForm({ first_name: '', middle_name: '', last_name: '', email: '', phone_number: '' });
    setConfirming(false);
  }, [open]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm(current => ({ ...current, [key]: value }));

  const isDirty = Object.values(form).some(Boolean);
  const canSubmit =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    /.+@.+\..+/.test(form.email.trim());

  const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ').trim();

  return (
    <>
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title='Create administrator'
        description='For someone who has no Elimika account yet.'
        isDirty={isDirty}
        isPending={isPending}
        submitLabel='Review and create'
        onSubmit={() => {
          if (canSubmit) setConfirming(true);
        }}
      >
        <TextField
          id='admin-first-name'
          label='First name'
          required
          maxLength={100}
          value={form.first_name}
          onChange={set('first_name')}
        />
        <TextField
          id='admin-middle-name'
          label='Middle name'
          maxLength={100}
          value={form.middle_name}
          onChange={set('middle_name')}
        />
        <TextField
          id='admin-last-name'
          label='Last name'
          required
          maxLength={100}
          value={form.last_name}
          onChange={set('last_name')}
        />
        <TextField
          id='admin-email'
          label='Email'
          required
          type='email'
          maxLength={150}
          value={form.email}
          onChange={set('email')}
          helper='Their sign-in address. The invitation goes here.'
        />
        <TextField
          id='admin-phone'
          label='Phone number'
          maxLength={50}
          value={form.phone_number}
          onChange={set('phone_number')}
        />
      </FormSheet>

      {confirming ? (
        <ConfirmDialog
          open
          onOpenChange={value => {
            if (!value) setConfirming(false);
          }}
          action='createAdmin'
          subject={{ name: fullName || form.email, detail: form.email }}
          isPending={isPending}
          onConfirm={() =>
            create(
              {
                first_name: form.first_name.trim(),
                middle_name: form.middle_name.trim() || undefined,
                last_name: form.last_name.trim(),
                email: form.email.trim(),
                phone_number: form.phone_number.trim() || undefined,
              },
              () => {
                setConfirming(false);
                onOpenChange(false);
              }
            )
          }
        />
      ) : null}
    </>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  required,
  helper,
  maxLength,
  type = 'text',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
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
      {helper ? <p className='text-muted-foreground text-xs'>{helper}</p> : null}
    </div>
  );
}
