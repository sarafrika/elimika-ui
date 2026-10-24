'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { assignmentFilters } from './assignment-data';
import type { AssignmentStatus } from './assignment-types';

type AssignmentToolbarProps = {
  activeFilter: AssignmentStatus;
  counts: Record<AssignmentStatus, number>;
  isLoading: boolean;
  onFilterChange: (value: AssignmentStatus) => void;
  search: string;
  setSearch: (value: string) => void;
};

export function AssignmentToolbar({
  activeFilter,
  counts,
  isLoading,
  onFilterChange,
  search,
  setSearch,
}: AssignmentToolbarProps) {
  return (
    <div className=''>
      <div className='flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:justify-between'>
        <div aria-busy={isLoading} className='flex flex-wrap gap-2'>
          {assignmentFilters.map(filter => (
            <Button
              key={filter.value}
              type='button'
              variant={activeFilter === filter.value ? 'default' : 'outline'}
              aria-pressed={activeFilter === filter.value}
              disabled={isLoading}
              onClick={() => onFilterChange(filter.value)}
              className='h-7 rounded-full px-4 text-xs'
            >
              {filter.label}
              {isLoading ? (
                <Skeleton className='h-3 w-5 rounded-full' />
              ) : (
                <span className='tabular-nums'>({counts[filter.value]})</span>
              )}
            </Button>
          ))}
        </div>

        <div className='relative w-full min-w-0 xl:max-w-[280px]'>
          <Search className='text-muted-foreground absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 sm:h-4 sm:w-4' />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search assignments'
            className='bg-background h-10 rounded-lg pl-10 text-xs sm:pl-11 sm:text-sm'
          />
        </div>
      </div>
    </div>
  );
}
