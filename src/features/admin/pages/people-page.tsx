'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { DataTable, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateOnly } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { User } from '@/services/client';
import { FilterBar } from '../components/filter-bar';
import { SectionBoundary } from '../components/section-boundary';
import {
  PEOPLE_PAGE_SIZE,
  personDomains,
  personInitials,
  usePeople,
  type PeopleRole,
  type PeopleStatus,
} from '../hooks/use-people';
import { adminRoutes } from '../lib/admin-routes';
import { enumParam, numberParam, stringParam } from '../state/search-state';
import { useSearchState, useSearchStatePatch } from '../state/use-search-state';

const ROLES: { id: PeopleRole; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'student', label: 'Students' },
  { id: 'instructor', label: 'Instructors' },
  { id: 'course_creator', label: 'Course creators' },
  { id: 'organisation_user', label: 'Organisation staff' },
  { id: 'admin', label: 'Admins' },
];

const ROLE_IDS = ROLES.map(role => role.id) as PeopleRole[];
const STATUSES = ['any', 'active', 'inactive'] as const;

const roleParam = enumParam<PeopleRole>(ROLE_IDS, 'all');
const statusParam = enumParam<PeopleStatus>(STATUSES, 'any');
const queryParam = stringParam();
const pageParam = numberParam(0);

const DOMAIN_LABEL: Record<string, string> = {
  student: 'Student',
  instructor: 'Instructor',
  course_creator: 'Course creator',
  organisation_user: 'Organisation',
  admin: 'Admin',
  parent: 'Parent',
};

export function PeoplePage() {
  const [role] = useSearchState<PeopleRole>('role', roleParam);
  const [status] = useSearchState<PeopleStatus>('status', statusParam);
  const [q] = useSearchState('q', queryParam);
  const [page] = useSearchState('page', pageParam);
  const patch = useSearchStatePatch();
  const router = useRouter();

  const result = usePeople({ role, q, status, page });

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'Person',
        header: 'Person',
        cell: ({ row }) => {
          const person = row.original;
          return (
            <div className='flex items-center gap-3'>
              <Avatar className='size-8'>
                <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                  {personInitials(person)}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <p className='text-foreground truncate text-sm font-medium'>
                  {person.full_name || `${person.first_name} ${person.last_name}`.trim()}
                </p>
                <p className='text-muted-foreground truncate text-xs'>{person.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'Roles',
        header: 'Roles',
        cell: ({ row }) => {
          const domains = personDomains(row.original);
          if (!domains.length) return <span className='text-muted-foreground'>—</span>;
          return (
            <div className='flex flex-wrap gap-1'>
              {domains.map(domain => (
                <StatusBadge
                  key={domain}
                  tone='neutral'
                  label={DOMAIN_LABEL[domain] ?? domain}
                />
              ))}
            </div>
          );
        },
      },
      {
        id: 'Organisation',
        header: 'Organisation',
        cell: ({ row }) => {
          const affiliation = row.original.organisation_affiliations?.[0];
          if (!affiliation?.organisation_name) {
            return <span className='text-muted-foreground'>—</span>;
          }
          return (
            <div className='min-w-0'>
              <p className='text-foreground truncate text-sm'>{affiliation.organisation_name}</p>
              {affiliation.domain_in_organisation ? (
                <p className='text-muted-foreground truncate text-xs'>
                  {DOMAIN_LABEL[affiliation.domain_in_organisation] ??
                    affiliation.domain_in_organisation}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'Status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.original.active ? 'active' : 'inactive'} />
        ),
      },
      {
        id: 'Joined',
        header: 'Joined',
        cell: ({ row }) => (
          <span className='text-muted-foreground font-mono text-xs'>
            {formatDateOnly(row.original.created_date)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='People'
          title='Everyone on Elimika'
          description='Students, instructors, creators, organisation staff and admins, in one directory.'
        />

        <nav aria-label='Roles' className='border-border/70 flex flex-wrap gap-4 border-b'>
          {ROLES.map(entry => {
            const isActive = entry.id === role;
            return (
              <Link
                key={entry.id}
                href={adminRoutes.people({ role: entry.id === 'all' ? undefined : entry.id })}
                scroll={false}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  '-mb-px flex h-10 shrink-0 items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
                )}
              >
                {entry.label}
                {entry.id === 'all' ? (
                  result.isLoading ? (
                    <Skeleton className='h-4 w-8' />
                  ) : (
                    <span className='text-muted-foreground font-mono text-xs'>{result.total}</span>
                  )
                ) : null}
              </Link>
            );
          })}
        </nav>

        <FilterBar
          values={{ q, status }}
          searchPlaceholder='Search name, email or phone…'
          filters={[
            {
              key: 'status',
              label: 'Status',
              anyValue: 'any',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
        />

        <SectionBoundary
          label='the directory'
          loading={result.isLoading}
          error={result.error}
          empty={result.people.length === 0}
          onRetry={result.refetch}
          emptyTitle={result.isFiltered ? 'Nothing matches these filters' : 'No people yet'}
          emptyDescription={
            result.isFiltered
              ? 'Clear the search or filters to see everyone.'
              : 'Accounts appear here as people join the platform.'
          }
          skeleton={
            <div className='space-y-3'>
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          }
        >
          <DataTable
            columns={columns}
            data={result.people}
            getRowId={person => person.uuid ?? person.email}
            onRowClick={person => {
              if (person.uuid) router.push(adminRoutes.person(person.uuid));
            }}
            enableRowSelection={false}
            hideToolbar
            pageSize={PEOPLE_PAGE_SIZE}
            emptyTitle='Nothing on this page'
            emptyDescription='Try another page or clear the filters.'
            serverPagination={{
              page,
              pageCount: result.pageCount,
              totalRows: result.total,
              onPageChange: next => patch({ page: next === 0 ? undefined : String(next) }),
            }}
          />
        </SectionBoundary>

        <p className='text-muted-foreground text-xs'>
          Selecting rows for bulk actions arrives with the notification send endpoint; until then
          every action happens inside a person’s record.
        </p>
      </div>
    </div>
  );
}
