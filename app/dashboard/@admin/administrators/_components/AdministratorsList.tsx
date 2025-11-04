'use client';
import AdministratorCard from '@/app/dashboard/@admin/administrators/_components/AdministratorCard';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/services/client';
import React, { useMemo } from 'react';
import { AdminFilterBar } from '@/components/admin/admin-filter-bar';

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

  const hasActiveFilters = useMemo(
    () =>
      Boolean(searchQuery || activeFilter !== 'all' || sortField !== 'created_date'),
    [searchQuery, activeFilter, sortField]
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
            id: 'status',
            value: activeFilter,
            onChange: value => updateParams({ active: value }),
            options: [
              { label: 'All Users', value: 'all' },
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ],
            placeholder: 'Status',
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
