import { Skeleton } from '@/components/ui/skeleton';
import type { CourseCreator } from '@/services/client';
import type React from 'react';
import CourseCreatorCard from './CreatorCard';
import CourseCreatorFilters from './CreatorFilters';

interface CreatorsListProps {
  courseCreators: CourseCreator[];
  selectedCourseCreator: CourseCreator | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onCourseCreatorSelect: (courseCreator: CourseCreator) => void;
  onCourseCreatorDelete: (courseCreator: CourseCreator) => void;
  getStatusBadgeComponent?: (courseCreatorId: string) => React.ReactElement;
  isLoading: boolean;
}

export default function CreatorsList({
  courseCreators,
  selectedCourseCreator,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  onCourseCreatorSelect,
  onCourseCreatorDelete,
  getStatusBadgeComponent,
  isLoading,
}: CreatorsListProps) {
  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      {/* Search and Filters Header */}
      <CourseCreatorFilters
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

        {courseCreators.map(creator => (
          <CourseCreatorCard
            key={creator.uuid}
            courseCreator={creator}
            isSelected={selectedCourseCreator?.uuid === creator.uuid}
            onSelect={onCourseCreatorSelect}
            onDelete={onCourseCreatorDelete}
            getStatusBadgeComponent={getStatusBadgeComponent}
          />
        ))}
      </div>
    </div>
  );
}
