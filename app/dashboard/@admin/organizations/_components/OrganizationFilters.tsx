import React from 'react';
import { Filter, Search, SortAsc, SortDesc, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrganizationFiltersProps {
  searchQuery: string;
  setSearchQuery(query: string): void;
  activeFilter: string;
  setActiveFilter(status: string): void;
  verifiedFilter: string;
  setVerifiedFilter(verified: string): void;
  sortField: string;
  setSortField(field: string): void;
  sortOrder: 'asc' | 'desc';
  setSortOrder(order: 'asc' | 'desc'): void;
  onClearFilters(): void;
}

export default function OrganizationFilters({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  verifiedFilter,
  setVerifiedFilter,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  onClearFilters,
}: OrganizationFiltersProps) {
  const hasActiveFilters =
    searchQuery ||
    activeFilter !== 'all' ||
    verifiedFilter !== 'all' ||
    sortField !== 'created_date';

  return (
    <div className='space-y-4 border-b p-4'>
      <div className='relative'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
        <Input
          placeholder='Search by name, location, or description'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>

      <div className='flex flex-wrap gap-2'>
        {/* Active Status Filter */}
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className='min-w-[120px] flex-1'>
            <Filter className='mr-2 h-4 w-4' />
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='true'>Active</SelectItem>
            <SelectItem value='false'>Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Verification Filter */}
        <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
          <SelectTrigger className='min-w-[120px] flex-1'>
            <SelectValue placeholder='Verification' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Verification</SelectItem>
            <SelectItem value='true'>Verified</SelectItem>
            <SelectItem value='false'>Pending</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Field */}
        <Select value={sortField} onValueChange={setSortField}>
          <SelectTrigger className='min-w-[140px] flex-1'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='created_date'>Date Created</SelectItem>
            <SelectItem value='updated_date'>Last Updated</SelectItem>
            <SelectItem value='name'>Name</SelectItem>
            <SelectItem value='location'>Location</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order Toggle */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className='flex-shrink-0 px-3'
        >
          {sortOrder === 'asc' ? <SortAsc className='h-4 w-4' /> : <SortDesc className='h-4 w-4' />}
          <span className='ml-2 hidden sm:inline'>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant='ghost' size='sm' onClick={onClearFilters} className='flex-shrink-0 px-3'>
            <X className='h-4 w-4' />
            <span className='ml-2 hidden sm:inline'>Clear</span>
          </Button>
        )}
      </div>
    </div>
  );
}
