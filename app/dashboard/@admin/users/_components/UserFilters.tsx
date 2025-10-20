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

interface UserFiltersProps {
  searchQuery: string;
  setSearchQuery(query: string): void;
  activeFilter: string;
  setActiveFilter(status: string): void;
  domainFilter: string;
  setDomainFilter(domain: string): void;
  sortField: string;
  setSortField(field: string): void;
  sortOrder: 'asc' | 'desc';
  setSortOrder(order: 'asc' | 'desc'): void;
  onClearFilters(): void;
}

export default function UserFilters({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  domainFilter,
  setDomainFilter,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  onClearFilters,
}: UserFiltersProps) {
  const hasActiveFilters =
    searchQuery || activeFilter !== 'all' || domainFilter !== 'all' || sortField !== 'created_date';

  return (
    <div className='space-y-4 border-b p-4'>
      {/* Search Input */}
      <div className='relative'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
        <Input
          placeholder='Search by name, email, or username'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Filters */}
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

        {/* Domain/Role Filter */}
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className='min-w-[120px] flex-1'>
            <SelectValue placeholder='Domain' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Domains</SelectItem>
            <SelectItem value='admin'>Admin</SelectItem>
            <SelectItem value='instructor'>Instructor</SelectItem>
            <SelectItem value='student'>Student</SelectItem>
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
            <SelectItem value='first_name'>First Name</SelectItem>
            <SelectItem value='last_name'>Last Name</SelectItem>
            <SelectItem value='email'>Email</SelectItem>
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
