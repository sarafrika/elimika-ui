'use client';

import { elimikaDesignSystem } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  acceptInvitationMutation,
  cancelInvitationMutation,
  declineInvitationMutation,
  getOrganizationInvitationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Invitation } from '@/services/client';
import { resendInvitation } from '@/services/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import {
  Mail,
  Send,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  X,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  UserX,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { InviteForm } from './InviteForm';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function getStatusBadgeVariant(status?: string) {
  switch (status) {
    case 'ACCEPTED':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'DECLINED':
    case 'CANCELLED':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getStatusIcon(status?: string) {
  switch (status) {
    case 'ACCEPTED':
      return <CheckCircle2 className='h-3.5 w-3.5' />;
    case 'PENDING':
      return <Clock className='h-3.5 w-3.5' />;
    case 'DECLINED':
    case 'CANCELLED':
      return <XCircle className='h-3.5 w-3.5' />;
    default:
      return <Clock className='h-3.5 w-3.5' />;
  }
}

export default function InvitesPageImproved() {
  const organisation = useOrganisation();
  const user = useUserProfile();
  const qc = useQueryClient();
  const organisationUuid = organisation?.uuid ?? '';

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const pageSize = 12;

  const invitesQuery = useQuery({
    ...getOrganizationInvitationsOptions({
      path: { uuid: organisationUuid },
    }),
    enabled: Boolean(organisationUuid),
  });

  const invitesPage = extractPage<Invitation>(invitesQuery.data);
  const allInvites = invitesPage.items;

  // Apply filters
  const filteredInvites = useMemo(() => {
    let items = allInvites;

    // Status filter
    if (statusFilter) {
      items = items.filter((invite) => invite.status === statusFilter);
    }

    // Search filter
    if (searchValue) {
      const term = searchValue.toLowerCase();
      items = items.filter(
        (invite) =>
          invite.recipient_name?.toLowerCase().includes(term) ||
          invite.recipient_email?.toLowerCase().includes(term) ||
          invite.inviter_name?.toLowerCase().includes(term)
      );
    }

    return items;
  }, [allInvites, statusFilter, searchValue]);

  // Pagination
  const paginatedInvites = useMemo(() => {
    const start = page * pageSize;
    return filteredInvites.slice(start, start + pageSize);
  }, [filteredInvites, page, pageSize]);

  const totalPages = Math.max(Math.ceil(filteredInvites.length / pageSize), 1);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allInvites.length,
      pending: allInvites.filter((i) => i.status === 'PENDING').length,
      accepted: allInvites.filter((i) => i.status === 'ACCEPTED').length,
      sentByYou: allInvites.filter((i) => i.inviter_uuid === user?.uuid).length,
    };
  }, [allInvites, user?.uuid]);

  // Mutations
  const cancelMutation = useMutation(cancelInvitationMutation());
  const declineMutation = useMutation(declineInvitationMutation());
  const acceptMutation = useMutation(acceptInvitationMutation());

  const handleCancel = (inviteUuid: string) => {
    cancelMutation.mutate(
      {
        path: { uuid: user?.uuid!, invitationUuid: inviteUuid },
        query: { canceller_uuid: user?.uuid! },
      },
      {
        onSuccess: () => {
          toast.success('Invitation cancelled');
          qc.invalidateQueries({
            queryKey: getOrganizationInvitationsOptions({ path: { uuid: organisationUuid } }).queryKey,
          });
        },
        onError: () => toast.error('Failed to cancel invitation'),
      }
    );
  };

  const handleAccept = (inviteUuid: string, token: string) => {
    acceptMutation.mutate(
      {
        path: { uuid: inviteUuid },
        query: { token },
      },
      {
        onSuccess: () => {
          toast.success('Invitation accepted');
          qc.invalidateQueries({
            queryKey: getOrganizationInvitationsOptions({ path: { uuid: organisationUuid } }).queryKey,
          });
        },
        onError: () => toast.error('Failed to accept invitation'),
      }
    );
  };

  const handleDecline = (inviteUuid: string, token: string) => {
    declineMutation.mutate(
      {
        path: { uuid: inviteUuid },
        query: { token },
      },
      {
        onSuccess: () => {
          toast.success('Invitation declined');
          qc.invalidateQueries({
            queryKey: getOrganizationInvitationsOptions({ path: { uuid: organisationUuid } }).queryKey,
          });
        },
        onError: () => toast.error('Failed to decline invitation'),
      }
    );
  };

  const handleResend = async (inviteUuid: string) => {
    try {
      const resp = await resendInvitation({
        path: { uuid: user?.uuid!, invitationUuid: inviteUuid },
        query: { resender_uuid: user?.uuid! },
      });

      if (resp.error) {
        const error = resp.error as any;
        toast.error(error.error || 'Failed to resend invitation');
      } else {
        toast.success('Invitation resent');
      }

      qc.invalidateQueries({
        queryKey: getOrganizationInvitationsOptions({ path: { uuid: organisationUuid } }).queryKey,
      });
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
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
          <InviteForm>
            <Button size='sm'>
              <UserPlus className='mr-2 h-4 w-4' />
              Create Invite
            </Button>
          </InviteForm>
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
                <UserCheck className='h-4 w-4 text-primary' />
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
                <p className='text-xs text-muted-foreground'>Sent by You</p>
                <p className='text-lg font-bold text-foreground'>{stats.sentByYou}</p>
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
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {statusFilter && (
              <Button variant='ghost' size='sm' onClick={() => setStatusFilter('')}>
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
        {invitesQuery.isLoading ? (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-56 w-full' />
            ))}
          </div>
        ) : paginatedInvites.length === 0 ? (
          <div className={elimikaDesignSystem.components.emptyState.container}>
            <Send className={elimikaDesignSystem.components.emptyState.icon} />
            <h3 className={elimikaDesignSystem.components.emptyState.title}>
              {searchValue || statusFilter ? 'No invitations found' : 'No invitations yet'}
            </h3>
            <p className={elimikaDesignSystem.components.emptyState.description}>
              {searchValue || statusFilter
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first invitation to invite team members to your organization'}
            </p>
            {!searchValue && !statusFilter && (
              <InviteForm>
                <Button className='mt-4'>
                  <UserPlus className='mr-2 h-4 w-4' />
                  Create Invite
                </Button>
              </InviteForm>
            )}
          </div>
        ) : (
          <>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {paginatedInvites.map((invite) => (
                <InviteCard
                  key={invite.uuid}
                  invite={invite}
                  currentUserUuid={user?.uuid}
                  onCancel={handleCancel}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onResend={handleResend}
                  isLoading={
                    cancelMutation.isPending || acceptMutation.isPending || declineMutation.isPending
                  }
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
    </div>
  );
}

function InviteCard({
  invite,
  currentUserUuid,
  onCancel,
  onAccept,
  onDecline,
  onResend,
  isLoading,
}: {
  invite: Invitation;
  currentUserUuid?: string;
  onCancel: (uuid: string) => void;
  onAccept: (uuid: string, token: string) => void;
  onDecline: (uuid: string, token: string) => void;
  onResend: (uuid: string) => void;
  isLoading: boolean;
}) {
  const isSentByMe = invite.inviter_uuid === currentUserUuid;
  const isReceivedByMe = !isSentByMe;

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
        <Badge variant={getStatusBadgeVariant(invite.status)} className='ml-2 flex-shrink-0'>
          <span className='mr-1'>{getStatusIcon(invite.status)}</span>
          {invite.status}
        </Badge>
      </div>

      <Separator className='my-3' />

      <div className='space-y-3'>
        <div>
          <p className='mb-2 text-xs font-medium text-muted-foreground'>Role</p>
          <Badge variant='outline' className='text-xs'>
            {invite.domain_name || 'Unknown'}
          </Badge>
        </div>

        {invite.branch_name && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Building2 className='h-3.5 w-3.5 flex-shrink-0' />
            <span className='truncate'>{invite.branch_name}</span>
          </div>
        )}

        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Calendar className='h-3 w-3 flex-shrink-0' />
          <span>
            {isSentByMe ? 'Sent by you' : `Sent by ${invite.inviter_name || 'Unknown'}`}
          </span>
        </div>

        {invite.notes && (
          <p className='text-xs text-muted-foreground italic line-clamp-2'>&quot;{invite.notes}&quot;</p>
        )}
      </div>

      <div className='mt-4 flex items-center gap-2'>
        {isSentByMe && invite.status !== 'CANCELLED' && (
          <>
            <Button
              size='sm'
              variant='outline'
              className='flex-1'
              onClick={() => onResend(invite.uuid!)}
              disabled={isLoading}
            >
              <RefreshCw className='mr-2 h-3.5 w-3.5' />
              Resend
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                if (confirm('Cancel this invitation?')) {
                  onCancel(invite.uuid!);
                }
              }}
              disabled={isLoading}
            >
              <UserX className='h-3.5 w-3.5 text-destructive' />
            </Button>
          </>
        )}

        {isReceivedByMe && invite.status === 'PENDING' && (
          <>
            <Button
              size='sm'
              variant='default'
              className='flex-1'
              onClick={() => onAccept(invite.uuid!, invite.token!)}
              disabled={isLoading}
            >
              <CheckCircle2 className='mr-2 h-3.5 w-3.5' />
              Accept
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                if (confirm('Decline this invitation?')) {
                  onDecline(invite.uuid!, invite.token!);
                }
              }}
              disabled={isLoading}
            >
              <XCircle className='h-3.5 w-3.5 text-destructive' />
            </Button>
          </>
        )}

        {isReceivedByMe && invite.status !== 'PENDING' && (
          <div className='flex-1 text-center text-xs text-muted-foreground'>
            {invite.status === 'ACCEPTED' && 'You accepted this invitation'}
            {invite.status === 'DECLINED' && 'You declined this invitation'}
          </div>
        )}

        {isSentByMe && invite.status === 'CANCELLED' && (
          <div className='flex-1 text-center text-xs text-muted-foreground'>
            This invitation was cancelled
          </div>
        )}
      </div>
    </div>
  );
}
