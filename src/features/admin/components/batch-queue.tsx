'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatMoney } from '@/components/money/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { listAdminWithdrawalsOptions } from '@/services/client/@tanstack/react-query.gen';
import {
  fetchAllUnbatched,
  invalidatePayouts,
  payoutBatchActions,
  SELECT_ALL_LIMIT,
  usePayoutBatches,
} from '../hooks/use-payout-batches';
import { adminRoutes } from '../lib/admin-routes';
import { type BatchWithdrawal, sumAmounts } from '../lib/payout-batches';
import { SectionBoundary } from './section-boundary';
import { WithdrawalTable } from './withdrawal-table';

const PAGE_SIZE = 50;

type QueueMode =
  /** The payouts page: build a new batch or add to a draft. */
  | { kind: 'page' }
  /** A draft batch's "Add rows" dialog: add straight to that batch. */
  | { kind: 'add'; batchUuid: string; onAdded: () => void };

interface WaitingQueueProps {
  active: boolean;
  mode: QueueMode;
  hint?: ReactNode;
  rowActions?: (row: BatchWithdrawal) => ReactNode;
}

/**
 * Withdrawals waiting for a batch, with checkboxes. The selection survives paging, can
 * take every matching row at once, and is carried by a sticky bar with its count and total.
 */
export function WaitingQueue({ active, mode, hint, rowActions }: WaitingQueueProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Map<string, BatchWithdrawal>>(() => new Map());
  const [gathering, setGathering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pickDraft, setPickDraft] = useState(false);

  const query = useQuery({
    ...listAdminWithdrawalsOptions({
      query: {
        status: ['NEEDS_REVIEW'],
        unbatched: true,
        pageable: { page, size: PAGE_SIZE },
      } as never,
    }),
    enabled: active,
    refetchInterval: active ? 15_000 : false,
  });
  const rows = (query.data?.data?.content ?? []) as BatchWithdrawal[];
  const meta = query.data?.data?.metadata;
  const matching = Number(meta?.totalElements ?? rows.length);
  const totalPages = Number(meta?.totalPages ?? 1);

  // A row that left the queue (rejected, batched elsewhere) should not stay selected.
  useEffect(() => {
    if (!query.data || matching > 0) return;
    setSelected(new Map());
  }, [query.data, matching]);

  const ids = useMemo(() => new Set(selected.keys()), [selected]);
  const total = useMemo(
    () => sumAmounts([...selected.values()].map(row => row.amount)),
    [selected]
  );
  const pageAllSelected = rows.length > 0 && rows.every(row => ids.has(row.uuid ?? ''));

  const toggle = (row: BatchWithdrawal, checked: boolean) =>
    setSelected(previous => {
      const next = new Map(previous);
      if (checked) next.set(row.uuid ?? '', row);
      else next.delete(row.uuid ?? '');
      return next;
    });
  const togglePage = (checked: boolean) =>
    setSelected(previous => {
      const next = new Map(previous);
      for (const row of rows) {
        if (checked) next.set(row.uuid ?? '', row);
        else next.delete(row.uuid ?? '');
      }
      return next;
    });

  const selectAllMatching = async () => {
    setGathering(true);
    const { data, error } = await fetchAllUnbatched();
    setGathering(false);
    if (error) return toast.error(error);
    setSelected(new Map((data ?? []).map(row => [row.uuid ?? '', row])));
    if ((data?.length ?? 0) >= SELECT_ALL_LIMIT) {
      toast.info(`Selected the first ${SELECT_ALL_LIMIT}. Build a second batch for the rest.`);
    }
  };

  const done = async (batchUuid: string | undefined, message: string) => {
    toast.success(message);
    setSelected(new Map());
    await invalidatePayouts(queryClient);
    if (mode.kind === 'add') mode.onAdded();
    else if (batchUuid) router.push(adminRoutes.payoutBatch(batchUuid));
  };

  const create = async () => {
    setBusy(true);
    const { data, error } = await payoutBatchActions.create([...ids]);
    setBusy(false);
    if (error) return toast.error(error);
    await done(
      data?.uuid,
      `Draft batch created with ${ids.size} withdrawal${ids.size === 1 ? '' : 's'}`
    );
  };

  const addTo = async (batchUuid: string) => {
    setBusy(true);
    const { error } = await payoutBatchActions.addRows(batchUuid, [...ids]);
    setBusy(false);
    if (error) return toast.error(error);
    setPickDraft(false);
    await done(batchUuid, `Added ${ids.size} withdrawal${ids.size === 1 ? '' : 's'} to the batch`);
  };

  return (
    <div className='relative'>
      {hint ? <p className='text-muted-foreground border-b px-5 py-4 text-sm'>{hint}</p> : null}
      <SectionBoundary
        label='the withdrawals waiting for a batch'
        loading={query.isLoading && !query.data}
        error={query.error}
        onRetry={() => void query.refetch()}
        skeleton={<QueueSkeleton />}
        empty={rows.length === 0}
        emptyState={
          <EmptyState
            variant='compact'
            icon={Wallet}
            title='Nothing waiting for a batch'
            description='Confirmed withdrawals appear here until an admin puts them in a batch.'
          />
        }
      >
        {pageAllSelected && matching > ids.size ? (
          <div className='bg-primary/5 flex flex-wrap items-center justify-center gap-2 border-b px-5 py-2 text-sm'>
            <span>All {rows.length} on this page are selected.</span>
            <Button
              size='sm'
              variant='link'
              disabled={gathering}
              onClick={() => void selectAllMatching()}
            >
              {gathering && <Spinner />}Select all {Math.min(matching, SELECT_ALL_LIMIT)} waiting
            </Button>
          </div>
        ) : null}
        <WithdrawalTable
          rows={rows}
          caption='Withdrawals waiting for a batch'
          selected={ids}
          onToggle={toggle}
          onTogglePage={togglePage}
          hideBatch
          actions={rowActions}
        />
        {totalPages > 1 ? (
          <div className='flex items-center justify-between border-t px-5 py-3 text-sm'>
            <span className='text-muted-foreground'>
              Page {page + 1} of {totalPages} · {matching} waiting
            </span>
            <div className='flex gap-2'>
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
          </div>
        ) : null}
      </SectionBoundary>

      {ids.size > 0 ? (
        <div
          role='region'
          aria-label='Selection'
          className='bg-card sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t px-5 py-3 shadow-[0_-4px_12px_-8px_var(--color-border)]'
        >
          <p className='text-sm'>
            <span className='font-semibold'>{ids.size} selected</span>
            <span className='text-muted-foreground'> · </span>
            <span className='font-semibold tabular-nums'>{formatMoney(total)}</span>
          </p>
          <Button size='sm' variant='ghost' onClick={() => setSelected(new Map())}>
            Clear
          </Button>
          <div className='ml-auto flex flex-wrap gap-2'>
            {mode.kind === 'add' ? (
              <Button size='sm' disabled={busy} onClick={() => void addTo(mode.batchUuid)}>
                {busy && <Spinner />}
                <Plus aria-hidden className='size-4' />
                Add {ids.size} to this batch
              </Button>
            ) : (
              <>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={busy}
                  onClick={() => setPickDraft(true)}
                >
                  Add to draft batch…
                </Button>
                <Button size='sm' disabled={busy} onClick={() => void create()}>
                  {busy && <Spinner />}
                  <Layers aria-hidden className='size-4' />
                  Create batch
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}

      <DraftPicker
        open={pickDraft}
        onOpenChange={setPickDraft}
        count={ids.size}
        total={total}
        busy={busy}
        onPick={uuid => void addTo(uuid)}
      />
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className='space-y-2 p-5'>
      {[0, 1, 2, 3].map(row => (
        <Skeleton key={row} className='h-10 w-full' />
      ))}
    </div>
  );
}

/** Pick one of the open draft batches to add the selection to. */
function DraftPicker({
  open,
  onOpenChange,
  count,
  total,
  busy,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  total: number;
  busy: boolean;
  onPick: (batchUuid: string) => void;
}) {
  const drafts = usePayoutBatches(['DRAFT'], 0, 20, open);
  const rows = drafts.data?.content ?? [];
  const [choice, setChoice] = useState('');

  useEffect(() => {
    if (!open) setChoice('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-md sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle className='text-base'>Add to a draft batch</DialogTitle>
          <DialogDescription>
            {count} withdrawal{count === 1 ? '' : 's'} · {formatMoney(total)}
          </DialogDescription>
        </DialogHeader>
        <SectionBoundary
          label='the draft batches'
          loading={drafts.isLoading}
          error={drafts.error}
          onRetry={() => void drafts.refetch()}
          skeleton={<Skeleton className='h-24 w-full' />}
          empty={rows.length === 0}
          emptyState={
            <EmptyState
              variant='compact'
              icon={Layers}
              title='No draft batches'
              description='Create a batch from the selection instead.'
            />
          }
        >
          <fieldset className='max-h-72 space-y-2 overflow-y-auto'>
            <legend className='sr-only'>Draft batches</legend>
            {rows.map(batch => (
              <label
                key={batch.uuid}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm',
                  choice === batch.uuid && 'border-primary bg-primary/5 ring-primary ring-1'
                )}
              >
                <input
                  type='radio'
                  name='draft-batch'
                  className='accent-primary size-4'
                  checked={choice === batch.uuid}
                  onChange={() => setChoice(batch.uuid)}
                />
                <span className='flex-1'>
                  <span className='block font-semibold'>
                    {batch.row_count ?? 0} rows · {formatMoney(batch.total_amount)}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {batch.created_by_name ?? 'An admin'} · {formatDateTime(batch.created_date)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        </SectionBoundary>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button disabled={!choice || busy} onClick={() => onPick(choice)}>
            {busy && <Spinner />}Add to batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
