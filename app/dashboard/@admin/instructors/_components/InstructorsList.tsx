import { Instructor } from '@/services/api/schema';
import React from 'react';
import { Skeleton } from '../../../../../components/ui/skeleton';
import InstructorCard from './InstructorCard';
import InstructorFilters from './InstructorFilters';

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
  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      {/* Search and Filters Header */}
      <InstructorFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* Instructor List */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading && (
          <div className='flex flex-col gap-3'>
            <Skeleton className='h-[100px] w-full px-4' />
            <Skeleton className='h-[100px] w-full px-4' />
            <Skeleton className='h-[100px] w-full px-4' />
            <Skeleton className='h-[100px] w-full px-4' />
            <Skeleton className='h-[100px] w-full px-4' />
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
