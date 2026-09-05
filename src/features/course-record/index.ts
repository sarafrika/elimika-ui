/**
 * Course record — one component tree, eight viewers, six dashboards.
 *
 * ## The shape of this feature
 *
 * - `types.ts` — the vocabulary, and `COURSE_ACCESS_CAPABILITIES`: the single
 *   place the eight viewer states are described.
 * - `use-course-record.ts` — the only place data is fetched. Every region comes
 *   back as a `CourseRecordSection` ready for an `<AsyncSection>`.
 * - `use-course-access.ts` — reads `access` off the API response. Never derives
 *   it from the signed-in user's domain.
 * - `CourseRecordView.tsx` — the shell: back bar, hero, KPI band, gate banner,
 *   tabs, body and rail. Slots, not implementations.
 * - `blocks/` — presentational blocks. Props in, markup out.
 *
 * ## House rules
 *
 * 1. No hex. Tokens only — `[data-dashboard-domain]` re-hues `--primary` per
 *    dashboard and a literal colour breaks on five of the six.
 * 2. `access` comes from the API and is read through the capability map. A
 *    `switch (access)` in a block means the map is missing a field.
 * 3. Blocks render; hooks fetch. A `useQuery` under `blocks/` is a bug.
 * 4. Every data region is an `<AsyncSection>` with a shape-matching skeleton,
 *    passed `loading={section.loading}` so a refetch keeps stale content up.
 * 5. Never ship a figure the response did not contain. An absent block is the
 *    right answer; a zero in its place is not.
 */

export * from './blocks';
export { CourseRecordPage, type CourseRecordPageProps } from './CourseRecordPage';
export { CourseRecordView, type CourseRecordViewProps } from './CourseRecordView';
export * from './types';
export {
  resolveCourseAccess,
  useCourseAccess,
  useCourseCapability,
} from './use-course-access';
export {
  COURSE_METRICS_ENDPOINTS_LIVE,
  courseStatsQueryKey,
  courseTrainersQueryKey,
  useCourseStats,
  useCourseTrainers,
} from './use-course-metrics';
export {
  asyncProps,
  COURSE_RECORD_SECTIONS,
  type CourseEnrollmentPage,
  type CourseRecord,
  type CourseRecordSectionId,
  type UseCourseRecordOptions,
  useCourseRecord,
} from './use-course-record';
