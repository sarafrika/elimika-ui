'use client';

import { ChevronDown, LayoutGrid, Search } from 'lucide-react';
import {
  trainingHubStatusFilters,
  trainingHubTypeFilters,
} from './training-hub-data';

type TrainingHubToolbarProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedStatus: (typeof trainingHubStatusFilters)[number]['value'];
  selectedType: (typeof trainingHubTypeFilters)[number]['value'];
  onStatusChange: (value: (typeof trainingHubStatusFilters)[number]['value']) => void;
  onTypeChange: (value: (typeof trainingHubTypeFilters)[number]['value']) => void;
};

export function TrainingHubToolbar({
  searchTerm,
  onSearchTermChange,
  selectedStatus,
  selectedType,
  onStatusChange,
  onTypeChange,
}: TrainingHubToolbarProps) {
  return (
    <section
      aria-label='Training hub filters'
      className='rounded-[14px] border border-border/50 bg-white p-3 shadow-[0_12px_30px_rgba(31,79,183,0.06)] sm:p-4'
    >
      <div className='flex flex-col gap-3 min-[900px]:gap-2 min-[900px]:flex-row min-[900px]:items-center'>
        <label className='flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-border/60 bg-white px-3 text-muted-foreground'>
          <Search className='size-4 shrink-0' />
          <span className='sr-only'>Search courses or classes</span>
          <input
            aria-label='Search courses or classes'
            className='w-full min-w-0 bg-transparent text-[0.9rem] text-foreground outline-none placeholder:text-muted-foreground/80 sm:text-[0.95rem]'
            onChange={event => onSearchTermChange(event.target.value)}
            placeholder='Search courses or classes...'
            type='search'
            value={searchTerm}
          />
          <ChevronDown className='size-4 shrink-0 text-muted-foreground' />
        </label>

        <div className='flex flex-wrap gap-2 min-[900px]:justify-end'>
          <label className='relative inline-flex h-11 items-center rounded-[10px] border border-border/60 bg-white px-3 pr-9 text-[0.88rem] font-medium text-foreground transition hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 sm:px-4 sm:text-[0.92rem]'>
            <select
              aria-label='Filter training hub by type'
              className='h-full appearance-none bg-transparent pr-5 outline-none'
              onChange={event =>
                onTypeChange(
                  event.target.value as (typeof trainingHubTypeFilters)[number]['value']
                )
              }
              value={selectedType}
            >
              {trainingHubTypeFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-3 size-4 text-muted-foreground' />
          </label>

          <label className='relative inline-flex h-11 items-center rounded-[10px] border border-border/60 bg-white px-3 pr-9 text-[0.88rem] font-medium text-foreground transition hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 sm:px-4 sm:text-[0.92rem]'>
            <select
              aria-label='Filter training hub by status'
              className='h-full appearance-none bg-transparent pr-5 outline-none'
              onChange={event =>
                onStatusChange(
                  event.target.value as (typeof trainingHubStatusFilters)[number]['value']
                )
              }
              value={selectedStatus}
            >
              {trainingHubStatusFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-3 size-4 text-muted-foreground' />
          </label>

          <button
            aria-label='Change view'
            className='inline-flex size-11 items-center justify-center rounded-[10px] border border-border/60 bg-white text-muted-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
            type='button'
          >
            <LayoutGrid className='size-4' />
          </button>
        </div>
      </div>
    </section>
  );
}
