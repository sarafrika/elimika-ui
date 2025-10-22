'use client';
import UserCard from '@/app/dashboard/@admin/users/_components/UserCard';
import UserFilters from '@/app/dashboard/@admin/users/_components/UserFilters';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/services/client';
import React from 'react';

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

  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      <UserFilters
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        domainFilter={domainFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        setSearchQuery={query => updateParams({ search: query })}
        setActiveFilter={active => updateParams({ active })}
        setDomainFilter={domain => updateParams({ domain })}
        setSortField={field => updateParams({ sortField: field })}
        setSortOrder={order => updateParams({ sortOrder: order })}
        onClearFilters={handleClearFilters}
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
