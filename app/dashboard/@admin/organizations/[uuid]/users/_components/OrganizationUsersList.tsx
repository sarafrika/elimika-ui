'use client';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/services/client';
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
import OrganizationUserCard from './OrganizationUserCard';

interface OrganizationUsersListProps {
  users: User[];
  organizationUuid: string;
  searchQuery: string;
  roleFilter: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  selectedUser: User | null;
}

export default function OrganizationUsersList({
  users,
  organizationUuid,
  searchQuery,
  roleFilter,
  sortField,
  sortOrder,
  selectedUser,
}: OrganizationUsersListProps) {
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

  const isSelected = (user: User) => (!selectedUser ? true : selectedUser?.uuid === user.uuid);

  const hasActiveFilters = searchQuery || roleFilter !== 'all' || sortField !== 'created_date';

  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      {/* Filters */}
      <div className='space-y-4 border-b p-4'>
        {/* Search */}
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder='Search members...'
            value={searchQuery}
            onChange={e => updateParams({ search: e.target.value })}
            className='pl-10'
          />
        </div>

        {/* Filters Row */}
        <div className='flex flex-wrap gap-2'>
          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={role => updateParams({ role })}>
            <SelectTrigger className='min-w-[120px] flex-1'>
              <Filter className='mr-2 h-4 w-4' />
              <SelectValue placeholder='Role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Roles</SelectItem>
              <SelectItem value='admin'>Admin</SelectItem>
              <SelectItem value='manager'>Manager</SelectItem>
              <SelectItem value='member'>Member</SelectItem>
              <SelectItem value='instructor'>Instructor</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Field */}
          <Select value={sortField} onValueChange={field => updateParams({ sortField: field })}>
            <SelectTrigger className='min-w-[120px] flex-1'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='first_name'>First Name</SelectItem>
              <SelectItem value='last_name'>Last Name</SelectItem>
              <SelectItem value='email'>Email</SelectItem>
              <SelectItem value='created_date'>Date Joined</SelectItem>
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

      <div className='flex-1 overflow-y-auto'>
        {users.length === 0 ? (
          <div className='text-muted-foreground flex h-32 items-center justify-center'>
            No members found
          </div>
        ) : (
          users.map(user => (
            <OrganizationUserCard
              key={user.uuid!}
              user={user}
              organizationUuid={organizationUuid}
              isSelected={isSelected(user)}
              onSelect={selectedUser => updateParams({ id: selectedUser?.uuid ?? '' })}
            />
          ))
        )}
      </div>
    </div>
  );
}
