'use client';

import { useMemo } from 'react';

import {
  type CourseAccess,
  type CourseAccessCapability,
  type CourseRecordContent,
  courseCapability,
  DEFAULT_COURSE_ACCESS,
  isCourseAccess,
} from './types';

/**
 * Resolve the viewer state for a course record.
 *
 * ## `access` comes from the API. Always.
 *
 * The course-content response carries an `access` string, and that string is the
 * only input to this hook. It is **never** re-derived from the signed-in user's
 * domain, the active dashboard, an `activeDomain` check, a `full_access`
 * boolean, or a uuid comparison against `course.course_creator_uuid`.
 *
 * That rule is not stylistic. The server is the only party that knows whether a
 * training application was approved, whether an enrolment is paid, or whether an
 * approval has since been withdrawn — and it is the only party that then
 * withholds the lesson bodies. A client-side guess would open the UI for content
 * the response does not contain (an outline rendered as if it were the full
 * course) or, worse, dress a request up as authorised when it is not. The domain
 * a user is browsing under says what they *are*; only the API says what they may
 * *see* of this particular course.
 *
 * While the content query is in flight, or when it fails, or when it comes back
 * without the field (an older deployment), the answer is `prospect`: the
 * least-privileged state, which shows the public listing and no teaching
 * material. Widening happens only on an explicit instruction from the server.
 */
export function useCourseAccess(content: CourseRecordContent | undefined): CourseAccess {
  return useMemo(() => resolveCourseAccess(content), [content]);
}

/** The same resolution, outside React (server components, tests, loaders). */
export function resolveCourseAccess(content: CourseRecordContent | undefined): CourseAccess {
  const access = content?.access;
  return isCourseAccess(access) ? access : DEFAULT_COURSE_ACCESS;
}

/** Convenience: the resolved access level *and* its capability row. */
export function useCourseCapability(content: CourseRecordContent | undefined): {
  access: CourseAccess;
  capability: CourseAccessCapability;
} {
  const access = useCourseAccess(content);
  return useMemo(() => ({ access, capability: courseCapability(access) }), [access]);
}
