'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Building2, MoreHorizontal, ShieldCheck, ShieldX, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type AdminOrganisation,
  useAdminOrganisations,
  useUnverifyAdminOrganisation,
  useVerifyAdminOrganisation,
} from '@/services/admin';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';

export function OrganizationsTable() {
  const router = useRouter();
  const { data, isLoading } = useAdminOrganisations({ page: 0, size: 100 });
  const organisations = (data?.items ?? []) as AdminOrganisation[];
  const verify = useVerifyAdminOrganisation();
  const unverify = useUnverifyAdminOrganisation();

  const runAction = (uuid: string | undefined, action: 'verify' | 'revoke') => {
    if (!uuid) return;
    const mutation = action === 'verify' ? verify : unverify;
    mutation.mutate(
      { path: { uuid }, query: { action: action === 'verify' ? 'approve' : 'revoke' } },
      {
        onSuccess: () => {
          toast.success(action === 'verify' ? 'Organisation verified' : 'Verification revoked');
          router.refresh();
        },
        onError: error => toast.error(error instanceof Error ? error.message : 'Action failed'),
      }
    );
  };

  const columns = useMemo<ColumnDef<AdminOrganisation>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => row.name ?? '',
        header: 'Organisation',
        meta: { label: 'Organisation' },
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <span className='border-border/60 bg-muted/40 flex size-9 items-center justify-center rounded-md border'>
              <Building2 className='text-muted-foreground size-4' />
            </span>
            <div className='min-w-0'>
              <p className='text-foreground truncate text-sm font-medium'>{row.original.name}</p>
              <p className='text-muted-foreground truncate text-xs'>
                {row.original.description || row.original.slug || '—'}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'location',
        accessorFn: row => [row.location, row.country].filter(Boolean).join(', '),
        header: 'Location',
        meta: { label: 'Location' },
        cell: ({ getValue }) => (
          <span className='text-muted-foreground text-sm'>{(getValue() as string) || '—'}</span>
        ),
      },
      {
        id: 'status',
        accessorFn: row => (row.active ? 'active' : 'inactive'),
        header: 'Status',
        meta: { label: 'Status' },
        filterFn: (row, id, value: string[]) =>
          !value?.length || value.includes(row.getValue(id) as string),
        cell: ({ row }) => <StatusBadge status={row.original.active ? 'active' : 'inactive'} />,
      },
      {
        id: 'verification',
        accessorFn: row => (row.admin_verified ? 'verified' : 'pending'),
        header: 'Verification',
        meta: { label: 'Verification' },
        filterFn: (row, id, value: string[]) =>
          !value?.length || value.includes(row.getValue(id) as string),
        cell: ({ row }) => (
          <StatusBadge status={row.original.admin_verified ? 'verified' : 'pending'} />
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const org = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-8'
                  onClick={e => e.stopPropagation()}
                >
                  <MoreHorizontal className='size-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-44'>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/admin/organizations/${org.uuid}/branches`}>
                    <Building2 className='size-4' />
                    Branches
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/admin/organizations/${org.uuid}/users`}>
                    <Users className='size-4' />
                    Members
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {org.admin_verified ? (
                  <DropdownMenuItem onClick={() => runAction(org.uuid, 'revoke')}>
                    <ShieldX className='size-4' />
                    Revoke verification
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => runAction(org.uuid, 'verify')}>
                    <ShieldCheck className='size-4' />
                    Verify organisation
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <AdminTable
      columns={columns}
      data={organisations}
      isLoading={isLoading}
      searchPlaceholder='Search organisations…'
      getRowId={(org, index) => org.uuid ?? String(index)}
      onRowClick={org => org.uuid && router.push(`/dashboard/admin/organizations/${org.uuid}`)}
      facetedFilters={[
        {
          columnId: 'status',
          title: 'Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
        },
        {
          columnId: 'verification',
          title: 'Verification',
          options: [
            { label: 'Verified', value: 'verified' },
            { label: 'Pending', value: 'pending' },
          ],
        },
      ]}
      pageSize={15}
      emptyTitle='No organisations found'
      emptyDescription='No organisations match your search or filters.'
    />
  );
}
