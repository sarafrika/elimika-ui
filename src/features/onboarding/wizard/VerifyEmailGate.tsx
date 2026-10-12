'use client';

import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import { resendRegistrationEmailMutation } from '@/services/client/@tanstack/react-query.gen';
import { type RegisterableDomain, requireApiSuccess } from '../lib/user-onboarding';
import { ROLE_COPY } from './wizard-model';

const RESEND_COOLDOWN_SECONDS = 60;

type Props = {
  email: string;
  domain: RegisterableDomain | '';
  stepsDone: number;
  stepsTotal: number;
  signingIn: boolean;
  onSignIn: () => void;
  onChangeEmail: () => void;
};

export function VerifyEmailGate({
  email,
  domain,
  stepsDone,
  stepsTotal,
  signingIn,
  onSignIn,
  onChangeEmail,
}: Props) {
  const resend = useMutation(resendRegistrationEmailMutation());
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    try {
      requireApiSuccess(await resend.mutateAsync({ body: { email } }));
      toast.success('A new link is on its way.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'Unable to resend the email. Please try again.'));
    }
  };

  const role = domain ? ROLE_COPY[domain] : null;
  const percent = Math.round((stepsDone / stepsTotal) * 100);
  const timer = `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`;

  return (
    <div aria-live='polite'>
      <div className='flex flex-col items-center gap-3.5 px-5 pt-10 pb-7 text-center sm:px-7'>
        <span className='bg-primary/10 text-primary relative grid size-16 place-items-center rounded-full'>
          <Mail className='size-7' />
          <span className='bg-success text-success-foreground border-card absolute -right-0.5 -bottom-0.5 grid size-[22px] place-items-center rounded-full border-2'>
            <CheckCircle2 className='size-3' />
          </span>
        </span>
        <h3 className='text-foreground text-xl font-bold'>Check your email to finish signing up</h3>
        <p className='text-muted-foreground max-w-[56ch] text-[15px]'>
          We have sent you a link to set your password. Once that is done, sign in to continue
          setting up your {role?.label ?? 'Elimika'} profile.
        </p>
        <span className='border-border bg-muted/40 inline-flex flex-wrap items-center justify-center gap-2.5 rounded-lg border px-3 py-2 text-sm'>
          <span className='font-mono'>{email}</span>
          <Button
            type='button'
            variant='link'
            className='h-auto p-0 text-sm'
            onClick={onChangeEmail}
          >
            Change email
          </Button>
        </span>
        <div className='mt-1 flex w-full flex-wrap justify-center gap-2.5'>
          <Button onClick={onSignIn} disabled={signingIn} className='w-full sm:w-auto'>
            {signingIn && <Spinner />}Sign in to continue
          </Button>
          <Button
            variant='outline'
            onClick={() => void handleResend()}
            disabled={cooldown > 0 || resend.isPending}
            className='w-full sm:w-auto'
          >
            {resend.isPending && <Spinner />}
            {cooldown > 0 ? (
              <>
                Resend link in <span className='font-mono'>{timer}</span>
              </>
            ) : (
              'Resend link'
            )}
          </Button>
        </div>
      </div>
      {role && (
        <div className='border-border bg-muted/40 mx-5 mb-6 space-y-4 rounded-xl border p-4 sm:mx-7'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <p className='text-foreground text-[15px] font-semibold'>You are almost there</p>
              <p className='text-muted-foreground text-sm'>
                {stepsDone} of {stepsTotal} steps done. The rest takes a few minutes.
              </p>
            </div>
            <div
              role='progressbar'
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label='Onboarding progress'
              className='bg-border h-2 w-full overflow-hidden rounded-full sm:w-56'
            >
              <div className='bg-primary h-full rounded-full' style={{ width: `${percent}%` }} />
            </div>
          </div>
          <ul className='grid gap-3 sm:grid-cols-3'>
            {role.perks.map(perk => (
              <li key={perk.title} className='flex gap-2.5'>
                <CheckCircle2 className='text-primary mt-0.5 size-4 shrink-0' />
                <span>
                  <span className='text-foreground block text-sm font-semibold'>{perk.title}</span>
                  <span className='text-muted-foreground text-xs'>{perk.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className='border-border grid border-t sm:grid-cols-3'>
        {[
          [
            "Can't find the email?",
            'Look in your spam or promotions folder. It is sent by Sarafrika.',
          ],
          ['Link expired?', 'Each link works for 72 hours. Use Resend link to get a new one.'],
          [
            'Using another device?',
            'You can continue anywhere. Your progress is saved to your account.',
          ],
        ].map(([title, detail]) => (
          <div
            key={title}
            className='border-border space-y-0.5 px-5 py-4 not-first:border-t sm:px-6 sm:not-first:border-t-0 sm:not-first:border-l'
          >
            <p className='text-foreground text-sm font-semibold'>{title}</p>
            <p className='text-muted-foreground text-xs'>{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
