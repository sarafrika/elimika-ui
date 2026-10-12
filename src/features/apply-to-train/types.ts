import type { ApplyCatalogueItem, StatusEnum3 } from '@/services/client';

export type ApplyKind = 'course' | 'program';

export type ApplyStepId = 'course' | 'groups' | 'delivery' | 'requirements' | 'review';

export const APPLY_TO_TRAIN_STEPS: readonly { id: ApplyStepId; label: string }[] = [
  { id: 'course', label: 'Course' },
  { id: 'groups', label: 'Age groups' },
  { id: 'delivery', label: 'Delivery & rates' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'review', label: 'Review' },
];

/** A course or programme an instructor can apply to train, flattened for the UI. */
export type ApplyItem = {
  kind: ApplyKind;
  uuid: string;
  title: string;
  code: string | null;
  category: string | null;
  creator: string | null;
  thumbnailUrl: string | null;
  /** Null bounds are open. */
  ageMin: number | null;
  ageMax: number | null;
  lessonCount: number | null;
  requirementCount: number | null;
  courseCount: number | null;
  matchesSkills: boolean;
  application: { uuid: string; status: StatusEnum3 } | null;
  minimumFee: number | null;
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Catalogue hits carry bigint counts and the API's "programme" spelling. */
export function toApplyItem(hit: ApplyCatalogueItem): ApplyItem | null {
  if (!hit.uuid) return null;
  return {
    kind: hit.type === 'programme' ? 'program' : 'course',
    uuid: hit.uuid,
    title: hit.title || 'Untitled',
    code: hit.code || null,
    category: hit.category_names?.[0] ?? null,
    creator: hit.creator_name || null,
    thumbnailUrl: hit.thumbnail_url || null,
    ageMin: toNumber(hit.age_lower_limit),
    ageMax: toNumber(hit.age_upper_limit),
    lessonCount: toNumber(hit.lesson_count),
    requirementCount: toNumber(hit.requirement_count),
    courseCount: toNumber(hit.course_count),
    matchesSkills: Boolean(hit.matches_skills),
    application:
      hit.my_application?.uuid && hit.my_application.status
        ? { uuid: hit.my_application.uuid, status: hit.my_application.status }
        : null,
    minimumFee: toNumber(hit.minimum_training_fee),
  };
}

/** Pending and approved applications lock the item; rejected or revoked ones can reapply. */
export function isLocked(item: ApplyItem): boolean {
  const status = item.application?.status;
  return status === 'pending' || status === 'approved';
}

export function ageRangeLabel(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'All ages';
  if (min === null) return `Up to ${max}`;
  if (max === null) return `${min}+`;
  return `${min}–${max}`;
}

export const kindNoun = (kind: ApplyKind) => (kind === 'program' ? 'programme' : 'course');
