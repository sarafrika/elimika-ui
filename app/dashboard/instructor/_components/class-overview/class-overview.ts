import type { CourseSkill } from '@/services/client';

/** Sections of the instructor class overview, in tab order. */
export const CLASS_OVERVIEW_TABS = [
  'overview',
  'schedule',
  'curriculum',
  'students',
  'skills',
] as const;
export type ClassOverviewTab = (typeof CLASS_OVERVIEW_TABS)[number];

export const CLASS_OVERVIEW_TAB_LABELS: Record<ClassOverviewTab, string> = {
  overview: 'Overview',
  schedule: 'Schedule',
  curriculum: 'Curriculum',
  students: 'Students',
  skills: 'Skills',
};

/**
 * The skills a class teaches: its course's tags, or the union of its program courses'.
 * One entry per skill; when two courses tag the same skill the higher weight wins, and the
 * list runs from the most central skill down, then by name.
 */
export function mergeCourseSkills(lists: ReadonlyArray<ReadonlyArray<CourseSkill> | undefined>) {
  const bySkill = new Map<string, CourseSkill>();
  for (const list of lists) {
    for (const skill of list ?? []) {
      const key = skill.skill_uuid ?? skill.skill_slug ?? skill.skill_name;
      if (!key) continue;
      const seen = bySkill.get(key);
      if (!seen || (skill.weight ?? 0) > (seen.weight ?? 0)) bySkill.set(key, skill);
    }
  }
  return [...bySkill.values()].sort(
    (a, b) =>
      (b.weight ?? 0) - (a.weight ?? 0) || (a.skill_name ?? '').localeCompare(b.skill_name ?? '')
  );
}
