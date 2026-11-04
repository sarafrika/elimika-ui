'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Layers,
  Plus,
  Send,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/page-header';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { StatusBadge } from '@/components/data-display/status-badge';
import { formatMoney } from '@/components/money/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '@/context/profile-context';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { WaitingQueue } from '../components/batch-queue';
import { SectionBoundary } from '../components/section-boundary';
import { WalletFlagChips, WalletsCard, WalletsVerdict } from '../components/wallet-check';
import { WithdrawalTable } from '../components/withdrawal-table';
import { invalidatePayouts, payoutBatchActions, usePayoutBatch } from '../hooks/use-payout-batches';
import { adminRoutes } from '../lib/admin-routes';
import {
  approveBlockReason,
  BATCH_STATUS,
  batchGroupOf,
  batchProgress,
  canConfirmApproval,
  type FloatState,
  floatState,
  isBatchLive,
  type PayoutBatchDetail,
  plural,
  type WalletSummary,
  walletFlagsOf,
  walletSummary,
  withdrawalPurseLabel,
} from '../lib/payout-batches';

type Dialogs = 'add' | 'approve' | 'reject' | 'submit' | 'return' | 'cancel' | null;

/** One payout batch: what is in it, who did what, whether the float covers it, and the next step. */
export function PayoutBatchPage({ batchUuid }: { batchUuid: string }) {
  const query = usePayoutBatch(batchUuid);
  const batch = query.data;

  return (
    <div className={cn(surfaceTheme.pageWide, 'space-y-5 py-4')}>
      <Link
        href={adminRoutes.payouts('batches', { group: batchGroupOf(batch?.status) })}
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
      >
        <ArrowLeft aria-hidden className='size-4' />
        Payout batches
      </Link>
      <SectionBoundary
        label='this batch'
        loading={query.isLoading && !query.data}
        error={query.error}
        onRetry={() => void query.refetch()}
        errorTitle='Couldn’t load this batch'
        skeleton={
          <div className={surfaceTheme.pageStack}>
            <SectionCardSkeleton rows={2} />
            <SectionCardSkeleton rows={6} />
          </div>
        }
        empty={!batch}
        emptyState={
          <EmptyState
            icon={Layers}
            title='Batch not found'
            description='It may have been removed.'
          />
        }
      >
        {batch ? <BatchView batch={batch} onChanged={() => void query.refetch()} /> : null}
      </SectionBoundary>
    </div>
  );
}

function BatchView({ batch, onChanged }: { batch: PayoutBatchDetail; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const viewer = useUserProfile();
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const status = BATCH_STATUS[batch.status];
  const rows = batch.withdrawals ?? [];
  const progress = batchProgress(batch);
  const float = floatState(batch.total_amount, batch.payout_float);
  const wallets = walletSummary(batch, rows);
  const blocked = approveBlockReason(batch, float, viewer?.uuid);
  const started =
    batch.status === 'RELEASED' || batch.status === 'COMPLETED' || batch.status === 'PARTLY_FAILED';
  const finished = batch.status === 'COMPLETED' || batch.status === 'PARTLY_FAILED';
  const failedRows = rows.filter(row => row.status === 'FAILED' || row.status === 'REJECTED');

  const run = async (call: () => Promise<{ error?: string }>, success: string) => {
    setBusy(true);
    const { error } = await call();
    setBusy(false);
    if (error) {
      toast.error(error);
      // A refusal often means the batch moved under us, e.g. someone else approved it.
      onChanged();
      return false;
    }
    toast.success(success);
    setDialog(null);
    await invalidatePayouts(queryClient);
    return true;
  };

  const remove = async (withdrawalUuid: string) => {
    setRemoving(withdrawalUuid);
    await run(
      () => payoutBatchActions.removeRow(batch.uuid, withdrawalUuid),
      'Removed from the batch'
    );
    setRemoving(null);
  };

  const actions: ReactNode = (() => {
    switch (batch.status) {
      case 'DRAFT':
        return (
          <>
            <Button variant='ghost' onClick={() => setDialog('cancel')}>
              Cancel batch
            </Button>
            <Button variant='outline' onClick={() => setDialog('add')}>
              <Plus aria-hidden className='size-4' />
              Add rows
            </Button>
            <Button disabled={progress.total === 0} onClick={() => setDialog('submit')}>
              <Send aria-hidden className='size-4' />
              Submit for approval
            </Button>
          </>
        );
      case 'AWAITING_APPROVAL':
        return (
          <>
            <Button variant='ghost' onClick={() => setDialog('return')}>
              Return to draft
            </Button>
            <Button variant='outline' onClick={() => setDialog('reject')}>
              Reject
            </Button>
            <Button
              disabled={Boolean(blocked)}
              title={blocked ?? undefined}
              onClick={() => setDialog('approve')}
            >
              <CheckCircle2 aria-hidden className='size-4' />
              Approve and pay
            </Button>
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <div className='space-y-5'>
      <PageHeader
        eyebrow='Payout batch'
        title={`${formatMoney(batch.total_amount)} to ${plural(progress.total, 'earner')}`}
        description={
          <span className='inline-flex flex-wrap items-center gap-2'>
            <StatusBadge status={batch.status} tone={status?.tone} label={status?.label} />
            {isBatchLive(batch) ? (
              <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
                <Spinner /> Updating every few seconds
              </span>
            ) : null}
          </span>
        }
        actions={
          actions ? <div className='flex flex-wrap justify-end gap-2'>{actions}</div> : undefined
        }
      />

      {batch.status === 'AWAITING_APPROVAL' && blocked ? (
        <p className='border-warning/40 bg-warning/10 flex items-start gap-2 rounded-lg border p-3 text-sm'>
          <AlertTriangle aria-hidden className='mt-0.5 size-4 shrink-0' />
          {blocked}
        </p>
      ) : null}
      {batch.status === 'REJECTED' && batch.rejection_reason ? (
        <p className='border-destructive/40 bg-destructive/10 rounded-lg border p-3 text-sm'>
          <span className='font-semibold'>Rejected: </span>
          {batch.rejection_reason}
        </p>
      ) : null}

      <div className='flex flex-wrap items-stretch gap-5'>
        <FloatCard batch={batch} float={float} />
        <WalletsCard summary={wallets} />
        <Card className='min-w-0 flex-[1_1_320px]'>
          <CardHeader>
            <CardTitle className='text-base'>History</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className='divide-border/60 divide-y text-sm'>
              {(
                [
                  ['Made', batch.created_by_name, batch.created_date],
                  ['Submitted', batch.submitted_by_name, batch.submitted_at],
                  ['Approved', batch.approved_by_name, batch.approved_at],
                  ['Rejected', null, batch.rejected_at],
                  ['Sent to M-Pesa', null, batch.released_at],
                  ['Finished', null, batch.completed_at],
                ] as [string, string | null | undefined, string | null | undefined][]
              )
                .filter(([, , at]) => Boolean(at))
                .map(([label, who, at]) => (
                  <div key={label} className='flex justify-between gap-4 py-2'>
                    <dt className='text-muted-foreground'>{label}</dt>
                    <dd className='text-right'>
                      {who ? <span className='font-semibold'>{who} · </span> : null}
                      {formatDateTime(at)}
                    </dd>
                  </div>
                ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      {started ? (
        <ProgressCard batch={batch} finished={finished} failedCount={failedRows.length} />
      ) : null}

      {finished && failedRows.length > 0 ? (
        <Card className='gap-0 overflow-hidden py-0'>
          <CardHeader className='border-b py-4'>
            <CardTitle className='text-base'>Failed rows</CardTitle>
            <CardDescription>Each amount has been returned to the earner’s wallet.</CardDescription>
          </CardHeader>
          <WithdrawalTable
            rows={failedRows}
            caption='Failed withdrawals in this batch'
            hideBatch
            showOutcome
          />
        </Card>
      ) : null}

      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b py-4'>
          <CardTitle className='text-base'>
            {finished && failedRows.length > 0 ? 'Every row' : 'Withdrawals in this batch'}
          </CardTitle>
          <CardDescription>
            {plural(progress.total, 'row')} · {formatMoney(batch.total_amount)}
          </CardDescription>
        </CardHeader>
        {rows.length === 0 ? (
          <EmptyState
            variant='compact'
            icon={Layers}
            title='No withdrawals yet'
            description='Add rows from the withdrawals waiting for a batch.'
            action={
              batch.status === 'DRAFT' ? (
                <Button size='sm' variant='outline' onClick={() => setDialog('add')}>
                  Add rows
                </Button>
              ) : undefined
            }
          />
        ) : (
          <WithdrawalTable
            rows={rows}
            caption='Withdrawals in this batch'
            hideBatch
            showOutcome={started}
            actions={
              batch.status === 'DRAFT'
                ? row => (
                    <Button
                      size='sm'
                      variant='ghost'
                      disabled={removing === row.uuid}
                      onClick={() => void remove(row.uuid ?? '')}
                    >
                      {removing === row.uuid && <Spinner />}Remove
                    </Button>
                  )
                : undefined
            }
          />
        )}
      </Card>

      <Dialog open={dialog === 'add'} onOpenChange={open => setDialog(open ? 'add' : null)}>
        <DialogContent className='max-h-[90vh] overflow-y-auto rounded-md sm:max-w-[1100px]'>
          <DialogHeader>
            <DialogTitle className='text-base'>Add withdrawals to this batch</DialogTitle>
            <DialogDescription>
              Only withdrawals that are not already in a batch are listed.
            </DialogDescription>
          </DialogHeader>
          <WaitingQueue
            active={dialog === 'add'}
            mode={{ kind: 'add', batchUuid: batch.uuid, onAdded: () => setDialog(null) }}
          />
        </DialogContent>
      </Dialog>

      <ApproveDialog
        open={dialog === 'approve'}
        onOpenChange={open => setDialog(open ? 'approve' : null)}
        batch={batch}
        float={float}
        wallets={wallets}
        busy={busy}
        onApprove={(override, acknowledged) =>
          void run(
            () => payoutBatchActions.approve(batch.uuid, override, acknowledged),
            'Approved. The payouts are on their way.'
          )
        }
      />
      <RejectDialog
        open={dialog === 'reject'}
        onOpenChange={open => setDialog(open ? 'reject' : null)}
        busy={busy}
        onReject={reason =>
          void run(() => payoutBatchActions.reject(batch.uuid, reason), 'Batch rejected')
        }
      />
      <SimpleConfirm
        open={dialog === 'submit'}
        onOpenChange={open => setDialog(open ? 'submit' : null)}
        title='Submit this batch for approval?'
        body={`${plural(progress.total, 'withdrawal')}, ${formatMoney(batch.total_amount)}. Another admin must approve it before anything is paid. You can’t change the rows while it waits.`}
        confirmLabel='Submit for approval'
        busy={busy}
        onConfirm={() =>
          void run(() => payoutBatchActions.submit(batch.uuid), 'Submitted for approval')
        }
      />
      <SimpleConfirm
        open={dialog === 'return'}
        onOpenChange={open => setDialog(open ? 'return' : null)}
        title='Return this batch to draft?'
        body='It stops waiting for approval so its rows can be changed. It must be submitted again.'
        confirmLabel='Return to draft'
        busy={busy}
        onConfirm={() =>
          void run(() => payoutBatchActions.returnToDraft(batch.uuid), 'Returned to draft')
        }
      />
      <SimpleConfirm
        open={dialog === 'cancel'}
        onOpenChange={open => setDialog(open ? 'cancel' : null)}
        title='Cancel this batch?'
        body='Its withdrawals go back to waiting for a batch. Nothing is paid or refunded.'
        confirmLabel='Cancel batch'
        destructive
        busy={busy}
        onConfirm={() => void run(() => payoutBatchActions.cancel(batch.uuid), 'Batch cancelled')}
      />
    </div>
  );
}

/** Payout paybill float against the batch total. */
function FloatCard({ batch, float }: { batch: PayoutBatchDetail; float: FloatState }) {
  const atApproval = batch.float_at_approval;
  const decided = batch.status !== 'DRAFT' && batch.status !== 'AWAITING_APPROVAL';
  return (
    <Card className='min-w-0 flex-[1_1_320px]'>
      <CardHeader>
        <CardTitle className='text-base'>Payout float</CardTitle>
        <CardDescription>
          {batch.payout_float?.reported_at
            ? `As M-Pesa reported it ${formatDateTime(batch.payout_float.reported_at)}`
            : 'M-Pesa has not reported the payout paybill’s balance yet'}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <p className='text-muted-foreground text-xs'>Available to pay out</p>
            <p className='text-lg font-bold tabular-nums'>
              {float.kind === 'unknown' ? 'Unknown' : formatMoney(float.float)}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-xs'>This batch</p>
            <p className='text-lg font-bold tabular-nums'>{formatMoney(batch.total_amount)}</p>
          </div>
        </div>
        {decided ? (
          atApproval != null ? (
            <p className='text-muted-foreground'>Float when approved: {formatMoney(atApproval)}</p>
          ) : null
        ) : (
          <FloatVerdict float={float} />
        )}
      </CardContent>
    </Card>
  );
}

function FloatVerdict({ float }: { float: FloatState }) {
  if (float.kind === 'enough') {
    return (
      <p className='border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-md border p-2 font-medium'>
        <CheckCircle2 aria-hidden className='size-4' />
        Enough float · {formatMoney(float.spare)} to spare
      </p>
    );
  }
  if (float.kind === 'short') {
    return (
      <p className='border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border p-2 font-medium'>
        <XCircle aria-hidden className='size-4' />
        Short by {formatMoney(float.shortBy)}
      </p>
    );
  }
  return (
    <p className='border-warning/30 bg-warning/10 text-warning flex items-center gap-2 rounded-md border p-2 font-medium'>
      <HelpCircle aria-hidden className='size-4' />
      Float unknown · the approver must confirm it is enough
    </p>
  );
}

function ProgressCard({
  batch,
  finished,
  failedCount,
}: {
  batch: PayoutBatchDetail;
  finished: boolean;
  failedCount: number;
}) {
  const progress = batchProgress(batch);
  const settled = progress.paid + progress.failed;
  const percent = progress.total ? Math.round((settled / progress.total) * 100) : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>{finished ? 'Summary' : 'Paying out'}</CardTitle>
        <CardDescription>
          {finished
            ? failedCount > 0
              ? `${progress.paid} paid, ${progress.failed} failed. Failed amounts are back in the earners’ wallets.`
              : `All ${progress.paid} paid.`
            : `${settled} of ${progress.total} settled`}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <Progress value={percent} aria-label='Batch progress' />
        <div className='flex flex-wrap gap-x-6 gap-y-1 text-sm tabular-nums'>
          <span className='text-success font-semibold'>{progress.paid} paid</span>
          <span className={cn(progress.failed > 0 && 'text-destructive font-semibold')}>
            {progress.failed} failed
          </span>
          <span>{progress.inFlight} in flight</span>
          {progress.waiting > 0 ? (
            <span className='text-muted-foreground'>{progress.waiting} not sent yet</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ApproveDialog({
  open,
  onOpenChange,
  batch,
  float,
  wallets,
  busy,
  onApprove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: PayoutBatchDetail;
  float: FloatState;
  wallets: WalletSummary;
  busy: boolean;
  onApprove: (override: boolean, acknowledgedWallets: boolean) => void;
}) {
  const overrideId = useId();
  const walletsId = useId();
  const [override, setOverride] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    if (open) return;
    setOverride(false);
    setAcknowledged(false);
  }, [open]);
  const rows = batchProgress(batch).total;
  const walletIssues = wallets.kind === 'issues' ? wallets.issues : 0;
  const flagged = (batch.withdrawals ?? []).filter(row => walletFlagsOf(row).length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-md sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle className='text-base'>Approve and pay this batch?</DialogTitle>
          <DialogDescription>
            The money goes to M-Pesa straight away. This can’t be undone.
          </DialogDescription>
        </DialogHeader>
        <dl className='divide-border/60 divide-y rounded-md border text-sm'>
          {(
            [
              ['Withdrawals', String(rows)],
              ['Total', formatMoney(batch.total_amount)],
              ['Payout float', float.kind === 'unknown' ? 'Unknown' : formatMoney(float.float)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className='flex justify-between gap-4 px-4 py-2.5'>
              <dt className='text-muted-foreground'>{label}</dt>
              <dd className='font-semibold tabular-nums'>{value}</dd>
            </div>
          ))}
        </dl>
        <FloatVerdict float={float} />
        {float.kind === 'unknown' ? (
          <div className='flex items-start gap-2'>
            <Checkbox
              id={overrideId}
              checked={override}
              onCheckedChange={value => setOverride(value === true)}
              className='mt-0.5'
            />
            <Label htmlFor={overrideId} className='text-sm leading-snug font-normal'>
              I have checked the payout paybill and it has enough float for{' '}
              {formatMoney(batch.total_amount)}.
            </Label>
          </div>
        ) : null}
        <WalletsVerdict summary={wallets} />
        {walletIssues > 0 ? (
          <>
            {flagged.length > 0 ? (
              <ul
                aria-label='Wallet issues'
                className='divide-border/60 max-h-48 divide-y overflow-y-auto rounded-md border text-sm'
              >
                {flagged.map(row => (
                  <li
                    key={row.uuid}
                    className='flex flex-wrap items-center justify-between gap-2 px-4 py-2'
                  >
                    <span className='min-w-0'>
                      <span className='font-semibold'>{row.requester_name ?? 'Earner'}</span>
                      {withdrawalPurseLabel(row) ? (
                        <span className='text-muted-foreground text-xs'> · {withdrawalPurseLabel(row)}</span>
                      ) : null}
                      <span className='text-muted-foreground font-mono text-xs'>
                        {' '}
                        {row.reference}
                      </span>
                    </span>
                    <span className='flex flex-wrap gap-1'>
                      <WalletFlagChips flags={walletFlagsOf(row)} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className='flex items-start gap-2'>
              <Checkbox
                id={walletsId}
                checked={acknowledged}
                onCheckedChange={value => setAcknowledged(value === true)}
                className='mt-0.5'
              />
              <Label htmlFor={walletsId} className='text-sm leading-snug font-normal'>
                I’ve checked these wallets and they are safe to pay.
              </Label>
            </div>
          </>
        ) : null}
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            disabled={busy || !canConfirmApproval(float, override, walletIssues, acknowledged)}
            onClick={() => onApprove(override, walletIssues > 0 && acknowledged)}
          >
            {busy && <Spinner />}Approve and pay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MIN_REASON = 10;

function RejectDialog({
  open,
  onOpenChange,
  busy,
  onReject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onReject: (reason: string) => void;
}) {
  const reasonId = useId();
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (!open) setReason('');
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-md sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle className='text-base'>Reject this batch?</DialogTitle>
          <DialogDescription>
            Nothing is paid. The admin who made it sees your reason.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <Label htmlFor={reasonId}>Reason</Label>
          <Textarea
            id={reasonId}
            rows={4}
            value={reason}
            onChange={event => setReason(event.target.value)}
            placeholder='e.g. Two of these are for the same earner on the same day. Check them first.'
          />
          <p className='text-muted-foreground text-xs'>At least {MIN_REASON} characters.</p>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={busy}>
            Back
          </Button>
          <Button
            variant='destructive'
            disabled={busy || reason.trim().length < MIN_REASON}
            onClick={() => onReject(reason.trim())}
          >
            {busy && <Spinner />}Reject batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SimpleConfirm({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  destructive,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-md sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle className='text-base'>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={busy}>
            Back
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy && <Spinner />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
