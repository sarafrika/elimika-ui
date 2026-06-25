'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/services/client';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';

function domainsOf(user: User): string[] {
  const raw = user.user_domain;
  return Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
}

function initials(user: User): string {
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U';
}

export function UsersTable({
  users,
  hideRoleFilter = false,
  isLoading = false,
}: {
  users: User[];
  hideRoleFilter?: boolean;
  isLoading?: boolean;
}) {
  const router = useRouter();

  const domainOptions = useMemo(() => {
    const set = new Set<string>();
    users.forEach(user => domainsOf(user).forEach(domain => set.add(domain)));
    return Array.from(set).map(domain => ({
      label: domain.replace(/_/g, ' '),
      value: domain,
    }));
  }, [users]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => `${row.full_name ?? ''} ${row.email ?? ''}`,
        header: 'User',
        meta: { label: 'User' },
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className='flex items-center gap-3'>
              <Avatar className='size-9'>
                {user.profile_image_url ? <AvatarImage src={user.profile_image_url} alt='' /> : null}
                <AvatarFallback className='text-xs'>{initials(user)}</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium text-foreground'>
                  {user.full_name || `${user.first_name} ${user.last_name}`}
                </p>
                <p className='truncate text-xs text-muted-foreground'>{user.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'domains',
        accessorFn: row => domainsOf(row),
        header: 'Roles',
        meta: { label: 'Roles' },
        enableSorting: false,
        filterFn: (row, _id, value: string[]) => {
          if (!value?.length) return true;
          const domains = domainsOf(row.original);
          return value.some(v => domains.includes(v));
        },
        cell: ({ row }) => {
          const domains = domainsOf(row.original);
          if (!domains.length) return <span className='text-xs text-muted-foreground'>—</span>;
          return (
            <div className='flex flex-wrap gap-1'>
              {domains.map(domain => (
                <Badge key={domain} variant='outline' className='text-[10px] uppercase'>
                  {domain.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorFn: row => (row.active ? 'active' : 'inactive'),
        header: 'Status',
        meta: { label: 'Status' },
        filterFn: (row, id, value: string[]) =>
          !value?.length || value.includes(row.getValue(id) as string),
        cell: ({ row }) => (
          <StatusBadge status={row.original.active ? 'active' : 'inactive'} />
        ),
      },
      {
        id: 'created',
        accessorFn: row => (row.created_date ? new Date(row.created_date).getTime() : 0),
        header: 'Joined',
        meta: { label: 'Joined' },
        cell: ({ row }) => {
          const date = row.original.created_date;
          return (
            <span className='text-sm text-muted-foreground'>
              {date
                ? new Date(date).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <AdminTable
      columns={columns}
      data={users}
      isLoading={isLoading}
      searchPlaceholder='Search users by name or email…'
      getRowId={(user, index) => user.uuid ?? String(index)}
      onRowClick={user => user.uuid && router.push(`/dashboard/users/${user.uuid}`)}
      facetedFilters={[
        { columnId: 'status', title: 'Status', options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ] },
        ...(hideRoleFilter
          ? []
          : [{ columnId: 'domains', title: 'Role', options: domainOptions }]),
      ]}
      pageSize={15}
      emptyTitle='No users found'
      emptyDescription='No user accounts match your search or filters.'
    />
  );
}
