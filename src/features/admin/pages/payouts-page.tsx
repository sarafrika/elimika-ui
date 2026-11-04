'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Layers, Wallet, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/page-header';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { SectionTabPanel, SectionTabs, useSectionTab } from '@/components/data-display/section-tabs';
import { StatCard } from '@/components/data-display/stat-tile';
import { formatMoney } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/components/wallet/payout-api';
import { REVIEW_FLAG_LABELS } from '@/components/wallet/withdrawal-api';
import { WithdrawalStatusBadge } from '@/components/wallet/withdrawals-panel';
import { useSearchState } from '@/hooks/use-search-state';
import { enumParam } from '@/lib/search-state';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import {
  getPayoutSettingsOptions,
  getPayoutSummaryOptions,
  listAdminWithdrawalsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  approveAdminWithdrawal,
  checkAdminWithdrawal,
  rejectAdminWithdrawal,
  updatePayoutSettings,
} from '@/services/client/sdk.gen';
import type { PayoutSettings } from '@/services/client/types.gen';
import { WaitingQueue } from '../components/batch-queue';
import { PayoutBatchesList } from '../components/payout-batches-list';
import { SectionBoundary } from '../components/section-boundary';
import { WalletCheckBlock } from '../components/wallet-check';
import { WithdrawalTable } from '../components/withdrawal-table';
import { invalidatePayouts } from '../hooks/use-payout-batches';
import { adminRoutes } from '../lib/admin-routes';
import { type BatchWithdrawal, withdrawalPurseLabel } from '../lib/payout-batches';

/** Payout settings with the batch-era switch the generated type does not have yet. */
type PayoutSettingsWithApproval = PayoutSettings & { require_admin_approval?: boolean };

const TABS = ['review', 'batches', 'flight', 'paid', 'returned', 'rules'] as const;
type Tab = (typeof TABS)[number];
type ListTab = Exclude<Tab, 'review' | 'batches' | 'rules'>;
const STATUSES: Record<ListTab, string[]> = {
  flight: ['SENDING', 'PROCESSING'],
  paid: ['PAID'],
  returned: ['FAILED', 'REJECTED'],
};
const HINTS: Record<ListTab, string> = {
  flight: 'With M-Pesa and waiting for Safaricom’s result. These are checked automatically every few seconds.',
  paid: 'Completed payouts with their M-Pesa receipts.',
  returned: 'M-Pesa failures and rejections. Every one has already been returned to the earner’s wallet.',
};
const WAITING_STATUSES = ['NEEDS_REVIEW', 'AWAITING_SECOND_APPROVAL'];
const REVIEW_VIEWS = ['unbatched', 'all'] as const;
const reviewViewParam = enumParam(REVIEW_VIEWS, 'unbatched');
const PAGE = { pageable: { page: 0, size: 50 } };

/** The admin Payouts page: withdrawals that need a decision, those in flight, and the payout rules. */
export function PayoutsPage() {
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'review');
  const [open, setOpen] = useState<{ withdrawal: BatchWithdrawal; rejecting: boolean } | null>(null);
  const summary = useQuery({ ...getPayoutSummaryOptions(), refetchInterval: 30_000 });
  const s = summary.data?.data;

  const refresh = () => void invalidatePayouts(queryClient);
  const openRow = (withdrawal: BatchWithdrawal, rejecting = false) => setOpen({ withdrawal, rejecting });

  const counts: Partial<Record<Tab, number>> = {
    review: s ? Number(s.needs_review_count ?? 0) : undefined,
    flight: s ? Number(s.in_flight_count ?? 0) : undefined,
  };

  return (
    <div className={cn(surfaceTheme.pageWide, 'space-y-5 py-4')}>
      <PageHeader
        eyebrow='Finance'
        title='Payouts'
        description='Withdrawals by instructors, course creators and organisations to M-Pesa. Each one waits here until an admin puts it in a batch and a second admin approves the batch.'
      />
      {s && !s.payouts_configured ? (
        <div className='border-warning/40 bg-warning/10 flex items-start gap-2 rounded-lg border p-3 text-sm'>
          <AlertTriangle aria-hidden className='mt-0.5 size-4 shrink-0' />
          Payouts are not configured on this server: set the mpesa-service URL and payout shortcode before turning
          withdrawals on.
        </div>
      ) : null}
      <section aria-label='Summary' className={surfaceTheme.statGrid}>
        <div className='bg-primary text-primary-foreground flex flex-col gap-1 rounded-md p-5'>
          <p className='text-xs font-medium tracking-wide uppercase opacity-85'>M-Pesa payout float</p>
          <div className='text-2xl font-bold tabular-nums'>
            {summary.isLoading ? <Skeleton className='h-7 w-28' /> : s?.float_amount != null ? formatMoney(s.float_amount) : '—'}
          </div>
          <p className='text-xs opacity-85'>
            {s?.float_reported_at ? `As M-Pesa reported it ${formatDateTime(s.float_reported_at)}` : 'Shown after the first payout'}
          </p>
        </div>
        <StatCard
          label='Waiting for approval'
          value={String(s?.needs_review_count ?? 0)}
          hint={`${formatMoney(s?.needs_review_amount ?? 0)} waiting`}
          icon={AlertTriangle}
          tone='warning'
        />
        <StatCard label='Paid out today' value={formatMoney(s?.paid_today_amount ?? 0)} icon={CheckCircle2} tone='success' />
        <StatCard label='Failed' value={String(s?.failed_count ?? 0)} hint='All returned to wallets' icon={XCircle} tone='destructive' />
      </section>
      <SectionTabs
        label='Payout sections'
        tabs={[
          { id: 'review', label: 'Waiting for a batch', count: counts.review ?? null },
          { id: 'batches', label: 'Batches' },
          { id: 'flight', label: 'In progress', count: counts.flight ?? null },
          { id: 'paid', label: 'Paid' },
          { id: 'returned', label: 'Failed & rejected' },
          { id: 'rules', label: 'Rules' },
        ]}
        value={tab}
        onValueChange={setTab}
        hrefFor={hrefFor}
      >
        <SectionTabPanel value='review'>
          <ReviewPanel active={tab === 'review'} onOpen={openRow} />
        </SectionTabPanel>
        <SectionTabPanel value='batches'>
          <Card className='gap-0 overflow-hidden py-0'>
            <PayoutBatchesList active={tab === 'batches'} />
          </Card>
        </SectionTabPanel>
        {(Object.keys(STATUSES) as ListTab[]).map(key => (
          <SectionTabPanel key={key} value={key}>
            <WithdrawalQueue statuses={STATUSES[key]} hint={HINTS[key]} active={tab === key} onOpen={openRow} />
          </SectionTabPanel>
        ))}
        <SectionTabPanel value='rules'>
          <RulesForm active={tab === 'rules'} onSaved={refresh} />
        </SectionTabPanel>
      </SectionTabs>
      <ReviewSheet
        withdrawal={open?.withdrawal ?? null}
        startRejecting={open?.rejecting ?? false}
        onClose={() => setOpen(null)}
        onChanged={refresh}
      />
    </div>
  );
}

/** Rows open to a decision: Open for the details, Reject straight from the row. */
function rowActions(onOpen: (w: BatchWithdrawal, rejecting?: boolean) => void) {
  return (w: BatchWithdrawal) => (
    <>
      {WAITING_STATUSES.includes(w.status ?? '') ? (
        <Button size='sm' variant='ghost' onClick={() => onOpen(w, true)}>
          Reject
        </Button>
      ) : null}
      <Button size='sm' variant='ghost' onClick={() => onOpen(w)}>
        Open
      </Button>
    </>
  );
}

/** Withdrawals waiting for an admin: those not yet in a batch, or every one still waiting. */
function ReviewPanel({ active, onOpen }: { active: boolean; onOpen: (w: BatchWithdrawal, rejecting?: boolean) => void }) {
  const [view, setView] = useSearchState('view', reviewViewParam);
  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <div role='group' aria-label='Which withdrawals' className='flex flex-wrap items-center gap-2 border-b px-5 py-3'>
        {(
          [
            ['unbatched', 'Not in a batch'],
            ['all', 'All waiting'],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size='sm' variant={view === id ? 'default' : 'outline'} aria-pressed={view === id} onClick={() => setView(id)}>
            {label}
          </Button>
        ))}
      </div>
      {view === 'unbatched' ? (
        <WaitingQueue
          active={active}
          mode={{ kind: 'page' }}
          hint='Every confirmed withdrawal waits here. Select rows to build a batch; another admin approves it before anything is paid. Rejecting returns the money to the earner’s wallet.'
          rowActions={rowActions(onOpen)}
        />
      ) : (
        <WithdrawalQueue
          bare
          statuses={WAITING_STATUSES}
          hint='Everything still waiting, including withdrawals already in a batch and organisation withdrawals waiting for their second approver.'
          active={active}
          onOpen={onOpen}
        />
      )}
    </Card>
  );
}

function WithdrawalQueue({
  statuses,
  hint,
  active,
  onOpen,
  bare,
}: {
  statuses: string[];
  hint: string;
  active: boolean;
  onOpen: (w: BatchWithdrawal, rejecting?: boolean) => void;
  /** Render without its own card, inside a panel that has one. */
  bare?: boolean;
}) {
  const query = useQuery({
    ...listAdminWithdrawalsOptions({ query: { status: statuses, ...PAGE } as never }),
    enabled: active,
    refetchInterval: active ? 15_000 : false,
  });
  const rows = (query.data?.data?.content ?? []) as BatchWithdrawal[];
  const body = (
    <>
      <p className='text-muted-foreground border-b px-5 py-4 text-sm'>{hint}</p>
      <SectionBoundary
        label='the withdrawals'
        loading={query.isLoading && !query.data}
        error={query.error}
        onRetry={() => void query.refetch()}
        skeleton={<Skeleton className='m-5 h-24' />}
        empty={rows.length === 0}
        emptyState={
          <EmptyState variant='compact' icon={Wallet} title='Nothing here right now' description='New withdrawals appear here.' />
        }
      >
        <WithdrawalTable rows={rows} caption='Withdrawals' actions={rowActions(onOpen)} />
      </SectionBoundary>
    </>
  );
  return bare ? body : <Card className='gap-0 overflow-hidden py-0'>{body}</Card>;
}

function ReviewSheet({
  withdrawal,
  startRejecting,
  onClose,
  onChanged,
}: {
  withdrawal: BatchWithdrawal | null;
  startRejecting: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const reasonId = useId();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRejecting(startRejecting);
    setReason('');
    setError('');
  }, [withdrawal?.uuid, startRejecting]);

  if (!withdrawal) return null;
  const uuid = withdrawal.uuid ?? '';
  const status = withdrawal.status ?? '';

  const run = async (call: () => Promise<{ error?: unknown }>, success: string) => {
    setBusy(true);
    const { error: failure } = await call();
    setBusy(false);
    if (failure) return setError(apiMessage(failure, 'That did not work. Try again.'));
    toast.success(success);
    onChanged();
    onClose();
  };

  return (
    <Sheet open onOpenChange={next => !next && onClose()}>
      <SheetContent side='right' className='w-full gap-0 sm:max-w-lg'>
        <SheetHeader>
          <p className='text-muted-foreground font-mono text-xs'>{withdrawal.reference}</p>
          <SheetTitle>
            {formatMoney(withdrawal.amount, withdrawal.currency_code)} to {withdrawal.requester_name ?? 'the earner'}
          </SheetTitle>
          <SheetDescription asChild>
            <div className='flex flex-wrap gap-2'>
              <WithdrawalStatusBadge status={status} />
              <Badge variant='outline' className='text-[11px]'>
                {withdrawal.owner_type === 'ORGANISATION' ? 'Organisation wallet' : 'Personal wallet'}
              </Badge>
              {withdrawalPurseLabel(withdrawal) ? (
                <Badge variant='outline' className='text-[11px]'>
                  {withdrawalPurseLabel(withdrawal)}
                </Badge>
              ) : null}
            </div>
          </SheetDescription>
        </SheetHeader>
        <div className='flex-1 space-y-4 overflow-y-auto px-4'>
          {withdrawal.review_flags?.length ? (
            <div className='border-warning/40 bg-warning/10 space-y-1 rounded-lg border p-3 text-sm'>
              <p className='font-semibold'>Why this is waiting</p>
              {withdrawal.review_flags.map(flag => (
                <p key={flag}>· {REVIEW_FLAG_LABELS[flag] ?? flag}</p>
              ))}
            </div>
          ) : null}
          {withdrawal.failure_reason || withdrawal.rejection_reason ? (
            <div className='border-destructive/40 bg-destructive/10 rounded-lg border p-3 text-sm'>
              {withdrawal.rejection_reason ?? withdrawal.failure_reason}
            </div>
          ) : null}
          <dl className='divide-border/60 divide-y rounded-md border text-sm'>
            {(
              [
                ['Requested', formatDateTime(withdrawal.created_date)],
                ['Confirmed', formatDateTime(withdrawal.confirmed_at)],
                ['Amount', formatMoney(withdrawal.amount, withdrawal.currency_code)],
                ['Arrives on M-Pesa', formatMoney(withdrawal.net_amount, withdrawal.currency_code)],
                ['To M-Pesa', withdrawal.masked_msisdn ?? ''],
                ['Name on account', withdrawal.requester_name ?? '—'],
                ['Paid from', withdrawalPurseLabel(withdrawal) ?? '—'],
                ['Name on M-Pesa', withdrawal.mpesa_recipient_name ?? 'Known after the first payout'],
                ['M-Pesa receipt', withdrawal.mpesa_receipt ?? '—'],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className='flex justify-between gap-4 px-4 py-2.5'>
                <dt className='text-muted-foreground'>{label}</dt>
                <dd className='text-right font-semibold tabular-nums'>{value}</dd>
              </div>
            ))}
          </dl>
          <WalletCheckBlock row={withdrawal} />
          {rejecting ? (
            <div className='space-y-2'>
              <Label htmlFor={reasonId}>Reason the earner will see</Label>
              <Textarea
                id={reasonId}
                rows={4}
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder='e.g. The name on this M-Pesa number does not match your profile. Add a number registered to you.'
              />
              <p className='text-muted-foreground text-xs'>The amount goes back to their wallet straight away.</p>
            </div>
          ) : null}
          {withdrawal.payout_batch_uuid ? (
            <Link
              href={adminRoutes.payoutBatch(withdrawal.payout_batch_uuid)}
              className='text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline'
            >
              <Layers aria-hidden className='size-4' />
              Open the batch it is in
            </Link>
          ) : null}
          {error ? <p className='text-destructive text-sm font-medium'>{error}</p> : null}
        </div>
        <SheetFooter className='flex-row flex-wrap justify-end gap-2 border-t'>
          {status === 'NEEDS_REVIEW' || status === 'AWAITING_SECOND_APPROVAL' ? (
            rejecting ? (
              <>
                <Button variant='outline' onClick={() => setRejecting(false)}>
                  Back
                </Button>
                <Button
                  variant='destructive'
                  disabled={busy || reason.trim().length < 10}
                  onClick={() =>
                    void run(() => rejectAdminWithdrawal({ path: { withdrawalUuid: uuid }, body: { reason: reason.trim() } }), 'Rejected and refunded')
                  }
                >
                  {busy && <Spinner />}Reject and refund
                </Button>
              </>
            ) : (
              <>
                <Button variant='outline' onClick={() => setRejecting(true)}>
                  Reject
                </Button>
                {status === 'NEEDS_REVIEW' && !withdrawal.payout_batch_uuid ? (
                  <Button
                    disabled={busy}
                    title='Puts it in a batch of its own; another admin approves the batch before it is paid.'
                    onClick={() =>
                      void run(
                        () => approveAdminWithdrawal({ path: { withdrawalUuid: uuid } }),
                        'Approved into a one-row batch. Another admin must approve it.'
                      )
                    }
                  >
                    {busy && <Spinner />}
                    <Layers aria-hidden className='size-4' />
                    Approve into its own batch
                  </Button>
                ) : null}
              </>
            )
          ) : null}
          {status === 'SENDING' || status === 'PROCESSING' ? (
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => void run(() => checkAdminWithdrawal({ path: { withdrawalUuid: uuid } }), 'Checked with M-Pesa')}
            >
              {busy && <Spinner />}Check with M-Pesa now
            </Button>
          ) : null}
          <Button variant='ghost' onClick={onClose}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const FIELDS: { key: keyof PayoutSettings; label: string; hint: string }[] = [
  { key: 'min_amount', label: 'Minimum withdrawal (KES)', hint: 'Smallest amount an earner can withdraw.' },
  { key: 'max_amount', label: 'Maximum per withdrawal (KES)', hint: 'Keep within the M-Pesa B2C per-transaction limit.' },
  { key: 'daily_limit', label: 'Daily limit per wallet (KES)', hint: 'Across all of one wallet’s withdrawals in a day.' },
  { key: 'review_limit', label: 'Review withdrawals above (KES)', hint: 'Larger amounts wait here for approval.' },
  {
    key: 'second_approval_limit',
    label: 'Second approver above (KES)',
    hint: 'Organisation withdrawals above this need another payout approver.',
  },
];

function RulesForm({ active, onSaved }: { active: boolean; onSaved: () => void }) {
  const query = useQuery({ ...getPayoutSettingsOptions(), enabled: active });
  const current = query.data?.data as PayoutSettingsWithApproval | undefined;
  const [form, setForm] = useState<Record<string, string>>({});
  const [requireApproval, setRequireApproval] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!current) return;
    setForm({
      min_amount: String(current.min_amount ?? ''),
      max_amount: String(current.max_amount ?? ''),
      daily_limit: String(current.daily_limit ?? ''),
      review_limit: String(current.review_limit ?? ''),
      second_approval_limit: String(current.second_approval_limit ?? ''),
      fee_payer: current.fee_payer ?? 'PLATFORM',
      earner_fee: String(current.earner_fee ?? '0'),
    });
    setRequireApproval(current.require_admin_approval ?? true);
  }, [current]);

  const save = async () => {
    setError('');
    setBusy(true);
    const n = (key: string) => Number(form[key] || 0);
    const { error: failure } = await updatePayoutSettings({
      body: {
        min_amount: n('min_amount'),
        max_amount: n('max_amount'),
        daily_limit: n('daily_limit'),
        review_limit: n('review_limit'),
        second_approval_limit: n('second_approval_limit'),
        fee_payer: form.fee_payer as PayoutSettings['fee_payer'],
        earner_fee: n('earner_fee'),
        require_admin_approval: requireApproval,
      } as never,
    });
    setBusy(false);
    if (failure) return setError(apiMessage(failure, 'Could not save the rules.'));
    toast.success('Rules saved. New withdrawals use them.');
    onSaved();
  };

  if (query.isLoading || !current) return <Skeleton className='h-64 w-full' />;

  return (
    <div className='flex flex-wrap items-start gap-5'>
      <Card className='min-w-0 flex-[2_1_520px]'>
        <CardHeader>
          <CardTitle className='text-base'>Withdrawal rules</CardTitle>
          <CardDescription>Apply to every wallet. Changes affect new withdrawals only.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid gap-4 sm:grid-cols-2'>
            {FIELDS.map(field => (
              <div key={field.key} className='space-y-1.5'>
                <Label htmlFor={`rule-${field.key}`}>{field.label}</Label>
                <Input
                  id={`rule-${field.key}`}
                  inputMode='numeric'
                  value={form[field.key] ?? ''}
                  onChange={event => setForm({ ...form, [field.key]: event.target.value.replace(/[^\d.]/g, '') })}
                />
                <p className='text-muted-foreground text-xs'>{field.hint}</p>
              </div>
            ))}
          </div>
          <fieldset className='space-y-2'>
            <legend className='mb-2 text-sm font-medium'>Who pays the M-Pesa transfer charge</legend>
            <div className='flex flex-wrap gap-3'>
              {[
                { id: 'PLATFORM', label: 'Elimika pays', hint: 'The earner receives the full amount.' },
                { id: 'EARNER', label: 'Earner pays', hint: 'A set fee comes off each withdrawal.' },
              ].map(option => (
                <label
                  key={option.id}
                  className={cn(
                    'flex flex-[1_1_200px] cursor-pointer items-start gap-3 rounded-xl border p-3',
                    form.fee_payer === option.id && 'border-primary bg-primary/5 ring-primary ring-1'
                  )}
                >
                  <input
                    type='radio'
                    name='fee-payer'
                    className='accent-primary mt-1 size-4'
                    checked={form.fee_payer === option.id}
                    onChange={() => setForm({ ...form, fee_payer: option.id })}
                  />
                  <span>
                    <span className='block text-sm font-semibold'>{option.label}</span>
                    <span className='text-muted-foreground text-xs'>{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {form.fee_payer === 'EARNER' ? (
              <div className='max-w-xs space-y-1.5 pt-2'>
                <Label htmlFor='rule-earner-fee'>Fee per withdrawal (KES)</Label>
                <Input
                  id='rule-earner-fee'
                  inputMode='numeric'
                  value={form.earner_fee ?? ''}
                  onChange={event => setForm({ ...form, earner_fee: event.target.value.replace(/[^\d.]/g, '') })}
                />
              </div>
            ) : null}
          </fieldset>
          <div className='flex items-start justify-between gap-4 rounded-xl border p-3'>
            <div className='space-y-0.5'>
              <Label htmlFor='rule-require-admin-approval' className='text-sm font-semibold'>
                Every withdrawal waits for admin approval
              </Label>
              <p className='text-muted-foreground text-xs'>
                Withdrawals are paid only through a payout batch that one admin builds and a different admin approves.
              </p>
            </div>
            <Switch
              id='rule-require-admin-approval'
              checked={requireApproval}
              onCheckedChange={setRequireApproval}
            />
          </div>
          {error ? <p className='text-destructive text-sm font-medium'>{error}</p> : null}
          <div className='flex justify-end'>
            <Button onClick={() => void save()} disabled={busy}>
              {busy && <Spinner />}Save rules
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className='min-w-0 flex-[1_1_300px]'>
        <CardHeader>
          <CardTitle className='text-base'>What sends a withdrawal to review</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          {[
            ['Above limit', `More than ${formatMoney(Number(form.review_limit || 0))}.`],
            ['First payout', 'The first withdrawal to a number, so its M-Pesa name is not yet known.'],
            ['Name mismatch', 'M-Pesa returned a name unlike the earner’s on an earlier payout.'],
          ].map(([tag, body]) => (
            <div key={tag} className='flex items-start gap-2'>
              <Badge variant='outline' className='border-warning/40 bg-warning/10 shrink-0 text-[10px]'>
                {tag}
              </Badge>
              <span className='text-muted-foreground'>{body}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
