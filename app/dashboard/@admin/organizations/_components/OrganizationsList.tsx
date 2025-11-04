'use client';
import OrganizationCard from '@/app/dashboard/@admin/organizations/_components/OrganizationCard';
import { useRouter, usePathname } from 'next/navigation';
import { Organisation } from '@/services/client';
import React, { useMemo } from 'react';
import { AdminFilterBar } from '@/components/admin/admin-filter-bar';

interface OrganizationsListProps {
  organizations: Organisation[];
  searchQuery: string;
  activeFilter: string;
  verifiedFilter: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  selectedOrganization: Organisation | null;
}

export default function OrganizationsList({
  organizations,
  searchQuery,
  activeFilter,
  verifiedFilter,
  sortField,
  sortOrder,
  selectedOrganization,
}: OrganizationsListProps) {
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

  const isSelected = (organization: Organisation) =>
    !selectedOrganization ? true : selectedOrganization?.uuid === organization.uuid;

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        searchQuery ||
          activeFilter !== 'all' ||
          verifiedFilter !== 'all' ||
          sortField !== 'created_date'
      ),
    [searchQuery, activeFilter, verifiedFilter, sortField]
  );

  return (
    <div className='flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-border/60 bg-card/40'>
      <AdminFilterBar
        search={{
          value: searchQuery,
          onChange: query => updateParams({ search: query }),
          placeholder: 'Search by name, location, or description',
        }}
        filters={[
          {
            id: 'status',
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
            id: 'verified',
            value: verifiedFilter,
            onChange: value => updateParams({ verified: value }),
            options: [
              { label: 'All Verification', value: 'all' },
              { label: 'Verified', value: 'true' },
              { label: 'Pending', value: 'false' },
            ],
            placeholder: 'Verification',
            minWidth: 'min-w-[140px]',
          },
        ]}
        sort={{
          value: sortField,
          onChange: field => updateParams({ sortField: field }),
          options: [
            { label: 'Date Created', value: 'created_date' },
            { label: 'Last Updated', value: 'updated_date' },
            { label: 'Name', value: 'name' },
            { label: 'Location', value: 'location' },
          ],
          order: sortOrder,
          onOrderChange: order => updateParams({ sortOrder: order }),
        }}
        dirty={hasActiveFilters}
        onClear={handleClearFilters}
      />

      <div className='flex-1 overflow-y-auto'>
        {organizations.length === 0 ? (
          <div className='text-muted-foreground flex h-32 items-center justify-center'>
            No organizations found
          </div>
        ) : (
          organizations.map(organization => (
            <OrganizationCard
              key={organization.uuid!}
              organization={organization}
              isSelected={isSelected(organization)}
              onSelect={selectedOrg => updateParams({ id: selectedOrg?.uuid ?? '' })}
            />
          ))
        )}
      </div>
    </div>
  );
}
