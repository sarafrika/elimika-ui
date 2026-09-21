'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, RotateCw, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { DataTable, SectionCard, StatusBadge } from '@/components/data-display';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/date';
import type {
  DomainNameEnum,
  DomainNameEnum2,
  Organisation,
  OrganisationInvitation,
  TrainingBranch,
  User,
} from '@/services/client';
import { ConfirmDialog } from './confirm-dialog';
import { FormSheet } from './form-sheet';
import { SectionBoundary } from './section-boundary';
import {
  useAddOrganisationStaff,
  useResendInvitation,
  useRevokeInvitation,
  useSetMemberRole,
} from '../hooks/use-organisation-admin-actions';

const ORG_ROLES: { value: DomainNameEnum; label: string }[] = [
  { value: 'organisation_user', label: 'Organisation user' },
  { value: 'admin', label: 'Organisation admin' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
];

/** Students are invited, not created here — the API rejects them on this route. */
const STAFF_ROLES: { value: DomainNameEnum2; label: string }[] = [
  { value: 'organisation_user', label: 'Organisation user' },
  { value: 'admin', label: 'Organisation admin' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'course_creator', label: 'Course creator' },
];

const staffSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  middle_name: z.string().trim().max(100).optional(),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().trim().email('Enter a valid email').max(150),
  phone_number: z.string().trim().max(50).optional(),
  domain_name: z.enum(['organisation_user', 'admin', 'instructor', 'course_creator']),
  branch_uuid: z.string().optional(),
});

type StaffValues = z.infer<typeof staffSchema>;

interface MembersTabProps {
  organisation: Organisation;
  members: User[];
  branches: TrainingBranch[];
  invitations: OrganisationInvitation[];
  membersQuery: {
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
    page: number;
    pageCount: number;
    totalRows: number;
    onPageChange: (page: number) => void;
  };
  invitationsQuery: { isLoading: boolean; error: unknown; refetch: () => void };
}

const NO_BRANCH = 'none';

/** Who belongs to the organisation, in what role, and who has been invited. */
export function MembersTab({
  organisation,
  members,
  branches,
  invitations,
  membersQuery,
  invitationsQuery,
}: MembersTabProps) {
  const organisationUuid = organisation.uuid ?? '';
  const [roleChange, setRoleChange] = useState<{
    user: User;
    domainName: DomainNameEnum;
    branchUuid: string | null;
  } | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);
  const [confirmStaff, setConfirmStaff] = useState(false);
  const [revoking, setRevoking] = useState<OrganisationInvitation | null>(null);
  const [resending, setResending] = useState<OrganisationInvitation | null>(null);

  const setRole = useSetMemberRole();
  const addStaff = useAddOrganisationStaff();
  const revoke = useRevokeInvitation();
  const resend = useResendInvitation();

  const form = useForm<StaffValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      domain_name: 'organisation_user',
      branch_uuid: NO_BRANCH,
    },
    mode: 'onChange',
  });

  /** The membership row for this organisation carries the role and the branch. */
  const affiliationOf = (user: User) =>
    user.organisation_affiliations?.find(
      affiliation => affiliation.organisation_uuid === organisationUuid
    );

  const askToAddStaff = async () => {
    const valid = await form.trigger();
    if (valid) setConfirmStaff(true);
  };

  return (
    <div className='flex flex-col gap-4'>
      <SectionCard
        title='Members'
        description='Roles are scoped to this organisation.'
        actions={
          <Button className='rounded-md' onClick={() => setStaffOpen(true)}>
            <UserPlus className='mr-2 size-4' />
            Add staff
          </Button>
        }
      >
        <SectionBoundary
          label='the members'
          loading={membersQuery.isLoading}
          error={membersQuery.error}
          empty={members.length === 0}
          onRetry={membersQuery.refetch}
          emptyTitle='No members yet'
          emptyDescription='Add staff, or invite students and instructors.'
        >
          <DataTable
            hideToolbar
            data={members}
            getRowId={row => row.uuid ?? row.email}
            emptyTitle='No members yet'
            serverPagination={{
              page: membersQuery.page,
              pageCount: membersQuery.pageCount,
              totalRows: membersQuery.totalRows,
              onPageChange: membersQuery.onPageChange,
            }}
            columns={[
              {
                id: 'member',
                header: 'Member',
                cell: ({ row }) => (
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-sm font-medium'>
                      {row.original.full_name ||
                        `${row.original.first_name} ${row.original.last_name}`}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>{row.original.email}</p>
                  </div>
                ),
              },
              {
                id: 'role',
                header: 'Role in this organisation',
                cell: ({ row }) => {
                  const affiliation = affiliationOf(row.original);
                  return (
                    <Select
                      value={affiliation?.domain_in_organisation ?? 'organisation_user'}
                      onValueChange={value =>
                        setRoleChange({
                          user: row.original,
                          domainName: value as DomainNameEnum,
                          branchUuid: affiliation?.branch_uuid ?? null,
                        })
                      }
                    >
                      <SelectTrigger className='border-border/70 h-8 w-[190px] rounded-md'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                },
              },
              {
                id: 'branch',
                header: 'Branch',
                cell: ({ row }) => (
                  <span className='text-muted-foreground text-sm'>
                    {affiliationOf(row.original)?.branch_name ?? '—'}
                  </span>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => (
                  <StatusBadge status={affiliationOf(row.original)?.active ? 'active' : 'inactive'} />
                ),
              },
              {
                id: 'actions',
                header: '',
                cell: () => (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button variant='ghost' size='sm' disabled>
                          Remove
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Removing a member needs a backend route: the service method exists but nothing
                      exposes it yet.
                    </TooltipContent>
                  </Tooltip>
                ),
              },
            ]}
          />
        </SectionBoundary>
      </SectionCard>

      <SectionCard title='Invitations' description='Sent, and not yet accepted.'>
        <SectionBoundary
          label='the invitations'
          loading={invitationsQuery.isLoading}
          error={invitationsQuery.error}
          empty={invitations.length === 0}
          onRetry={invitationsQuery.refetch}
          emptyTitle='Nothing outstanding'
          emptyDescription='No invitations are waiting for a reply.'
        >
          <ul className='flex flex-col gap-2'>
            {invitations.map(invitation => {
              const live = invitation.status === 'PENDING' || invitation.status === 'AWAITING_GUARDIAN_CONSENT';
              return (
                <li
                  key={invitation.uuid}
                  className='border-border/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2.5'
                >
                  <Mail className='text-muted-foreground size-4 shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <p className='text-foreground truncate text-sm font-medium'>
                      {invitation.recipient_name || invitation.recipient_email}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {invitation.domain_name?.replace(/_/g, ' ')} · sent{' '}
                      {formatDate(invitation.created_date) || '—'}
                      {invitation.expires_at ? ` · expires ${formatDate(invitation.expires_at)}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={invitation.status} />
                  {live ? (
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='rounded-md'
                        onClick={() => setResending(invitation)}
                      >
                        <RotateCw className='mr-1.5 size-3.5' />
                        Resend
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='border-destructive/40 text-destructive rounded-md'
                        onClick={() => setRevoking(invitation)}
                      >
                        <X className='mr-1.5 size-3.5' />
                        Withdraw
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </SectionBoundary>
      </SectionCard>

      <FormSheet
        open={staffOpen}
        onOpenChange={setStaffOpen}
        title='Add a staff member'
        description='They get an account attached to this organisation.'
        isDirty={form.formState.isDirty}
        isPending={addStaff.isPending}
        submitLabel='Add member'
        onSubmit={askToAddStaff}
      >
        <Form {...form}>
          <form className='space-y-4' onSubmit={event => event.preventDefault()}>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      First name <span className='text-destructive'>*</span>
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
                name='last_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Last name <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className='rounded-md' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type='email' className='rounded-md' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phone_number'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input {...field} className='rounded-md font-mono' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='domain_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Role <span className='text-destructive'>*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='border-border/70 rounded-md'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STAFF_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Students are invited instead of created here.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='branch_uuid'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='border-border/70 rounded-md'>
                        <SelectValue placeholder='No branch' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_BRANCH}>No branch</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.uuid} value={branch.uuid ?? ''}>
                          {branch.branch_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </FormSheet>

      <ConfirmDialog
        open={confirmStaff}
        onOpenChange={setConfirmStaff}
        action='addOrganisationStaff'
        subject={{
          name: `${form.getValues('first_name')} ${form.getValues('last_name')}`.trim(),
          detail: organisation.name,
        }}
        isPending={addStaff.isPending}
        onConfirm={() => {
          const values = form.getValues();
          addStaff.mutate(
            {
              organisationUuid,
              values: {
                first_name: values.first_name,
                middle_name: values.middle_name || undefined,
                last_name: values.last_name,
                email: values.email,
                phone_number: values.phone_number || undefined,
                domain_name: values.domain_name,
                branch_uuid:
                  values.branch_uuid && values.branch_uuid !== NO_BRANCH
                    ? values.branch_uuid
                    : undefined,
              },
            },
            {
              onSuccess: () => {
                setConfirmStaff(false);
                setStaffOpen(false);
                form.reset();
              },
            }
          );
        }}
      />

      <ConfirmDialog
        open={roleChange !== null}
        onOpenChange={open => {
          if (!open) setRoleChange(null);
        }}
        action='setMemberRole'
        subject={{
          name:
            roleChange?.user.full_name ||
            `${roleChange?.user.first_name ?? ''} ${roleChange?.user.last_name ?? ''}`.trim(),
          detail: ORG_ROLES.find(role => role.value === roleChange?.domainName)?.label,
        }}
        isPending={setRole.isPending}
        onConfirm={() => {
          if (!roleChange?.user.uuid) return;
          setRole.mutate(
            {
              organisationUuid,
              userUuid: roleChange.user.uuid,
              domainName: roleChange.domainName,
              branchUuid: roleChange.branchUuid,
              memberName:
                roleChange.user.full_name ||
                `${roleChange.user.first_name} ${roleChange.user.last_name}`,
            },
            { onSuccess: () => setRoleChange(null) }
          );
        }}
      />

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={open => {
          if (!open) setRevoking(null);
        }}
        action='revokeInvitation'
        subject={{ name: revoking?.recipient_email ?? '' }}
        isPending={revoke.isPending}
        onConfirm={() => {
          if (!revoking?.uuid) return;
          revoke.mutate(
            {
              organisationUuid,
              invitationUuid: revoking.uuid,
              recipient: revoking.recipient_email ?? 'this person',
            },
            { onSuccess: () => setRevoking(null) }
          );
        }}
      />

      <ConfirmDialog
        open={resending !== null}
        onOpenChange={open => {
          if (!open) setResending(null);
        }}
        action='resendInvitation'
        subject={{ name: resending?.recipient_email ?? '' }}
        isPending={resend.isPending}
        onConfirm={() => {
          if (!resending?.uuid) return;
          resend.mutate(
            {
              organisationUuid,
              invitationUuid: resending.uuid,
              recipient: resending.recipient_email ?? 'this person',
            },
            { onSuccess: () => setResending(null) }
          );
        }}
      />
    </div>
  );
}
