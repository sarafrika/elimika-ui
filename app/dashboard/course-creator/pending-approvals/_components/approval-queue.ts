import type { TrainingApplication, TrainingApplicationKind } from '@/src/features/rate-card/types';

export type ReviewApplication = {
  kind: TrainingApplicationKind;
  parentUuid?: string;
  application: TrainingApplication;
};

export const applicationKey = (entry: ReviewApplication) =>
  `${entry.kind}:${entry.application.uuid}`;

/** Preserve the list order while removing applications that no longer need a decision. */
export function pendingForApplicant(entries: ReviewApplication[], uuid: string, type: string) {
  return entries.filter(
    entry =>
      entry.application.applicant_uuid === uuid &&
      entry.application.applicant_type === type &&
      entry.application.status === 'pending'
  );
}
