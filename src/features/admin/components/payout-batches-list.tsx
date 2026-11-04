'use client';

import { Layers } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatusBadge } from '@/components/data-display/status-badge';
import { formatMoney } from '@/components/money/format';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchState } from '@/hooks/use-search-state';
import { formatDateTime } from '@/lib/date';
import { enumParam } from '@/lib/search-state';
import { cn } from '@/lib/utils';
import { usePayoutBatches } from '../hooks/use-payout-batches';
import { adminRoutes } from '../lib/admin-routes';
import {
  BATCH_GROUP_LABELS,
  BATCH_GROUP_STATUSES,
  BATCH_GROUPS,
  BATCH_STATUS,
  type BatchGroup,
  batchProgress,
  type PayoutBatch,
} from '../lib/payout-batches';
import { SectionBoundary } from './section-boundary';

const PAGE_SIZE = 25;
const groupParam = enumParam(BATCH_GROUPS, 'awaiting');

/** Payout batches, one status group at a time. */
export function PayoutBatchesList({ active }: { active: boolean }) {
  const [group, setGroup] = useSearchState('group', groupParam);
  const [page, setPage] = useState(0);
  const query = usePayoutBatches(BATCH_GROUP_STATUSES[group], page, PAGE_SIZE, active);
  const rows = query.data?.content ?? [];
  const totalPages = Number(query.data?.metadata?.totalPages ?? 1);

  const choose = (next: BatchGroup) => {
    setPage(0);
    setGroup(next);
  };

  return (
    <div>
      <div
        role='group'
        aria-label='Batch status'
        className='flex flex-wrap gap-2 border-b px-5 py-3'
      >
        {BATCH_GROUPS.map(id => (
          <Button
            key={id}
            size='sm'
            variant={group === id ? 'default' : 'outline'}
            aria-pressed={group === id}
            onClick={() => choose(id)}
          >
            {BATCH_GROUP_LABELS[id]}
          </Button>
        ))}
      </div>
      <SectionBoundary
        label='the payout batches'
        loading={query.isLoading && !query.data}
        error={query.error}
        onRetry={() => void query.refetch()}
        skeleton={
          <div className='space-y-2 p-5'>
            {[0, 1, 2].map(row => (
              <Skeleton key={row} className='h-10 w-full' />
            ))}
          </div>
        }
        empty={rows.length === 0}
        emptyState={
          <EmptyState
            variant='compact'
            icon={Layers}
            title={`No ${BATCH_GROUP_LABELS[group].toLowerCase()} batches`}
            description='Batches are built from the withdrawals waiting for a batch.'
          />
        }
      >
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[860px] text-sm'>
            <caption className='sr-only'>Payout batches: {BATCH_GROUP_LABELS[group]}</caption>
            <thead className='bg-muted/40 text-muted-foreground text-left text-xs'>
              <tr>
                {['Created', 'Rows', 'Total', 'Made by', 'Status', 'Progress', ''].map(h => (
                  <th key={h} className='px-4 py-3 font-semibold'>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(batch => (
                <BatchRow key={batch.uuid} batch={batch} />
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className='flex items-center justify-end gap-2 border-t px-5 py-3'>
            <Button
              size='sm'
              variant='outline'
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size='sm'
              variant='outline'
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </SectionBoundary>
    </div>
  );
}

function BatchRow({ batch }: { batch: PayoutBatch }) {
  const status = BATCH_STATUS[batch.status];
  const progress = batchProgress(batch);
  const started =
    batch.status === 'RELEASED' || batch.status === 'COMPLETED' || batch.status === 'PARTLY_FAILED';
  return (
    <tr className='hover:bg-muted/30 border-t'>
      <td className='px-4 py-3'>{formatDateTime(batch.created_date)}</td>
      <td className='px-4 py-3 tabular-nums'>{progress.total}</td>
      <td className='px-4 py-3 font-semibold tabular-nums'>{formatMoney(batch.total_amount)}</td>
      <td className='px-4 py-3'>{batch.created_by_name ?? '—'}</td>
      <td className='px-4 py-3'>
        <StatusBadge status={batch.status} tone={status?.tone} label={status?.label} />
      </td>
      <td className='px-4 py-3 text-xs'>
        {started ? (
          <span className='tabular-nums'>
            <span className='text-success font-semibold'>{progress.paid} paid</span>
            {' · '}
            <span className={cn(progress.failed > 0 && 'text-destructive font-semibold')}>
              {progress.failed} failed
            </span>
            {' · '}
            <span>{progress.inFlight} in flight</span>
          </span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        )}
      </td>
      <td className='px-4 py-3 text-right'>
        <Button asChild size='sm' variant='ghost'>
          <Link href={adminRoutes.payoutBatch(batch.uuid)}>Open</Link>
        </Button>
      </td>
    </tr>
  );
}
