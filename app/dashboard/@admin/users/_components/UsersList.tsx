'use client';
import UserCard from '@/app/dashboard/@admin/users/_components/UserCard';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/services/client';
import React, { useMemo } from 'react';
import { AdminFilterBar } from '@/components/admin/admin-filter-bar';

interface UsersListProps {
  users: User[];
  searchQuery: string;
  activeFilter: string;
  domainFilter: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  selectedUser: User | null;
}

export default function UsersList({
  users,
  searchQuery,
  activeFilter,
  domainFilter,
  sortField,
  sortOrder,
  selectedUser,
}: UsersListProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'all') {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push(pathname);
  };

  const isSelected = (user: User) => (!selectedUser ? true : selectedUser?.uuid === user.uuid);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        searchQuery ||
          activeFilter !== 'all' ||
          domainFilter !== 'all' ||
          sortField !== 'created_date'
      ),
    [searchQuery, activeFilter, domainFilter, sortField]
  );

  return (
    <div className='flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-border/60 bg-card/40'>
      <AdminFilterBar
        search={{
          value: searchQuery,
          onChange: query => updateParams({ search: query }),
          placeholder: 'Search by name, email, or username',
        }}
        filters={[
          {
            id: 'active',
            value: activeFilter,
            onChange: value => updateParams({ active: value }),
            options: [
              { label: 'All Status', value: 'all' },
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ],
            placeholder: 'Status',
            minWidth: 'min-w-[140px]',
          },
          {
            id: 'domain',
            value: domainFilter,
            onChange: value => updateParams({ domain: value }),
            options: [
              { label: 'All Domains', value: 'all' },
              { label: 'Admin', value: 'admin' },
              { label: 'Instructor', value: 'instructor' },
              { label: 'Student', value: 'student' },
            ],
            placeholder: 'Domain',
            minWidth: 'min-w-[140px]',
          },
        ]}
        sort={{
          value: sortField,
          onChange: field => updateParams({ sortField: field }),
          options: [
            { label: 'Date Created', value: 'created_date' },
            { label: 'Last Updated', value: 'updated_date' },
            { label: 'First Name', value: 'first_name' },
            { label: 'Last Name', value: 'last_name' },
            { label: 'Email', value: 'email' },
          ],
          order: sortOrder,
          onOrderChange: order => updateParams({ sortOrder: order }),
        }}
        dirty={hasActiveFilters}
        onClear={handleClearFilters}
      />

      <div className='flex-1 overflow-y-auto'>
        {users.length === 0 ? (
          <div className='text-muted-foreground flex h-32 items-center justify-center'>
            No users found
          </div>
        ) : (
          users.map(user => (
            <UserCard
              key={user.uuid!}
              user={user}
              isSelected={isSelected(user)}
              onSelect={selectedUser => updateParams({ id: selectedUser?.uuid ?? '' })}
            />
          ))
        )}
      </div>
    </div>
  );
}
