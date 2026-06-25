'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AdminTable } from './ui/AdminTable';

export interface RoleMember {
  userUuid?: string;
  name: string;
  subtitle?: string;
  joined?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

export function RoleMembersTable({
  members,
  isLoading = false,
  searchPlaceholder = 'Search members…',
  emptyTitle = 'No members found',
  emptyDescription = 'No records match your search.',
}: {
  members: RoleMember[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<RoleMember>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => `${row.name} ${row.subtitle ?? ''}`,
        header: 'Member',
        meta: { label: 'Member' },
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Avatar className='size-9'>
              <AvatarFallback className='text-xs'>{initials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium text-foreground'>{row.original.name}</p>
              {row.original.subtitle ? (
                <p className='truncate text-xs text-muted-foreground'>{row.original.subtitle}</p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: 'joined',
        accessorFn: row => (row.joined ? new Date(row.joined).getTime() : 0),
        header: 'Joined',
        meta: { label: 'Joined' },
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.joined
              ? new Date(row.original.joined).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <AdminTable
      columns={columns}
      data={members}
      isLoading={isLoading}
      searchPlaceholder={searchPlaceholder}
      getRowId={(member, index) => member.userUuid ?? String(index)}
      onRowClick={member => member.userUuid && router.push(`/dashboard/users/${member.userUuid}`)}
      pageSize={15}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
}
