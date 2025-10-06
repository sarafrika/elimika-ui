'use client';

import ErrorPage from '@/components/ErrorPage';
import { Badge } from '@/components/ui/badge';
import { Instructor } from '@/services/api/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getAllInstructorsOptions,
  getAllInstructorsQueryKey,
  unverifyInstructorMutation,
  verifyInstructorMutation,
} from '../../../../../services/client/@tanstack/react-query.gen';
import InstructorDetailsPanel from './InstructorDetailsPanel';
import InstructorMobileModal from './InstructorMobileModal';
import InstructorsList from './InstructorsList';

export default function InstructorsPage() {
  const { data, error, isLoading } = useQuery(
    getAllInstructorsOptions({ query: { pageable: { page: 0, size: 20, sort: ['desc'] } } })
  );

  const instructors = data?.data?.content || [];
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [instructorStatuses, setInstructorStatuses] = useState<Map<string, string>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  // Mock status data - in real app this would come from API
  useEffect(() => {
    const mockStatuses = new Map<string, string>();
    // This would typically be fetched from your API
    setInstructorStatuses(mockStatuses);
  }, []);

  useEffect(() => {
    if (instructors.length > 0 && !selectedInstructor) {
      setSelectedInstructor(instructors[0] as any);
    }
  }, [instructors, selectedInstructor]);

  const approveInstrucor = useMutation(verifyInstructorMutation());
  const rejectInstructor = useMutation(unverifyInstructorMutation());

  const handleApproveInstructor = async (instructor: Instructor) => {
    try {
      approveInstrucor.mutate(
        { path: { uuid: instructor.uuid! }, query: { reason: '' } },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getAllInstructorsQueryKey({ query: { pageable: {} } }),
            });
            toast.success(data?.message);
          },
        }
      );
    } catch (error) {}
  };

  const handleRejectInstructor = async (instructor: Instructor) => {
    try {
      rejectInstructor.mutate(
        { path: { uuid: instructor.uuid! }, query: { reason: '' } },
        {
          onSuccess: () => {
            qc.invalidateQueries({
              queryKey: getAllInstructorsQueryKey({ query: { pageable: {} } }),
            });
            toast.success(data?.message);
          },
        }
      );
    } catch (error) {}
  };

  const getStatusBadge = (instructorId: string) => {
    return instructorStatuses.get(instructorId) || 'pending';
  };

  const getStatusBadgeComponent = (instructorId: string) => {
    const status = getStatusBadge(instructorId);
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
    };

    return (
      <Badge variant={variants[status]} className='text-xs'>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleInstructorSelect = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    // Open modal on small screens
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsModalOpen(true);
    }
  };

  const handleInstructorDelete = (instructor: Instructor) => {
    // Handle delete logic here
    //console.log('Delete instructor:', instructor.uuid);
  };

  // Filter and sort instructors
  const filteredAndSortedInstructors = instructors
    .filter(instructor => {
      // Search filter
      const matchesSearch =
        instructor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.professional_headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.formatted_location?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || getStatusBadge(instructor.uuid!) === statusFilter;

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
      <ErrorPage message={error?.message || 'Something went wrong while fetching instructors'} />
    );
  }

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
      {/* Left Sidebar - Instructor List */}
      <InstructorsList
        instructors={filteredAndSortedInstructors as any}
        selectedInstructor={selectedInstructor}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onInstructorSelect={handleInstructorSelect}
        onInstructorDelete={handleInstructorDelete}
        getStatusBadgeComponent={getStatusBadgeComponent}
        isLoading={isLoading}
      />

      {/* Right Panel - Instructor Details (Desktop only) */}
      <InstructorDetailsPanel
        instructor={selectedInstructor}
        onApprove={handleApproveInstructor}
        onReject={handleRejectInstructor}
        getStatusBadgeComponent={getStatusBadgeComponent}
        isApprovePending={approveInstrucor.isPending}
        isRejectPending={rejectInstructor.isPending}
      />

      {/* Mobile Modal */}
      <InstructorMobileModal
        instructor={selectedInstructor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={handleApproveInstructor}
        onReject={handleRejectInstructor}
        getStatusBadgeComponent={getStatusBadgeComponent}
      />
    </div>
  );
}
