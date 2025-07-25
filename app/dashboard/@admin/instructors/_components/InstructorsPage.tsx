'use client';

import { Badge } from '@/components/ui/badge';
import { Instructor } from '@/services/api/schema';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import InstructorDetailsPanel from './InstructorDetailsPanel';
import InstructorMobileModal from './InstructorMobileModal';
import InstructorsList from './InstructorsList';

type Props = {
  instructors: Instructor[];
};

export default function InstructorsPage({ instructors }: Props) {
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(
    instructors[0] || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [instructorStatuses, setInstructorStatuses] = useState<Map<string, string>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Mock status data - in real app this would come from API
  useEffect(() => {
    const mockStatuses = new Map<string, string>();
    // This would typically be fetched from your API
    setInstructorStatuses(mockStatuses);
  }, []);

  const handleApproveInstructor = async (instructor: Instructor) => {
    try {
      // In a real implementation, you would call an API to approve the instructor
      // For now, we'll just update the local state
      const newStatuses = new Map(instructorStatuses);
      newStatuses.set(instructor.uuid!, 'approved');
      setInstructorStatuses(newStatuses);

      router.refresh();
    } catch (error) {
      //console.log('Error approving instructor:', error);
    }
  };

  const handleRejectInstructor = async (instructor: Instructor) => {
    try {
      // In a real implementation, you would call an API to reject the instructor
      // For now, we'll just update the local state
      const newStatuses = new Map(instructorStatuses);
      newStatuses.set(instructor.uuid!, 'rejected');
      setInstructorStatuses(newStatuses);

      router.refresh();
    } catch (error) {
      //console.log('Error rejecting instructor:', error);
    }
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
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
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

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
      {/* Left Sidebar - Instructor List */}
      <InstructorsList
        instructors={filteredAndSortedInstructors}
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
      />

      {/* Right Panel - Instructor Details (Desktop only) */}
      <InstructorDetailsPanel
        instructor={selectedInstructor}
        onApprove={handleApproveInstructor}
        onReject={handleRejectInstructor}
        getStatusBadgeComponent={getStatusBadgeComponent}
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
