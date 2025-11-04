'use client';

import { AdminDataTableFilter, AdminDataTableSearch } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Search, SlidersHorizontal } from 'lucide-react';

interface AdminDataTableToolbarProps {
  className?: string;
  search?: AdminDataTableSearch;
  filters?: AdminDataTableFilter[];
}

export function AdminDataTableToolbar({
  className,
  search,
  filters,
}: AdminDataTableToolbarProps) {
  const hasFilters = Boolean(filters?.length);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      {search ? (
        <div className='relative w-full max-w-lg'>
          <Search className='text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
          <Input
            value={search.value}
            onChange={event => search.onChange(event.target.value)}
            placeholder={search.placeholder ?? 'Search records'}
            className='pl-9'
          />
        </div>
      ) : (
        <div />
      )}

      <div className='flex flex-wrap items-center justify-between gap-2 lg:justify-end'>
        {hasFilters ? (
          <div className='flex flex-wrap items-center gap-2'>
            <div className='text-muted-foreground hidden items-center gap-2 text-xs font-medium sm:flex'>
              <SlidersHorizontal className='h-3.5 w-3.5' />
              Filters
            </div>
            {filters?.map(filter => (
              <Select
                key={filter.id}
                value={filter.value}
                onValueChange={filter.onValueChange}
              >
                <SelectTrigger className='w-[160px] whitespace-nowrap'>
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        ) : null}
        {search?.onReset || hasFilters ? (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              search?.onReset?.();
              filters?.forEach(filter => filter.onValueChange(''));
            }}
          >
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
