import { cn } from '@/lib/utils';

import { ReadinessChip } from '../../components/readiness-chip';
import { stageLabel, stageTone, type TrackerState, trackerStates } from '../application-view';

export function ApplicationStageChip({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  return (
    <ReadinessChip label={stageLabel(status)} tone={stageTone(status)} className={className} />
  );
}

export const trackerSegmentClass: Record<TrackerState | 'reached', string> = {
  done: 'bg-primary',
  current: 'bg-primary/25 ring-1 ring-inset ring-primary',
  upcoming: 'bg-muted',
  reached: 'bg-muted-foreground/35',
};

/** Five-segment funnel bar; decorative, because the chip beside it names the stage. */
export function ApplicationStageTracker({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn('flex gap-1', className)}>
      {trackerStates(status).map((state, index) => (
        <span key={index} className={cn('h-1.5 w-7 rounded-full', trackerSegmentClass[state])} />
      ))}
    </div>
  );
}
