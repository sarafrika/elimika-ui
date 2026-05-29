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


// update the traininghub tool bar to activate the filter for the classes.
// make sure the data are filtered correctly based on the description of the filters

const trainingHubFilters = [
  { label: 'All Classes', value: 'all' },
  { label: 'Today Classes', value: 'today' }, //classes with schedule happening on that day
  { label: 'Upcoming', value: 'upcoming' }, // classes with schedule happening on a future date
  { label: 'Incomplete', value: 'incomplete' }, // classes whose completion rate are not 100%
  { label: 'Remedial', value: 'remedial' }, // 
  { label: 'Make up Classes', value: 'make-up' },
  { label: 'Cancelled', value: 'cancelled' }, // cancelled classes
  { label: 'Completed', value: 'comleted' }, // cancelled whose completion rate is 100%

] as const;


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
      className=''
    >
      {/* // also add for the status here, list of all the items in the filters at the top here, such that when I select any, it filters also */}

      <div className='flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-2'>

        {/* Search */}
        <Label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-border/60 bg-background px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-4 shrink-0" />
          <span className="sr-only">Search courses or classes</span>

          <Input
            type="search"
            aria-label="Search courses or classes"
            placeholder="Search courses or classes..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full min-w-0 border-none bg-transparent p-0 text-[0.9rem] text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-[0.95rem]"
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
              {trainingHubFilters.map(filter => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Select */}
          {/* <Select value={selectedStatus} onValueChange={onStatusChange}>
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
          </Select> */}

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