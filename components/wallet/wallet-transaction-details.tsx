'use client';

import { Button } from '@/components/ui/button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { WalletTransaction } from '@/services/client/types.gen';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { transactionTypeLabel } from './wallet-labels';

function DetailRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value?: string | null;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    if (!value || !copyable) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      toast.error('Could not copy. Please select and copy the value manually.');
    }
  };

  return (
    <div
      className={cn(
        'border-border grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[138px_minmax(0,1fr)] sm:gap-3',
        copyable &&
        value &&
        'hover:bg-muted/50 -mx-2 cursor-pointer rounded-md px-2 transition-colors'
      )}
      onClick={() => void copy()}
      onKeyDown={(event) => {
        if (!copyable || !value) return;

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          void copy();
        }
      }}
      role={copyable && value ? 'button' : undefined}
      tabIndex={copyable && value ? 0 : undefined}
      aria-label={copyable && value ? `Copy ${label}: ${value}` : undefined}
    >
      <dt className='text-muted-foreground text-[13px]'>{label}</dt>

      <dd className='flex min-w-0 items-center justify-between gap-2 text-[13px]'>
        <span
          className={cn(
            'min-w-0 [overflow-wrap:anywhere]',
            !value && 'text-muted-foreground'
          )}
        >
          {value || 'None'}
        </span>

        {value && copyable && (
          <span className='text-muted-foreground flex shrink-0 items-center gap-1'>
            {copied && (
              <span className='text-success text-xs' aria-live='polite'>
                Copied
              </span>
            )}

            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-7'
              aria-label={`Copy ${label}`}
              title={`Copy ${label}`}
              onClick={(event) => {
                event.stopPropagation();
                void copy();
              }}
            >
              {copied ? (
                <Check className='size-3.5' />
              ) : (
                <Copy className='size-3.5' />
              )}
            </Button>
          </span>
        )}
      </dd>
    </div>
  );
}

export function WalletTransactionDetails({ txn }: { txn: WalletTransaction }) {
  const currency = txn.currency_code || 'KES';
  const credit = Number(txn.balance_after ?? 0) >= Number(txn.balance_before ?? 0);
  const money = (value?: number) =>
    value == null || !Number.isFinite(value)
      ? '—'
      : new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency,
        currencyDisplay: 'code',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

  const created = txn.created_date ? new Date(txn.created_date) : null;
  const when =
    created && Number.isFinite(created.getTime())
      ? created.toLocaleString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      })
      : 'Date unavailable';

  const descriptionMatch = /^(.*?)\s*\((\w+)\s+([0-9a-f-]{36})\)\s*$/i.exec(txn.description || '');
  const description = descriptionMatch
    ? descriptionMatch[1]
    : txn.description || transactionTypeLabel(txn.transaction_type);
  const referenceParts = (txn.reference || '').split(':');
  const splitReference = referenceParts.length === 2 && referenceParts.every(Boolean);

  return (
    <DialogContent className='bg-card max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-[520px]'>
      <DialogHeader className='gap-1 px-5 pt-5 pr-12 text-left sm:px-[22px] sm:pr-12'>
        <DialogTitle className='text-[15px] leading-normal'>Transaction details</DialogTitle>
        <DialogDescription className='text-xs tabular-nums'>{when}</DialogDescription>
      </DialogHeader>

      <section className='flex flex-col items-start gap-2 px-5 py-[22px] sm:px-[22px]'>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            credit ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}
        >
          <span aria-hidden='true' className='size-1.5 rounded-full bg-current' />
          {transactionTypeLabel(txn.transaction_type)}
        </span>
        <p
          className={cn(
            'text-3xl leading-tight font-semibold tracking-tight [overflow-wrap:anywhere] tabular-nums sm:text-4xl',
            credit ? 'text-success' : 'text-destructive'
          )}
        >
          <span className='sr-only'>{credit ? 'Credit: ' : 'Debit: '}</span>
          {txn.amount == null ? '—' : `${credit ? '+' : '−'}${money(Math.abs(txn.amount))}`}
        </p>
        <p className='text-muted-foreground text-sm [overflow-wrap:anywhere]'>{description}</p>
      </section>

      <section
        aria-label='Wallet balance change'
        className='border-border bg-muted/30 mx-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3.5 sm:mx-[22px]'
      >
        <div>
          <p className='text-muted-foreground text-xs'>Balance before</p>
          <p className='mt-0.5 text-[15px] font-semibold tabular-nums'>
            {money(txn.balance_before)}
          </p>
        </div>
        <ArrowRight aria-hidden='true' className='text-muted-foreground size-5 shrink-0' />
        <div>
          <p className='text-muted-foreground text-xs'>Balance after</p>
          <p
            className={cn(
              'mt-0.5 text-[15px] font-semibold tabular-nums',
              credit ? 'text-success' : 'text-destructive'
            )}
          >
            {money(txn.balance_after)}
          </p>
        </div>
      </section>

      <dl className='mx-5 mt-2 sm:mx-[22px]'>
        {descriptionMatch && (
          <DetailRow
            label={transactionTypeLabel(descriptionMatch[2])}
            value={descriptionMatch[3]}
            copyable
          />
        )}
        <DetailRow label='Transaction ID' value={txn.uuid} copyable />
        {splitReference ? (
          <>
            <DetailRow label='Order reference' value={referenceParts[0]} copyable />
            <DetailRow label='Payment reference' value={referenceParts[1]} copyable />
          </>
        ) : (
          <DetailRow label='Reference' value={txn.reference} copyable />
        )}
        <DetailRow label='Wallet ID' value={txn.wallet_uuid} copyable />
        <DetailRow label='Transfer reference' value={txn.transfer_reference} />
        <DetailRow label='Counterparty' value={txn.counterparty_user_uuid} />
      </dl>

      <DialogFooter className='flex-row justify-end px-5 pt-3.5 pb-5 sm:px-[22px]'>
        <DialogClose asChild>
          <Button type='button' variant='outline'>
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
