import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseByUuidOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';

/** The blocking query of a course record page, for IntentLink's prefetchQuery. */
export function coursePrefetchQuery(uuid: string | undefined) {
  if (!uuid) return undefined;
  return { ...getCourseByUuidOptions({ path: { uuid } }), staleTime: STALE_TIMES.entity };
}

/** The blocking query of a programme detail page. */
export function programPrefetchQuery(uuid: string | undefined) {
  if (!uuid) return undefined;
  return { ...getTrainingProgramByUuidOptions({ path: { uuid } }), staleTime: STALE_TIMES.entity };
}

/** Picks the course or programme query for a catalogue item. */
export function catalogItemPrefetchQuery(kind: 'course' | 'program', uuid: string | undefined) {
  return kind === 'program' ? programPrefetchQuery(uuid) : coursePrefetchQuery(uuid);
}
