import type { QueryClient } from '@tanstack/react-query';
import type {
  ClassDefinition,
  ClassDefinitionResponse,
  ClassMarketplaceJob,
  Course,
  User,
} from '@/services/client/types.gen';
import { isQueryHashInRenderedDomain } from '@/src/features/dashboard/lib/acting-domain-query-scope';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Rows of an `{ data: T[] }` or `{ data: { content: T[] } }` envelope. */
function listRows(data: unknown): unknown[] {
  if (!isRecord(data)) return [];
  const payload = data.data;
  if (Array.isArray(payload)) return payload;
  return isRecord(payload) && Array.isArray(payload.content) ? payload.content : [];
}

/** First row matching `guard` in any cached list answer of `listQueryIds` for this dashboard. */
function findCachedListRow<T>(
  queryClient: QueryClient,
  listQueryIds: ReadonlySet<string>,
  guard: (row: unknown) => row is T
): T | undefined {
  for (const query of queryClient.getQueryCache().getAll()) {
    const head = query.queryKey[0];
    if (!isRecord(head) || typeof head._id !== 'string' || !listQueryIds.has(head._id)) continue;
    if (!isQueryHashInRenderedDomain(query.queryHash)) continue;
    const row = listRows(query.state.data).find(guard);
    if (row !== undefined) return row;
  }
  return undefined;
}

const COURSE_LIST_IDS: ReadonlySet<string> = new Set([
  'searchCourses',
  'getAllCourses',
  'getPublishedCourses',
]);
const JOB_LIST_IDS: ReadonlySet<string> = new Set(['listJobs']);
const CLASS_LIST_IDS: ReadonlySet<string> = new Set([
  'getClassDefinitionsForOrganisation',
  'getClassDefinitionsForInstructor',
  'getClassDefinitionsForCourse',
  'getClassDefinitionsForProgram',
  'getAllActiveClassDefinitions',
  'getAllClassDefinitions',
]);
const PERSON_LIST_IDS: ReadonlySet<string> = new Set([
  'search',
  'getAllUsers',
  'getUsersByOrganisationAndDomain',
]);

/** Placeholder for a course detail read, taken from a list row already on screen. */
export function courseFromListCache(queryClient: QueryClient, uuid: string | undefined) {
  if (!uuid) return undefined;
  const isRow = (row: unknown): row is Course =>
    isRecord(row) && row.uuid === uuid && typeof row.name === 'string';
  const row = findCachedListRow(queryClient, COURSE_LIST_IDS, isRow);
  return row ? { success: true, data: row } : undefined;
}

/** Placeholder for a job detail read, taken from a list row already on screen. */
export function jobFromListCache(queryClient: QueryClient, uuid: string | undefined) {
  if (!uuid) return undefined;
  const isRow = (row: unknown): row is ClassMarketplaceJob => isRecord(row) && row.uuid === uuid;
  const row = findCachedListRow(queryClient, JOB_LIST_IDS, isRow);
  return row ? { success: true, data: row } : undefined;
}

/** Placeholder for a class detail read, taken from a list row already on screen. */
export function classFromListCache(queryClient: QueryClient, uuid: string | undefined) {
  if (!uuid) return undefined;
  const isRow = (row: unknown): row is ClassDefinitionResponse =>
    isRecord(row) && isRecord(row.class_definition) && row.class_definition.uuid === uuid;
  const row = findCachedListRow(queryClient, CLASS_LIST_IDS, isRow);
  if (row) return { success: true, data: row };
  // Some class lists return the bare definition rather than the response wrapper.
  const isFlatRow = (value: unknown): value is ClassDefinition =>
    isRecord(value) && value.uuid === uuid && typeof value.title === 'string';
  const flat = findCachedListRow(queryClient, CLASS_LIST_IDS, isFlatRow);
  return flat ? { success: true, data: { class_definition: flat } } : undefined;
}

/** Placeholder for a person detail read, taken from a directory row already on screen. */
export function personFromListCache(queryClient: QueryClient, uuid: string | undefined) {
  if (!uuid) return undefined;
  const isRow = (row: unknown): row is User =>
    isRecord(row) && row.uuid === uuid && typeof row.email === 'string';
  const row = findCachedListRow(queryClient, PERSON_LIST_IDS, isRow);
  return row ? { success: true, data: row } : undefined;
}
