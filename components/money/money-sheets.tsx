'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { statusToneClass } from '@/components/data-display/tone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  getPaymentStatusOptions,
  payWithMpesaMutation,
  settleObligationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { formatAmount, maskMsisdn, normalizeMsisdn, RESEND_AFTER_SECONDS } from '@/src/features/checkout/checkout-format';
import { formatMoney, formatMoneyDate } from './format';
import type { ObligationLike, OrderLike } from './ledger';

const POLL_MS = 5000;
const GIVE_UP_MS = 120_000;

function Lines({ lines }: { lines: [string, string][] }) {
  return (
    <dl className='border-border/70 divide-border/60 divide-y rounded-md border text-sm'>
      {lines.map(([label, value]) => (
        <div key={label} className='flex justify-between gap-4 px-4 py-2.5'>
          <dt className='text-muted-foreground'>{label}</dt>
          <dd className='text-right font-semibold tabular-nums'>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** What was bought, for how much, and how it was paid. */
export function ReceiptSheet({ order, onOpenChange }: { order: OrderLike | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={!!order} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full gap-6 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Receipt · Order {order?.display_id}</SheetTitle>
          <SheetDescription>{formatMoneyDate(order?.created_at)}</SheetDescription>
        </SheetHeader>
        <div className='space-y-4 px-4'>
          <Lines
            lines={[
              ...(order?.items ?? []).map(item => [
                `${item.title ?? 'Class'} × ${item.quantity ?? 1}`,
                formatMoney(item.total, order?.currency_code),
              ] as [string, string]),
              ['Status', 'Paid'],
              ['Total', formatMoney(order?.total, order?.currency_code)],
            ]}
          />
          <p className='text-muted-foreground text-sm'>A copy of this receipt was emailed when the payment went through.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type PayState = 'idle' | 'waiting' | 'paid' | 'failed' | 'refused';

/** Seconds since `since`, ticking once a second while `active`. */
function useSecondsSince(since: number | null, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return since ? Math.max(0, Math.floor((now - since) / 1000)) : 0;
}

/**
 * "Finish paying": sends an M-Pesa prompt for an order still awaiting payment and waits for it to
 * clear. A right-side sheet on wide screens, a bottom sheet on phones.
 */
export function CompletePaymentSheet({
  order,
  onOpenChange,
  onPaid,
}: {
  order: OrderLike | null;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
}) {
  const phoneId = useId();
  const isMobile = useIsMobile();
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [state, setState] = useState<PayState>('idle');
  const [sentTo, setSentTo] = useState('');
  const [sentAt, setSentAt] = useState<number | null>(null);
  const pay = useMutation(payWithMpesaMutation());
  const status = useQuery({
    ...getPaymentStatusOptions({ path: { orderId: order?.id ?? 'unset' } }),
    enabled: state === 'waiting' && !!order?.id,
    refetchInterval: state === 'waiting' ? POLL_MS : false,
    gcTime: 0,
    retry: false,
  });
  const elapsed = useSecondsSince(sentAt, state === 'waiting');
  const amount = formatAmount(order?.total, order?.currency_code ?? 'KES');

  useEffect(() => {
    if (state !== 'waiting') return;
    // The server wraps the status in its ApiResponse envelope; the generated type omits it.
    const body = status.data as unknown as { data?: { status?: string }; status?: string } | undefined;
    const result = (body?.data?.status ?? body?.status)?.toUpperCase();
    if (result === 'SUCCESS' || result === 'CAPTURED') {
      setState('paid');
      toast.success('Payment received. Your seat is confirmed.');
      onPaid();
    } else if (result === 'REFUSED') {
      setState('refused');
      onPaid();
    } else if (result === 'FAILED' || result === 'CANCELLED' || result === 'CANCELED') {
      setState('failed');
    }
  }, [status.data, state, onPaid]);

  useEffect(() => {
    if (state !== 'waiting') return;
    const timer = setTimeout(() => setState('failed'), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const close = (open: boolean) => {
    if (!open) {
      setState('idle');
      setSentAt(null);
    }
    onOpenChange(open);
  };

  const send = (number: string | null) => {
    if (!order?.id) return;
    if (!number) {
      setPhoneError('Enter a Safaricom number, e.g. 0712 345 678');
      return;
    }
    setPhoneError(null);
    pay.mutate(
      { path: { orderId: order.id }, body: { phone_number: number } },
      {
        onSuccess: () => {
          setSentTo(number);
          setSentAt(Date.now());
          setState('waiting');
        },
        onError: () => toast.error('Could not send the M-Pesa prompt. Check the number and try again.'),
      }
    );
  };

  const canResend = !pay.isPending && elapsed >= RESEND_AFTER_SECONDS;
  const items = order?.items ?? [];

  return (
    <Sheet open={!!order} onOpenChange={close}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn('w-full gap-5 overflow-y-auto', isMobile ? 'max-h-[88dvh] rounded-t-2xl' : 'sm:max-w-md')}
      >
        <SheetHeader>
          <SheetTitle>Finish paying</SheetTitle>
          <SheetDescription>
            <span className='text-foreground font-mono font-semibold'>{order?.display_id}</span> · your seat stays held
            for a few minutes while you pay.
          </SheetDescription>
        </SheetHeader>

        <div className='flex flex-col gap-4 px-4'>
          <div className={cn(surfaceTheme.cardMuted, 'flex items-center justify-between gap-3 px-3.5 py-3 text-sm')}>
            <span className='min-w-0 truncate font-semibold'>
              {items.map(item => item.title).filter(Boolean).join(', ') || 'Class'}
            </span>
            <strong className='shrink-0 tabular-nums'>{amount}</strong>
          </div>

          {state === 'idle' || state === 'failed' ? (
            <div className='flex flex-col gap-3'>
              {state === 'failed' ? (
                <p role='alert' className={cn('rounded-md border px-3 py-2.5 text-sm', statusToneClass.warning)}>
                  The payment did not go through, and nothing was taken. Send the prompt again.
                </p>
              ) : null}
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor={phoneId}>M-Pesa phone number</Label>
                <div
                  className={cn(
                    'border-input focus-within:border-primary focus-within:ring-primary/20 flex h-11 items-stretch overflow-hidden rounded-md border focus-within:ring-[3px]',
                    phoneError && 'border-destructive'
                  )}
                >
                  <span className='bg-muted/50 text-muted-foreground flex items-center border-r px-3 text-sm font-semibold'>
                    +254
                  </span>
                  <input
                    id={phoneId}
                    type='tel'
                    inputMode='numeric'
                    autoComplete='tel-national'
                    placeholder='712 345 678'
                    value={phone}
                    onChange={event => setPhone(event.target.value)}
                    aria-invalid={Boolean(phoneError)}
                    className='min-w-0 flex-1 bg-transparent px-3 text-[15px] font-medium tabular-nums outline-none'
                  />
                </div>
                {phoneError ? <p className='text-destructive text-xs font-medium'>{phoneError}</p> : null}
              </div>
              <Button size='lg' onClick={() => send(normalizeMsisdn(phone))} disabled={pay.isPending}>
                {pay.isPending ? <Spinner className='size-4' /> : null}
                Send M-Pesa prompt · {amount}
              </Button>
            </div>
          ) : null}

          {state === 'waiting' ? (
            <div className='flex flex-col gap-3'>
              <div role='status' className={cn('flex items-center gap-3 rounded-md border p-3.5', statusToneClass.info)}>
                <span className='relative flex size-10 shrink-0 items-center justify-center'>
                  <span aria-hidden className='bg-primary/25 absolute inset-0 animate-ping rounded-full motion-reduce:animate-none' />
                  <Smartphone aria-hidden className='relative size-5' />
                </span>
                <div className='text-foreground text-sm'>
                  <strong>Check your phone</strong>
                  <div className='text-muted-foreground text-[13px]'>
                    PIN prompt sent to {maskMsisdn(sentTo)} · checking every 5 s
                  </div>
                </div>
              </div>
              <Button variant='outline' disabled={!canResend} onClick={() => send(sentTo)}>
                {canResend ? 'Send the prompt again' : `Send again in 0:${String(Math.max(0, RESEND_AFTER_SECONDS - elapsed)).padStart(2, '0')}`}
              </Button>
            </div>
          ) : null}

          {state === 'paid' ? (
            <div className={cn('flex flex-col gap-1 rounded-md border p-3.5', statusToneClass.success)}>
              <strong className='text-[15px]'>Paid — your seat is confirmed</strong>
              <span className='text-foreground text-[13px]'>Your receipt is on its way by SMS and email.</span>
            </div>
          ) : null}

          {state === 'refused' ? (
            <div role='alert' className={cn('flex flex-col gap-1 rounded-md border p-3.5', statusToneClass.destructive)}>
              <strong className='text-[15px]'>We have your payment — don&apos;t pay again</strong>
              <span className='text-foreground text-[13px]'>
                Your seat needs a check. We&apos;ll enrol or refund you within one working day.
              </span>
            </div>
          ) : null}

          {order?.id && (state === 'idle' || state === 'failed') ? (
            <Link href={`/dashboard/checkout?order=${order.id}`} className='text-primary text-sm font-semibold hover:underline'>
              Open full checkout
            </Link>
          ) : null}
        </div>

        <SheetFooter className='flex-row justify-end gap-2'>
          <Button variant={state === 'paid' || state === 'refused' ? 'default' : 'outline'} onClick={() => close(false)}>
            {state === 'paid' || state === 'refused' ? 'Done' : 'Close'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** An organisation records that it paid its instructor for a delivered session. */
export function RecordPaymentSheet({
  organisationUuid,
  obligation,
  title,
  onOpenChange,
  onRecorded,
}: {
  organisationUuid: string;
  obligation: ObligationLike | null;
  title: string;
  onOpenChange: (open: boolean) => void;
  onRecorded: () => void;
}) {
  const referenceId = useId();
  const [reference, setReference] = useState('');
  const settle = useMutation(settleObligationMutation());

  const record = () => {
    if (!obligation?.uuid || !reference.trim()) return;
    settle.mutate(
      {
        path: { organisationUuid, obligationUuid: obligation.uuid },
        body: { settlement_reference: reference.trim() },
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded. The instructor sees it as settled.');
          setReference('');
          onRecorded();
          onOpenChange(false);
        },
        onError: () => toast.error('Could not record the payment. Try again.'),
      }
    );
  };

  return (
    <Sheet open={!!obligation} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full gap-6 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Record payment</SheetTitle>
          <SheetDescription>{title}</SheetDescription>
        </SheetHeader>
        <div className='space-y-4 px-4'>
          <Lines
            lines={[
              ['Session', formatMoneyDate(obligation?.accrued_at)],
              ['Owed', formatMoney(obligation?.rate_amount, obligation?.currency_code)],
            ]}
          />
          <div className='space-y-2'>
            <Label htmlFor={referenceId}>Payment reference</Label>
            <Input
              id={referenceId}
              placeholder='e.g. the M-Pesa or bank reference'
              value={reference}
              onChange={event => setReference(event.target.value)}
            />
          </div>
          <p className='text-muted-foreground text-sm'>
            You pay the instructor directly; recording it here lets both of you see it settled.
          </p>
        </div>
        <SheetFooter className='flex-row justify-end gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={record} disabled={!reference.trim() || settle.isPending}>
            {settle.isPending ? <Spinner className='size-4' /> : null}
            Record payment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
