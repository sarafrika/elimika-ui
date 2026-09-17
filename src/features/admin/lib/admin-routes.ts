import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

/**
 * Every admin URL is built here, so a section can move without hunting for strings.
 * Paths are relative to the admin segment; dashboardUrl adds it.
 */
const admin = (path: string) => dashboardUrl('admin', path);

export type PersonTab =
  | 'overview'
  | 'verification'
  | 'teaching'
  | 'learning'
  | 'money'
  | 'audit';

export type OrganisationTab =
  | 'overview'
  | 'verification'
  | 'branches'
  | 'members'
  | 'classes'
  | 'finance';

export type InboxType =
  | 'documents'
  | 'instructors'
  | 'creators'
  | 'organisations'
  | 'courses'
  | 'edits'
  | 'programs';

const withQuery = (path: string, query: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
};

export const adminRoutes = {
  overview: () => admin('overview'),
  inbox: (type?: InboxType, item?: string) => withQuery(admin('inbox'), { type, item }),
  activity: () => admin('activity'),

  people: (filters?: { role?: string; q?: string; status?: string; page?: string }) =>
    withQuery(admin('people'), filters ?? {}),
  person: (userUuid: string, tab: PersonTab = 'overview', review?: { queue: string; item: string }) =>
    withQuery(admin(`people/${userUuid}`), {
      tab,
      review: review?.queue,
      item: review?.item,
    }),

  organisations: (filters?: { q?: string; verified?: string; active?: string; page?: string }) =>
    withQuery(admin('organisations'), filters ?? {}),
  organisation: (uuid: string, tab: OrganisationTab = 'overview') =>
    withQuery(admin(`organisations/${uuid}`), { tab }),

  courses: (filters?: { status?: string; approval?: string; q?: string; page?: string }) =>
    withQuery(admin('courses'), filters ?? {}),
  course: (uuid: string, tab?: string) => withQuery(admin(`courses/${uuid}`), { tab }),
  programs: () => admin('programs'),
  program: (uuid: string) => admin(`programs/${uuid}`),
  classes: (filters?: { view?: string; from?: string; to?: string; instructor?: string }) =>
    withQuery(admin('classes'), filters ?? {}),
  catalogue: () => admin('catalogue'),
  rubrics: () => admin('rubrics'),
  marketplace: () => admin('marketplace'),
  job: (uuid: string) => admin(`marketplace/${uuid}`),

  revenue: (range?: string) => withQuery(admin('revenue'), { range }),
  sales: (filters?: { status?: string; scope?: string; order?: string; page?: string }) =>
    withQuery(admin('sales'), filters ?? {}),
  currencies: () => admin('currencies'),

  categories: () => admin('platform/categories'),
  rules: (filters?: { rule?: string; category?: string; status?: string }) =>
    withQuery(admin('platform/rules'), filters ?? {}),
  config: (tab?: string) => withQuery(admin('platform/config'), { tab }),
  access: () => admin('access'),
  notifications: () => admin('notifications'),
  settings: () => admin('settings'),
} as const;
