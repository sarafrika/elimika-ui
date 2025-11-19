"use client";

import { AdminDataTable } from '@/components/admin/data-table/data-table';
import type { AdminDataTableColumn } from '@/components/admin/data-table/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTrainingCenter } from '@/context/training-center-provide';
import { useUserProfile } from '@/context/profile-context';
import { extractPage, } from '@/lib/api-helpers';
import {
  cancelInvitationMutation,
  createBranchInvitationMutation,
  createOrganizationInvitationMutation,
  getOrganizationInvitationsOptions,
  getTrainingBranchesByOrganisationOptions,
  resendInvitationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Invitation, TrainingBranch } from '@/services/client';
import { zInvitationRequest } from '@/services/client/zod.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, MailPlus, Send, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

const statusBadges: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  ACCEPTED: { label: 'Accepted', variant: 'default' },
  DECLINED: { label: 'Declined', variant: 'outline' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

type InvitationFormValues = z.infer<typeof zInvitationRequest> & { branchUuid?: string };

export default function OrganisationInvitationsPage() {
  const trainingCenter = useTrainingCenter();
  const profile = useUserProfile();
  const qc = useQueryClient();

  const organisationUuid = trainingCenter?.uuid ?? '';
  const inviterUuid = profile?.uuid ?? '';

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'org' | 'branch'>('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const invitationsQuery = useQuery({
    ...getOrganizationInvitationsOptions({
      path: { uuid: organisationUuid },
    }),
    enabled: Boolean(organisationUuid),
  });

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 50 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const invitations = extractPage<Invitation>(invitationsQuery.data).items;
  const branchesPage = extractPage<TrainingBranch>(branchesQuery.data);
  const branchOptions = branchesPage.items;

  const filteredInvitations = useMemo(() => {
    return invitations.filter(invite => {
      const matchesStatus = statusFilter ? invite.status === statusFilter : true;
      const matchesScope =
        scopeFilter === 'all'
          ? true
          : scopeFilter === 'org'
            ? !invite.branch_uuid
            : Boolean(invite.branch_uuid);
      return matchesStatus && matchesScope;
    });
  }, [invitations, statusFilter, scopeFilter]);

  const resendInvitation = useMutation(resendInvitationMutation());
  const cancelInvitation = useMutation(cancelInvitationMutation());
  const createOrgInvitation = useMutation(createOrganizationInvitationMutation());
  const createBranchInvitation = useMutation(createBranchInvitationMutation());

  const columns: AdminDataTableColumn<Invitation>[] = [
    {
      id: 'recipient',
      header: 'Recipient',
      cell: invite => (
        <div className='flex flex-col'>
          <span className='font-medium'>{invite.recipient_name}</span>
          <span className='text-muted-foreground text-xs'>{invite.recipient_email}</span>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: invite => <Badge variant='secondary'>{invite.domain_name}</Badge>,
    },
    {
      id: 'scope',
      header: 'Scope',
      cell: invite => (
        <div className='flex flex-col text-sm'>
          <span>{invite.branch_name ?? invite.organisation_name ?? 'Organisation'}</span>
          {invite.branch_uuid ? (
            <span className='text-muted-foreground text-xs'>Branch invitation</span>
          ) : (
            <span className='text-muted-foreground text-xs'>Organisation level</span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: invite => {
        const badge = statusBadges[invite.status ?? ''] ?? statusBadges.PENDING;
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      id: 'expires',
      header: 'Created',
      cell: invite =>
        invite.created_date ? (
          <span className='text-sm'>{format(new Date(invite.created_date), 'dd MMM yyyy')}</span>
        ) : (
          <span className='text-muted-foreground text-sm'>—</span>
        ),
      className: 'text-right',
    },
    {
      id: 'actions',
      header: '',
      cell: invite => (
        <div className='flex justify-end gap-2'>
          <Button
            variant='ghost'
            size='sm'
            disabled={invite.status !== 'PENDING' || resendInvitation.isPending}
            onClick={() => handleResend(invite.uuid)}
          >
            <Send className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            disabled={invite.status !== 'PENDING' || cancelInvitation.isPending}
            onClick={() => handleCancel(invite.uuid)}
          >
            <XCircle className='h-4 w-4 text-destructive' />
          </Button>
        </div>
      ),
    },
  ];

  const handleResend = (invitationUuid?: string) => {
    if (!invitationUuid || !organisationUuid || !inviterUuid) {
      toast.error('Missing organisation or user context to resend');
      return;
    }
    resendInvitation.mutate(
      {
        path: { uuid: organisationUuid, invitationUuid },
        query: { resender_uuid: inviterUuid },
      },
      {
        onSuccess: () => {
          toast.success('Invitation resent');
          qc.invalidateQueries({
            queryKey: getOrganizationInvitationsOptions({ path: { uuid: organisationUuid } }).queryKey,
          });
        },
        onError: () => toast.error('Unable to resend invitation'),
      }
    );
  };

  const handleCancel = (invitationUuid?: string) => {
    if (!invitationUuid || !organisationUuid || !inviterUuid) {
      toast.error('Missing organisation or user context to cancel');
      return;
    }
    cancelInvitation.mutate(
      {
        path: { uuid: organisationUuid, invitationUuid },
        query: { canceller_uuid: inviterUuid },
      },
      {
        onSuccess: () => {
          toast.success('Invitation cancelled');
          qc.invalidateQueries({
            queryKey: getOrganizationInvitationsOptions({ path: { uuid: organisationUuid } }).queryKey,
          });
        },
        onError: () => toast.error('Unable to cancel invitation'),
      }
    );
  };

  const handleCreate = (values: InvitationFormValues) => {
    if (!organisationUuid || !inviterUuid) {
      toast.error('Missing organisation or inviter details');
      return;
    }
    const payload = { ...values, inviter_uuid: inviterUuid };

    const mutation = values.branchUuid ? createBranchInvitation : createOrgInvitation;
    mutation.mutate(
      values.branchUuid
        ? {
            path: { uuid: organisationUuid, branchUuid: values.branchUuid },
            body: payload,
          }
        : {
            path: { uuid: organisationUuid },
            body: payload,
          },
      {
        onSuccess: () => {
          toast.success('Invitation sent');
          qc.invalidateQueries({
            queryKey: getOrganizationInvitationsOptions({ path: { uuid: organisationUuid } }).queryKey,
          });
          setInviteDialogOpen(false);
        },
        onError: () => toast.error('Unable to send invitation'),
      }
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Invitations</h1>
          <p className='text-muted-foreground text-sm'>
            Combined organisation and branch invites from /api/v1/organisations/{organisationUuid}/invitations.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button size='sm' className='gap-2' onClick={() => setInviteDialogOpen(true)}>
            <MailPlus className='h-4 w-4' />
            New invitation
          </Button>
        </div>
      </div>

      <div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='space-y-1'>
            <Label className='text-xs text-muted-foreground'>Status</Label>
            <select
              className='rounded-md border border-border/60 bg-background px-3 py-2 text-sm'
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
            >
              <option value=''>All</option>
              <option value='PENDING'>Pending</option>
              <option value='ACCEPTED'>Accepted</option>
              <option value='DECLINED'>Declined</option>
              <option value='EXPIRED'>Expired</option>
              <option value='CANCELLED'>Cancelled</option>
            </select>
          </div>
          <div className='space-y-1'>
            <Label className='text-xs text-muted-foreground'>Scope</Label>
            <select
              className='rounded-md border border-border/60 bg-background px-3 py-2 text-sm'
              value={scopeFilter}
              onChange={event => setScopeFilter(event.target.value as typeof scopeFilter)}
            >
              <option value='all'>All</option>
              <option value='org'>Organisation</option>
              <option value='branch'>Branch</option>
            </select>
          </div>
        </div>
        <div className='mt-4'>
          <AdminDataTable
            title='Sent invitations'
            description='Only pending invitations can be resent or cancelled.'
            columns={columns}
            data={filteredInvitations}
            isLoading={invitationsQuery.isLoading}
            emptyState={{
              title: 'No invitations found',
              description: 'Send a new invite to onboard team members.',
            }}
            pagination={{
              page: 0,
              pageSize: filteredInvitations.length || 1,
              totalItems: filteredInvitations.length,
              totalPages: 1,
              onPageChange: () => undefined,
            }}
          />
        </div>
      </div>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSubmit={handleCreate}
        branches={branchOptions}
        isSubmitting={
          createOrgInvitation.isPending || createBranchInvitation.isPending || cancelInvitation.isPending
        }
        inviterUuid={inviterUuid}
      />
    </div>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onSubmit,
  branches,
  isSubmitting,
  inviterUuid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InvitationFormValues) => void;
  branches: TrainingBranch[];
  isSubmitting: boolean;
  inviterUuid: string;
}) {
  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(zInvitationRequest),
    defaultValues: {
      recipient_email: '',
      recipient_name: '',
      domain_name: 'organisation_user',
      notes: '',
      branchUuid: '',
      inviter_uuid: inviterUuid,
    },
  });

  useEffect(() => {
    if (inviterUuid) {
      form.setValue('inviter_uuid', inviterUuid);
    }
  }, [form, inviterUuid]);

  const handleSubmit = (values: InvitationFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create invitation</DialogTitle>
          <DialogDescription>
            Org-level invites use POST /api/v1/organisations/{'{uuid}'}/invitations. Select a branch to
            use the branch-specific endpoint.
          </DialogDescription>
        </DialogHeader>
        <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input {...form.register('recipient_name')} />
            </div>
            <div className='space-y-1'>
              <Label>Email</Label>
              <Input type='email' {...form.register('recipient_email')} />
            </div>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-1'>
              <Label>Role</Label>
              <Select
                value={form.watch('domain_name')}
                onValueChange={value => form.setValue('domain_name', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='organisation_user'>Organisation user</SelectItem>
                  <SelectItem value='instructor'>Instructor</SelectItem>
                  <SelectItem value='student'>Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Branch (optional)</Label>
              <Select
                value={form.watch('branchUuid') ?? ''}
                onValueChange={value => form.setValue('branchUuid', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Organisation-level invite' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>Organisation-level invite</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.uuid} value={branch.uuid ?? ''}>
                      {branch.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='space-y-1'>
            <Label>Message</Label>
            <Textarea rows={3} placeholder='Optional message for the recipient' {...form.register('notes')} />
          </div>
          <DialogFooter>
            <Button variant='outline' type='button' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
