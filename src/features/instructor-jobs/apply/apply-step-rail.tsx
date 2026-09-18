import { cn } from '@/lib/utils';

export const APPLY_STEPS = ['Availability', 'Your note', 'Review'] as const;

/** Three progress bars with their labels; the current step is marked for assistive tech. */
export function ApplyStepRail({ step }: { step: number }) {
  return (
    <ol aria-label='Application steps' className='grid grid-cols-3 gap-2'>
      {APPLY_STEPS.map((label, index) => {
        const number = index + 1;
        const state = number < step ? 'done' : number === step ? 'current' : 'todo';
        return (
          <li
            key={label}
            aria-current={state === 'current' ? 'step' : undefined}
            className='flex flex-col gap-2'
          >
            <span
              aria-hidden
              className={cn(
                'h-1.5 rounded-full',
                state === 'done' && 'bg-primary',
                state === 'current' && 'bg-primary/30 ring-primary ring-1 ring-inset',
                state === 'todo' && 'bg-muted'
              )}
            />
            <span
              className={cn(
                'text-sm font-semibold',
                state === 'todo' ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              {number}. {label}
              {state === 'done' ? <span className='sr-only'> (done)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
