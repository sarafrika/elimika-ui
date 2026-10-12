'use client';

import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { WizardStep } from './wizard-model';

type FrameProps = {
  steps: WizardStep[];
  current: number;
  /** Small line above the card title, e.g. "Step 3 of 5 · Instructor". */
  kicker?: string;
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
};

export function OnboardingFrame({
  steps,
  current,
  kicker,
  title,
  description,
  aside,
  children,
}: FrameProps) {
  return (
    <div className='bg-muted/40 min-h-screen'>
      <div className='mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10'>
        <h1 className='text-foreground text-2xl font-bold tracking-tight'>User Onboarding</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Join Elimika with your Sarafrika account and set up the role you need.
        </p>
        <Stepper steps={steps} current={current} />
        <p className='text-muted-foreground -mt-3 mb-4 text-sm md:hidden'>
          Step {current + 1} of {steps.length} · {steps[current]?.label}
        </p>
        <section className='bg-card border-border rounded-xl border shadow-xs'>
          <div className='flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-6'>
            <div className='min-w-0'>
              <p className='text-primary text-xs font-semibold'>
                {kicker ?? `Step ${current + 1} of ${steps.length}`}
              </p>
              <h2 className='text-foreground mt-1 text-lg font-bold'>{title}</h2>
              {description && (
                <div className='text-muted-foreground mt-1 max-w-prose text-sm'>{description}</div>
              )}
            </div>
            {aside}
          </div>
          {children}
        </section>
        <Button asChild variant='link' className='mt-4 px-0'>
          <Link href='/'>Back home</Link>
        </Button>
      </div>
    </div>
  );
}

function Stepper({ steps, current }: { steps: WizardStep[]; current: number }) {
  return (
    <ol className='my-7 flex' aria-label='Onboarding progress'>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.label}
            aria-current={active ? 'step' : undefined}
            className='relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center'
          >
            {index > 0 && (
              <span
                aria-hidden='true'
                className={cn(
                  'absolute top-[17px] right-1/2 h-0.5 w-full',
                  done || active ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
            <span
              className={cn(
                'relative grid size-9 place-items-center rounded-full border-[1.5px]',
                done && 'border-primary bg-primary text-primary-foreground',
                active && 'border-primary bg-primary/10 text-primary ring-primary/10 ring-4',
                !done && !active && 'border-border bg-card text-muted-foreground'
              )}
            >
              {done ? <Check className='size-4' /> : <Icon className='size-4' />}
            </span>
            <span
              className={cn(
                'hidden px-1 text-xs font-semibold md:block',
                active
                  ? 'text-foreground'
                  : done
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/70'
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function StepBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-5 px-5 py-5 sm:px-7 sm:py-6', className)}>{children}</div>;
}

type FooterProps = {
  onBack?: () => void;
  backDisabled?: boolean;
  primaryLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  primaryDisabled?: boolean;
  primaryIcon?: ReactNode;
  /** Defaults to a submit button so Enter in a field advances. */
  onPrimary?: () => void;
};

export function StepFooter({
  onBack,
  backDisabled,
  primaryLabel,
  pendingLabel,
  pending,
  primaryDisabled,
  primaryIcon,
  onPrimary,
}: FooterProps) {
  return (
    <div className='border-border bg-muted/40 flex items-center justify-between gap-3 rounded-b-xl border-t px-5 py-4 sm:px-7'>
      <Button
        type='button'
        variant='outline'
        onClick={onBack}
        disabled={pending || backDisabled || !onBack}
        className='flex-1 sm:flex-none'
      >
        <ArrowLeft />
        Back
      </Button>
      <Button
        type={onPrimary ? 'button' : 'submit'}
        onClick={onPrimary}
        disabled={pending || primaryDisabled}
        className='flex-1 sm:flex-none'
      >
        {pending ? <Spinner /> : null}
        {pending ? (pendingLabel ?? 'Saving…') : primaryLabel}
        {!pending && (primaryIcon ?? <ArrowRight />)}
      </Button>
    </div>
  );
}

export function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className='text-success mt-1 inline-flex items-center gap-1.5 text-xs font-semibold'>
      <CheckCircle2 className='size-3.5' />
      Saved to your account
    </span>
  );
}

export function SummaryRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className='flex justify-between gap-4 py-3 text-sm'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='text-foreground text-right font-medium'>{value || '—'}</dd>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role='alert' className='text-destructive text-sm'>
      {message}
    </p>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role='alert' className='text-destructive px-5 pb-1 text-sm whitespace-pre-line sm:px-7'>
      {message}
    </p>
  );
}
