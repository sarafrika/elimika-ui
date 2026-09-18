'use client';

import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';

/** Back, the reason Continue is blocked, and Continue (or the final action). */
export function StepFooter({
  onBack,
  backDisabled,
  blocker,
  nextLabel,
  nextDisabled,
  pending = false,
  onNext,
  finalIcon,
}: {
  onBack: () => void;
  backDisabled: boolean;
  blocker: string | null;
  nextLabel: string;
  nextDisabled: boolean;
  pending?: boolean;
  onNext?: () => void;
  finalIcon?: ReactNode;
}) {
  return (
    <div className='border-border/60 flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
      <Button type='button' variant='outline' onClick={onBack} disabled={backDisabled}>
        <ArrowLeft aria-hidden />
        Back
      </Button>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3'>
        {blocker ? (
          <p className='text-muted-foreground flex items-start gap-1.5 text-sm' role='status'>
            <Info className='mt-0.5 size-4 shrink-0' aria-hidden />
            {blocker}
          </p>
        ) : null}
        <Button
          type={onNext ? 'button' : 'submit'}
          onClick={onNext}
          disabled={nextDisabled || pending}
        >
          {pending ? <Spinner className='size-4' /> : null}
          {nextLabel}
          {finalIcon ?? <ArrowRight aria-hidden />}
        </Button>
      </div>
    </div>
  );
}
