import { dayjs } from '@/lib/date';
import type { RateBasis } from '@/lib/rate-card';
import type { ClassMarketplaceJob, LocationTypeEnum } from '@/services/client/types.gen';

import type { JobFacts } from '../job-facts';
import type { JobReadiness, JobReadinessState } from '../job-readiness';
import { findWorkHref } from '../job-routes';

export type ReadyFilter = 'all' | 'ready' | 'fix' | 'applied';
export type DeliveryFilter = 'all' | LocationTypeEnum;
export type StartsFilter = 'any' | '2w' | '1m';
export type FormatFilter = 'all' | 'private' | 'group';
export type BasisFilter = 'all' | RateBasis;
export type SortOption = 'soonest' | 'newest' | 'pay';

export type FindWorkFilters = {
  ready: ReadyFilter;
  delivery: DeliveryFilter;
  starts: StartsFilter;
  format: FormatFilter;
  basis: BasisFilter;
  organisation: string | null;
  course: string | null;
  program: string | null;
  sort: SortOption;
};

export const READY_OPTIONS: { value: ReadyFilter; label: string }[] = [
  { value: 'all', label: 'All open jobs' },
  { value: 'ready', label: 'Ready to apply' },
  { value: 'fix', label: 'Needs a fix' },
  { value: 'applied', label: 'Already applied' },
];

export const DELIVERY_OPTIONS: { value: DeliveryFilter; label: string }[] = [
  { value: 'all', label: 'Any delivery' },
  { value: 'IN_PERSON', label: 'In person' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Hybrid' },
];

export const STARTS_OPTIONS: { value: StartsFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: '2w', label: 'Within 2 weeks' },
  { value: '1m', label: 'Within a month' },
];

export const FORMAT_OPTIONS: { value: FormatFilter; label: string }[] = [
  { value: 'all', label: 'Private or group' },
  { value: 'private', label: 'Private' },
  { value: 'group', label: 'Group' },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'soonest', label: 'Starts soonest' },
  { value: 'newest', label: 'Newest' },
  { value: 'pay', label: 'Highest pay' },
];

export const BASIS_OPTIONS: { value: BasisFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'per_hour', label: 'Per hour' },
  { value: 'per_session', label: 'Per session' },
  { value: 'per_day', label: 'Per day' },
];

const DELIVERY_PARAM: Record<Exclude<DeliveryFilter, 'all'>, string> = {
  IN_PERSON: 'in-person',
  ONLINE: 'online',
  HYBRID: 'hybrid',
};

const pick = <T extends string>(options: { value: T }[], raw: string | null, fallback: T): T =>
  options.find(option => option.value === raw)?.value ?? fallback;

type Params = { get(name: string): string | null };

export function parseFindWorkFilters(params: Params): FindWorkFilters {
  const deliveryRaw = params.get('delivery');
  const delivery =
    (Object.entries(DELIVERY_PARAM).find(([, value]) => value === deliveryRaw)?.[0] as
      | DeliveryFilter
      | undefined) ?? 'all';
  return {
    ready: pick(READY_OPTIONS, params.get('ready'), 'all'),
    delivery,
    starts: pick(STARTS_OPTIONS, params.get('starts'), 'any'),
    format: pick(FORMAT_OPTIONS, params.get('format'), 'all'),
    basis: pick(BASIS_OPTIONS, params.get('basis'), 'all'),
    organisation: params.get('organisation') || null,
    course: params.get('course') || null,
    program: params.get('program') || null,
    sort: pick(SORT_OPTIONS, params.get('sort'), 'soonest'),
  };
}

/** Query string for a filter set, leaving defaults out so shared links stay short. */
export function findWorkQuery(filters: FindWorkFilters) {
  const params = new URLSearchParams();
  if (filters.ready !== 'all') params.set('ready', filters.ready);
  if (filters.delivery !== 'all') params.set('delivery', DELIVERY_PARAM[filters.delivery]);
  if (filters.starts !== 'any') params.set('starts', filters.starts);
  if (filters.format !== 'all') params.set('format', filters.format);
  if (filters.basis !== 'all') params.set('basis', filters.basis);
  if (filters.organisation) params.set('organisation', filters.organisation);
  if (filters.course) params.set('course', filters.course);
  if (filters.program) params.set('program', filters.program);
  if (filters.sort !== 'soonest') params.set('sort', filters.sort);
  return params.toString();
}

const DEFAULT_FILTERS = parseFindWorkFilters(new URLSearchParams());

/** Find work opened on a filter, e.g. `findWorkFilteredHref({ organisation: uuid })`. */
export function findWorkFilteredHref(patch: Partial<FindWorkFilters>) {
  const query = findWorkQuery({ ...DEFAULT_FILTERS, ...patch });
  return query ? `${findWorkHref()}?${query}` : findWorkHref();
}

const FIX_STATES: readonly JobReadinessState[] = ['verify', 'training', 'rate', 'clash'];

export function readyGroupOf(readiness: JobReadiness | null): Exclude<ReadyFilter, 'all'> | null {
  if (!readiness) return null;
  if (readiness.state === 'ready') return 'ready';
  if (readiness.state === 'applied' || readiness.state === 'hired') return 'applied';
  return FIX_STATES.includes(readiness.state) ? 'fix' : null;
}

export const matchesReady = (filter: ReadyFilter, readiness: JobReadiness | null) =>
  filter === 'all' || readyGroupOf(readiness) === filter;

export const matchesDelivery = (filter: DeliveryFilter, job: ClassMarketplaceJob) =>
  filter === 'all' || job.location_type === filter;

export const matchesBasis = (filter: BasisFilter, job: ClassMarketplaceJob) =>
  filter === 'all' || job.rate_basis === filter;

export const matchesFormat = (filter: FormatFilter, job: ClassMarketplaceJob) =>
  filter === 'all' ||
  (filter === 'private' ? job.session_format === 'INDIVIDUAL' : job.session_format !== 'INDIVIDUAL');

export function matchesStarts(filter: StartsFilter, facts: JobFacts, now: number) {
  if (filter === 'any') return true;
  const start = facts.first?.start ?? facts.closesAt;
  if (!start) return false;
  const limit = filter === '2w' ? dayjs(now).add(14, 'day') : dayjs(now).add(1, 'month');
  return !dayjs(start).isAfter(limit);
}

type Sortable = { job: ClassMarketplaceJob; facts: JobFacts };

const createdTime = (row: Sortable) =>
  row.job.created_date ? new Date(row.job.created_date).getTime() : 0;

/** Ascending, with missing values last. */
function compareNullable(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
  return a - b;
}

/** Highest pay compares estimated totals, the one figure comparable across billing bases. */
export function sortRows<T extends Sortable>(rows: T[], sort: SortOption): T[] {
  return [...rows].sort((a, b) => {
    if (sort === 'newest') return createdTime(b) - createdTime(a);
    if (sort === 'pay') {
      const pa = a.facts.estimatedTotal;
      const pb = b.facts.estimatedTotal;
      const byPay = pa == null || pb == null ? compareNullable(pa, pb) : pb - pa;
      if (byPay !== 0) return byPay;
    }
    return compareNullable(a.facts.first?.start.getTime(), b.facts.first?.start.getTime());
  });
}
