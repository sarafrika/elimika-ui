'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { assignmentFilters } from './assignment-data';
import type { AssignmentStatus } from './assignment-types';
import { cn } from '@/lib/utils';

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
    <div className='border-border/60 rounded-2xl border bg-white p-3 shadow-sm'>
      <div className='flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:justify-between'>
        <div className='flex flex-wrap gap-2'>
          {assignmentFilters.map(filter => (
            <Button
              key={filter.value}
              type='button'
              variant='ghost'
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                'h-10 rounded-lg px-4 text-sm font-medium',
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted/60 text-foreground hover:bg-muted'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className='relative w-full min-w-0 xl:max-w-[280px]'>
          <Search className='text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search assignments'
            className='h-10 rounded-lg bg-background pl-11'
          />
        </div>
      </div>
    </div>
  );
}
