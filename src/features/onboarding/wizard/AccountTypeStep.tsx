'use client';

import { CheckCircle2, Info, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingAccountType } from '../lib/user-onboarding';
import { ACCESS_LABEL, ACCOUNT_TYPE_OPTIONS, ROLE_COPY } from './wizard-model';

const ACCESS_TONE = {
  instant: 'bg-success/10 text-success',
  review: 'bg-primary/10 text-primary',
  invited: 'bg-warning/10 text-warning',
} as const;

type Props = {
  selected: OnboardingAccountType | '';
  onSelect: (type: OnboardingAccountType) => void;
  /** Domains the signed-in user already holds; they cannot be requested again. */
  held?: string[];
};

export function AccountTypeStep({ selected, onSelect, held = [] }: Props) {
  return (
    <div className='space-y-4'>
      <div
        role='radiogroup'
        aria-label='Account type'
        className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
      >
        {ACCOUNT_TYPE_OPTIONS.map(option => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          const isHeld = held.includes(option.id);
          return (
            <button
              key={option.id}
              type='button'
              role='radio'
              aria-checked={isSelected}
              disabled={isHeld}
              onClick={() => onSelect(option.id)}
              className={cn(
                'border-border bg-card flex h-full flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-colors',
                'hover:border-primary/40 focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
                'disabled:cursor-not-allowed disabled:opacity-60',
                isSelected && 'border-primary bg-primary/5'
              )}
            >
              <span className='flex w-full items-center justify-between'>
                <span
                  className={cn(
                    'bg-primary/10 text-primary grid size-9 place-items-center rounded-lg',
                    isSelected && 'bg-card'
                  )}
                >
                  <Icon className='size-[18px]' />
                </span>
                <span
                  className={cn(
                    'border-border grid size-5 place-items-center rounded-full border-[1.5px]',
                    isSelected && 'border-primary bg-primary text-primary-foreground'
                  )}
                >
                  {isSelected && <CheckCircle2 className='size-3.5' />}
                </span>
              </span>
              <span className='text-foreground text-[15px] font-bold'>{option.name}</span>
              <span className='text-muted-foreground text-xs leading-5'>{option.detail}</span>
              <span
                className={cn(
                  'mt-auto inline-flex h-[22px] items-center rounded-full px-2 text-[11.5px] font-semibold',
                  isHeld ? 'bg-muted text-muted-foreground' : ACCESS_TONE[option.access]
                )}
              >
                {isHeld ? 'Already on your account' : ACCESS_LABEL[option.access]}
              </span>
            </button>
          );
        })}
      </div>
      {selected === 'parent' ? (
        <div role='note' className='border-border bg-muted/40 flex gap-3.5 rounded-xl border p-4'>
          <span className='bg-card text-primary grid size-9 shrink-0 place-items-center rounded-lg'>
            <Info className='size-[18px]' />
          </span>
          <div className='text-sm'>
            <p className='text-foreground font-semibold'>
              Guardian access starts from your child&apos;s account
            </p>
            <p className='text-muted-foreground mt-0.5'>
              Elimika links every parent to a learner, so there is nothing to fill in here.
            </p>
            <ol className='text-muted-foreground mt-2 list-decimal space-y-0.5 pl-4'>
              <li>Your child adds your email as their guardian during their onboarding.</li>
              <li>We email you an invitation. Accept it to create or link your account.</li>
              <li>Already invited? Sign in to see your pending invitations.</li>
            </ol>
          </div>
        </div>
      ) : selected ? (
        <div role='note' className='border-border bg-muted/40 flex gap-3.5 rounded-xl border p-4'>
          <span className='bg-card text-primary grid size-9 shrink-0 place-items-center rounded-lg'>
            <Route className='size-[18px]' />
          </span>
          <p className='text-muted-foreground self-center text-sm'>{ROLE_COPY[selected].next}</p>
        </div>
      ) : null}
    </div>
  );
}
