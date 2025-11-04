import { Instructor } from '@/services/api/schema';
import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import InstructorCard from './InstructorCard';
import { AdminFilterBar } from '@/components/admin/admin-filter-bar';

interface InstructorsListProps {
  instructors: Instructor[];
  selectedInstructor: Instructor | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onInstructorSelect: (instructor: Instructor) => void;
  onInstructorDelete: (instructor: Instructor) => void;
  getStatusBadgeComponent: (instructorId: string) => React.ReactElement;
  isLoading: boolean;
}

export default function InstructorsList({
  instructors,
  selectedInstructor,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  onInstructorSelect,
  onInstructorDelete,
  getStatusBadgeComponent,
  isLoading,
}: InstructorsListProps) {
  const hasActiveFilters = useMemo(
    () => Boolean(searchQuery || statusFilter !== 'all'),
    [searchQuery, statusFilter]
  );

  return (
    <div className='flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-border/60 bg-card/40'>
      <AdminFilterBar
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search instructors',
        }}
        filters={[
          {
            id: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
            ],
            placeholder: 'Status',
            minWidth: 'min-w-[140px]',
          },
        ]}
        sort={{
          value: 'created_date',
          onChange: () => {},
          options: [{ label: 'Date Created', value: 'created_date' }],
          order: sortOrder,
          onOrderChange: setSortOrder,
        }}
        dirty={hasActiveFilters || sortOrder !== 'desc'}
        onClear={() => {
          setSearchQuery('');
          setStatusFilter('all');
          setSortOrder('desc');
        }}
      />

      <div className='flex-1 overflow-y-auto'>
        {isLoading && (
          <div className='flex flex-col gap-3 p-4'>
            <Skeleton className='h-[88px] w-full' />
            <Skeleton className='h-[88px] w-full' />
            <Skeleton className='h-[88px] w-full' />
          </div>
        )}

        {instructors.map(instructor => (
          <InstructorCard
            key={instructor.uuid}
            instructor={instructor}
            isSelected={selectedInstructor?.uuid === instructor.uuid}
            onSelect={onInstructorSelect}
            onDelete={onInstructorDelete}
            getStatusBadgeComponent={getStatusBadgeComponent}
          />
        ))}
      </div>
    </div>
  );
}
