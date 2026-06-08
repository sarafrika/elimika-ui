'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CourseEnrollment } from '../services/client';
import { getCourseEnrollmentsOptions } from '../services/client/@tanstack/react-query.gen';

export type EnrollmentMap = Record<
  string,
  {
    enrollments: CourseEnrollment[] | null;
    count: number;
  } | null
>;

export function useCourseEnrollmentsMap(courseUuids: string[]) {
  const enrollmentQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseEnrollmentsOptions({
        path: { courseUuid: uuid },
        query: { pageable: { size: 10000 } }
      }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const courseEnrollmentMap = useMemo<EnrollmentMap>(() => {
    const map: EnrollmentMap = {};

    courseUuids.forEach((uuid, index) => {
      const data = enrollmentQueries[index]?.data?.data?.content;

      map[uuid] = data
        ? {
          enrollments: data,
          count: data.length ?? 0,
        }
        : null;
    });

    return map;
  }, [courseUuids, enrollmentQueries]);

  const isLoading = enrollmentQueries.some(q => q.isPending);

  return { courseEnrollmentMap, isLoading };
}

