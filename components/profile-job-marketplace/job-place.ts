import { townFromAddress } from '@/lib/geocoding';
import type { ClassMarketplaceJob } from '@/services/client';

type JobPlace = Pick<
  ClassMarketplaceJob,
  'branch_name' | 'location_name' | 'location_type' | 'location_latitude' | 'location_longitude'
>;

/** Branch jobs store "Branch · address"; the address alone is what maps and towns want. */
export function jobAddress(job: JobPlace) {
  const location = job.location_name?.trim();
  if (!location) return null;
  const prefix = job.branch_name ? `${job.branch_name} · ` : '';
  return prefix && location.startsWith(prefix) ? location.slice(prefix.length) : location;
}

export function jobTown(job: JobPlace) {
  return townFromAddress(jobAddress(job));
}

export function jobHasPin(job: JobPlace) {
  return (
    typeof job.location_latitude === 'number' &&
    Number.isFinite(job.location_latitude) &&
    typeof job.location_longitude === 'number' &&
    Number.isFinite(job.location_longitude)
  );
}

/** "Main Campus · Kasarani" for branch jobs; the stored location text otherwise. */
export function jobPlaceLabel(job: JobPlace, fallback: string) {
  if (job.location_type !== 'ONLINE' && job.branch_name) {
    const town = jobTown(job);
    return town ? `${job.branch_name} · ${town}` : job.branch_name;
  }
  return job.location_name || fallback;
}
