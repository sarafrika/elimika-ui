'use client';

import { Check, ChevronDown, LayoutGrid, Search } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DOT_COLORS } from '../../class-colors';
import type { SchedulerFilterSection } from './types';

type SchedulerFiltersProps = {
  activeFilterCount: number;
  onClearFilters: () => void;
  onSearchChange: (value: string) => void;
  searchQuery: string;
  sections: SchedulerFilterSection[];
};

export function SchedulerFilters({
  activeFilterCount,
  onClearFilters,
  onSearchChange,
  searchQuery,
  sections,
}: SchedulerFiltersProps) {
  const isAllActive = activeFilterCount === 0 && !searchQuery;

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='mb-2 flex w-full items-center justify-between gap-2'>
        <h2 className='text-foreground text-sm font-semibold sm:text-base'>Filters</h2>

        <Button
          variant='ghost'
          size='sm'
          className='h-7 px-2 text-xs'
          onClick={onClearFilters}
          disabled={activeFilterCount === 0 && !searchQuery}
        >
          Clear All
        </Button>
      </div>

      {/* Pills */}
      <div className='-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        <button
          type='button'
          onClick={onClearFilters}
          aria-pressed={isAllActive}
          aria-label={isAllActive ? 'All filter, active' : 'Clear all filters'}
          className={cn(
            'focus-visible:ring-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            isAllActive
              ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
              : 'border-border bg-card text-foreground hover:bg-muted font-medium'
          )}
        >
          <LayoutGrid className='h-4 w-4 shrink-0' aria-hidden='true' />
          <span>All</span>
          {isAllActive && <Check className='h-4 w-4 shrink-0 opacity-70' aria-hidden='true' />}
        </button>

        {sections.map((section, index) => (
          <SchedulerFilterPill
            key={section.key}
            section={section}
            dotColor={DOT_COLORS[index % DOT_COLORS.length] as string}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
          />
        ))}
      </div>

      {activeFilterCount > 0 && (
        <p className='text-muted-foreground mt-2 text-xs font-medium md:text-sm'>
          {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} applied
        </p>
      )}
    </div>
  );
}

function SchedulerFilterPill({
  section,
  dotColor,
  searchQuery,
  onSearchChange,
}: {
  section: SchedulerFilterSection;
  dotColor: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  const selectedItem = section.items.find(item => item.id === section.selectedId) ?? null;
  const active = Boolean(selectedItem);

  const visibleItems = useMemo(() => {
    if (!searchQuery) return section.items;
    const query = searchQuery.toLowerCase();
    return section.items.filter(item => item.name.toLowerCase().includes(query));
  }, [searchQuery, section.items]);

  return (
    <div
      className={cn(
        'focus-visible:ring-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-full border text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        active
          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
          : 'border-border bg-card text-foreground hover:bg-muted font-medium'
      )}
    >
      {/* Label — click resets just this filter, mirrors FilterPillWithDropdown from the calendar page */}
      <button
        type='button'
        onClick={() => selectedItem && section.onItemClick(selectedItem.id)}
        aria-pressed={active}
        aria-label={
          active
            ? `${section.label} filter set to ${selectedItem?.name}. Activate to clear.`
            : `Filter by ${section.label.toLowerCase()}`
        }
        className='flex min-w-0 flex-1 items-center gap-2 px-3.5 text-sm focus-visible:outline-none'
      >
        <span
          className='h-2 w-2 shrink-0 rounded-full'
          style={{ backgroundColor: dotColor }}
          aria-hidden='true'
        />
        <span className='max-w-[9rem] flex-1 truncate text-left'>
          {section.label}
          {active ? (
            <span className='ml-1 text-xs font-normal opacity-80'>: {selectedItem?.name}</span>
          ) : (
            <span className='ml-1 opacity-60'>({section.count})</span>
          )}
        </span>
      </button>

      {/* Chevron — opens the item list for this category */}
      <DropdownMenu
        onOpenChange={open => {
          if (!open) onSearchChange('');
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            aria-label={`Choose ${section.label.toLowerCase()} to filter by${active ? `, currently ${selectedItem?.name}` : ''}`}
            aria-haspopup='menu'
            className={cn(
              'flex w-8 shrink-0 items-center justify-center border-l focus-visible:outline-none',
              active ? 'border-primary/30 hover:bg-primary/15' : 'border-border hover:bg-muted'
            )}
          >
            <ChevronDown className='h-4 w-4' aria-hidden='true' />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='start' side='bottom' collisionPadding={8} className='w-64 p-0'>
          <div className='border-b p-2'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
              <Input
                type='text'
                placeholder={`Search ${section.label.toLowerCase()}...`}
                value={searchQuery}
                onChange={event => onSearchChange(event.target.value)}
                onKeyDown={event => event.stopPropagation()}
                className='h-8 pl-8 text-xs'
              />
            </div>
          </div>

          <div className='[&::-webkit-scrollbar-thumb]:bg-border max-h-64 overflow-y-auto p-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-px [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent'>
            {visibleItems.length === 0 && (
              <div className='text-muted-foreground px-2 py-6 text-center text-xs'>
                No matches found.
              </div>
            )}

            {visibleItems.map(item => {
              const isSelected = section.selectedId === item.id;
              const course = (item as { course?: string }).course;

              return (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={event => {
                    event.preventDefault();
                    section.onItemClick(item.id);
                  }}
                  className='flex items-start gap-2'
                >
                  <div className='min-w-0 flex-1'>
                    <p
                      className={cn(
                        'truncate text-[13px] leading-tight font-medium',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {item.name}
                    </p>
                    {course ? (
                      <p className='text-muted-foreground truncate text-[11px]'>{course}</p>
                    ) : null}
                  </div>

                  {isSelected && (
                    <Check className='text-primary h-4 w-4 shrink-0' aria-hidden='true' />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
