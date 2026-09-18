import { StatusBadge } from '@/app/dashboard/admin/_components/ui';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob } from '@/services/client';
import { type HoldState, JOB_STAGE_META, jobStage, jobStatusLabel } from '../lib/job-stage';

export function JobStageBadge({
  job,
  now,
  className,
}: {
  job: ClassMarketplaceJob;
  now: number;
  className?: string;
}) {
  const stage = jobStage(job, now);
  return (
    <StatusBadge
      tone={JOB_STAGE_META[stage].tone}
      label={jobStatusLabel(job, now)}
      className={className}
    />
  );
}

/** Confirmed holds read as success; everything else stays neutral so the next step stands out. */
export function HoldBadge({
  hold,
  label,
  className,
}: {
  hold: HoldState;
  label?: string;
  className?: string;
}) {
  return (
    <StatusBadge
      tone={hold.key === 'confirmed' ? 'success' : 'neutral'}
      label={label ?? hold.label}
      className={cn('max-w-full truncate', className)}
    />
  );
}
