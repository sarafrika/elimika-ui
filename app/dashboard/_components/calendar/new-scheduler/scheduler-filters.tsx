'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
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
  const initialTab = sections[0]?.key ?? '';

  const [activeTab, setActiveTab] = useState(initialTab);

  const activeSection = useMemo(
    () => sections.find(section => section.key === activeTab) ?? sections[0],
    [activeTab, sections]
  );

  return (
    <aside className='bg-card w-full min-w-[220px] max-w-[20rem] rounded-md border p-3 shadow-sm xl:w-full'>
      {/* Header */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='mb-4 w-full'>
        <TabsList className='grid h-auto w-full grid-cols-2 gap-1 bg-transparent p-0 sm:grid-cols-3'>
          {sections.map(section => (
            <TabsTrigger
              key={section.key}
              value={section.key}
              className='h-8 rounded-md border px-2 text-[11px] font-medium sm:text-xs data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
            >
              <span className='truncate'>
                {section.label}
                <span className='ml-1 opacity-70'>
                  ({section.count})
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className='border-border border-b pb-3'>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />

          <Input
            type='text'
            placeholder={`Search ${activeSection?.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={event => onSearchChange(event.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className='border-border border-b py-2'>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-muted-foreground text-xs font-medium md:text-sm'>
              {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} applied
            </span>
          </div>
        </div>
      )}

      {/* Items */}
      <div className='scrollbar-hide max-h-[500px] overflow-y-auto py-3'>
        {activeSection?.items.length ? (
          <div className='space-y-1.5'>
            {activeSection.items.map(item => {
              const isSelected = activeSection.selectedId === item.id;

              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => activeSection.onItemClick(item.id)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors md:text-sm ${isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-primary/5'
                    }`}
                >
                  <span className='truncate'>{item.name}</span>

                  {isSelected && (
                    <div className='bg-primary h-2 w-2 shrink-0 rounded-full' />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className='py-6 text-center'>
            <p className='text-muted-foreground text-xs md:text-sm'>
              No matches found.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}