'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import {
  getPaymentStatusOptions,
  payWithMpesaMutation,
  settleObligationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { formatMoney, formatMoneyDate } from './format';
import type { ObligationLike, OrderLike } from './ledger';

const POLL_MS = 4000;
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
          <SheetTitle>Receipt · Order #{order?.display_id}</SheetTitle>
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

type PayState = 'idle' | 'waiting' | 'paid' | 'failed';

/** Sends an M-Pesa prompt for an order still awaiting payment and waits for it to clear. */
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
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<PayState>('idle');
  const pay = useMutation(payWithMpesaMutation());
  const status = useQuery({
    ...getPaymentStatusOptions({ path: { orderId: order?.id ?? 'unset' } }),
    enabled: state === 'waiting' && !!order?.id,
    refetchInterval: state === 'waiting' ? POLL_MS : false,
    gcTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (state !== 'waiting') return;
    // The server wraps the status in its ApiResponse envelope; the generated type omits it.
    const body = status.data as unknown as { data?: { status?: string }; status?: string } | undefined;
    const result = (body?.data?.status ?? body?.status)?.toUpperCase();
    if (result === 'SUCCESS' || result === 'CAPTURED') {
      setState('paid');
      toast.success('Payment received. Your seat is confirmed.');
      onPaid();
    } else if (result === 'FAILED' || result === 'CANCELLED') {
      setState('failed');
    }
  }, [status.data, state, onPaid]);

  useEffect(() => {
    if (state !== 'waiting') return;
    const timer = setTimeout(() => setState('failed'), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const close = (open: boolean) => {
    if (!open) setState('idle');
    onOpenChange(open);
  };

  const send = () => {
    if (!order?.id || !phone.trim()) return;
    pay.mutate(
      { path: { orderId: order.id }, body: { phone_number: phone.trim() } },
      {
        onSuccess: () => setState('waiting'),
        onError: () => toast.error('Could not send the M-Pesa prompt. Check the number and try again.'),
      }
    );
  };

  return (
    <Sheet open={!!order} onOpenChange={close}>
      <SheetContent side='right' className='w-full gap-6 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Complete payment</SheetTitle>
          <SheetDescription>Order #{order?.display_id} · your seat stays held while you pay.</SheetDescription>
        </SheetHeader>
        <div className='space-y-4 px-4'>
          <Lines
            lines={[
              ['Class', (order?.items ?? []).map(item => item.title).join(', ')],
              ['Amount', formatMoney(order?.total, order?.currency_code)],
            ]}
          />
          <div className='space-y-2'>
            <Label htmlFor={phoneId}>M-Pesa number</Label>
            <Input
              id={phoneId}
              inputMode='tel'
              placeholder='0712 345 678'
              value={phone}
              onChange={event => setPhone(event.target.value)}
              disabled={state === 'waiting'}
            />
          </div>
          {state === 'waiting' ? (
            <p role='status' className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Spinner className='size-4' /> Check your phone and enter your M-Pesa PIN.
            </p>
          ) : null}
          {state === 'failed' ? (
            <p role='alert' className='text-destructive text-sm'>
              The payment did not go through. You can send the prompt again.
            </p>
          ) : null}
        </div>
        <SheetFooter className='flex-row justify-end gap-2'>
          <Button variant='outline' onClick={() => close(false)}>
            Cancel
          </Button>
          <Button onClick={send} disabled={!phone.trim() || pay.isPending || state === 'waiting'}>
            {pay.isPending ? <Spinner className='size-4' /> : null}
            Send M-Pesa prompt
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
