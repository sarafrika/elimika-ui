import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { skillsMatchesHref } from '@/src/features/dashboard/lib/skills-matches-url';
import type { ApplyKind } from './types';

/** The new instructor flow, optionally preselecting an item or editing an application. */
export function instructorApplyToTrainHref(
  item?: { kind: ApplyKind; uuid: string } | null,
  applicationUuid?: string | null
) {
  const params = new URLSearchParams();
  if (item?.uuid) {
    params.set('item', item.uuid);
    params.set('kind', item.kind);
  }
  if (applicationUuid) params.set('application', applicationUuid);
  return skillsMatchesHref('apply-to-train', params);
}

/** Instructors track training applications on their rate card page, opened on the item. */
export function trackApplicationHref(kind: ApplyKind, parentUuid: string) {
  const params = new URLSearchParams({ kind, parent: parentUuid });
  return dashboardUrl('instructor', `rate-card?${params.toString()}`);
}

export const myTrainingApplicationsHref = () => dashboardUrl('instructor', 'rate-card');
