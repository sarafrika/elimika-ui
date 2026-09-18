import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ProgressStep = { title: string; detail: string; done: boolean };

/** Done steps get a tick; the first unfinished one is current unless the job has closed. */
export function JobProgressSteps({ steps, closed }: { steps: ProgressStep[]; closed?: boolean }) {
  const currentIndex = closed ? -1 : steps.findIndex(step => !step.done);
  return (
    <div className='border-border/70 bg-card rounded-md border px-4 py-3.5 shadow-sm sm:px-5'>
      <ol className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        {steps.map((step, index) => {
          const current = index === currentIndex;
          return (
            <li key={step.title} className='flex min-w-0 items-center gap-2.5'>
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  step.done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : current
                      ? 'border-primary text-primary border-2'
                      : 'text-muted-foreground'
                )}
              >
                {step.done ? <Check className='h-3 w-3' /> : index + 1}
              </span>
              <div className='min-w-0'>
                <p
                  className={cn(
                    'truncate text-sm',
                    step.done || current ? 'font-semibold' : 'text-muted-foreground font-medium'
                  )}
                >
                  {step.title}
                </p>
                <p className='text-muted-foreground truncate text-xs'>{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
