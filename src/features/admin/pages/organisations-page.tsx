'use client';

import { Building2, MoreHorizontal, Pause, Play, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  DataTable,
  StatCard,
  StatCardSkeleton,
  StatusBadge,
  surfaceTheme,
} from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import type { Organisation } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FilterBar } from '../components/filter-bar';
import { SectionBoundary } from '../components/section-boundary';
import { useAdminStatistics } from '../hooks/use-admin-dashboard';
import { useSetOrganisationActive } from '../hooks/use-organisation-admin-actions';
import { useOrganisations } from '../hooks/use-organisations';
import { adminRoutes } from '../lib/admin-routes';
import { numberParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const searchParam = stringParam();
const verifiedParam = stringParam('any');
const activeParam = stringParam('any');
const pageParam = numberParam(0);

export function OrganisationsPage() {
  const router = useRouter();
  const [q] = useSearchState('q', searchParam);
  const [verified] = useSearchState('verified', verifiedParam);
  const [active] = useSearchState('active', activeParam);
  const [page, setPage] = useSearchState('page', pageParam);

  const [suspending, setSuspending] = useState<{ organisation: Organisation; next: boolean } | null>(
    null
  );

  const { statistics, query: statisticsQuery } = useAdminStatistics();
  const { organisations, totalRows, pageCount, query } = useOrganisations({
    q,
    verified,
    active,
    page,
  });
  const setActive = useSetOrganisationActive();

  const metrics = statistics?.organisation_metrics;

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Organisations'
          title='Organisations'
          description='Every training provider on Elimika, and where each one stands.'
        />

        <SectionBoundary
          label='the organisation counts'
          loading={statisticsQuery.isLoading}
          error={statisticsQuery.error}
          onRetry={statisticsQuery.refetch}
          skeleton={
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              {[0, 1, 2, 3].map(item => (
                <StatCardSkeleton key={item} />
              ))}
            </div>
          }
        >
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard
              label='Organisations'
              value={toNumber(metrics?.total_organisations)}
              icon={Building2}
            />
            <StatCard
              label='Awaiting verification'
              value={toNumber(metrics?.pending_approvals)}
              tone='warning'
              hint='Unverified, whether or not they asked'
            />
            <StatCard label='Active' value={toNumber(metrics?.active_organisations)} tone='success' />
            <StatCard
              label='Suspended'
              value={toNumber(metrics?.suspended_organisations)}
              tone='destructive'
            />
          </div>
        </SectionBoundary>

        <FilterBar
          values={{ q, verified, active }}
          searchPlaceholder='Search by name…'
          filters={[
            {
              key: 'verified',
              label: 'Verification',
              options: [
                { value: 'verified', label: 'Verified' },
                { value: 'unverified', label: 'Unverified' },
              ],
            },
            {
              key: 'active',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Suspended' },
              ],
            },
          ]}
        />

        <SectionBoundary
          label='the organisations'
          loading={query.isLoading && organisations.length === 0}
          error={query.error}
          onRetry={query.refetch}
          empty={!query.isLoading && organisations.length === 0}
          emptyTitle={q || verified !== 'any' || active !== 'any' ? 'Nothing matches' : 'No organisations yet'}
          emptyDescription={
            q || verified !== 'any' || active !== 'any'
              ? 'Try a different search or clear the filters.'
              : 'No training provider has registered yet.'
          }
        >
          <DataTable
            hideToolbar
            data={organisations}
            isLoading={query.isLoading}
            getRowId={row => row.uuid ?? row.slug ?? row.name}
            onRowClick={row => router.push(adminRoutes.organisation(row.uuid ?? ''))}
            serverPagination={{
              page,
              pageCount,
              totalRows,
              onPageChange: setPage,
            }}
            columns={[
              {
                id: 'organisation',
                header: 'Organisation',
                cell: ({ row }) => (
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-sm font-medium'>
                      {row.original.name}
                    </p>
                    <p className='text-muted-foreground truncate font-mono text-xs'>
                      {row.original.slug || '—'}
                    </p>
                  </div>
                ),
              },
              {
                id: 'location',
                header: 'Location',
                cell: ({ row }) => (
                  <span className='text-muted-foreground text-sm'>
                    {[row.original.location, row.original.country].filter(Boolean).join(', ') || '—'}
                  </span>
                ),
              },
              {
                id: 'verification',
                header: 'Verification',
                cell: ({ row }) => (
                  <div className='flex flex-col gap-1'>
                    <StatusBadge
                      label={row.original.admin_verified ? 'Verified' : 'Unverified'}
                      tone={row.original.admin_verified ? 'success' : 'warning'}
                    />
                    {!row.original.admin_verified && row.original.verification_requested_at ? (
                      <span className='text-muted-foreground text-xs'>
                        requested {formatDate(row.original.verification_requested_at)}
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => (
                  <StatusBadge status={row.original.active ? 'active' : 'suspended'} />
                ),
              },
              {
                id: 'registered',
                header: 'Registered',
                cell: ({ row }) => (
                  <span className='text-muted-foreground font-mono text-xs'>
                    {formatDate(row.original.created_date) || '—'}
                  </span>
                ),
              },
              {
                id: 'actions',
                header: '',
                cell: ({ row }) => (
                  <div className='flex justify-end'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8 rounded-md'
                          aria-label={`Actions for ${row.original.name}`}
                          onClick={event => event.stopPropagation()}
                        >
                          <MoreHorizontal className='size-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        onClick={event => event.stopPropagation()}
                        className='w-56'
                      >
                        <DropdownMenuItem
                          onClick={() => router.push(adminRoutes.organisation(row.original.uuid ?? ''))}
                        >
                          Open record
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              adminRoutes.organisation(row.original.uuid ?? '', 'verification')
                            )
                          }
                        >
                          <ShieldCheck className='mr-2 size-4' />
                          Review verification
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setSuspending({ organisation: row.original, next: !row.original.active })
                          }
                        >
                          {row.original.active ? (
                            <>
                              <Pause className='mr-2 size-4' />
                              Suspend
                            </>
                          ) : (
                            <>
                              <Play className='mr-2 size-4' />
                              Reactivate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ),
              },
            ]}
          />
        </SectionBoundary>
      </div>

      <ConfirmDialog
        open={suspending !== null}
        onOpenChange={open => {
          if (!open) setSuspending(null);
        }}
        action={suspending?.next ? 'reactivateOrganisation' : 'suspendOrganisation'}
        subject={{
          name: suspending?.organisation.name ?? '',
          confirmValue: suspending?.organisation.name ?? '',
        }}
        isPending={setActive.isPending}
        onConfirm={() => {
          if (!suspending) return;
          setActive.mutate(
            { organisation: suspending.organisation, active: suspending.next },
            { onSuccess: () => setSuspending(null) }
          );
        }}
      />
    </div>
  );
}
