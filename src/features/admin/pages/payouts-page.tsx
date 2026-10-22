'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Wallet, XCircle } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/page-header';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { SectionTabPanel, SectionTabs, useSectionTab } from '@/components/data-display/section-tabs';
import { StatCard } from '@/components/data-display/stat-tile';
import { formatMoney, formatMoneyDate } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/components/wallet/payout-api';
import { REVIEW_FLAG_LABELS } from '@/components/wallet/withdrawal-api';
import { WithdrawalStatusBadge } from '@/components/wallet/withdrawals-panel';
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
import type { PayoutSettings, Withdrawal } from '@/services/client/types.gen';

const TABS = ['review', 'flight', 'paid', 'returned', 'rules'] as const;
type Tab = (typeof TABS)[number];
const STATUSES: Record<Exclude<Tab, 'rules'>, string[]> = {
  review: ['NEEDS_REVIEW', 'AWAITING_SECOND_APPROVAL'],
  flight: ['SENDING', 'PROCESSING'],
  paid: ['PAID'],
  returned: ['FAILED', 'REJECTED'],
};
const HINTS: Record<Exclude<Tab, 'rules'>, string> = {
  review: 'Flagged by the rules. Approving sends the money to M-Pesa at once; rejecting returns it to the earner’s wallet.',
  flight: 'With M-Pesa and waiting for Safaricom’s result. These are checked automatically every few seconds.',
  paid: 'Completed payouts with their M-Pesa receipts.',
  returned: 'M-Pesa failures and rejections. Every one has already been returned to the earner’s wallet.',
};
const PAGE = { pageable: { page: 0, size: 50 } };
const PAYOUT_IDS = new Set(['getPayoutSummary', 'listAdminWithdrawals', 'getPayoutSettings']);

/** The admin Payouts page: withdrawals that need a decision, those in flight, and the payout rules. */
export function PayoutsPage() {
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'review');
  const [open, setOpen] = useState<Withdrawal | null>(null);
  const summary = useQuery({ ...getPayoutSummaryOptions(), refetchInterval: 30_000 });
  const s = summary.data?.data;

  const refresh = () =>
    void queryClient.invalidateQueries({
      predicate: query => PAYOUT_IDS.has(String((query.queryKey[0] as { _id?: string } | undefined)?._id)),
    });

  const counts: Partial<Record<Tab, number>> = {
    review: s ? Number(s.needs_review_count ?? 0) : undefined,
    flight: s ? Number(s.in_flight_count ?? 0) : undefined,
  };

  return (
    <div className={cn(surfaceTheme.pageWide, 'space-y-5 py-4')}>
      <PageHeader
        eyebrow='Finance'
        title='Payouts'
        description='Withdrawals by instructors, course creators and organisations to M-Pesa. Most go out automatically; the ones the rules flag wait here for a decision.'
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
            {s?.float_reported_at ? `As M-Pesa reported it ${formatMoneyDate(s.float_reported_at)}` : 'Shown after the first payout'}
          </p>
        </div>
        <StatCard
          label='Needs review'
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
          { id: 'review', label: 'Needs review', count: counts.review ?? null },
          { id: 'flight', label: 'In progress', count: counts.flight ?? null },
          { id: 'paid', label: 'Paid' },
          { id: 'returned', label: 'Failed & rejected' },
          { id: 'rules', label: 'Rules' },
        ]}
        value={tab}
        onValueChange={setTab}
        hrefFor={hrefFor}
      >
        {(Object.keys(STATUSES) as Exclude<Tab, 'rules'>[]).map(key => (
          <SectionTabPanel key={key} value={key}>
            <WithdrawalQueue statuses={STATUSES[key]} hint={HINTS[key]} active={tab === key} onOpen={setOpen} />
          </SectionTabPanel>
        ))}
        <SectionTabPanel value='rules'>
          <RulesForm active={tab === 'rules'} onSaved={refresh} />
        </SectionTabPanel>
      </SectionTabs>
      <ReviewSheet withdrawal={open} onClose={() => setOpen(null)} onChanged={refresh} />
    </div>
  );
}

function WithdrawalQueue({
  statuses,
  hint,
  active,
  onOpen,
}: {
  statuses: string[];
  hint: string;
  active: boolean;
  onOpen: (w: Withdrawal) => void;
}) {
  const query = useQuery({
    ...listAdminWithdrawalsOptions({ query: { status: statuses, ...PAGE } as never }),
    enabled: active,
    refetchInterval: active ? 15_000 : false,
  });
  const rows: Withdrawal[] = query.data?.data?.content ?? [];
  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <p className='text-muted-foreground border-b px-5 py-4 text-sm'>{hint}</p>
      {query.isLoading ? (
        <Skeleton className='m-5 h-24' />
      ) : rows.length === 0 ? (
        <EmptyState variant='compact' icon={Wallet} title='Nothing here right now' description='New withdrawals appear here.' />
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[960px] text-sm'>
            <caption className='sr-only'>Withdrawals</caption>
            <thead className='bg-muted/40 text-muted-foreground text-left text-xs'>
              <tr>
                {['Earner', 'Reference', 'Amount', 'To M-Pesa', 'Requested', 'Flags', 'Status', ''].map(h => (
                  <th key={h} className='px-4 py-3 font-semibold'>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(w => (
                <tr key={w.uuid} className='hover:bg-muted/30 border-t'>
                  <td className='px-4 py-3'>
                    <div className='flex flex-col gap-1'>
                      <span className='font-semibold'>{w.requester_name ?? 'Earner'}</span>
                      <Badge variant='outline' className='self-start text-[10px]'>
                        {w.owner_type === 'ORGANISATION' ? 'Organisation' : 'Person'}
                      </Badge>
                    </div>
                  </td>
                  <td className='px-4 py-3 font-mono text-xs'>{w.reference}</td>
                  <td className='px-4 py-3 font-semibold tabular-nums'>{formatMoney(w.amount, w.currency_code)}</td>
                  <td className='px-4 py-3 font-mono text-xs'>{w.masked_msisdn}</td>
                  <td className='px-4 py-3'>{formatMoneyDate(w.created_date)}</td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap gap-1'>
                      {(w.review_flags ?? []).map(flag => (
                        <Badge key={flag} variant='outline' className='border-warning/40 bg-warning/10 text-[10px]'>
                          {REVIEW_FLAG_LABELS[flag] ?? flag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <WithdrawalStatusBadge status={w.status} />
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <Button size='sm' variant='ghost' onClick={() => onOpen(w)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ReviewSheet({
  withdrawal,
  onClose,
  onChanged,
}: {
  withdrawal: Withdrawal | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const reasonId = useId();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRejecting(false);
    setReason('');
    setError('');
  }, [withdrawal?.uuid]);

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
                ['Requested', formatMoneyDate(withdrawal.created_date)],
                ['Amount', formatMoney(withdrawal.amount, withdrawal.currency_code)],
                ['Arrives on M-Pesa', formatMoney(withdrawal.net_amount, withdrawal.currency_code)],
                ['To M-Pesa', withdrawal.masked_msisdn ?? ''],
                ['Name on account', withdrawal.requester_name ?? '—'],
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
                {status === 'NEEDS_REVIEW' ? (
                  <Button
                    disabled={busy}
                    onClick={() => void run(() => approveAdminWithdrawal({ path: { withdrawalUuid: uuid } }), 'Sent to M-Pesa')}
                  >
                    {busy && <Spinner />}
                    <ArrowUpRight aria-hidden className='size-4' />
                    Approve and send
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
  const current = query.data?.data;
  const [form, setForm] = useState<Record<string, string>>({});
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
