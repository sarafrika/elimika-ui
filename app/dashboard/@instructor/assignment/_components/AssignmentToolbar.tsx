'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { assignmentFilters } from './assignment-data';
import type { AssignmentStatus } from './assignment-types';

type AssignmentToolbarProps = {
  activeFilter: AssignmentStatus;
  onFilterChange: (value: AssignmentStatus) => void;
  search: string;
  setSearch: (value: string) => void;
};

export function AssignmentToolbar({
  activeFilter,
  onFilterChange,
  search,
  setSearch,
}: AssignmentToolbarProps) {
  return (
    <div className='border-border/70 bg-card rounded-xl border p-2.5 shadow-sm sm:p-3'>
      <div className='flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:justify-between'>
        <div className='bg-muted/50 grid grid-cols-2 gap-1.5 rounded-lg p-1 sm:flex sm:flex-wrap sm:gap-2'>
          {assignmentFilters.map(filter => (
            <Button
              key={filter.value}
              type='button'
              variant='ghost'
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                'h-9 rounded-xl px-3 text-xs font-semibold transition-all sm:h-10 sm:px-4 sm:text-sm',
                activeFilter === filter.value
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border hover:bg-background'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className='relative w-full min-w-0 xl:max-w-[280px]'>
          <Search className='text-muted-foreground absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 sm:h-4 sm:w-4' />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search assignments'
            className='h-10 rounded-lg bg-background pl-10 text-xs sm:pl-11 sm:text-sm'
          />
        </div>
      </div>
    </div>
  );
}
