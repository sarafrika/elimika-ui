'use client';

import { Calendar, ChevronDown, Filter, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dayjs } from '@/lib/date';

import { ANALYTICS_STATUS_OPTIONS } from './analytics-filters';
import { useAnalyticsFilters } from './analytics-filters-context';

interface HeaderBarProps {
  availablePrograms: string[];
  availableLocations: string[];
}

const formatRangeLabel = (from: string, to: string) => {
  if (!from && !to) {
    return 'All Dates';
  }

  const startLabel = from ? dayjs(from).format('MMM D, YYYY') : 'Start';
  const endLabel = to ? dayjs(to).format('MMM D, YYYY') : 'End';

  if (from && to) {
    return `${startLabel} - ${endLabel}`;
  }

  return `${startLabel} - ${endLabel}`;
};

export function HeaderBar({ availablePrograms, availableLocations }: HeaderBarProps) {
  const { filters, setFilters, resetFilters } = useAnalyticsFilters();

  const updateFilters = (patch: Partial<typeof filters>) => {
    setFilters(current => ({
      ...current,
      ...patch,
    }));
  };

  const toggleStatus = (status: string) => {
    setFilters(current => {
      const nextStatuses = current.statuses.includes(status)
        ? current.statuses.filter(item => item !== status)
        : [...current.statuses, status];

      return {
        ...current,
        statuses: nextStatuses,
      };
    });
  };

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.program !== 'all' ||
    filters.location !== 'all' ||
    filters.statuses.length !== ANALYTICS_STATUS_OPTIONS.length;

  return (
    <div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
      <div>
        <h1 className='text-foreground text-lg leading-tight font-bold sm:text-xl lg:text-2xl'>
          Training Delivery Tracker - Report
        </h1>
        <p className='text-muted-foreground mt-0.5 text-xs sm:text-sm'>
          Comprehensive overview of training delivery performance and progress
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline' size='sm' className='justify-between gap-1.5'>
              <Calendar className='text-primary h-3.5 w-3.5 shrink-0' />
              <span className='text-foreground whitespace-nowrap'>
                {formatRangeLabel(filters.dateFrom, filters.dateTo)}
              </span>
              <ChevronDown className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-80 space-y-3' align='start'>
            <div>
              <p className='text-foreground text-sm font-semibold'>Date range</p>
              <p className='text-muted-foreground text-xs'>
                Filter the dashboard by session start date.
              </p>
            </div>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <label className='text-muted-foreground space-y-1 text-xs font-medium'>
                <span>From</span>
                <Input
                  type='date'
                  value={filters.dateFrom}
                  onChange={event => updateFilters({ dateFrom: event.target.value })}
                />
              </label>
              <label className='text-muted-foreground space-y-1 text-xs font-medium'>
                <span>To</span>
                <Input
                  type='date'
                  value={filters.dateTo}
                  onChange={event => updateFilters({ dateTo: event.target.value })}
                />
              </label>
            </div>
            <div className='flex justify-between gap-2'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => updateFilters({ dateFrom: '', dateTo: '' })}
              >
                Clear dates
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={filters.program} onValueChange={value => updateFilters({ program: value })}>
          <SelectTrigger size='sm' className='w-[160px] justify-between'>
            <SelectValue placeholder='All Programs' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Programs</SelectItem>
            {availablePrograms.map(program => (
              <SelectItem key={program} value={program}>
                {program}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.location}
          onValueChange={value => updateFilters({ location: value })}
        >
          <SelectTrigger size='sm' className='w-[160px] justify-between'>
            <SelectValue placeholder='All Locations' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Locations</SelectItem>
            {availableLocations.map(location => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              size='sm'
              className='gap-1.5'
            >
              <Filter className='h-3.5 w-3.5 shrink-0' />
              <span>Filters</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            {ANALYTICS_STATUS_OPTIONS.map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.statuses.includes(status)}
                onCheckedChange={() => toggleStatus(status)}
                onSelect={event => event.preventDefault()}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuItem onSelect={() => resetFilters()}>
              <RotateCcw className='h-4 w-4' />
              Reset filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button variant='ghost' size='sm' onClick={resetFilters}>
            Reset all
          </Button>
        )}
      </div>
    </div>
  );
}
