/**
 * The marketplace job application funnel, in one place.
 *
 * These mirror `ClassMarketplaceJobApplicationStatus` on the backend — including its
 * `isActive()` / `allowsReapplication()` predicates. They were previously redeclared in four
 * components, which is how `withdrawn` ended up missing from two of them and withdrawn candidates
 * kept showing in the Applied column. Import from here rather than re-listing them.
 */

export const APPLICATION_STATUSES = [
  'pending',
  'shortlisted',
  'interviewing',
  'offered',
  'approved',
  'rejected',
  'assigned',
  'not_selected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Still moving through the funnel — the organisation owes this candidate an answer. */
export const LIVE_STATUSES: readonly string[] = [
  'pending',
  'shortlisted',
  'interviewing',
  'offered',
  'approved',
];

/** Stages an organisation can move a live candidate between, before a final decision. */
export const MOVABLE_STAGES: readonly string[] = ['pending', 'shortlisted', 'interviewing', 'offered'];

/** Closed in a way that leaves the instructor free to apply for the job again. */
export const REAPPLICABLE_STATUSES: readonly string[] = ['rejected', 'not_selected', 'withdrawn'];

export const isLiveApplication = (status?: string | null): boolean =>
  LIVE_STATUSES.includes((status ?? '').toLowerCase());

export const canReapply = (status?: string | null): boolean =>
  REAPPLICABLE_STATUSES.includes((status ?? '').toLowerCase());

/** An instructor may pull out at any live stage, but not once they have been hired. */
export const canWithdraw = (status?: string | null): boolean =>
  isLiveApplication(status) && (status ?? '').toLowerCase() !== 'assigned';

/** The organisation can still act on this candidate (shortlist / interview / offer / decide). */
export const canReviewApplication = (status?: string | null): boolean =>
  MOVABLE_STAGES.includes((status ?? '').toLowerCase());
