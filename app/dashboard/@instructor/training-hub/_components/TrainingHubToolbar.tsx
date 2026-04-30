'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LayoutGrid, Search } from 'lucide-react';

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
      className='rounded-[14px] border border-border/50 bg-card p-3 shadow-sm sm:p-4'
    >
      <div className='flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-2'>

        {/* Search */}
        <Label className='flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-border/60 bg-background px-3 text-muted-foreground'>
          <Search className='size-4 shrink-0' />
          <span className='sr-only'>Search courses or classes</span>
          <Input
            aria-label='Search courses or classes'
            className='w-full min-w-0 bg-transparent text-[0.9rem] text-foreground outline-none placeholder:text-muted-foreground/80 sm:text-[0.95rem]'
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            placeholder='Search courses or classes...'
            type='search'
          />
        </Label>

        {/* Filters */}
        <div className='flex flex-wrap gap-2 min-[900px]:justify-end'>

          {/* Type Select */}
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className='h-11 w-[160px] rounded-[10px] border-border/60 bg-background'>
              <SelectValue placeholder='Type' />
            </SelectTrigger>
            <SelectContent>
              {trainingHubTypeFilters.map(filter => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Select */}
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className='h-11 w-[160px] rounded-[10px] border-border/60 bg-background'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              {trainingHubStatusFilters.map(filter => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type='button'
            aria-label='Change view'
            className='inline-flex size-11 items-center justify-center rounded-[10px] border border-border/60 bg-background text-muted-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
          >
            <LayoutGrid className='size-4' />
          </button>
        </div>
      </div>
    </section>
  );
}