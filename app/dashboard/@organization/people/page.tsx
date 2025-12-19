'use client';

import { elimikaDesignSystem } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  getUsersByOrganisationAndDomainOptions,
  getUsersByOrganisationOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { User } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import {
  Users,
  Mail,
  Calendar,
  Filter,
  X,
  Building2,
  GraduationCap,
  BookOpen,
  MoreVertical,
  UserCog,
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const domainOptions = [
  { value: '', label: 'All roles' },
  { value: 'organisation_user', label: 'Organisation user' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
];

const peopleColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'first_name',
    header: 'Member',
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full'>
          <span className='text-base font-semibold'>
            {(row.original.first_name?.[0] || row.original.email?.[0] || '?').toUpperCase()}
          </span>
        </div>
        <div className='text-foreground font-semibold'>
          {`${row.original.first_name ?? ''} ${row.original.last_name ?? ''}`.trim() ||
            'Unnamed User'}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <div className='text-muted-foreground flex items-center gap-1.5 text-sm'>
        <Mail className='h-3.5 w-3.5' />
        <span>{row.original.email}</span>
      </div>
    ),
  },
  {
    id: 'roles',
    header: 'Roles',
    cell: ({ row }) => (
      <div className='flex flex-wrap gap-1.5'>
        {row.original.user_domain && row.original.user_domain.length > 0 ? (
          row.original.user_domain.map(domain => (
            <Badge key={domain} variant='secondary' className='text-xs'>
              {domain}
            </Badge>
          ))
        ) : (
          <span className='text-muted-foreground text-xs'>No roles</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'created_date',
    header: 'Joined',
    cell: ({ row }) =>
      row.original.created_date ? (
        <div className='text-muted-foreground flex items-center gap-1.5 text-sm'>
          <Calendar className='h-3.5 w-3.5' />
          <span>{format(new Date(row.original.created_date), 'MMM dd, yyyy')}</span>
        </div>
      ) : null,
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Actions</div>,
    cell: ({ row }) => (
      <div className='flex justify-end'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size='sm' variant='ghost' onClick={e => e.stopPropagation()}>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                // Handle view profile action
              }}
            >
              <Users className='h-4 w-4' />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                // Handle manage roles action
              }}
            >
              <UserCog className='h-4 w-4' />
              Manage Roles
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

export default function OrganisationPeoplePage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const [domainFilter, setDomainFilter] = useState('');

  const usersQuery = useQuery({
    ...(domainFilter
      ? getUsersByOrganisationAndDomainOptions({
          path: { uuid: organisationUuid, domainName: domainFilter },
        })
      : getUsersByOrganisationOptions({
          path: { uuid: organisationUuid },
          query: { pageable: { page: 0, size: 100 } },
        })),
    enabled: Boolean(organisationUuid),
  });

  const usersPage = extractPage<User>(usersQuery.data);
  const users = usersPage.items;
  const totalItems = getTotalFromMetadata(usersPage.metadata);

  const stats = useMemo(() => {
    return {
      total: totalItems,
      orgUsers: users.filter(u => u.user_domain?.includes('organisation_user')).length,
      instructors: users.filter(u => u.user_domain?.includes('instructor')).length,
      students: users.filter(u => u.user_domain?.includes('student')).length,
    };
  }, [users, totalItems]);

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Compact Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>People</h1>
            <p className='text-muted-foreground text-sm'>Manage members and team roles</p>
          </div>
        </div>

        {/* Stats */}
        <div className='grid gap-3 sm:grid-cols-4'>
          <div className='border-border bg-card rounded-lg border p-3'>
            <div className='flex items-center gap-3'>
              <div className='bg-muted rounded-lg p-2'>
                <Users className='text-primary h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Total Members</p>
                <p className='text-foreground text-lg font-bold'>{stats.total}</p>
              </div>
            </div>
          </div>

          <div className='border-border bg-card rounded-lg border p-3'>
            <div className='flex items-center gap-3'>
              <div className='bg-muted rounded-lg p-2'>
                <Building2 className='text-primary h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Org Users</p>
                <p className='text-foreground text-lg font-bold'>{stats.orgUsers}</p>
              </div>
            </div>
          </div>

          <div className='border-border bg-card rounded-lg border p-3'>
            <div className='flex items-center gap-3'>
              <div className='bg-muted rounded-lg p-2'>
                <BookOpen className='text-primary h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Instructors</p>
                <p className='text-foreground text-lg font-bold'>{stats.instructors}</p>
              </div>
            </div>
          </div>

          <div className='border-border bg-card rounded-lg border p-3'>
            <div className='flex items-center gap-3'>
              <div className='bg-muted rounded-lg p-2'>
                <GraduationCap className='text-primary h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Students</p>
                <p className='text-foreground text-lg font-bold'>{stats.students}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className='mb-6'>
        <div className='flex items-center gap-3'>
          <Filter className='text-muted-foreground h-4 w-4' />
          <select
            className='border-border bg-background rounded-md border px-3 py-2 text-sm'
            value={domainFilter}
            onChange={event => setDomainFilter(event.target.value)}
          >
            {domainOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {domainFilter && (
            <Button variant='ghost' size='sm' onClick={() => setDomainFilter('')}>
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </section>

      {/* People DataTable */}
      <section className={elimikaDesignSystem.spacing.content}>
        {usersQuery.isLoading ? (
          <div className='space-y-2'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className={elimikaDesignSystem.components.emptyState.container}>
            <Users className={elimikaDesignSystem.components.emptyState.icon} />
            <h3 className={elimikaDesignSystem.components.emptyState.title}>No members found</h3>
            <p className={elimikaDesignSystem.components.emptyState.description}>
              {domainFilter
                ? 'Try adjusting your filter criteria'
                : 'No members have been added yet.'}
            </p>
          </div>
        ) : (
          <DataTable
            columns={peopleColumns}
            data={users}
            searchKey='first_name'
            searchPlaceholder='Search by name or email...'
            pageSize={10}
          />
        )}
      </section>
    </div>
  );
}
