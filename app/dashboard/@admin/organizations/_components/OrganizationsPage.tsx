'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { OrganisationDto } from '@/services/api/schema'
import OrganizationsList from './OrganizationsList'
import OrganizationDetailsPanel from './OrganizationDetailsPanel'
import OrganizationMobileModal from './OrganizationMobileModal'

type Props = {
    organizations: OrganisationDto[]
}

export default function OrganizationsPage({ organizations }: Props) {
    const [selectedOrganization, setSelectedOrganization] = useState<OrganisationDto | null>(organizations[0] || null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [organizationStatuses, setOrganizationStatuses] = useState<Map<string, string>>(new Map())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const router = useRouter()

    // Mock status data - in real app this would come from API
    useEffect(() => {
        const mockStatuses = new Map<string, string>()
        // Set default status based on organization.active field
        organizations.forEach(org => {
            if (org.uuid) {
                mockStatuses.set(org.uuid, org.active ? 'approved' : 'pending')
            }
        })
        setOrganizationStatuses(mockStatuses)
    }, [organizations])

    const handleApproveOrganization = async (organization: OrganisationDto) => {
        try {
            // In a real implementation, you would call an API to approve the organization
            // For now, we'll just update the local state
            const newStatuses = new Map(organizationStatuses)
            newStatuses.set(organization.uuid!, 'approved')
            setOrganizationStatuses(newStatuses)

            router.refresh()
        } catch (error) {
            console.error('Error approving organization:', error)
        }
    }

    const handleRejectOrganization = async (organization: OrganisationDto) => {
        try {
            // In a real implementation, you would call an API to reject the organization
            // For now, we'll just update the local state
            const newStatuses = new Map(organizationStatuses)
            newStatuses.set(organization.uuid!, 'rejected')
            setOrganizationStatuses(newStatuses)

            router.refresh()
        } catch (error) {
            console.error('Error rejecting organization:', error)
        }
    }

    const getStatusBadge = (organizationId: string) => {
        return organizationStatuses.get(organizationId) || 'pending'
    }

    const getStatusBadgeComponent = (organizationId: string) => {
        const status = getStatusBadge(organizationId)
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "outlineSuccess" | "outlineWarning" | "outlineDestructive"> = {
            approved: 'success',
            pending: 'warning',
            rejected: 'destructive'
        }

        return (
            <Badge variant={variants[status]} className="text-xs">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        )
    }

    const handleOrganizationSelect = (organization: OrganisationDto) => {
        setSelectedOrganization(organization)
        // Open modal on small screens
        if (window.innerWidth < 1024) {
            setIsModalOpen(true)
        }
    }

    const handleOrganizationDelete = (organization: OrganisationDto) => {
        // Handle delete logic here
        console.log('Delete organization:', organization.uuid)
    }

    // Filter and sort organizations
    const filteredAndSortedOrganizations = organizations
        .filter(organization => {
            // Search filter
            const matchesSearch =
                organization.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                organization.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                organization.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                organization.description?.toLowerCase().includes(searchQuery.toLowerCase())

            // Status filter
            const matchesStatus = statusFilter === 'all' || getStatusBadge(organization.uuid!) === statusFilter

            return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
            // Sort by created date
            const dateA = new Date(a.created_date || '').getTime()
            const dateB = new Date(b.created_date || '').getTime()

            if (sortOrder === 'asc') {
                return dateA - dateB
            } else {
                return dateB - dateA
            }
        })

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] bg-background">
            {/* Left Sidebar - Organization List */}
            <OrganizationsList
                organizations={filteredAndSortedOrganizations}
                selectedOrganization={selectedOrganization}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                onOrganizationSelect={handleOrganizationSelect}
                onOrganizationDelete={handleOrganizationDelete}
                getStatusBadgeComponent={getStatusBadgeComponent}
            />

            {/* Right Panel - Organization Details (Desktop only) */}
            <OrganizationDetailsPanel
                organization={selectedOrganization}
                onApprove={handleApproveOrganization}
                onReject={handleRejectOrganization}
                getStatusBadgeComponent={getStatusBadgeComponent}
            />

            {/* Mobile Modal */}
            <OrganizationMobileModal
                organization={selectedOrganization}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onApprove={handleApproveOrganization}
                onReject={handleRejectOrganization}
                getStatusBadgeComponent={getStatusBadgeComponent}
            />
        </div>
    )
} 