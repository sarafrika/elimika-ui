'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LucideIcon, Filter, Search, SortAsc, SortDesc, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminSelectFilterOption = {
  label: string;
  value: string;
};

export type AdminSelectFilterConfig = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectFilterOption[];
  icon?: LucideIcon;
  placeholder?: string;
  minWidth?: string;
};

export type AdminSortConfig = {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectFilterOption[];
  order: 'asc' | 'desc';
  onOrderChange: (order: 'asc' | 'desc') => void;
  ascendingLabel?: string;
  descendingLabel?: string;
};

export type AdminFilterBarProps = {
  className?: string;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: LucideIcon;
  };
  filters?: AdminSelectFilterConfig[];
  sort?: AdminSortConfig;
  dirty?: boolean;
  onClear?: () => void;
};

export function AdminFilterBar({
  className,
  search,
  filters,
  sort,
  dirty,
  onClear,
}: AdminFilterBarProps) {
  const SearchIcon = search?.icon ?? Search;

  const hasFilters = Boolean(
    dirty ||
      (filters?.some(filter => filter.value && filter.value !== 'all') ?? false) ||
      Boolean(search?.value)
  );

  return (
    <div className={cn('space-y-4 border-b p-4', className)}>
      {search && (
        <div className='relative'>
          <SearchIcon className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
          <Input
            value={search.value}
            onChange={event => search.onChange(event.target.value)}
            placeholder={search.placeholder ?? 'Search'}
            className='pl-10'
          />
        </div>
      )}

      {(filters?.length || sort) && (
        <div className='flex flex-wrap gap-2'>
          {filters?.map(filter => {
            const Icon = filter.icon ?? Filter;
            return (
              <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className={cn('flex-1', filter.minWidth)}>
                  <Icon className='mr-2 h-4 w-4' />
                  <SelectValue placeholder={filter.placeholder ?? 'Filter'} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}

          {sort && (
            <Select value={sort.value} onValueChange={sort.onChange}>
              <SelectTrigger className='min-w-[140px] flex-1'>
                <SelectValue placeholder='Sort by' />
              </SelectTrigger>
              <SelectContent>
                {sort.options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {sort && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => sort.onOrderChange(sort.order === 'asc' ? 'desc' : 'asc')}
              className='flex-shrink-0 px-3'
            >
              {sort.order === 'asc' ? <SortAsc className='h-4 w-4' /> : <SortDesc className='h-4 w-4' />}
              <span className='ml-2 hidden sm:inline'>
                {sort.order === 'asc'
                  ? sort.ascendingLabel ?? 'Asc'
                  : sort.descendingLabel ?? 'Desc'}
              </span>
            </Button>
          )}

          {hasFilters && onClear && (
            <Button variant='ghost' size='sm' onClick={onClear} className='flex-shrink-0 px-3'>
              <X className='h-4 w-4' />
              <span className='ml-2 hidden sm:inline'>Clear</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
