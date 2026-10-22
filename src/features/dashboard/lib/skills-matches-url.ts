import { dashboardUrl } from './dashboard-url';

export const SKILLS_MATCH_TABS = [
  'all-matches',
  'jobs',
  'apply-to-train',
  'projects',
  'workshop',
  'my-applications',
] as const;

export type SkillsMatchTab = (typeof SKILLS_MATCH_TABS)[number];
export type SkillsMatchSearchParams = Record<string, string | string[] | undefined>;

export function isSkillsMatchTab(value: string | null): value is SkillsMatchTab {
  return SKILLS_MATCH_TABS.some(tab => tab === value);
}

/** Preserve filters and application deep links when moving an existing page into the hub. */
export function skillsMatchesHref(
  tab: SkillsMatchTab = 'all-matches',
  search: URLSearchParams | SkillsMatchSearchParams = new URLSearchParams()
) {
  const params = new URLSearchParams();
  if (search instanceof URLSearchParams) {
    search.forEach((value, key) => params.append(key, value));
  } else {
    for (const [key, value] of Object.entries(search)) {
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, item));
      } else if (value !== undefined) {
        params.set(key, value);
      }
    }
  }

  if (tab === 'all-matches') {
    params.delete('tab');
  } else {
    params.set('tab', tab);
  }
  const query = params.toString();
  return dashboardUrl('instructor', `skills-matches${query ? `?${query}` : ''}`);
}
