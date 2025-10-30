'use client';
import OrganizationCard from '@/app/dashboard/@admin/organizations/_components/OrganizationCard';
import OrganizationFilters from '@/app/dashboard/@admin/organizations/_components/OrganizationFilters';
import { useRouter, usePathname } from 'next/navigation';
import { Organisation } from '@/services/client';
import React from 'react';

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

  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      <OrganizationFilters
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        verifiedFilter={verifiedFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        setSearchQuery={query => updateParams({ search: query })}
        setActiveFilter={active => updateParams({ active })}
        setVerifiedFilter={verified => updateParams({ verified })}
        setSortField={field => updateParams({ sortField: field })}
        setSortOrder={order => updateParams({ sortOrder: order })}
        onClearFilters={handleClearFilters}
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
