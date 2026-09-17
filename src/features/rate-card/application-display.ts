import type { UserOrganisationAffiliationDto } from '@/services/client';
import type { TrainingApplicationEvent, TrainingApplicationKind } from './types';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export type StatusTone = 'warning' | 'success' | 'destructive' | 'muted' | 'primary';

/** The status pill's words and colour; an approved card with a pending update reads as such. */
export function applicationStatusDisplay(
  status: string | null | undefined,
  { hasPendingUpdate = false, viewer = 'applicant', kind = 'course' }: StatusDisplayOptions = {}
): { label: string; tone: StatusTone } {
  switch (status?.toLowerCase()) {
    case 'approved':
      return hasPendingUpdate
        ? { label: 'Approved · rate updates pending', tone: 'primary' }
        : { label: 'Approved', tone: 'success' };
    case 'rejected':
      return { label: 'Rejected', tone: 'destructive' };
    case 'revoked':
      return { label: 'Revoked', tone: 'muted' };
    default:
      return {
        label: viewer === 'owner' ? 'Pending review' : `Waiting for the ${creatorRole(kind)}`,
        tone: 'warning',
      };
  }
}

type StatusDisplayOptions = {
  hasPendingUpdate?: boolean;
  viewer?: 'applicant' | 'owner';
  kind?: TrainingApplicationKind;
};

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  warning: 'border-warning/50 bg-warning/10 text-foreground',
  success: 'border-success/40 bg-success/10 text-success',
  destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
  muted: 'border-border bg-muted text-muted-foreground',
  primary: 'border-primary/40 bg-primary/10 text-primary',
};

export function creatorRole(kind: TrainingApplicationKind) {
  return kind === 'program' ? 'program creator' : 'course creator';
}

const EVENT_VERBS: Record<string, string> = {
  submitted: 'Submitted',
  edited: 'Edited',
  opened_by_creator: 'Opened',
  approved: 'Approved',
  rejected: 'Rejected',
  revoked: 'Revoked',
  withdrawn: 'Withdrawn',
  rates_update_submitted: 'Rates updated',
  rates_update_approved: 'Rate update approved',
  rates_update_rejected: 'Rate update rejected',
  rates_update_withdrawn: 'Rate update withdrawn',
};

/** "Approved by Sarafrika Academy". */
export function describeApplicationEvent(event: TrainingApplicationEvent): string {
  const verb = EVENT_VERBS[event.event_type ?? ''] ?? 'Updated';
  return event.actor_name ? `${verb} by ${event.actor_name}` : verb;
}

const MANAGER_DOMAINS = new Set(['organisation_user', 'admin']);

/** Org-scoped managers may act for the organisation as an applicant; mirrors the backend. */
export function managesOrganisation(
  affiliations: readonly UserOrganisationAffiliationDto[] | null | undefined,
  organisationUuid: string | null | undefined
): boolean {
  if (!organisationUuid) return false;
  return (affiliations ?? []).some(
    affiliation =>
      affiliation.organisation_uuid === organisationUuid &&
      affiliation.active !== false &&
      MANAGER_DOMAINS.has(affiliation.domain_in_organisation ?? '')
  );
}
