import type { AgeGroup, AgeGroupRequest } from '@/services/client';

/*
 * Age groups: named, non-overlapping age bands, each with hours per lesson.
 * Kept self-contained so the group shape or data source can be swapped later.
 */

export const MAX_AGE_GROUPS = 10;
export const MAX_GROUP_NAME = 80;
export const MAX_LESSON_HOURS = 24;
export const HOUR_PRESETS = ['0.5', '0.75', '1', '1.5'] as const;

/** One lesson of the plan; a programme's lessons carry their course for grouping. */
export type PlanLesson = {
  uuid: string;
  number: number;
  title: string;
  courseUuid: string;
  courseTitle: string | null;
};

export type AgeGroupDraft = {
  id: string;
  name: string;
  minAge: string;
  maxAge: string;
  /** Hours keyed by lesson uuid, as typed. */
  hours: Record<string, string>;
  /** Shown for lessons with no typed value yet (the first group starts at 1 h). */
  seed?: string;
};

export type AgeScope = { min: number | null; max: number | null };

let sequence = 0;
const nextId = () => `group-${Date.now().toString(36)}-${(sequence++).toString(36)}`;

export function createGroup(init?: Partial<Omit<AgeGroupDraft, 'id'>>): AgeGroupDraft {
  return { id: nextId(), name: '', minAge: '', maxAge: '', hours: {}, ...init };
}

/** The starting group for a freshly chosen item: everyone in its range, 1 h a lesson. */
export function defaultGroups(scope: AgeScope): AgeGroupDraft[] {
  return [
    createGroup({
      name: 'All learners',
      minAge: scope.min === null ? '' : String(scope.min),
      maxAge: scope.max === null ? '' : String(scope.max),
      seed: '1',
    }),
  ];
}

/** Drafts from a stored application's groups, for editing. */
export function groupsFromApplication(groups: AgeGroup[] | null | undefined): AgeGroupDraft[] {
  return (groups ?? []).map(group =>
    createGroup({
      name: group.name ?? '',
      minAge: group.min_age === undefined ? '' : String(group.min_age),
      maxAge: group.max_age === undefined ? '' : String(group.max_age),
      hours: Object.fromEntries(
        (group.lesson_hours ?? [])
          .filter(row => row.lesson_uuid)
          .map(row => [row.lesson_uuid as string, row.hours === undefined ? '' : String(row.hours)])
      ),
    })
  );
}

export const hoursFor = (group: AgeGroupDraft, lessonUuid: string) =>
  group.hours[lessonUuid] ?? group.seed ?? '';

const parseAge = (value: string): number | null => {
  if (!/^\d{1,3}$/.test(value.trim())) return null;
  return Number(value.trim());
};

const parseHours = (value: string): number | null => {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Number(trimmed);
};

export const validHours = (value: string) => {
  const hours = parseHours(value);
  return hours !== null && hours > 0 && hours <= MAX_LESSON_HOURS;
};

export function totalHours(group: AgeGroupDraft, lessons: PlanLesson[]): number {
  return lessons.reduce((sum, lesson) => sum + (parseHours(hoursFor(group, lesson.uuid)) ?? 0), 0);
}

export const formatHours = (hours: number) => `${Math.round(hours * 100) / 100} h`;

export type GroupValidation = {
  byGroup: Record<string, string[]>;
  general: string[];
  count: number;
};

/** Mirrors the server: names, ages within scope, no overlaps, hours for every lesson. */
export function validateGroups(
  groups: AgeGroupDraft[],
  lessons: PlanLesson[],
  scope: AgeScope
): GroupValidation {
  const byGroup: Record<string, string[]> = {};
  const general: string[] = [];
  const add = (id: string, message: string) => {
    if (!byGroup[id]) byGroup[id] = [];
    byGroup[id].push(message);
  };

  if (groups.length === 0) general.push('Add at least one age group.');
  if (groups.length > MAX_AGE_GROUPS)
    general.push(`Keep it to ${MAX_AGE_GROUPS} groups or fewer.`);
  if (scope.min !== null && scope.max !== null && scope.min > scope.max)
    general.push('The courses in this programme share no common age range.');

  const seen = new Map<string, string>();
  for (const group of groups) {
    const name = group.name.trim();
    if (!name) add(group.id, 'Give this group a name.');
    else if (name.length > MAX_GROUP_NAME)
      add(group.id, `Keep the name to ${MAX_GROUP_NAME} characters.`);
    else if (seen.has(name.toLowerCase())) add(group.id, `Another group is already called “${name}”.`);
    else seen.set(name.toLowerCase(), group.id);

    const min = parseAge(group.minAge);
    const max = parseAge(group.maxAge);
    if (min === null || max === null) add(group.id, 'Enter a minimum and a maximum age.');
    else {
      if (min > max) add(group.id, 'The minimum age is above the maximum.');
      if ((scope.min !== null && min < scope.min) || (scope.max !== null && max > scope.max))
        add(
          group.id,
          `Ages must stay within ${scope.min ?? 'any'}–${scope.max ?? 'any'}, this item’s range.`
        );
    }

    const badHours = lessons.filter(lesson => !validHours(hoursFor(group, lesson.uuid))).length;
    if (badHours > 0)
      add(
        group.id,
        `${badHours} ${badHours === 1 ? 'lesson needs' : 'lessons need'} hours above 0 and at most ${MAX_LESSON_HOURS} (2 decimals).`
      );
  }

  const ranged = groups
    .map(group => ({ group, min: parseAge(group.minAge), max: parseAge(group.maxAge) }))
    .filter(
      (row): row is { group: AgeGroupDraft; min: number; max: number } =>
        row.min !== null && row.max !== null && row.min <= row.max
    )
    .sort((a, b) => a.min - b.min);
  for (let index = 1; index < ranged.length; index++) {
    const previous = ranged[index - 1]!;
    const current = ranged[index]!;
    if (current.min <= previous.max)
      add(
        current.group.id,
        `Overlaps with ${previous.group.name.trim() || 'another group'}. Groups can leave gaps but can’t overlap.`
      );
  }

  const count = general.length + Object.values(byGroup).reduce((sum, list) => sum + list.length, 0);
  return { byGroup, general, count };
}

/** The request shape; call only once the groups validate. */
export function toAgeGroupRequests(
  groups: AgeGroupDraft[],
  lessons: PlanLesson[]
): AgeGroupRequest[] {
  return groups.map(group => ({
    name: group.name.trim(),
    min_age: Number(group.minAge),
    max_age: Number(group.maxAge),
    lesson_hours: lessons.map(lesson => ({
      lesson_uuid: lesson.uuid,
      hours: Number(hoursFor(group, lesson.uuid)),
    })),
  }));
}

/** True when a band sits inside the scope; open bounds always fit. */
export function bandFits(min: number, max: number, scope: AgeScope): boolean {
  return (scope.min === null || min >= scope.min) && (scope.max === null || max <= scope.max);
}

/** A copy of a saved age group for this application, starting at 1 h a lesson. */
export function groupFromSaved(saved: { name?: string; min_age?: number; max_age?: number }) {
  return createGroup({
    name: saved.name ?? '',
    minAge: saved.min_age === undefined ? '' : String(saved.min_age),
    maxAge: saved.max_age === undefined ? '' : String(saved.max_age),
    seed: '1',
  });
}
