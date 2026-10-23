'use client';

import { skipToken, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  hasApiError,
  nextWorkbookPage,
  WORKBOOK_PAGE_SIZE,
} from '@/components/lesson/workbook-data';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseEnrollmentsInfiniteOptions,
  getCourseEnrollmentsInfiniteQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseEnrollment } from '@/services/client/types.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import type { AssessmentResultRow, AssessmentRole } from './assessment-list-data';

/** Course enrollments carry result identities. Resolve only the visible page, one course at a
 * time, stopping once its requested ids are found; never fetch an enrollment per result row. */
export function useResultStudents(rows: AssessmentResultRow[], role: AssessmentRole) {
  const profile = useUserProfile();
  const [enrollments, setEnrollments] = useState<Record<string, CourseEnrollment>>({});
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const groups = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (role !== 'instructor') return [];
    for (const row of rows) {
      const courseId = row.assessment.classMeta.courseUuid;
      if (!courseId) continue;
      const ids = map.get(courseId) ?? new Set<string>();
      ids.add(row.enrollmentUuid);
      map.set(courseId, ids);
    }
    return [...map].map(([courseId, ids]) => ({
      courseId,
      ids,
      key: `${courseId}:${[...ids].sort().join(',')}`,
    }));
  }, [rows, role]);
  const active = groups.find(
    group => !completed.has(group.key) && [...group.ids].some(id => !enrollments[id])
  );
  const options = active
    ? getCourseEnrollmentsInfiniteOptions({
        path: { courseUuid: active.courseId },
        query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
      })
    : null;
  const query = useInfiniteQuery({
    ...options,
    queryKey:
      options?.queryKey ??
      getCourseEnrollmentsInfiniteQueryKey({
        path: { courseUuid: '' },
        query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
      }),
    queryFn: options?.queryFn ?? skipToken,
    enabled: Boolean(active),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    staleTime: STALE_TIMES.entity,
  });
  const failed = query.isError || Boolean(query.data?.pages.some(hasApiError));
  const { data, hasNextPage, isFetching, fetchNextPage } = query;
  const activeKey = active?.key;
  const courseId = active?.courseId;
  const wantedIds = useMemo(() => new Set(active?.ids ?? []), [active]);
  useEffect(() => {
    if (!activeKey || !data || failed || isFetching) return;
    const matches = data.pages
      .flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? [])))
      .filter(item => item.uuid && wantedIds.has(item.uuid) && item.course_uuid === courseId);
    setEnrollments(previous => {
      const next = { ...previous };
      for (const item of matches) if (item.uuid) next[item.uuid] = item;
      return next;
    });
    if (new Set(matches.map(item => item.uuid)).size >= wantedIds.size || !hasNextPage) {
      setCompleted(previous => new Set([...previous, activeKey]));
    } else {
      void fetchNextPage();
    }
  }, [activeKey, courseId, wantedIds, data, failed, isFetching, hasNextPage, fetchNextPage]);
  const studentIds = useMemo(
    () =>
      role === 'instructor' && !active
        ? [
            ...new Set(
              rows.flatMap(row =>
                enrollments[row.enrollmentUuid]?.student_uuid
                  ? [enrollments[row.enrollmentUuid]!.student_uuid]
                  : []
              )
            ),
          ]
        : [],
    [rows, enrollments, role, active]
  );
  const students = useStudentsByIds(studentIds);
  const userIds = useMemo(
    () =>
      Object.values(students.studentMap).flatMap(student =>
        student.user_uuid ? [student.user_uuid] : []
      ),
    [students.studentMap]
  );
  const users = useUsersByIds(userIds);
  const names = useMemo(
    () =>
      Object.fromEntries(
        rows.map(row => {
          if (role === 'student')
            return [row.enrollmentUuid, profile?.student?.full_name || profile?.full_name || 'You'];
          const student = students.studentMap[enrollments[row.enrollmentUuid]?.student_uuid ?? ''];
          const user = student?.user_uuid ? users.userMap[student.user_uuid] : undefined;
          return [
            row.enrollmentUuid,
            student?.full_name ||
              user?.full_name ||
              [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
              '',
          ];
        })
      ),
    [
      rows,
      role,
      profile?.student?.full_name,
      profile?.full_name,
      students.studentMap,
      users.userMap,
      enrollments,
    ]
  );
  const avatars = useMemo(
    () =>
      Object.fromEntries(
        rows.map(row => {
          const student = students.studentMap[enrollments[row.enrollmentUuid]?.student_uuid ?? ''];
          const image =
            role === 'student'
              ? profile?.profile_image_url
              : student?.user_uuid
                ? users.userMap[student.user_uuid]?.profile_image_url
                : undefined;
          return [row.enrollmentUuid, toAuthenticatedMediaUrl(image) ?? undefined];
        })
      ),
    [rows, role, profile?.profile_image_url, students.studentMap, users.userMap, enrollments]
  );
  return {
    names,
    avatars,
    isLoading: Boolean(active) || students.isLoading || users.isLoading,
    isError: failed || students.isError || users.isError,
    retry: () => {
      if (active) void query.refetch();
      void students.refetch();
      void users.refetch();
    },
  };
}
