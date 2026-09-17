import { cn } from '@/lib/utils';

import type { ReadinessTone } from '../job-readiness';
import { StatusTone, statusToneClass } from '@/components/data-display';

const TONES: Record<ReadinessTone, StatusTone> = {
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  muted: 'neutral',
  brand: 'info',
};

/** A job's readiness as a dotted pill, e.g. `<ReadinessChip {...jobReadiness(input)} />`. */
export function ReadinessChip({
  label,
  tone,
  className,
}: {
  label: string;
  tone: ReadinessTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6.5 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap',
        statusToneClass[TONES[tone]],
        className
      )}
    >
      <span aria-hidden className='size-1.5 shrink-0 rounded-full bg-current' />
      {label}
    </span>
  );
}
