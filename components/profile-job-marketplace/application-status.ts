/**
 * The marketplace job application funnel, in one place.
 *
 * Hiring is the last decision: it affiliates the instructor and leaves the job ready for its class.
 * Creating the class is what performs the assignment, so `assigned` is an outcome, never a stage.
 */

/** applied -> shortlisted -> interviewing -> offered -> hired. `pending` is how the backend spells applied. */
export const HIRING_STAGES = [
  'pending',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
] as const;

export type HiringStage = (typeof HIRING_STAGES)[number];

export type HiringStep = {
  action: 'shortlist' | 'interview' | 'offer' | 'hire';
  label: string;
  leadsTo: HiringStage;
};

/** The single step an organisation may take from each stage — labelled as a person would say it. */
const NEXT_STEP: Record<HiringStage, HiringStep | null> = {
  pending: { action: 'shortlist', label: 'Shortlist', leadsTo: 'shortlisted' },
  shortlisted: { action: 'interview', label: 'Move to interview', leadsTo: 'interviewing' },
  interviewing: { action: 'offer', label: 'Make an offer', leadsTo: 'offered' },
  offered: { action: 'hire', label: 'Hire', leadsTo: 'hired' },
  hired: null,
};

/** Closed in a way that leaves the instructor free to apply for the job again. */
const EXIT_STATUSES: readonly string[] = ['rejected', 'not_selected', 'withdrawn'];

const normalise = (status?: string | null) => (status ?? '').toLowerCase();

/** Position in the funnel, or -1 for an exit, for `assigned`, and for anything unrecognised. */
export function stageIndexOf(status?: string | null): number {
  return (HIRING_STAGES as readonly string[]).indexOf(normalise(status));
}

/** Null once hired and on every exit — those surfaces offer creating the class, or nothing. */
export function nextStepFor(status?: string | null): HiringStep | null {
  const stage = HIRING_STAGES[stageIndexOf(status)];
  return stage ? NEXT_STEP[stage] : null;
}

export function isExitStatus(status?: string | null): boolean {
  return EXIT_STATUSES.includes(normalise(status));
}

/** The class exists and staffed itself from the hire; no funnel stage remains. */
export function isClassCreatedStatus(status?: string | null): boolean {
  return normalise(status) === 'assigned';
}

/** Every status a filter may offer: the funnel, then the class, then the exits. */
export const APPLICATION_STATUSES = [
  ...HIRING_STAGES,
  'assigned',
  'rejected',
  'not_selected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Still moving through the funnel — the organisation owes this candidate an answer. */
export const LIVE_STATUSES: readonly string[] = HIRING_STAGES;

/** Stages a candidate can still be moved on from, before the hire ends the funnel. */
export const MOVABLE_STAGES: readonly string[] = HIRING_STAGES.filter(stage => NEXT_STEP[stage]);

export const REAPPLICABLE_STATUSES = EXIT_STATUSES;

export const isLiveApplication = (status?: string | null): boolean => stageIndexOf(status) >= 0;

export const canReapply = (status?: string | null): boolean => isExitStatus(status);

/** An instructor may pull out while the application is live; a class-backed one no longer is. */
export const canWithdraw = (status?: string | null): boolean => isLiveApplication(status);

/** The organisation can still act on this candidate (shortlist / interview / offer / hire). */
export const canReviewApplication = (status?: string | null): boolean =>
  nextStepFor(status) !== null;

/**
 * Rejection closes only where the funnel still moves: the hire takes the job out of OPEN, and the
 * server refuses every decision on a job that has left it. Unwinding a hire is the job's own move.
 */
export const canRejectApplication = (status?: string | null): boolean =>
  MOVABLE_STAGES.includes(normalise(status));

const STATUS_LABELS: Record<string, string> = {
  pending: 'Applied',
  shortlisted: 'Shortlisted',
  interviewing: 'Interviewing',
  offered: 'Offer made',
  hired: 'Hired',
  assigned: 'Class created',
  rejected: 'Rejected',
  not_selected: 'Not selected',
  withdrawn: 'Withdrawn',
};

/** One vocabulary for every surface, so nobody reinvents 'Approved' or 'Assigned' locally. */
export function statusLabel(status?: string | null): string {
  const key = normalise(status);
  if (!key) return 'Unknown';
  return (
    STATUS_LABELS[key] ??
    key.replace(/_/g, ' ').replace(/(^|\s)\S/g, letter => letter.toUpperCase())
  );
}
