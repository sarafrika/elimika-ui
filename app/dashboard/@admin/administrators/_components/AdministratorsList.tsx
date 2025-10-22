'use client';
import AdministratorCard from '@/app/dashboard/@admin/administrators/_components/AdministratorCard';
import AdministratorFilters from '@/app/dashboard/@admin/administrators/_components/AdministratorFilters';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/services/client';
import React from 'react';

interface AdministratorsListProps {
  administrators: User[];
  searchQuery: string;
  activeFilter: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  selectedAdministrator: User | null;
}

export default function AdministratorsList({
  administrators,
  searchQuery,
  activeFilter,
  sortField,
  sortOrder,
  selectedAdministrator,
}: AdministratorsListProps) {
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

  const isSelected = (administrator: User) =>
    !selectedAdministrator ? true : selectedAdministrator?.uuid === administrator.uuid;

  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      <AdministratorFilters
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        setSearchQuery={query => updateParams({ search: query })}
        setActiveFilter={active => updateParams({ active })}
        setSortField={field => updateParams({ sortField: field })}
        setSortOrder={order => updateParams({ sortOrder: order })}
        onClearFilters={handleClearFilters}
      />

      <div className='flex-1 overflow-y-auto'>
        {administrators.length === 0 ? (
          <div className='text-muted-foreground flex h-32 items-center justify-center'>
            No administrators found
          </div>
        ) : (
          administrators.map(administrator => (
            <AdministratorCard
              key={administrator.uuid!}
              administrator={administrator}
              isSelected={isSelected(administrator)}
              onSelect={selectedAdministrator =>
                updateParams({ id: selectedAdministrator?.uuid ?? '' })
              }
              onDelete={function (administrator: User): void {
                throw new Error('Function not implemented.');
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
