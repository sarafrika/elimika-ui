import type { UserDomain } from '@/lib/types';
import type { SearchType } from '@/lib/search/type-search';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

/**
 * Where a global-search hit opens, per dashboard. Pure, so the palette and its tests share
 * one table. Admin paths mirror `adminRoutes` (the admin console may not be imported from
 * outside it).
 *
 * Hits carry only `type`, `uuid` and display text. An instructor hit's uuid is the
 * instructor profile, but the admin person page and the public profile are keyed by the
 * user, so those destinations ask the palette to look the instructor up once on select.
 */

export type PaletteHit = { type: SearchType; uuid: string; title?: string };

export type HitDestination =
  | { kind: 'href'; href: string }
  /** Resolve the instructor's user uuid, then build the href from it. */
  | { kind: 'instructor-user'; build: (userUuid: string) => string };

const withQuery = (path: string, query: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
};

const href = (value: string): HitDestination => ({ kind: 'href', href: value });
const publicInstructorProfile = (userUuid: string) =>
  withQuery(`/profile-user/${userUuid}`, { domain: 'instructor' });

/** The dashboards the palette serves; `organisation` is the same dashboard as `organisation_user`. */
export type PaletteDomain = Exclude<UserDomain, 'organisation'>;

export function toPaletteDomain(domain: UserDomain | null | undefined): PaletteDomain | null {
  if (!domain) return null;
  return domain === 'organisation' ? 'organisation_user' : domain;
}

/**
 * The types each dashboard searches: those it has somewhere to open. The server also
 * leaves out what the caller may not see (a student never gets people).
 */
export const PALETTE_TYPES: Record<PaletteDomain, readonly SearchType[]> = {
  admin: [
    'courses',
    'programs',
    'classes',
    'marketplace_jobs',
    'instructors',
    'organisations',
    'people',
    'rubrics',
  ],
  course_creator: [
    'courses',
    'programs',
    'marketplace_jobs',
    'instructors',
    'organisations',
    'rubrics',
  ],
  instructor: ['courses', 'programs', 'classes', 'marketplace_jobs', 'instructors'],
  organisation_user: [
    'courses',
    'programs',
    'classes',
    'marketplace_jobs',
    'instructors',
    'organisations',
    'people',
  ],
  student: ['courses', 'programs', 'classes', 'marketplace_jobs', 'instructors'],
  parent: ['courses', 'programs', 'marketplace_jobs', 'instructors'],
};

export function hitDestination(domain: PaletteDomain, hit: PaletteHit): HitDestination | null {
  const { type, uuid } = hit;
  if (!uuid) return null;
  const url = (path: string) => dashboardUrl(domain, path);

  switch (domain) {
    case 'admin':
      switch (type) {
        case 'courses':
          return href(url(`courses/${uuid}`));
        case 'programs':
          return href(url(`programs/${uuid}`));
        case 'classes':
          return href(withQuery(url('classes'), { class: uuid }));
        case 'marketplace_jobs':
          return href(url(`marketplace/${uuid}`));
        case 'instructors':
          return {
            kind: 'instructor-user',
            build: userUuid => withQuery(url(`people/${userUuid}`), { tab: 'teaching' }),
          };
        case 'organisations':
          return href(url(`organisations/${uuid}`));
        case 'people':
          return href(url(`people/${uuid}`));
        case 'rubrics':
          return href(withQuery(url('rubrics'), { q: hit.title }));
      }
      return null;

    case 'course_creator':
      switch (type) {
        case 'courses':
          return href(url(`courses/${uuid}`));
        case 'programs':
          // Hits do not say who owns a program, so every program opens its read view.
          return href(url(`courses/available-programs/${uuid}`));
        case 'marketplace_jobs':
          return href(withQuery(url('opportunities'), { job: uuid }));
        case 'instructors':
          return href(url(`instructors/${uuid}`));
        case 'organisations':
          return href(url(`organisations/${uuid}`));
        case 'rubrics':
          // The rubric manager opens searched for the rubric's title.
          return href(withQuery(url('rubrics'), { q: hit.title }));
      }
      return null;

    case 'instructor':
      switch (type) {
        case 'courses':
          return href(url(`courses/${uuid}`));
        case 'programs':
          return href(url(`courses/available-programs/${uuid}`));
        case 'classes':
          return href(url(`training-hub/classes/${uuid}`));
        case 'marketplace_jobs':
          return href(url(`opportunities/${uuid}`));
        case 'instructors':
          return { kind: 'instructor-user', build: publicInstructorProfile };
      }
      return null;

    case 'organisation_user':
      switch (type) {
        case 'courses':
          return href(url(`courses/${uuid}`));
        case 'programs':
          // No organisation program page yet: the catalogue, searched for this program.
          return href(withQuery(url('courses/catalog'), { tab: 'programs', q: hit.title }));
        case 'classes':
          return href(withQuery(url('classes'), { highlight: uuid }));
        case 'marketplace_jobs':
          return href(url(`jobs/${uuid}`));
        case 'instructors':
          return href(url(`instructors/${uuid}`));
        case 'organisations':
          return href(url('account'));
        case 'people':
          // No organisation-level person page yet (open question 4): the public profile.
          return href(`/profile-user/${uuid}`);
      }
      return null;

    case 'student':
      switch (type) {
        case 'courses':
          return href(url(`courses/${uuid}`));
        case 'programs':
          return href(url(`courses/available-programs/${uuid}`));
        case 'classes':
          return href(url(`learning-hub/classes/${uuid}`));
        case 'marketplace_jobs':
          return href(withQuery(url('opportunities'), { job: uuid }));
        case 'instructors':
          return { kind: 'instructor-user', build: publicInstructorProfile };
      }
      return null;

    case 'parent':
      switch (type) {
        case 'courses':
          return href(url(`all-courses/${uuid}`));
        case 'programs':
          return href(url(`all-courses/available-programs/${uuid}`));
        case 'marketplace_jobs':
          return href(withQuery(url('opportunities'), { job: uuid }));
        case 'instructors':
          return { kind: 'instructor-user', build: publicInstructorProfile };
      }
      return null;
  }
  return null;
}

/** "See all {n}": the type's list page carrying the term as `?q=`, where one takes it. */
export function seeAllHref(domain: PaletteDomain, type: SearchType, q: string): string | null {
  const url = (path: string) => withQuery(dashboardUrl(domain, path), { q });

  switch (domain) {
    case 'admin':
      switch (type) {
        case 'courses':
          return url('courses');
        case 'programs':
          return url('programs');
        case 'classes':
          return url('classes');
        case 'marketplace_jobs':
          return url('marketplace');
        case 'instructors':
          return withQuery(dashboardUrl('admin', 'people'), { role: 'instructor', q });
        case 'organisations':
          return url('organisations');
        case 'people':
          return url('people');
        case 'rubrics':
          return url('rubrics');
      }
      return null;
    case 'course_creator':
      switch (type) {
        case 'courses':
          return url('courses');
        case 'programs':
          return url('all-courses');
        case 'marketplace_jobs':
          return url('opportunities');
        case 'rubrics':
          return url('rubrics');
      }
      return null;
    case 'instructor':
      switch (type) {
        case 'courses':
          return url('learning');
        case 'marketplace_jobs':
          return url('opportunities');
      }
      return null;
    case 'organisation_user':
      switch (type) {
        case 'courses':
          return url('courses/catalog');
        case 'classes':
          return url('classes');
        case 'marketplace_jobs':
          return url('jobs');
      }
      return null;
    case 'student':
      switch (type) {
        case 'courses':
          return url('courses');
        case 'programs':
          return url('all-courses');
        case 'marketplace_jobs':
          return url('opportunities');
      }
      return null;
    case 'parent':
      switch (type) {
        case 'courses':
        case 'programs':
          return url('all-courses');
        case 'marketplace_jobs':
          return url('opportunities');
      }
      return null;
  }
  return null;
}

/** Where to go when search is down: the role's home, catalogue and opportunities. */
export function quickLinks(domain: PaletteDomain): { label: string; href: string }[] {
  const home = { label: 'Home', href: dashboardUrl(domain, 'overview') };
  switch (domain) {
    case 'admin':
      return [
        home,
        { label: 'Courses', href: dashboardUrl(domain, 'courses') },
        { label: 'Marketplace', href: dashboardUrl(domain, 'marketplace') },
      ];
    case 'organisation_user':
      return [
        home,
        { label: 'Course catalogue', href: dashboardUrl(domain, 'courses/catalog') },
        { label: 'Jobs', href: dashboardUrl(domain, 'jobs') },
      ];
    case 'instructor':
      return [
        home,
        { label: 'Courses', href: dashboardUrl(domain, 'learning') },
        { label: 'Find work', href: dashboardUrl(domain, 'opportunities') },
      ];
    case 'parent':
      return [
        home,
        { label: 'All courses', href: dashboardUrl(domain, 'all-courses') },
        { label: 'Opportunities', href: dashboardUrl(domain, 'opportunities') },
      ];
    default:
      return [
        home,
        { label: 'Course catalogue', href: dashboardUrl(domain, 'courses') },
        { label: 'Opportunities', href: dashboardUrl(domain, 'opportunities') },
      ];
  }
}

export const TYPE_LABELS: Record<SearchType, string> = {
  courses: 'Courses',
  programs: 'Programs',
  classes: 'Classes',
  marketplace_jobs: 'Jobs',
  instructors: 'Instructors',
  organisations: 'Organisations',
  people: 'People',
  rubrics: 'Rubrics',
};
