'use client';

import { AlertTriangle, CalendarDays, Check, Clock, ReceiptText, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { StatCard } from '@/components/data-display/stat-tile';
import { statusToneClass } from '@/components/data-display/tone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MPESA_PAYBILL } from './checkout-format';

/** "You're in": the moment worth celebrating, in the dashboard's own hero banner. */
export function PaidResult({
  firstName,
  classTitle,
  amountLabel,
  orderNumber,
  receiptEmail,
  classHref,
}: {
  firstName?: string | null;
  classTitle: string;
  amountLabel: string;
  orderNumber?: string | null;
  receiptEmail?: string | null;
  classHref: string;
}) {
  return (
    <div className='flex flex-col gap-5'>
      <section className='from-primary via-primary to-primary/70 text-primary-foreground relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-br px-7 py-7'>
        <span aria-hidden className='absolute -top-40 -right-20 size-[340px] rounded-full bg-primary-foreground/10' />
        <span aria-hidden className='absolute right-64 -bottom-28 size-44 rotate-[24deg] rounded-[44px] bg-primary-foreground/[0.07]' />
        <div className='relative flex min-w-0 flex-col gap-1.5'>
          <span className='text-primary-foreground/80 text-xs font-bold tracking-widest uppercase'>Payment confirmed</span>
          <h1 className='text-3xl font-extrabold tracking-tight'>You&apos;re in{firstName ? `, ${firstName}` : ''}!</h1>
          <p className='text-primary-foreground/90 text-[15px]'>Your seat in {classTitle} is confirmed.</p>
        </div>
        <div className='relative flex flex-wrap gap-2.5'>
          <Button asChild size='lg' className='bg-card text-primary hover:bg-card/90'>
            <Link href={classHref}>Go to my class</Link>
          </Button>
          <Button asChild size='lg' variant='outline' className='border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground'>
            <Link href='/dashboard/student/wallet'>View receipt</Link>
          </Button>
        </div>
      </section>

      <section aria-label='Receipt' className={surfaceTheme.statGrid}>
        <StatCard label='Paid' value={amountLabel} hint='via M-Pesa' icon={Check} tone='success' />
        <StatCard label='Order' value={<span className='font-mono text-lg'>{orderNumber ?? '—'}</span>} hint='Quote this to support' icon={ReceiptText} tone='info' />
        <StatCard label='Receipt' value='SMS + email' hint={receiptEmail ? `Sent to ${receiptEmail}` : 'On its way'} icon={Smartphone} tone='neutral' />
        <StatCard label='Next' value='Learning Hub' hint='Your sessions and join links' icon={CalendarDays} tone='warning' />
      </section>

      <section className={cn(surfaceTheme.cardPadded, 'flex max-w-3xl flex-col gap-1.5')}>
        <h2 className='mb-1.5 text-base font-semibold'>Before your first session</h2>
        {[
          { done: true, text: `Seat confirmed${receiptEmail ? ` and receipt sent to ${receiptEmail}` : ''}` },
          { done: false, text: 'Check what to bring on the class page' },
          { done: false, text: 'The join link opens in Learning Hub shortly before each session' },
        ].map((row, index) => (
          <div key={row.text} className='border-border/60 flex items-center gap-3 border-t py-2.5 text-sm'>
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                row.done ? statusToneClass.success : statusToneClass.neutral
              )}
            >
              {row.done ? <Check aria-hidden className='size-3.5' /> : index + 1}
            </span>
            <span className='flex-1'>{row.text}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

/** The prompt timed out or was cancelled: nothing was taken, the seat is still held. */
export function NotPaidResult({
  timedOut,
  orderNumber,
  amountLabel,
  resending,
  onResend,
  onChangeNumber,
}: {
  timedOut: boolean;
  orderNumber?: string | null;
  amountLabel: string;
  resending: boolean;
  onResend: () => void;
  onChangeNumber: () => void;
}) {
  return (
    <section aria-live='polite' className={cn(surfaceTheme.card, 'mx-auto w-full max-w-3xl overflow-hidden')}>
      <div className='border-warning/30 bg-warning/[0.06] flex items-center gap-3.5 border-b px-6 py-6'>
        <span className={cn('flex size-13 shrink-0 items-center justify-center rounded-xl border', statusToneClass.warning)}>
          <Clock aria-hidden className='size-6' />
        </span>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{timedOut ? 'We haven’t seen your payment yet' : 'M-Pesa didn’t complete the prompt'}</h1>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {timedOut
              ? 'If you entered your PIN, keep this page open: it confirms on its own the moment M-Pesa tells us.'
              : 'If money left your M-Pesa anyway, keep this page open: it confirms on its own. Otherwise send a new prompt.'}
          </p>
        </div>
      </div>
      <div className='flex flex-col gap-4 px-6 py-5'>
        <div className={cn(surfaceTheme.cardMuted, 'flex flex-wrap justify-between gap-2.5 px-3.5 py-3 text-sm')}>
          <span>Your seat is held for a few more minutes.</span>
          {orderNumber ? (
            <span className='font-mono text-[13px] font-semibold'>
              {orderNumber} · {amountLabel}
            </span>
          ) : null}
        </div>
        <div className='grid gap-2.5 sm:grid-cols-2'>
          <Button size='lg' onClick={onResend} disabled={resending}>
            {resending ? 'Sending…' : 'Send a new prompt'}
          </Button>
          <Button size='lg' variant='outline' onClick={onChangeNumber}>
            Use another number
          </Button>
        </div>
        {orderNumber ? (
          <details className={cn(surfaceTheme.cardMuted, 'px-3.5 py-3')}>
            <summary className='flex min-h-7 cursor-pointer items-center text-sm font-semibold'>
              Pay from your M-Pesa menu instead
            </summary>
            <ol className='mt-2.5 grid list-decimal gap-1.5 pl-5 text-sm'>
              <li>Lipa na M-Pesa › Pay Bill</li>
              <li>
                Business no. <strong className='tabular-nums'>{MPESA_PAYBILL}</strong>
              </li>
              <li>
                Account no. <strong className='font-mono'>{orderNumber}</strong>
              </li>
              <li>
                Amount <strong className='tabular-nums'>{amountLabel}</strong> — we confirm it here
              </li>
            </ol>
          </details>
        ) : null}
      </div>
    </section>
  );
}

/** M-Pesa collected the money but the seat could not be confirmed: never ask for it again. */
export function RefusedResult({ orderNumber, amountLabel }: { orderNumber?: string | null; amountLabel: string }) {
  return (
    <section role='alert' className={cn(surfaceTheme.card, 'border-destructive/30 mx-auto w-full max-w-3xl overflow-hidden')}>
      <div className='border-destructive/30 bg-destructive/[0.05] flex items-center gap-3.5 border-b px-6 py-6'>
        <span className={cn('flex size-13 shrink-0 items-center justify-center rounded-xl border', statusToneClass.destructive)}>
          <AlertTriangle aria-hidden className='size-6' />
        </span>
        <div>
          <h1 className='text-xl font-bold tracking-tight'>We have your payment — your seat needs a check</h1>
          <p className='text-muted-foreground mt-0.5 text-sm'>Please don&apos;t pay again. We&apos;ll enrol or refund you within one working day.</p>
        </div>
      </div>
      <dl className='grid grid-cols-[1fr_auto] gap-2.5 px-6 py-5 text-sm'>
        <dt className='text-muted-foreground'>Paid</dt>
        <dd className='font-bold tabular-nums'>{amountLabel}</dd>
        <dt className='text-muted-foreground'>Order</dt>
        <dd className='font-mono font-semibold'>{orderNumber ?? '—'}</dd>
      </dl>
      <div className='grid gap-2.5 px-6 pb-6 sm:grid-cols-2'>
        <Button asChild size='lg'>
          <a href='https://sarafrika.com/contact' target='_blank' rel='noreferrer'>Contact support</a>
        </Button>
        <Button asChild size='lg' variant='outline'>
          <Link href='/dashboard/student/wallet'>See it in Wallet</Link>
        </Button>
      </div>
    </section>
  );
}
