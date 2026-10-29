'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

import type { ProgramSaveProgress } from '../program-save-state';

export function ProgramSavingOverlay({ progress }: { progress: ProgramSaveProgress | null }) {
  const activeStepRef = useRef<HTMLLIElement>(null);
  const currentIndex = progress?.steps.findIndex(step => step.key === progress.currentStep) ?? -1;
  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [progress?.currentStep]);

  return (
    <Dialog open={!!progress}>
      <DialogContent
        className='bg-card max-h-[85dvh] gap-6 overflow-y-auto rounded-2xl p-8 shadow-2xl sm:max-w-sm [&>button]:hidden'
        onEscapeKeyDown={event => event.preventDefault()}
        onInteractOutside={event => event.preventDefault()}
      >
        <div
          className='relative mx-auto flex h-16 w-16 items-center justify-center'
          aria-hidden='true'
        >
          <div className='border-primary absolute inset-0 animate-spin rounded-full border-2 border-t-transparent' />
          <Loader2 className='text-primary h-7 w-7 animate-spin' />
        </div>
        <DialogHeader className='text-center sm:text-center'>
          <DialogTitle>Saving program</DialogTitle>
          <DialogDescription>
            Your program details and changes are being saved. Please keep this page open.
          </DialogDescription>
        </DialogHeader>
        <div role='status' aria-live='polite' className='sr-only'>
          {progress?.steps[currentIndex]?.label}
        </div>
        <ol className='max-h-[45dvh] space-y-3 overflow-y-auto'>
          {progress?.steps.map((step, index) => {
            const isDone = index < currentIndex;
            const isActive = index === currentIndex;
            return (
              <li
                key={step.key}
                ref={isActive ? activeStepRef : undefined}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex items-start gap-3 transition-opacity duration-300',
                  isActive ? 'opacity-100' : isDone ? 'opacity-60' : 'opacity-25'
                )}
              >
                {isDone ? (
                  <CheckCircle2
                    className='text-success mt-0.5 h-4 w-4 shrink-0'
                    aria-hidden='true'
                  />
                ) : isActive ? (
                  <Loader2
                    className='text-primary mt-0.5 h-4 w-4 shrink-0 animate-spin'
                    aria-hidden='true'
                  />
                ) : (
                  <div
                    className='border-muted-foreground mt-0.5 h-4 w-4 shrink-0 rounded-full border-2'
                    aria-hidden='true'
                  />
                )}
                <span
                  className={cn(
                    'text-sm',
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  <span className='sr-only'>
                    {isDone ? 'Completed: ' : isActive ? 'In progress: ' : 'Pending: '}
                  </span>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
