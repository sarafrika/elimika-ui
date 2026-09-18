import {
  isClassCreatedStatus,
  isLiveApplication,
  statusLabel,
} from '@/components/profile-job-marketplace/application-status';
import { isHiredApplication } from '@/components/profile-job-marketplace/hired-jobs';
import { getEffectiveJobStatus } from '@/components/profile-job-marketplace/job-expiration';
import { formatRateAmount, formatRateBasis } from '@/lib/rate-card';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobApplication,
  ClassMarketplaceJobEligibility,
} from '@/services/client/types.gen';

/** Where the instructor's rate stands against this job's format, delivery and basis. */
export type RateStanding =
  | { kind: 'ok'; approvedRate: number | null }
  | { kind: 'above_pay'; approvedRate: number }
  | { kind: 'resolving' }
  | { kind: 'awaiting'; creatorName: string | null }
  | { kind: 'missing' };

export type PendingRate = { loading: boolean; awaiting: boolean; creatorName: string | null };

export function rateStandingFor(
  eligibility: ClassMarketplaceJobEligibility,
  pendingRate: PendingRate
): RateStanding {
  if (eligibility.rate_ok !== false) {
    return { kind: 'ok', approvedRate: eligibility.approved_rate ?? null };
  }
  if (typeof eligibility.approved_rate === 'number') {
    return { kind: 'above_pay', approvedRate: eligibility.approved_rate };
  }
  if (pendingRate.loading) return { kind: 'resolving' };
  if (pendingRate.awaiting) return { kind: 'awaiting', creatorName: pendingRate.creatorName };
  return { kind: 'missing' };
}

/** Whether the apply button is blocked, and the reason shown under it. */
export function applyGate(
  eligibility: ClassMarketplaceJobEligibility | undefined,
  rate: RateStanding | null
): { blocked: boolean; hint: string | null } {
  if (!eligibility || eligibility.eligible !== false) return { blocked: false, hint: null };
  const reason = eligibility.reason ?? 'You are not currently eligible to apply for this job.';
  const earlierCheckFails =
    eligibility.instructor_verified === false || eligibility.training_approved === false;
  if (!earlierCheckFails && rate?.kind === 'awaiting') {
    return { blocked: true, hint: "You can apply once the rate is approved. We'll let you know." };
  }
  if (!earlierCheckFails && rate?.kind === 'missing') {
    return {
      blocked: true,
      hint: 'Jobs can only hire you on a basis you have an approved rate for.',
    };
  }
  if (!earlierCheckFails && rate?.kind === 'resolving') return { blocked: true, hint: null };
  return { blocked: true, hint: reason };
}

export type JobReadinessState =
  | 'applied'
  | 'hired'
  | 'closed'
  | 'checking'
  | 'verify'
  | 'training'
  | 'rate'
  | 'clash'
  | 'ready';

export type ReadinessTone = 'success' | 'warning' | 'danger' | 'muted' | 'brand';

export type ReadinessCtaKind =
  | 'apply'
  | 'add-rate'
  | 'apply-to-train'
  | 'see-clashes'
  | 'verify'
  | 'track'
  | 'view';

export type JobReadiness = {
  state: JobReadinessState;
  label: string;
  tone: ReadinessTone;
  /** One sentence on what blocks the application, or null when nothing needs explaining. */
  fix: string | null;
  cta: { label: string; kind: ReadinessCtaKind };
};

export type JobReadinessInput = {
  job: ClassMarketplaceJob;
  eligibility: ClassMarketplaceJobEligibility | undefined;
  application?: Pick<ClassMarketplaceJobApplication, 'status'> | null;
  /** A rate update covering this job is waiting on the course creator. */
  pendingRate?: boolean;
  creatorName?: string | null;
  /** The course or program title, for the training sentence. */
  contentTitle?: string | null;
  now?: number;
};

const VIEW_JOB = { label: 'View job', kind: 'view' } as const;

const sessionsClash = (count: number) =>
  count === 1 ? '1 session clashes' : count > 1 ? `${count} sessions clash` : 'Sessions clash';

function rateReadiness(
  job: ClassMarketplaceJob,
  eligibility: ClassMarketplaceJobEligibility,
  pendingRate: boolean,
  creatorName: string | null
): JobReadiness {
  const standing = rateStandingFor(eligibility, {
    loading: false,
    awaiting: pendingRate,
    creatorName,
  });
  const phrase = job.rate_basis ? formatRateBasis(job.rate_basis) : null;
  const rateNoun = phrase ? `${phrase.replace(' ', '-')} rate` : 'rate';
  const creator = creatorName ?? 'the course creator';

  if (standing.kind === 'above_pay') {
    const pay =
      typeof job.instructor_pay === 'number' ? ` of ${formatRateAmount(job.instructor_pay)}` : '';
    return {
      state: 'rate',
      label: 'Your rate is above pay',
      tone: 'warning',
      fix: `Your approved rate of ${formatRateAmount(standing.approvedRate)}${phrase ? ` ${phrase}` : ''} is above this job’s pay${pay}.`,
      cta: { label: 'Review your rate', kind: 'add-rate' },
    };
  }
  if (standing.kind === 'awaiting') {
    return {
      state: 'rate',
      label: 'Rate awaiting approval',
      tone: 'warning',
      fix: `Your ${rateNoun} is awaiting approval. You can apply once ${creator} approves it.`,
      cta: { label: 'View rate card', kind: 'add-rate' },
    };
  }
  const scope = job.session_format === 'INDIVIDUAL' ? 'private' : 'group';
  const where = job.location_type === 'ONLINE' ? 'online' : 'in person';
  return {
    state: 'rate',
    label: `Add a ${rateNoun}`,
    tone: 'warning',
    fix: `No approved ${rateNoun} for ${scope} classes ${where}. Add one and ${creator} reviews it.`,
    cta: { label: 'Add the rate', kind: 'add-rate' },
  };
}

/** The single thing that decides whether an instructor can apply for a job, in priority order. */
export function jobReadiness({
  job,
  eligibility,
  application,
  pendingRate = false,
  creatorName = null,
  contentTitle = null,
  now = Date.now(),
}: JobReadinessInput): JobReadiness {
  const status = application?.status ?? eligibility?.application_status;

  if (isHiredApplication(status)) {
    return {
      state: 'hired',
      label: isClassCreatedStatus(status) ? 'Hired · Class created' : 'Hired',
      tone: 'success',
      fix: null,
      cta: { label: 'View hire', kind: 'view' },
    };
  }
  if (isLiveApplication(status)) {
    const stage = statusLabel(status);
    return {
      state: 'applied',
      label: stage === 'Applied' ? 'Applied' : `Applied · ${stage}`,
      tone: 'brand',
      fix: null,
      cta: { label: 'Track application', kind: 'track' },
    };
  }

  if (getEffectiveJobStatus(job, now) !== 'open') {
    return {
      state: 'closed',
      label: 'Closed',
      tone: 'muted',
      fix:
        job.status === 'open'
          ? 'The first session has started, so applications are closed.'
          : 'This job is no longer taking applications.',
      cta: VIEW_JOB,
    };
  }

  if (!eligibility) {
    return { state: 'checking', label: 'Checking…', tone: 'muted', fix: null, cta: VIEW_JOB };
  }

  if (eligibility.instructor_verified === false) {
    return {
      state: 'verify',
      label: 'Awaiting verification',
      tone: 'muted',
      fix: 'An administrator has to verify your instructor profile before you can apply.',
      cta: { label: 'Check verification', kind: 'verify' },
    };
  }
  if (eligibility.training_approved === false) {
    const noun = job.program_uuid ? 'training program' : 'course';
    return {
      state: 'training',
      label: 'Apply to train first',
      tone: 'muted',
      fix: `You’re not approved to train ${contentTitle || `this ${noun}`} yet.`,
      cta: { label: 'Apply to train', kind: 'apply-to-train' },
    };
  }
  if (eligibility.rate_ok === false) {
    return rateReadiness(job, eligibility, pendingRate, creatorName);
  }
  if (eligibility.schedule_clear === false) {
    const clash = sessionsClash(eligibility.schedule_conflicts?.length ?? 0);
    return {
      state: 'clash',
      label: clash,
      tone: 'danger',
      fix: `${clash} with your calendar. Free those times, then apply.`,
      cta: { label: 'See the clashes', kind: 'see-clashes' },
    };
  }

  return {
    state: 'ready',
    label: 'You can apply',
    tone: 'success',
    fix: null,
    cta: { label: 'Apply', kind: 'apply' },
  };
}
