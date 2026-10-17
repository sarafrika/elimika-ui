'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCount } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { ArrowRight, Building2, CircleAlert, GraduationCap, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';

export type ApprovedPartnerRow = {
  uuid: string;
  type: 'instructor' | 'organisation';
  name: string;
  subtitle?: string | null;
  searchText?: string;
  offerings: { uuid: string; kind: 'course' | 'program'; name: string | null }[];
  href: string;
};

export type ApprovedPartnerSource = {
  type: ApprovedPartnerRow['type'];
  rows: ApprovedPartnerRow[];
  isLoading: boolean;
  hasProfile: boolean;
  hasError: boolean;
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  refetch: () => Promise<unknown>;
  loadMore: () => Promise<unknown>;
};

const HEADING = 'px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap uppercase';
const VISIBLE_OFFERINGS = 2;
const plural = (count: number, label: string) =>
  `${formatCount(count, '0')} ${label}${count === 1 ? '' : 's'}`;

export default function ApprovedPartnersTable({
  sources,
  organisationsOnly = false,
}: {
  sources: ApprovedPartnerSource[];
  organisationsOnly?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search).trim().toLowerCase();
  const rows = useMemo(
    () => sources.flatMap(source => source.rows).sort((a, b) => a.name.localeCompare(b.name)),
    [sources]
  );
  const filtered = useMemo(
    () =>
      rows.filter(row =>
        [
          row.name,
          row.subtitle,
          row.searchText,
          row.type === 'instructor' ? 'freelancer' : 'organisation',
          ...row.offerings.map(offering => offering.name),
        ].some(value => value?.toLowerCase().includes(term))
      ),
    [rows, term]
  );
  const coverage = useMemo(() => {
    const offerings = rows.flatMap(row => row.offerings);
    return {
      courses: new Set(offerings.filter(item => item.kind === 'course').map(item => item.uuid))
        .size,
      programs: new Set(offerings.filter(item => item.kind === 'program').map(item => item.uuid))
        .size,
    };
  }, [rows]);
  const isLoading = sources.some(source => source.isLoading);
  const hasProfile = sources.some(source => source.hasProfile);
  const hasError = sources.some(source => source.hasError);
  const hasNextPage = sources.some(source => source.hasNextPage);
  const label = organisationsOnly ? 'organisation' : 'training partner';
  const searchLabel = organisationsOnly
    ? 'Search organisations or courses'
    : 'Search freelancers, organisations or content';
  const refetch = () => Promise.all(sources.map(source => source.refetch()));

  return (
    <div className='space-y-4'>
      <Card className='gap-0 overflow-hidden rounded-2xl py-0 shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-4 p-4'>
          <div>
            {isLoading && rows.length === 0 ? (
              <Skeleton className='mb-2 h-5 w-48' />
            ) : (
              <h2 className='text-base font-semibold'>
                {plural(rows.length, `approved ${label}`)}
              </h2>
            )}
            <p className='text-muted-foreground text-sm'>
              Training {plural(coverage.courses, 'course')}
              {!organisationsOnly && ` and ${plural(coverage.programs, 'program')}`} you created
              {hasNextPage || isLoading || hasError ? ' (loaded so far)' : ''}.
            </p>
          </div>
          <label className='relative block w-full sm:w-72'>
            <span className='sr-only'>{searchLabel}</span>
            <Search
              aria-hidden
              className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2'
            />
            <Input
              type='search'
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={`${searchLabel}…`}
              className='h-9 pl-9'
            />
          </label>
        </div>
        <div className='border-t' aria-busy={isLoading}>
          {isLoading && rows.length === 0 ? (
            <div className='space-y-2 p-4' role='status' aria-label={`Loading approved ${label}s`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className='h-16 w-full' />
              ))}
            </div>
          ) : !hasProfile ? (
            <EmptyState
              variant='plain'
              icon={Building2}
              title='Course creator profile unavailable'
              description={`A course creator profile is needed to view approved ${label}s.`}
            />
          ) : rows.length === 0 && hasError ? (
            <EmptyState
              variant='plain'
              icon={CircleAlert}
              title={`Could not load ${label}s`}
              description='Please try again.'
              action={
                <Button variant='outline' onClick={() => void refetch()}>
                  Retry
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState
              variant='plain'
              icon={Building2}
              title={`No approved ${label}s yet`}
              description='Training partners appear here once their application to teach your content is approved.'
            />
          ) : (
            <Table
              className={cn('text-left', organisationsOnly ? 'min-w-[760px]' : 'min-w-[900px]')}
            >
              <caption className='sr-only'>
                {organisationsOnly
                  ? 'Approved organisations and the courses they train'
                  : 'Approved freelancers and organisations with their courses and programs'}
              </caption>
              <TableHeader className='bg-muted/40'>
                <TableRow className='hover:bg-transparent'>
                  <TableHead scope='col' className={cn(HEADING, 'min-w-64')}>
                    {organisationsOnly ? 'Organisation' : 'Training partner'}
                  </TableHead>
                  {!organisationsOnly && (
                    <TableHead scope='col' className={HEADING}>
                      Type
                    </TableHead>
                  )}
                  <TableHead scope='col' className={HEADING}>
                    {organisationsOnly ? 'Courses' : 'Courses & programs'}
                  </TableHead>
                  <TableHead scope='col' className={HEADING}>
                    Status
                  </TableHead>
                  <TableHead scope='col' className={cn(HEADING, 'text-right')}>
                    <span className='sr-only'>Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={organisationsOnly ? 4 : 5} className='whitespace-normal'>
                      <EmptyState
                        variant='plain'
                        icon={Search}
                        title={`No ${label}s match your search`}
                        description='Try another name or course title, or load more approvals.'
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(row => {
                    const isOrganisation = row.type === 'organisation';
                    const Icon = isOrganisation ? Building2 : GraduationCap;
                    const shown = row.offerings.slice(0, VISIBLE_OFFERINGS);
                    const hidden = row.offerings.length - shown.length;
                    return (
                      <TableRow
                        key={`${row.type}-${row.uuid}`}
                        className='hover:bg-muted/30 focus-within:bg-muted/30 cursor-pointer'
                        onClick={event => {
                          if (event.target instanceof Element && event.target.closest('a, button'))
                            return;
                          if (window.getSelection()?.toString()) return;
                          router.push(row.href);
                        }}
                      >
                        <TableHead scope='row' className='px-4 py-4 font-normal'>
                          <div className='flex items-center gap-3'>
                            <span
                              aria-hidden
                              className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'
                            >
                              <Icon className='size-4' />
                            </span>
                            <div className='min-w-0'>
                              <Link
                                href={row.href}
                                title={row.name}
                                className='hover:text-primary focus-visible:ring-ring block max-w-64 truncate rounded-sm text-sm font-semibold focus-visible:ring-2'
                              >
                                {row.name}
                              </Link>
                              {row.subtitle && (
                                <p
                                  className='text-muted-foreground mt-0.5 flex max-w-72 items-center gap-1 text-xs'
                                  title={row.subtitle}
                                >
                                  {isOrganisation && (
                                    <MapPin aria-hidden className='size-3 shrink-0' />
                                  )}
                                  <span className='truncate'>{row.subtitle}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </TableHead>
                        {!organisationsOnly && (
                          <TableCell className='px-4 py-4'>
                            <Badge variant='outline'>
                              {isOrganisation ? 'Organisation' : 'Freelancer'}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className='w-full px-4 py-4 whitespace-normal'>
                          <div className='flex flex-wrap items-center gap-1.5'>
                            {shown.map(offering => (
                              <Badge
                                key={`${offering.kind}-${offering.uuid}`}
                                variant='secondary'
                                className='max-w-64 gap-1.5 rounded-md px-2 py-1 font-medium'
                                title={offering.name ?? undefined}
                              >
                                {!offering.name && (
                                  <CircleAlert
                                    aria-hidden
                                    className='text-muted-foreground size-3.5 shrink-0'
                                  />
                                )}
                                <span
                                  className={cn(
                                    'truncate',
                                    !offering.name && 'text-muted-foreground italic'
                                  )}
                                >
                                  {!organisationsOnly &&
                                    `${offering.kind === 'course' ? 'Course' : 'Program'} · `}
                                  {offering.name || 'Title unavailable'}
                                </span>
                              </Badge>
                            ))}
                            {hidden > 0 && (
                              <span className='text-muted-foreground text-xs'>+{hidden} more</span>
                            )}
                            {row.offerings.length === 0 && (
                              <span className='text-muted-foreground text-sm'>No courses yet</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='px-4 py-4'>
                          <Badge
                            variant='secondary'
                            className='bg-primary/10 text-primary gap-1.5 rounded-full'
                          >
                            <span aria-hidden className='bg-primary size-1.5 rounded-full' />
                            Approved
                          </Badge>
                        </TableCell>
                        <TableCell className='px-4 py-4 text-right'>
                          <Link
                            href={row.href}
                            aria-label={
                              isOrganisation
                                ? `View ${row.name} and its instructors`
                                : `View ${row.name}'s details`
                            }
                            className='text-primary focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm text-sm font-medium whitespace-nowrap hover:underline focus-visible:ring-2'
                          >
                            {isOrganisation ? 'View instructors' : 'View details'}
                            <ArrowRight aria-hidden className='size-4' />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
      {isLoading && rows.length > 0 && (
        <p role='status' className='text-muted-foreground text-sm'>
          Loading remaining training partner details…
        </p>
      )}
      {sources
        .filter(source => (source.hasError && rows.length > 0) || source.hasNextPage)
        .map(source => {
          const sourceLabel = source.type === 'instructor' ? 'freelancer' : 'organisation';
          return (
            <div key={source.type} className='space-y-4'>
              {source.hasError && rows.length > 0 && (
                <EmptyState
                  variant='compact'
                  title={`Some ${sourceLabel} details could not be loaded`}
                  description='Available approvals are shown above. Missing titles are marked as unavailable.'
                  action={
                    <Button
                      variant='outline'
                      disabled={source.isFetching}
                      onClick={() => void source.refetch()}
                    >
                      {source.isFetching && <Spinner />}Retry {sourceLabel}s
                    </Button>
                  }
                />
              )}
              {source.hasNextPage && (
                <div className='flex justify-center'>
                  <Button
                    variant='outline'
                    disabled={source.isFetching}
                    onClick={() => void source.loadMore()}
                  >
                    {source.isFetchingNextPage && <Spinner />}Load more {sourceLabel} approvals
                  </Button>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
