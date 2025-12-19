'use client';

import { AdminDataTable } from '@/components/admin/data-table/data-table';
import type { AdminDataTableColumn } from '@/components/admin/data-table/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import { extractEntity, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  getOrganisationByUuidOptions,
  getPendingOrganisationsOptions,
  isOrganisationVerifiedOptions,
  moderateOrganisationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Organisation } from '@/services/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const actions = [
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'revoke', label: 'Revoke' },
];

export default function OrganisationVerificationPage() {
  const organisationContext = useOrganisation();
  const profile = useUserProfile();
  const qc = useQueryClient();

  const organisationUuid = organisationContext?.uuid ?? '';
  const [page, setPage] = useState(0);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [action, setAction] = useState(actions[0]?.value ?? 'approve');
  const [reason, setReason] = useState('');

  const isAdmin = profile?.user_domain?.includes('admin');

  const verificationQuery = useQuery({
    ...isOrganisationVerifiedOptions({
      path: { uuid: organisationUuid },
    }),
    enabled: Boolean(organisationUuid) && isAdmin,
  });

  const organisationQuery = useQuery({
    ...getOrganisationByUuidOptions({
      path: { uuid: organisationUuid },
    }),
    enabled: Boolean(organisationUuid) && isAdmin,
  });

  const pendingQuery = useQuery({
    ...getPendingOrganisationsOptions({
      query: { pageable: { page, size: 10 } },
    }),
    enabled: isAdmin,
  });

  const moderate = useMutation(moderateOrganisationMutation());

  const verificationStatus = extractEntity<{ success?: boolean; data?: boolean }>(
    verificationQuery.data
  );
  const organisation = extractEntity<Organisation>(organisationQuery.data);
  const pendingPage = extractPage<Organisation>(pendingQuery.data);
  const totalPending = getTotalFromMetadata(pendingPage.metadata);
  const totalPages =
    (pendingPage.metadata.totalPages as number | undefined) ??
    (totalPending > 0 ? Math.ceil(totalPending / 10) : 1);

  const isVerified = verificationStatus?.data ?? organisation?.admin_verified;

  const formattedPending = useMemo(() => pendingPage.items ?? [], [pendingPage.items]);

  const columns: AdminDataTableColumn<Organisation>[] = [
    {
      id: 'name',
      header: 'Organisation',
      cell: org => (
        <div className='flex flex-col'>
          <span className='font-medium'>{org.name}</span>
          <span className='text-muted-foreground text-xs'>{org.country ?? 'Country not set'}</span>
        </div>
      ),
    },
    {
      id: 'created',
      header: 'Created',
      cell: org =>
        org.created_date ? (
          <span className='text-sm'>{format(new Date(org.created_date), 'dd MMM yyyy')}</span>
        ) : (
          <span className='text-muted-foreground text-sm'>—</span>
        ),
    },
    {
      id: 'active',
      header: 'Status',
      cell: org => (
        <Badge variant={org.active ? 'secondary' : 'outline'}>
          {org.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
      className: 'text-right',
    },
  ];

  const handleModerate = () => {
    if (!selectedOrg?.uuid) {
      toast.error('Select an organisation to moderate');
      return;
    }

    moderate.mutate(
      {
        path: { uuid: selectedOrg.uuid },
        query: { action: action as any, reason: reason || undefined },
      },
      {
        onSuccess: () => {
          toast.success('Moderation submitted');
          qc.invalidateQueries({
            queryKey: getPendingOrganisationsOptions({ query: { pageable: { page, size: 10 } } })
              .queryKey,
          });
          qc.invalidateQueries({
            queryKey: isOrganisationVerifiedOptions({ path: { uuid: organisationUuid } }).queryKey,
          });
        },
        onError: () => toast.error('Unable to moderate organisation'),
      }
    );
  };

  if (!isAdmin) {
    return (
      <div className='border-border/60 bg-card rounded-2xl border p-6 shadow-sm'>
        <div className='flex items-center gap-2 text-sm font-semibold'>
          <ShieldQuestion className='h-4 w-4' />
          Verification actions are restricted to system admins.
        </div>
        <p className='text-muted-foreground text-sm'>
          Switch to an admin role to review pending organisation approvals.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='border-border/60 bg-card flex flex-col gap-3 rounded-3xl border p-6 shadow-sm md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Verification & compliance</h1>
          <p className='text-muted-foreground text-sm'>
            Pending queue comes from GET /api/v1/admin/organizations/pending. Actions post to the
            moderation endpoint.
          </p>
        </div>
        <Badge variant={isVerified ? 'default' : 'secondary'} className='gap-2'>
          {isVerified ? <ShieldCheck className='h-4 w-4' /> : <ShieldAlert className='h-4 w-4' />}
          {isVerified ? 'Verified' : 'Pending verification'}
        </Badge>
      </div>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]'>
        <div className='border-border/60 bg-card rounded-2xl border p-5 shadow-sm'>
          <AdminDataTable
            title='Pending approvals'
            description='Select an organisation to approve, reject, or revoke.'
            columns={columns}
            data={formattedPending}
            isLoading={pendingQuery.isLoading}
            onRowClick={org => setSelectedOrg(org)}
            selectedId={selectedOrg?.uuid ?? null}
            pagination={{
              page,
              pageSize: 10,
              totalItems: totalPending,
              totalPages: totalPages || 1,
              onPageChange: setPage,
            }}
            emptyState={{
              title: 'No pending organisations',
              description: 'New onboarding requests will appear here for moderation.',
            }}
          />
        </div>

        <div className='border-border/60 bg-card rounded-2xl border p-5 shadow-sm'>
          <div className='flex items-center gap-2 text-sm font-semibold'>
            <Workflow className='h-4 w-4' />
            Moderation action
          </div>
          <p className='text-muted-foreground text-sm'>
            POST /api/v1/admin/organizations/{'{uuid}'}
            /moderate?action=approve|reject|revoke&reason=...
          </p>
          <div className='mt-4 space-y-3'>
            <div className='space-y-1'>
              <Label className='text-muted-foreground text-xs'>Selected organisation</Label>
              <Input
                value={selectedOrg?.name ?? ''}
                readOnly
                placeholder='Select an organisation'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-muted-foreground text-xs'>Action</Label>
              <select
                className='border-border/60 bg-background rounded-md border px-3 py-2 text-sm'
                value={action}
                onChange={event => setAction(event.target.value)}
              >
                {actions.map(current => (
                  <option key={current.value} value={current.value}>
                    {current.label}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-1'>
              <Label className='text-muted-foreground text-xs'>Reason</Label>
              <Textarea
                rows={3}
                placeholder='Provide context for the moderation decision'
                value={reason}
                onChange={event => setReason(event.target.value)}
              />
            </div>
            <Button onClick={handleModerate} disabled={moderate.isPending || !selectedOrg}>
              {moderate.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Submit moderation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
