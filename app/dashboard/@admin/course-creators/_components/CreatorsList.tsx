import { Skeleton } from '@/components/ui/skeleton';
import { CourseCreator } from '@/services/client';
import React, { useMemo } from 'react';
import CourseCreatorCard from './CreatorCard';
import { AdminFilterBar } from '@/components/admin/admin-filter-bar';

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
          placeholder: 'Search course creators',
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
