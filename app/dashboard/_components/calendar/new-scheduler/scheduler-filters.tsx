'use client';

import { Check, ChevronDown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SchedulerFilterSection } from './types';

type FilterSectionView = Omit<SchedulerFilterSection, 'key'>;

const Dropdown = ({
  label,
  count,
  isOpen,
  onToggle,
  items,
  onItemClick,
  selectedId,
}: FilterSectionView) => (
  <div className='border-border border-b last:border-b-0'>
    <button
      type='button'
      onClick={onToggle}
      className='hover:bg-primary/5 flex w-full items-center justify-between px-4 py-2.5 transition-colors md:px-5 md:py-3'
    >
      <span className='text-foreground text-xs font-medium tracking-wide uppercase md:text-sm'>
        {label}
      </span>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground text-xs font-semibold md:text-sm'>{count}</span>
        <ChevronDown
          className={`text-muted-foreground h-3 w-3 transition-transform md:h-4 md:w-4 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
    </button>

    {isOpen && (
      <div className='scrollbar-hide max-h-64 space-y-1.5 overflow-y-auto px-4 pb-3 md:px-5'>
        {items.length ? (
          items.map(item => (
            <button
              key={item.id}
              type='button'
              className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition-colors md:text-sm ${
                selectedId === item.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-primary/5'
              }`}
              onClick={() => onItemClick(item.id)}
            >
              <span className='truncate'>{item.name}</span>
              {selectedId === item.id && <Check className='text-primary ml-2 h-3.5 w-3.5 shrink-0' />}
            </button>
          ))
        ) : (
          <p className='text-muted-foreground px-2 py-1 text-xs'>No matches found.</p>
        )}
      </div>
    )}
  </div>
);

export function SchedulerFilters({
  activeFilterCount,
  onClearFilters,
  onSearchChange,
  searchQuery,
  sections,
}: {
  activeFilterCount: number;
  onClearFilters: () => void;
  onSearchChange: (value: string) => void;
  searchQuery: string;
  sections: SchedulerFilterSection[];
}) {
  return (
    <aside className='bg-card w-full min-w-[220px] max-w-[20rem] rounded-md border p-3 shadow-sm xl:w-full'>
      <div className='mb-4 flex w-full items-center justify-between gap-2'>
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

      <div className='border-border border-b pb-3'>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
          <Input
            type='text'
            placeholder='Search classes, venues, rooms...'
            value={searchQuery}
            onChange={event => onSearchChange(event.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className='border-border border-b p-3 md:p-4'>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-muted-foreground text-xs font-medium md:text-sm'>
              {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} applied
            </span>
          </div>
        </div>
      )}

      <div className='scrollbar-hide flex-1 overflow-y-auto'>
        {sections.map(({ key, ...section }) => (
          <Dropdown key={key} {...section} />
        ))}
      </div>
    </aside>
  );
}
