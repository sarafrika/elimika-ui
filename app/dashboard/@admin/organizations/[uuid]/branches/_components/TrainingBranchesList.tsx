'use client';
import { useRouter, usePathname } from 'next/navigation';
import type { TrainingBranch } from '@/services/client';
import { Input } from '@/components/ui/input';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import TrainingBranchCard from './TrainingBranchCard';

interface TrainingBranchesListProps {
  branches: TrainingBranch[];
  organizationUuid: string;
  searchQuery: string;
  activeFilter: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  selectedBranch: TrainingBranch | null;
}

export default function TrainingBranchesList({
  branches,
  organizationUuid,
  searchQuery,
  activeFilter,
  sortField,
  sortOrder,
  selectedBranch,
}: TrainingBranchesListProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'all') {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push(pathname);
  };

  const isSelected = (branch: TrainingBranch) =>
    !selectedBranch ? true : selectedBranch?.uuid === branch.uuid;

  const hasActiveFilters = searchQuery || activeFilter !== 'all' || sortField !== 'branch_name';

  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      {/* Filters */}
      <div className='space-y-4 border-b p-4'>
        {/* Search */}
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder='Search branches...'
            value={searchQuery}
            onChange={e => updateParams({ search: e.target.value })}
            className='pl-10'
          />
        </div>

        {/* Filters Row */}
        <div className='flex flex-wrap gap-2'>
          {/* Active Filter */}
          <Select value={activeFilter} onValueChange={active => updateParams({ active })}>
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

          {/* Sort Field */}
          <Select value={sortField} onValueChange={field => updateParams({ sortField: field })}>
            <SelectTrigger className='min-w-[120px] flex-1'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='branch_name'>Name</SelectItem>
              <SelectItem value='address'>Location</SelectItem>
              <SelectItem value='poc_name'>Contact</SelectItem>
              <SelectItem value='created_date'>Date Created</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant='outline'
            size='sm'
            onClick={() => updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
            className='flex-shrink-0 px-3'
          >
            {sortOrder === 'asc' ? (
              <SortAsc className='h-4 w-4' />
            ) : (
              <SortDesc className='h-4 w-4' />
            )}
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClearFilters}
              className='flex-shrink-0 px-3'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Branches List */}
      <div className='flex-1 overflow-y-auto'>
        {branches.length === 0 ? (
          <div className='text-muted-foreground flex h-32 items-center justify-center'>
            No branches found
          </div>
        ) : (
          branches.map(branch => (
            <TrainingBranchCard
              key={branch.uuid!}
              branch={branch}
              isSelected={isSelected(branch)}
              onSelect={selectedBranch => updateParams({ id: selectedBranch?.uuid ?? '' })}
            />
          ))
        )}
      </div>
    </div>
  );
}
