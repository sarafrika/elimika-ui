"use client";

import { elimikaDesignSystem } from '@/lib/design-system';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisation } from '@/context/organisation-context';
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
import {
  Loader2,
  MailPlus,
  Send,
  XCircle,
  Mail,
  UserPlus,
  Search,
  Filter,
  X,
  Building2,
  Clock,
  CheckCircle2,
  Calendar,
  RefreshCw,
} from 'lucide-react';
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
  const organisation = useOrganisation();
  const profile = useUserProfile();
  const qc = useQueryClient();

  const organisationUuid = organisation?.uuid ?? '';
  const inviterUuid = profile?.uuid ?? '';

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'org' | 'branch'>('all');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(0);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const pageSize = 12;

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
    let items = invitations.filter(invite => {
      const matchesStatus = statusFilter ? invite.status === statusFilter : true;
      const matchesScope =
        scopeFilter === 'all'
          ? true
          : scopeFilter === 'org'
            ? !invite.branch_uuid
            : Boolean(invite.branch_uuid);
      return matchesStatus && matchesScope;
    });

    // Search filter
    if (searchValue) {
      const term = searchValue.toLowerCase();
      items = items.filter(
        (invite) =>
          invite.recipient_name?.toLowerCase().includes(term) ||
          invite.recipient_email?.toLowerCase().includes(term)
      );
    }

    return items;
  }, [invitations, statusFilter, scopeFilter, searchValue]);

  // Pagination
  const paginatedInvitations = useMemo(() => {
    const start = page * pageSize;
    return filteredInvitations.slice(start, start + pageSize);
  }, [filteredInvitations, page, pageSize]);

  const totalPages = Math.max(Math.ceil(filteredInvitations.length / pageSize), 1);

  // Stats
  const stats = useMemo(() => {
    return {
      total: invitations.length,
      pending: invitations.filter((i) => i.status === 'PENDING').length,
      accepted: invitations.filter((i) => i.status === 'ACCEPTED').length,
      branch: invitations.filter((i) => i.branch_uuid).length,
    };
  }, [invitations]);

  const resendMutation = useMutation(resendInvitationMutation());
  const cancelMutation = useMutation(cancelInvitationMutation());
  const createOrgInvitation = useMutation(createOrganizationInvitationMutation());
  const createBranchInvitation = useMutation(createBranchInvitationMutation());

  const handleResend = (invitationUuid?: string) => {
    if (!invitationUuid || !organisationUuid || !inviterUuid) {
      toast.error('Missing organisation or user context to resend');
      return;
    }
    resendMutation.mutate(
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
    cancelMutation.mutate(
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
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Compact Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Invitations</h1>
            <p className='text-sm text-muted-foreground'>Manage pending invites and team member access</p>
          </div>
          <Button size='sm' onClick={() => setInviteDialogOpen(true)}>
            <MailPlus className='mr-2 h-4 w-4' />
            New Invitation
          </Button>
        </div>

        {/* Stats */}
        <div className='grid gap-3 sm:grid-cols-4'>
          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Send className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Total Invites</p>
                <p className='text-lg font-bold text-foreground'>{stats.total}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Clock className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Pending</p>
                <p className='text-lg font-bold text-foreground'>{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <CheckCircle2 className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Accepted</p>
                <p className='text-lg font-bold text-foreground'>{stats.accepted}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Building2 className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Branch Invites</p>
                <p className='text-lg font-bold text-foreground'>{stats.branch}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className='mb-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <select
              className='rounded-md border border-border bg-background px-3 py-2 text-sm'
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
            >
              <option value=''>All statuses</option>
              <option value='PENDING'>Pending</option>
              <option value='ACCEPTED'>Accepted</option>
              <option value='DECLINED'>Declined</option>
              <option value='CANCELLED'>Cancelled</option>
            </select>
            <select
              className='rounded-md border border-border bg-background px-3 py-2 text-sm'
              value={scopeFilter}
              onChange={(event) => {
                setScopeFilter(event.target.value as typeof scopeFilter);
                setPage(0);
              }}
            >
              <option value='all'>All scopes</option>
              <option value='org'>Organisation</option>
              <option value='branch'>Branch</option>
            </select>
            {(statusFilter || scopeFilter !== 'all') && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setStatusFilter('');
                  setScopeFilter('all');
                }}
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by name or email...'
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className='w-full pl-10 sm:w-80'
            />
            {searchValue && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSearchValue('')}
                className='absolute right-1 top-1/2 h-7 -translate-y-1/2'
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Invitations Grid */}
      <section className={elimikaDesignSystem.spacing.content}>
        {invitationsQuery.isLoading ? (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-56 w-full' />
            ))}
          </div>
        ) : paginatedInvitations.length === 0 ? (
          <div className={elimikaDesignSystem.components.emptyState.container}>
            <Send className={elimikaDesignSystem.components.emptyState.icon} />
            <h3 className={elimikaDesignSystem.components.emptyState.title}>
              {searchValue || statusFilter || scopeFilter !== 'all'
                ? 'No invitations found'
                : 'No invitations yet'}
            </h3>
            <p className={elimikaDesignSystem.components.emptyState.description}>
              {searchValue || statusFilter || scopeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first invitation to invite team members to your organization'}
            </p>
            {!searchValue && !statusFilter && scopeFilter === 'all' && (
              <Button className='mt-4' onClick={() => setInviteDialogOpen(true)}>
                <MailPlus className='mr-2 h-4 w-4' />
                New Invitation
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {paginatedInvitations.map((invite) => (
                <InviteCard
                  key={invite.uuid}
                  invite={invite}
                  onCancel={handleCancel}
                  onResend={handleResend}
                  isLoading={cancelMutation.isPending || resendMutation.isPending}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className='text-sm text-muted-foreground'>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSubmit={handleCreate}
        branches={branchOptions}
        isSubmitting={createOrgInvitation.isPending || createBranchInvitation.isPending}
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
                value={form.watch('branchUuid') ?? 'org-level'}
                onValueChange={value => form.setValue('branchUuid', value === 'org-level' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Organisation-level invite' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='org-level'>Organisation-level invite</SelectItem>
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

function InviteCard({
  invite,
  onCancel,
  onResend,
  isLoading,
}: {
  invite: Invitation;
  onCancel: (uuid?: string) => void;
  onResend: (uuid?: string) => void;
  isLoading: boolean;
}) {
  const badge = statusBadges[invite.status ?? ''] ?? statusBadges.PENDING;

  return (
    <div className={elimikaDesignSystem.components.listCard.base}>
      <div className='mb-4 flex items-start justify-between'>
        <div className='flex items-center gap-3 flex-1'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <span className='text-lg font-semibold'>
              {(invite.recipient_name?.[0] || invite.recipient_email?.[0] || '?').toUpperCase()}
            </span>
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='font-semibold text-foreground truncate'>{invite.recipient_name}</h3>
            <div className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Mail className='h-3 w-3 flex-shrink-0' />
              <span className='truncate'>{invite.recipient_email}</span>
            </div>
          </div>
        </div>
        <Badge variant={badge.variant} className='ml-2 flex-shrink-0'>
          {badge.label}
        </Badge>
      </div>

      <Separator className='my-3' />

      <div className='space-y-3'>
        <div>
          <p className='mb-2 text-xs font-medium text-muted-foreground'>Role & Scope</p>
          <div className='flex flex-wrap gap-1.5'>
            <Badge variant='outline' className='text-xs'>
              {invite.domain_name || 'Unknown'}
            </Badge>
            {invite.branch_uuid && (
              <Badge variant='secondary' className='text-xs'>
                Branch: {invite.branch_name}
              </Badge>
            )}
            {!invite.branch_uuid && (
              <Badge variant='secondary' className='text-xs'>
                Organisation
              </Badge>
            )}
          </div>
        </div>

        {invite.created_date && (
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Calendar className='h-3 w-3 flex-shrink-0' />
            <span>Sent {format(new Date(invite.created_date), 'MMM dd, yyyy')}</span>
          </div>
        )}

        {invite.notes && (
          <p className='text-xs text-muted-foreground italic line-clamp-2'>&quot;{invite.notes}&quot;</p>
        )}
      </div>

      <div className='mt-4 flex items-center gap-2'>
        <Button
          size='sm'
          variant='outline'
          className='flex-1'
          onClick={() => onResend(invite.uuid)}
          disabled={invite.status !== 'PENDING' || isLoading}
        >
          <RefreshCw className='mr-2 h-3.5 w-3.5' />
          Resend
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={() => {
            if (confirm(`Cancel invitation to ${invite.recipient_name}?`)) {
              onCancel(invite.uuid);
            }
          }}
          disabled={invite.status !== 'PENDING' || isLoading}
        >
          <XCircle className='h-3.5 w-3.5 text-destructive' />
        </Button>
      </div>
    </div>
  );
}
