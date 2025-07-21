import React from 'react'
import { Organisation as OrganisationDto } from '@/services/api/schema'
import OrganizationFilters from './OrganizationFilters'
import OrganizationCard from './OrganizationCard'

interface OrganizationsListProps {
    organizations:OrganisationDto[]
    selectedOrganization:OrganisationDto | null
    searchQuery: string
    setSearchQuery: (query: string) => void
    statusFilter: string
    setStatusFilter: (status: string) => void
    sortOrder: 'asc' | 'desc'
    setSortOrder: (order: 'asc' | 'desc') => void
    onOrganizationSelect: (organization:OrganisationDto) => void
    onOrganizationDelete: (organization:OrganisationDto) => void
    getStatusBadgeComponent: (organizationId: string) => React.ReactElement
}

export default function OrganizationsList({
    organizations,
    selectedOrganization,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    onOrganizationSelect,
    onOrganizationDelete,
    getStatusBadgeComponent,
}: OrganizationsListProps) {
    return (
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-background flex flex-col">
            {/* Search and Filters Header */}
            <OrganizationFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />

            {/* Organization List */}
            <div className="flex-1 overflow-y-auto">
                {organizations.map((organization) => (
                    <OrganizationCard
                        key={organization.uuid}
                        organization={organization}
                        isSelected={selectedOrganization?.uuid === organization.uuid}
                        onSelect={onOrganizationSelect}
                        onDelete={onOrganizationDelete}
                        getStatusBadgeComponent={getStatusBadgeComponent}
                    />
                ))}
            </div>
        </div>
    )
} 