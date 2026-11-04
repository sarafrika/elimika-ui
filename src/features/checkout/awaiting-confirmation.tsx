'use client';

import { Check, Copy, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { statusToneClass } from '@/components/data-display/tone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  formatCountdown,
  MPESA_BUSINESS_NAME,
  MPESA_PAYBILL,
  maskMsisdn,
  PROMPT_LIFETIME_SECONDS,
  RESEND_AFTER_SECONDS,
} from './checkout-format';

/** Seconds since `since`, ticking once a second. */
function useElapsed(since: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return since ? Math.max(0, Math.floor((now - since) / 1000)) : 0;
}

function CopyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <div className={cn(surfaceTheme.cardMuted, 'flex items-center justify-between gap-3 px-3.5 py-3')}>
      <div className='min-w-0'>
        <div className='text-muted-foreground text-[11px] font-semibold'>{label}</div>
        <div className={cn('mt-0.5 truncate text-base font-bold tabular-nums', mono && 'font-mono font-semibold')}>
          {value}
        </div>
      </div>
      <Button
        type='button'
        size='sm'
        variant='outline'
        aria-label={`Copy ${label}`}
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => setCopied(true));
        }}
        className={cn(copied && statusToneClass.success)}
      >
        {copied ? <Check aria-hidden className='size-3.5' /> : <Copy aria-hidden className='size-3.5' />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

type StepState = 'done' | 'live' | 'todo';

function Step({ title, sub, state, last }: { title: string; sub: string; state: StepState; last?: boolean }) {
  return (
    <li className='flex gap-3'>
      <span className='flex flex-col items-center self-stretch'>
        <span
          className={cn(
            'relative flex size-[26px] items-center justify-center rounded-full border-[1.5px] text-xs font-extrabold text-primary-foreground',
            state === 'done' && 'border-success bg-success',
            state === 'live' && 'border-primary bg-primary',
            state === 'todo' && 'border-border bg-card'
          )}
        >
          {state === 'live' ? (
            <span aria-hidden className='bg-primary/30 absolute -inset-1.5 animate-ping rounded-full motion-reduce:animate-none' />
          ) : null}
          {state === 'done' ? <Check aria-hidden className='relative size-3.5' /> : null}
        </span>
        {last ? null : (
          <span aria-hidden className={cn('min-h-3.5 w-0.5 flex-1', state === 'done' ? 'bg-success' : 'bg-border')} />
        )}
      </span>
      <span className='flex min-w-0 flex-col gap-0.5 pt-0.5 pb-3.5'>
        <span className={cn('text-sm', state === 'live' ? 'font-bold' : 'font-semibold', state === 'todo' && 'text-muted-foreground')}>
          {title}
        </span>
        <span className='text-muted-foreground text-xs'>{sub}</span>
      </span>
    </li>
  );
}

/** "Approve the payment on your phone": shows what the prompt looks like and what happens next. */
export function AwaitingConfirmation({
  msisdn,
  amountLabel,
  orderNumber,
  promptSentAt,
  lastCheckedAt,
  resending,
  onResend,
  onChangeNumber,
}: {
  msisdn: string;
  amountLabel: string;
  orderNumber: string;
  promptSentAt: number | null;
  lastCheckedAt: number | null;
  resending: boolean;
  onResend: () => void;
  onChangeNumber: () => void;
}) {
  const elapsed = useElapsed(promptSentAt);
  const sinceCheck = useElapsed(lastCheckedAt);
  const left = Math.max(0, PROMPT_LIFETIME_SECONDS - elapsed);
  const canResend = !resending && elapsed >= RESEND_AFTER_SECONDS;
  const urgent = left <= 15;
  const sentClock = promptSentAt
    ? new Date(promptSentAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  return (
    <section aria-live='polite' className={cn(surfaceTheme.card, 'min-w-0 overflow-hidden')}>
      <div className='border-border/60 from-primary/10 via-primary/[0.03] to-card flex flex-wrap items-center gap-7 border-b bg-gradient-to-br px-6 py-6'>
        <div aria-hidden className='relative mx-auto h-[330px] w-[196px] shrink-0'>
          <span className='bg-primary/15 absolute top-1/2 left-1/2 size-44 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full [animation-duration:2s] motion-reduce:animate-none' />
          <div className='absolute inset-0 rounded-[34px] bg-[var(--el-neutral-950)] p-2.5 shadow-2xl'>
            <div className='flex h-full flex-col justify-center rounded-[26px] bg-gradient-to-b from-[var(--el-neutral-800)] to-[var(--el-neutral-900)] p-3.5'>
              <div className='flex flex-col gap-2.5 rounded-xl bg-[var(--el-neutral-0)] p-3 shadow-xl'>
                <div className='text-[10px] font-extrabold tracking-widest text-success'>M-PESA</div>
                <p className='text-[11px] leading-snug text-[var(--el-neutral-900)]'>
                  Do you want to pay <strong>{amountLabel}</strong> to <strong>{MPESA_BUSINESS_NAME}</strong>, account{' '}
                  <strong className='font-mono'>{orderNumber}</strong>?
                </p>
                <div className='flex h-6 items-center rounded-md border border-[var(--el-neutral-300)] px-2 text-[11px] tracking-[0.3em] text-[var(--el-neutral-500)]'>
                  ••••
                </div>
                <div className='flex justify-end gap-3.5 text-[11px] font-extrabold text-success'>
                  <span>CANCEL</span>
                  <span>SEND</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='flex min-w-0 flex-[1_1_280px] flex-col gap-3.5'>
          <div>
            <div className={surfaceTheme.sectionLabel}>Prompt expires in</div>
            <div className={cn('text-[56px] leading-none font-extrabold tracking-tight tabular-nums', urgent && 'text-warning')}>
              {formatCountdown(left)}
            </div>
          </div>
          <div aria-hidden className='bg-border h-2 overflow-hidden rounded-full'>
            <div
              className={cn('h-2 rounded-full transition-[width] duration-1000', urgent ? 'bg-warning' : 'bg-primary')}
              style={{ width: `${(left / PROMPT_LIFETIME_SECONDS) * 100}%` }}
            />
          </div>
          <ol className='mt-1 flex flex-col'>
            <Step title='Prompt sent' sub={`To ${maskMsisdn(msisdn)}${sentClock ? ` · ${sentClock}` : ''}`} state='done' />
            <Step title='Waiting for your PIN' sub='Open the M-Pesa prompt and enter your PIN' state='live' />
            <Step title='Confirming with M-Pesa' sub='Takes a few seconds once you approve' state='todo' />
            <Step title='Seat confirmed' sub='Receipt by SMS and email' state='todo' last />
          </ol>
        </div>
      </div>

      <div className='flex flex-col gap-4 px-6 py-5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className={surfaceTheme.sectionLabel}>Paying from the M-Pesa menu instead? Use these</div>
          <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', statusToneClass.success)}>
            <span className='relative inline-flex size-2'>
              <span aria-hidden className='bg-success/50 absolute -inset-1 animate-ping rounded-full motion-reduce:animate-none' />
              <span className='bg-success relative size-2 rounded-full' />
            </span>
            Live · checked {lastCheckedAt ? (sinceCheck < 1 ? 'just now' : `${sinceCheck} s ago`) : 'every 5 s'}
          </span>
        </div>
        <div className='grid gap-2.5 sm:grid-cols-3'>
          <CopyField label='PayBill' value={MPESA_PAYBILL} />
          <CopyField label='Account no.' value={orderNumber} mono />
          <CopyField label='Amount' value={amountLabel} />
        </div>
        <div className='flex flex-wrap gap-2.5'>
          <Button type='button' className='min-w-[200px] flex-1' disabled={!canResend} onClick={onResend}>
            {resending
              ? 'Sending a new prompt…'
              : canResend
                ? 'Send the prompt again'
                : `Send again in ${formatCountdown(RESEND_AFTER_SECONDS - elapsed)}`}
          </Button>
          <Button type='button' variant='outline' className='min-w-[160px] flex-1' onClick={onChangeNumber}>
            Use another number
          </Button>
        </div>
      </div>

      <details className='border-border/60 bg-muted/20 border-t px-6 py-3.5'>
        <summary className='flex min-h-8 cursor-pointer items-center gap-2 text-sm font-semibold'>
          <HelpCircle aria-hidden className='text-primary size-4' />
          Didn&apos;t get the prompt?
        </summary>
        <ul className='text-muted-foreground mt-2.5 mb-1 grid list-disc gap-1.5 pl-5 text-[13px]'>
          <li>Unlock your phone and keep it on — the prompt shows for about a minute.</li>
          <li>Check the number is a Safaricom line with M-Pesa.</li>
          <li>Still nothing? Send it again, or pay from Lipa na M-Pesa › Pay Bill using the details above.</li>
        </ul>
      </details>
    </section>
  );
}
