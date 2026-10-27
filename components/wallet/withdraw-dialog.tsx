'use client';

import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatMoney } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { PayoutMethod, VerificationCode, Withdrawal } from '@/services/client/types.gen';
import { usePayoutMethods } from './payout-api';
import type { WalletScope } from './wallet-scope';
import { IN_FLIGHT, REVIEW_FLAG_LABELS, usePayoutRules, WAITING, withdrawalActions } from './withdrawal-api';

type Step = 'amount' | 'code' | 'result';
const POLL_MS = 3000;
const GIVE_UP_MS = 120_000;

const unlockText = (method: PayoutMethod) =>
  method.unlock_at
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Nairobi',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(method.unlock_at))
    : '';

/** Withdraw to M-Pesa: amount and number, the SMS code, then the outcome as M-Pesa reports it. */
export function WithdrawDialog({
  open,
  onOpenChange,
  scope,
  available,
  currency,
  onAddNumber,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: WalletScope;
  available: number;
  currency: string;
  /** Takes the user to Payout details to add a number. */
  onAddNumber: () => void;
  onChanged: () => void;
}) {
  const ids = { amount: useId(), code: useId() };
  const actions = withdrawalActions(scope);
  const { rules } = usePayoutRules(open);
  const { methods } = usePayoutMethods(scope, open);
  const verified = methods.filter(method => method.status === 'VERIFIED');
  const usable = verified.filter(method => !method.on_hold);
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [methodUuid, setMethodUuid] = useState('');
  const [code, setCode] = useState('');
  const [verification, setVerification] = useState<VerificationCode | undefined>();
  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const idempotencyKey = useRef('');
  const startedPolling = useRef(0);

  useEffect(() => {
    if (!open) return;
    setStep('amount');
    setAmount('');
    setCode('');
    setError('');
    setWithdrawal(null);
    setVerification(undefined);
    idempotencyKey.current = crypto.randomUUID();
  }, [open]);

  useEffect(() => {
    if (!open || methodUuid) return;
    const preferred = usable.find(method => method.is_default) ?? usable[0];
    if (preferred?.uuid) setMethodUuid(preferred.uuid);
  }, [open, usable, methodUuid]);

  useEffect(() => {
    if (step !== 'code') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  const status = withdrawal?.status ?? '';
  useEffect(() => {
    if (step !== 'result' || !withdrawal?.uuid || !IN_FLIGHT.has(status)) return;
    if (!startedPolling.current) startedPolling.current = Date.now();
    if (Date.now() - startedPolling.current > GIVE_UP_MS) return;
    const uuid = withdrawal.uuid;
    const timer = setTimeout(async () => {
      const result = await actions.get(uuid);
      if (result.data) {
        setWithdrawal(result.data);
        if (!IN_FLIGHT.has(result.data.status ?? '')) onChanged();
      }
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [step, withdrawal, status, actions, onChanged]);

  const value = Number(amount || 0);
  const fee = Number(rules?.earner_fee ?? 0);
  const net = Math.max(0, value - fee);
  const min = Number(rules?.min_amount ?? 0);
  const quick = useMemo(
    () =>
      [1000, 5000, Math.floor(available / 2), Math.floor(available)]
        .filter((v, i, all) => v >= Math.max(1, min) && v <= available && all.indexOf(v) === i)
        .slice(0, 4),
    [available, min]
  );
  const chosen = methods.find(method => method.uuid === methodUuid);
  const resendAt = verification?.resend_available_at ? new Date(verification.resend_available_at).getTime() : 0;
  const waitSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const start = async () => {
    setError('');
    if (!Number.isInteger(value) || value <= 0) return setError('Enter a whole number of shillings.');
    if (value > available) return setError(`You can withdraw up to ${formatMoney(available, currency)}.`);
    if (!methodUuid) return setError('Choose a number to send to.');
    setBusy(true);
    const result = await actions.request({ amount: value, payout_method_uuid: methodUuid, idempotency_key: idempotencyKey.current });
    setBusy(false);
    if (result.error || !result.data?.withdrawal) return setError(result.error ?? 'Could not start the withdrawal.');
    setWithdrawal(result.data.withdrawal);
    setVerification(result.data.verification);
    setStep('code');
  };

  const confirm = async () => {
    if (!withdrawal?.uuid) return;
    setError('');
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from the SMS.');
    setBusy(true);
    const result = await actions.confirm(withdrawal.uuid, code);
    setBusy(false);
    if (result.error || !result.data) return setError(result.error ?? 'Could not confirm the withdrawal.');
    startedPolling.current = 0;
    setWithdrawal(result.data);
    setStep('result');
    onChanged();
  };

  const resend = async () => {
    if (!withdrawal?.uuid) return;
    setError('');
    setBusy(true);
    const result = await actions.resend(withdrawal.uuid);
    setBusy(false);
    if (result.error) setError(result.error);
    else setVerification(result.data);
  };

  const close = (next: boolean) => {
    if (!next && withdrawal?.uuid && step === 'code') void actions.cancel(withdrawal.uuid);
    onOpenChange(next);
  };

  const lines: [string, string][] = [
    ['You withdraw', formatMoney(value, currency)],
    ['M-Pesa charge', fee > 0 ? formatMoney(fee, currency) : 'Free'],
    ['Arrives on M-Pesa', formatMoney(net, currency)],
    ['Left in wallet', formatMoney(Math.max(0, available - value), currency)],
  ];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg'>
        <DialogHeader className='px-6 pt-6 pb-4'>
          <p className='text-primary text-xs font-semibold tracking-wider uppercase'>
            {step === 'result' ? 'Submitted' : step === 'code' ? 'Step 2 of 2' : 'Step 1 of 2'}
          </p>
          <DialogTitle>Withdraw to M-Pesa</DialogTitle>
          <DialogDescription>Available {formatMoney(available, currency)}</DialogDescription>
        </DialogHeader>

        {step === 'amount' ? (
          usable.length === 0 ? (
            <div className='flex flex-col items-center gap-3 px-6 pt-2 pb-6 text-center'>
              <p className='font-semibold'>
                {verified.length ? 'Your number is on hold' : 'Add where to send your money'}
              </p>
              <p className='text-muted-foreground text-sm'>
                {verified.length && verified[0]
                  ? `For your safety, withdrawals to a just-added number unlock on ${unlockText(verified[0])} (EAT).`
                  : 'Add and verify an M-Pesa number first. It takes about a minute.'}
              </p>
              {verified.length ? null : (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onAddNumber();
                  }}
                >
                  Add M-Pesa number
                </Button>
              )}
            </div>
          ) : (
            <div className='min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-4'>
              <div className='space-y-2'>
                <Label htmlFor={ids.amount}>Amount ({currency})</Label>
                <Input
                  id={ids.amount}
                  inputMode='numeric'
                  placeholder='0'
                  value={amount}
                  onChange={event => setAmount(event.target.value.replace(/\D/g, ''))}
                  className='h-14 text-2xl font-bold'
                />
                <div className='flex flex-wrap gap-2'>
                  {quick.map(v => (
                    <Button key={v} type='button' size='sm' variant='outline' className='rounded-full' onClick={() => setAmount(String(v))}>
                      {v === Math.floor(available) ? 'All available' : formatMoney(v, currency)}
                    </Button>
                  ))}
                </div>
                {rules ? (
                  <p className='text-muted-foreground text-xs'>
                    From {formatMoney(rules.min_amount, currency)} to {formatMoney(rules.max_amount, currency)} at a time,
                    up to {formatMoney(rules.daily_limit, currency)} a day.
                  </p>
                ) : null}
              </div>
              <fieldset className='space-y-2'>
                <legend className='mb-2 text-sm font-medium'>Send to</legend>
                {verified.map(method => {
                  const disabled = Boolean(method.on_hold);
                  const selected = method.uuid === methodUuid;
                  return (
                    <label
                      key={method.uuid}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-3',
                        selected && 'border-primary bg-primary/5 ring-primary ring-1',
                        disabled && 'bg-muted/40 cursor-not-allowed opacity-70'
                      )}
                    >
                      <input
                        type='radio'
                        name='payout-method'
                        className='accent-primary size-4'
                        checked={selected}
                        disabled={disabled}
                        onChange={() => method.uuid && setMethodUuid(method.uuid)}
                      />
                      <span className='min-w-0 flex-1'>
                        <span className='block text-sm font-semibold'>M-Pesa · {method.label || 'Number'}</span>
                        <span className='font-mono text-xs'>{method.masked_msisdn}</span>
                      </span>
                      <Badge variant='outline' className='text-[11px]'>
                        {disabled ? `Unlocks ${unlockText(method)}` : method.is_default ? 'DEFAULT' : 'VERIFIED'}
                      </Badge>
                    </label>
                  );
                })}
              </fieldset>
              <dl className='divide-border/60 divide-y rounded-md border text-sm'>
                {lines.map(([label, v]) => (
                  <div key={label} className='flex justify-between gap-4 px-4 py-2.5'>
                    <dt className='text-muted-foreground'>{label}</dt>
                    <dd className='font-semibold tabular-nums'>{v}</dd>
                  </div>
                ))}
              </dl>
              {error ? <p className='text-destructive text-sm font-medium'>{error}</p> : null}
            </div>
          )
        ) : null}

        {step === 'code' ? (
          <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-4'>
            <dl className='divide-border/60 divide-y rounded-md border text-sm'>
              {(
                [
                  ['You withdraw', formatMoney(value, currency)],
                  ['M-Pesa charge', fee > 0 ? formatMoney(fee, currency) : 'Free'],
                  ['To', chosen?.masked_msisdn ?? ''],
                  ['Arrives on M-Pesa', formatMoney(net, currency)],
                ] as [string, string][]
              ).map(([label, v]) => (
                <div key={label} className='flex justify-between gap-4 px-4 py-2.5'>
                  <dt className='text-muted-foreground'>{label}</dt>
                  <dd className='font-semibold tabular-nums'>{v}</dd>
                </div>
              ))}
            </dl>
            <div className='space-y-2'>
              <Label htmlFor={ids.code}>Confirmation code</Label>
              <p className='text-muted-foreground text-sm'>
                We sent a 6-digit code by SMS to {verification?.sent_to ?? withdrawal?.masked_msisdn}. It expires in 10
                minutes.
              </p>
              <Input
                id={ids.code}
                inputMode='numeric'
                autoComplete='one-time-code'
                maxLength={6}
                placeholder='••••••'
                value={code}
                onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className='h-14 text-center font-mono text-2xl tracking-[0.5em]'
              />
              {error ? <p className='text-destructive text-sm font-medium'>{error}</p> : null}
              <Button variant='ghost' size='sm' disabled={busy || waitSeconds > 0} onClick={() => void resend()}>
                {waitSeconds > 0 ? `Resend code in ${waitSeconds}s` : 'Resend code'}
              </Button>
            </div>
            <p className='bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm'>
              The amount leaves your balance when you confirm. If M-Pesa can&apos;t complete it, it comes straight back.
            </p>
          </div>
        ) : null}

        {step === 'result' && withdrawal ? (
          <div className='flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-6 pt-2 pb-6 text-center'>
            {status === 'PAID' ? (
              <CheckCircle2 aria-hidden className='text-success size-14' />
            ) : status === 'FAILED' ? (
              <XCircle aria-hidden className='text-destructive size-14' />
            ) : WAITING.has(status) ? (
              <Clock aria-hidden className='text-warning size-14' />
            ) : (
              <Loader2 aria-hidden className='text-primary size-14 animate-spin' />
            )}
            <p className='text-2xl font-bold tabular-nums'>{formatMoney(withdrawal.net_amount, currency)}</p>
            <p className='font-semibold'>
              {status === 'PAID'
                ? `Sent to ${withdrawal.masked_msisdn}`
                : status === 'FAILED'
                  ? 'M-Pesa could not pay it; the money is back in your wallet'
                  : status === 'NEEDS_REVIEW'
                    ? 'Waiting for Elimika to approve it'
                    : status === 'AWAITING_SECOND_APPROVAL'
                      ? 'Waiting for another payout approver'
                      : 'Sending to M-Pesa…'}
            </p>
            <p className='text-muted-foreground text-sm'>
              {status === 'PAID'
                ? `M-Pesa receipt ${withdrawal.mpesa_receipt ?? ''}. Check your phone for the SMS.`
                : status === 'NEEDS_REVIEW'
                  ? `${(withdrawal.review_flags ?? []).map(flag => REVIEW_FLAG_LABELS[flag] ?? flag).join(', ')}. We will let you know when it is paid.`
                  : WAITING.has(status)
                    ? 'The money is held for this withdrawal until then.'
                    : status === 'FAILED'
                      ? withdrawal.failure_reason
                      : 'You can close this. We will let you know when it lands.'}
            </p>
            <p className='text-muted-foreground font-mono text-xs'>{withdrawal.reference}</p>
          </div>
        ) : null}

        <DialogFooter className='flex-row justify-end gap-2 border-t px-6 py-4'>
          {step === 'amount' && usable.length > 0 ? (
            <>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => void start()} disabled={busy || !amount}>
                {busy && <Spinner />}Continue
              </Button>
            </>
          ) : null}
          {step === 'code' ? (
            <>
              <Button
                variant='outline'
                onClick={() => {
                  // A changed amount or number is a new withdrawal: drop this one and start fresh.
                  if (withdrawal?.uuid) void actions.cancel(withdrawal.uuid);
                  idempotencyKey.current = crypto.randomUUID();
                  setWithdrawal(null);
                  setCode('');
                  setStep('amount');
                }}
              >
                Back
              </Button>
              <Button onClick={() => void confirm()} disabled={busy || code.length !== 6}>
                {busy && <Spinner />}Confirm withdrawal
              </Button>
            </>
          ) : null}
          {step === 'result' ? <Button onClick={() => onOpenChange(false)}>Done</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
