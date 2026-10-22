'use client';

import { CheckCircle2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import type { PayoutMethod, VerificationCode } from '@/services/client/types.gen';
import { payoutActions } from './payout-api';
import type { WalletScope } from './wallet-scope';

type Step = 'details' | 'code' | 'done';

/** Opening at the code step resumes a number that was added but never verified. */
export interface PendingMethod {
  method: PayoutMethod;
  verification?: VerificationCode;
}

/** Add an M-Pesa number: details, then the SMS code, then done. A right-side drawer like every flow. */
export function AddPayoutMethodSheet({
  open,
  onOpenChange,
  scope,
  ownerName,
  resume,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: WalletScope;
  /** Whose name the number must be registered in: the person, or the approver for an organisation. */
  ownerName: string;
  resume?: PendingMethod | null;
  onChanged: () => void;
}) {
  const ids = { phone: useId(), label: useId(), code: useId(), confirm: useId() };
  const actions = payoutActions(scope);
  const [step, setStep] = useState<Step>('details');
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<PendingMethod | null>(null);
  const [verified, setVerified] = useState<PayoutMethod | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    setPhone('');
    setLabel('');
    setConfirmed(false);
    setCode('');
    setError('');
    setVerified(null);
    setPending(resume ?? null);
    setStep(resume ? 'code' : 'details');
  }, [open, resume]);

  useEffect(() => {
    if (step !== 'code') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  const resendAt = pending?.verification?.resend_available_at
    ? new Date(pending.verification.resend_available_at).getTime()
    : 0;
  const waitSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const send = async () => {
    setError('');
    if (!confirmed) {
      setError('Confirm the number is registered in your name.');
      return;
    }
    setBusy(true);
    const result = await actions.add({ msisdn: phone, label: label || undefined, confirms_registered_name: true });
    setBusy(false);
    if (result.error || !result.data?.payout_method) {
      setError(result.error ?? 'Could not add the number.');
      return;
    }
    setPending({ method: result.data.payout_method, verification: result.data.verification });
    setStep('code');
    onChanged();
  };

  const resend = async () => {
    if (!pending?.method.uuid) return;
    setError('');
    setBusy(true);
    const result = await actions.resend(pending.method.uuid);
    setBusy(false);
    if (result.error) setError(result.error);
    else setPending({ ...pending, verification: result.data });
  };

  const verify = async () => {
    if (!pending?.method.uuid) return;
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the SMS.');
      return;
    }
    setBusy(true);
    const result = await actions.verify(pending.method.uuid, code);
    setBusy(false);
    if (result.error || !result.data) {
      setError(result.error ?? 'Could not verify the number.');
      return;
    }
    setVerified(result.data);
    setStep('done');
    onChanged();
  };

  const unlock = verified?.unlock_at
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Nairobi',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(verified.unlock_at))
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full gap-0 sm:max-w-md'>
        <SheetHeader>
          <p className='text-primary text-xs font-semibold tracking-wider uppercase'>
            {step === 'done' ? 'Done' : step === 'code' ? 'Step 2 of 2' : 'Step 1 of 2'}
          </p>
          <SheetTitle>Add M-Pesa number</SheetTitle>
          <SheetDescription>Withdrawals are sent to this number by M-Pesa.</SheetDescription>
        </SheetHeader>

        {step === 'details' ? (
          <div className='flex-1 space-y-5 overflow-y-auto px-4'>
            <div className='space-y-2'>
              <Label htmlFor={ids.phone}>M-Pesa phone number</Label>
              <div className='flex gap-2'>
                <span className='bg-muted flex h-10 items-center rounded-md border px-3 text-sm font-semibold'>+254</span>
                <Input
                  id={ids.phone}
                  inputMode='tel'
                  autoComplete='tel'
                  placeholder='712 345 678'
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                />
              </div>
              <p className='text-muted-foreground text-xs'>
                Safaricom numbers starting 07 or 01. You can paste 07…, 2547… or +2547….
              </p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor={ids.label}>
                Nickname <span className='text-muted-foreground font-normal'>(optional)</span>
              </Label>
              <Input
                id={ids.label}
                maxLength={40}
                placeholder='Personal'
                value={label}
                onChange={event => setLabel(event.target.value)}
              />
            </div>
            <div className='flex items-start gap-3'>
              <Checkbox id={ids.confirm} checked={confirmed} onCheckedChange={value => setConfirmed(value === true)} />
              <Label htmlFor={ids.confirm} className='leading-snug font-normal'>
                This number is registered in my name, <strong>{ownerName}</strong>.
              </Label>
            </div>
            {error ? <p className='text-destructive text-sm font-medium'>{error}</p> : null}
          </div>
        ) : null}

        {step === 'code' ? (
          <div className='flex-1 space-y-4 overflow-y-auto px-4'>
            <div className='space-y-2'>
              <Label htmlFor={ids.code}>Enter the code</Label>
              <p className='text-muted-foreground text-sm'>
                We sent a 6-digit code by SMS to{' '}
                <strong>{pending?.verification?.sent_to ?? pending?.method.masked_msisdn}</strong>. It expires in 10
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
            </div>
            {error ? <p className='text-destructive text-sm font-medium'>{error}</p> : null}
            <Button variant='ghost' size='sm' disabled={busy || waitSeconds > 0} onClick={() => void resend()}>
              {waitSeconds > 0 ? `Resend code in ${waitSeconds}s` : 'Resend code'}
            </Button>
          </div>
        ) : null}

        {step === 'done' ? (
          <div className='flex flex-1 flex-col items-center gap-2 overflow-y-auto px-4 pt-6 text-center'>
            <CheckCircle2 aria-hidden className='text-success size-14' />
            <p className='text-lg font-bold'>Number verified</p>
            <p className='font-mono'>{verified?.masked_msisdn}</p>
            <p className='text-muted-foreground max-w-xs text-sm'>
              {verified?.on_hold && unlock
                ? `For your safety, withdrawals to this number unlock on ${unlock} (EAT). We emailed you in case this wasn't you.`
                : 'You can withdraw to this number now.'}
            </p>
          </div>
        ) : null}

        <SheetFooter className='flex-row justify-end gap-2 border-t'>
          {step === 'details' ? (
            <>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => void send()} disabled={busy || !phone.trim()}>
                {busy && <Spinner />}Send code
              </Button>
            </>
          ) : null}
          {step === 'code' ? (
            <>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Finish later
              </Button>
              <Button onClick={() => void verify()} disabled={busy || code.length !== 6}>
                {busy && <Spinner />}Verify number
              </Button>
            </>
          ) : null}
          {step === 'done' ? <Button onClick={() => onOpenChange(false)}>Done</Button> : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
