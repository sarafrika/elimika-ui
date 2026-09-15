import type { ClassMarketplaceJob } from '@/services/client/types.gen';

export function hasJobStarted(startTime: Date | string | null | undefined, now = Date.now()) {
  if (!startTime) return false;
  const timestamp = new Date(startTime).getTime();
  return Number.isFinite(timestamp) && timestamp <= now;
}

export function getEffectiveJobStatus(
  job: Pick<ClassMarketplaceJob, 'status' | 'default_start_time'>,
  now = Date.now()
) {
  return job.status === 'open' && hasJobStarted(job.default_start_time, now)
    ? 'expired'
    : job.status;
}
