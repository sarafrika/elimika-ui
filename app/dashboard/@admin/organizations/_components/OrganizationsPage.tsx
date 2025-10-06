'use client';

import ErrorPage from '@/components/ErrorPage';
import { Badge } from '@/components/ui/badge';
import { Organisation as OrganisationDto } from '@/services/api/schema';
import {
  getAllOrganisationsOptions,
  getAllOrganisationsQueryKey,
  unverifyOrganisationMutation,
  verifyOrganisationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { sampleOrganizations } from '../../overview/sample-admin-data';
import OrganizationDetailsPanel from './OrganizationDetailsPanel';
import OrganizationMobileModal from './OrganizationMobileModal';
import OrganizationsList from './OrganizationsList';

export default function OrganizationsPage() {
  const qc = useQueryClient();

  const { data, error } = useQuery(
    getAllOrganisationsOptions({ query: { pageable: { page: 0, size: 100 } } })
  );

  // Use sample data if API returns no organizations
  const organizations =
    data?.data?.content && data?.data?.content.length > 0
      ? data?.data?.content
      : sampleOrganizations;

  const [selectedOrganization, setSelectedOrganization] = useState<OrganisationDto | null>(
    organizations[0] || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [organizationStatuses, setOrganizationStatuses] = useState<Map<string, string>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Mock status data - in real app this would come from API
  useEffect(() => {
    const mockStatuses = new Map<string, string>();
    // Set default status based on organization.active field
    organizations.forEach(org => {
      if (org.uuid) {
        mockStatuses.set(org.uuid, org.active ? 'approved' : 'pending');
      }
    });
    setOrganizationStatuses(mockStatuses);
  }, [organizations]);

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrganization) {
      setSelectedOrganization(organizations[0] as any);
    }
  }, [organizations, selectedOrganization]);

  const verifyOrganisation = useMutation(verifyOrganisationMutation());
  const unVerifyOrganisation = useMutation(unverifyOrganisationMutation());

  const handleApproveOrganization = async (organization: OrganisationDto) => {
    try {
      verifyOrganisation.mutate(
        { path: { uuid: organization.uuid! }, query: { reason: '' } },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getAllOrganisationsQueryKey({ query: { pageable: {} } }),
            });
            toast.success(data?.message);
          },
        }
      );

      router.refresh();
    } catch (error) {
      //console.log('Error approving organization:', error);
    }
  };

  const handleRejectOrganization = async (organization: OrganisationDto) => {
    try {
      // In a real implementation, you would call an API to reject the organization
      // For now, we'll just update the local state
      unVerifyOrganisation.mutate(
        { path: { uuid: organization.uuid! }, query: { reason: '' } },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getAllOrganisationsQueryKey({ query: { pageable: {} } }),
            });
            toast.success(data?.message);
          },
        }
      );

      router.refresh();
    } catch (error) {
      //console.log('Error rejecting organization:', error);
    }
  };

  const getStatusBadge = (organizationId: string) => {
    return organizationStatuses.get(organizationId) || 'pending';
  };

  const getStatusBadgeComponent = (organizationId: string) => {
    const status = getStatusBadge(organizationId);
    const variants: Record<
      string,
      | 'default'
      | 'secondary'
      | 'destructive'
      | 'outline'
      | 'success'
      | 'warning'
      | 'outlineSuccess'
      | 'outlineWarning'
      | 'outlineDestructive'
    > = {
      approved: 'success',
      pending: 'warning',
      rejected: 'destructive',
    };

    return (
      <Badge variant={variants[status]} className='text-xs'>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleOrganizationSelect = (organization: OrganisationDto) => {
    setSelectedOrganization(organization);
    // Open modal on small screens
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsModalOpen(true);
    }
  };

  const handleOrganizationDelete = (organization: OrganisationDto) => {
    // Handle delete logic here
    //console.log('Delete organization:', organization.uuid);
  };

  // Filter and sort organizations
  const filteredAndSortedOrganizations: OrganisationDto[] = organizations
    .filter(organization => {
      // Search filter
      const matchesSearch =
        organization.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        organization.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        organization.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        organization.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || getStatusBadge(organization.uuid!) === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by created date
      const dateA = new Date(a.created_date || '').getTime();
      const dateB = new Date(b.created_date || '').getTime();

      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

  if (error) {
    return (
      <ErrorPage message={error.message || 'Something went wrong while fetching organizations'} />
    );
  }

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
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
        isVerifyPending={verifyOrganisation.isPending}
        isUnverifyPending={unVerifyOrganisation.isPending}
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
  );
}
