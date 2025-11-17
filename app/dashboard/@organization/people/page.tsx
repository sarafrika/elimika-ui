"use client";

import { AdminDataTable } from '@/components/admin/data-table/data-table';
import { AdminDataTableColumn } from '@/components/admin/data-table/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrainingCenter } from '@/context/training-center-provide';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  getUsersByOrganisationAndDomainOptions,
  getUsersByOrganisationOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { User } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const domainOptions = [
  { value: '', label: 'All roles' },
  { value: 'organisation_user', label: 'Organisation user' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
];

export default function OrganisationPeoplePage() {
  const trainingCenter = useTrainingCenter();
  const organisationUuid = trainingCenter?.uuid ?? '';

  const [domainFilter, setDomainFilter] = useState('');
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const pageSize = 10;

  const usersQuery = useQuery({
    ...(domainFilter
      ? getUsersByOrganisationAndDomainOptions({
          path: { uuid: organisationUuid, domainName: domainFilter },
        })
      : getUsersByOrganisationOptions({
          path: { uuid: organisationUuid },
          query: { pageable: { page, size: pageSize } },
        })),
    enabled: Boolean(organisationUuid),
  });

  const usersPage = extractPage<User>(usersQuery.data);
  const filteredItems = useMemo(() => {
    if (!searchValue) return usersPage.items;
    const term = searchValue.toLowerCase();
    return usersPage.items.filter(user => {
      const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.toLowerCase();
      return name.includes(term) || (user.email ?? '').toLowerCase().includes(term);
    });
  }, [usersPage.items, searchValue]);

  const totalItems = domainFilter ? filteredItems.length : getTotalFromMetadata(usersPage.metadata);
  const totalPages =
    domainFilter || totalItems === 0
      ? 1
      : Math.max(
          (usersPage.metadata.totalPages as number | undefined) ??
            Math.ceil(totalItems / pageSize) ??
            1,
          1
        );

  const columns: AdminDataTableColumn<User>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: user => (
        <div className='flex flex-col'>
          <span className='font-medium'>
            {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
          </span>
          <span className='text-muted-foreground text-xs'>{user.email}</span>
        </div>
      ),
    },
    {
      id: 'domains',
      header: 'Domains',
      cell: user => (
        <div className='flex flex-wrap gap-2'>
          {user.user_domain?.map(domain => (
            <Badge key={domain} variant='secondary'>
              {domain}
            </Badge>
          )) || <span className='text-muted-foreground text-sm'>—</span>}
        </div>
      ),
    },
    {
      id: 'created',
      header: 'Created',
      cell: user =>
        user.created_date ? (
          <span className='text-sm'>{format(new Date(user.created_date), 'dd MMM yyyy')}</span>
        ) : (
          <span className='text-muted-foreground text-sm'>—</span>
        ),
      className: 'text-right',
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>People</h1>
          <p className='text-muted-foreground text-sm'>
            Paginated from GET /api/v1/organisations/{organisationUuid}/users with role filters for organisation admins, instructors, and students.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link prefetch href='/dashboard/invitations'>
              Invite to organisation
            </Link>
          </Button>
        </div>
      </div>

      <div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-wrap items-center gap-3'>
            <label className='text-xs text-muted-foreground' htmlFor='domain-filter'>
              Role filter
            </label>
            <select
              id='domain-filter'
              className='rounded-md border border-border/60 bg-background px-3 py-2 text-sm'
              value={domainFilter}
              onChange={event => {
                setDomainFilter(event.target.value);
                setPage(0);
              }}
            >
              {domainOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-center gap-2'>
            <Input
              placeholder='Search by name or email'
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              className='w-full md:w-72'
            />
            <Button variant='ghost' size='sm' onClick={() => setSearchValue('')}>
              Reset
            </Button>
          </div>
        </div>
        <div className='mt-4'>
          <AdminDataTable
            title='Members & roles'
            description='Domain chips show full access including organisation-level roles.'
            columns={columns}
            data={filteredItems}
            isLoading={usersQuery.isLoading}
            pagination={
              domainFilter
                ? undefined
                : {
                    page,
                    pageSize,
                    totalItems,
                    totalPages,
                    onPageChange: setPage,
                  }
            }
            emptyState={{
              title: 'No members found',
              description: 'Invite people to this organisation or adjust filters.',
            }}
          />
        </div>
      </div>
    </div>
  );
}
