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
import { format } from 'date-fns';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Users,
  Mail,
  Search,
  UserPlus,
  Calendar,
  Filter,
  X,
  Building2,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const domainOptions = [
  { value: '', label: 'All roles' },
  { value: 'organisation_user', label: 'Organisation user' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
];

export default function OrganisationPeoplePage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const [domainFilter, setDomainFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');

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
    return usersPage.items.filter((user) => {
      const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.toLowerCase();
      return name.includes(term) || (user.email ?? '').toLowerCase().includes(term);
    });
  }, [usersPage.items, searchValue]);

  const totalItems = domainFilter ? filteredItems.length : getTotalFromMetadata(usersPage.metadata);
  const totalPages =
    domainFilter || totalItems === 0
      ? 1
      : Math.max(
          (usersPage.metadata.totalPages as number | undefined) ?? Math.ceil(totalItems / pageSize) ?? 1,
          1
        );

  const stats = useMemo(() => {
    const all = usersPage.items;
    return {
      total: totalItems,
      orgUsers: all.filter((u) => u.user_domain?.includes('organisation_user')).length,
      instructors: all.filter((u) => u.user_domain?.includes('instructor')).length,
      students: all.filter((u) => u.user_domain?.includes('student')).length,
    };
  }, [usersPage.items, totalItems]);

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Compact Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>People</h1>
            <p className='text-sm text-muted-foreground'>Manage members and team roles</p>
          </div>
          <Button asChild size='sm'>
            <Link href='/dashboard/invitations'>
              <UserPlus className='mr-2 h-4 w-4' />
              Invite People
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className='grid gap-3 sm:grid-cols-4'>
          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Users className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Total Members</p>
                <p className='text-lg font-bold text-foreground'>{stats.total}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Building2 className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Org Users</p>
                <p className='text-lg font-bold text-foreground'>{stats.orgUsers}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <BookOpen className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Instructors</p>
                <p className='text-lg font-bold text-foreground'>{stats.instructors}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <GraduationCap className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Students</p>
                <p className='text-lg font-bold text-foreground'>{stats.students}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className='mb-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <select
              className='rounded-md border border-border bg-background px-3 py-2 text-sm'
              value={domainFilter}
              onChange={(event) => {
                setDomainFilter(event.target.value);
                setPage(0);
              }}
            >
              {domainOptions.map((option) => (
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
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by name or email...'
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className='w-full pl-10 sm:w-80'
            />
            {searchValue && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSearchValue('')}
                className='absolute right-1 top-1/2 h-7 -translate-y-1/2'
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
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
        ) : filteredItems.length === 0 ? (
          <div className={elimikaDesignSystem.components.emptyState.container}>
            <Users className={elimikaDesignSystem.components.emptyState.icon} />
            <h3 className={elimikaDesignSystem.components.emptyState.title}>No members found</h3>
            <p className={elimikaDesignSystem.components.emptyState.description}>
              {searchValue || domainFilter
                ? 'Try adjusting your search or filter criteria'
                : 'Invite people to your organization to get started'}
            </p>
            <Button asChild className='mt-4'>
              <Link href='/dashboard/invitations'>
                <UserPlus className='mr-2 h-4 w-4' />
                Invite People
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className='overflow-hidden rounded-lg border border-border'>
              <table className='w-full'>
                <thead className='bg-muted/50'>
                  <tr className='border-b border-border'>
                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                      Member
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                      Email
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                      Roles
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border bg-card'>
                  {filteredItems.map((user) => (
                    <tr
                      key={user.uuid}
                      className='transition-colors hover:bg-accent/50'
                    >
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                            <span className='text-base font-semibold'>
                              {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className='font-semibold text-foreground'>
                              {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Unnamed User'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                          <Mail className='h-3.5 w-3.5' />
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='flex flex-wrap gap-1.5'>
                          {user.user_domain && user.user_domain.length > 0 ? (
                            user.user_domain.map((domain) => (
                              <Badge key={domain} variant='secondary' className='text-xs'>
                                {domain}
                              </Badge>
                            ))
                          ) : (
                            <span className='text-xs text-muted-foreground'>No roles</span>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        {user.created_date && (
                          <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                            <Calendar className='h-3.5 w-3.5' />
                            <span>{format(new Date(user.created_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            {!domainFilter && (
              <div className='mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>Rows per page:</span>
                  <select
                    className='rounded-md border border-border bg-background px-3 py-1.5 text-sm'
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                  >
                    <option value='5'>5</option>
                    <option value='10'>10</option>
                    <option value='20'>20</option>
                    <option value='50'>50</option>
                  </select>
                </div>

                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalItems)} of{' '}
                    {totalItems} entries
                  </span>
                </div>

                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(0)}
                    disabled={page === 0}
                  >
                    First
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <div className='flex items-center gap-1'>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (page < 3) {
                        pageNum = i;
                      } else if (page > totalPages - 4) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setPage(pageNum)}
                          className='min-w-[2.5rem]'
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
