'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CourseEnrollment, Enrollment } from '../services/client';
import {
  getCourseEnrollmentsOptions,
  getEnrollmentsForClassOptions,
} from '../services/client/@tanstack/react-query.gen';

export type EnrollmentMap = Record<
  string,
  {
    enrollments: CourseEnrollment[] | null;
    count: number;
  } | null
>;

export function useCourseEnrollmentsMap(courseUuids: string[]) {
  // Consumers only need the enrollment COUNT — read it from the page
  // metadata of a size-1 request instead of downloading up to 10,000 rows
  // per course.
  const enrollmentQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseEnrollmentsOptions({
        path: { courseUuid: uuid },
        query: { pageable: { page: 0 } },
      }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });


  const courseEnrollmentMap = useMemo<EnrollmentMap>(() => {
    const map: EnrollmentMap = {};

    courseUuids.forEach((uuid, index) => {
      const page = enrollmentQueries[index]?.data?.data;
      const content = page?.content;

      map[uuid] = content
        ? {
          enrollments: content,
          count: Number(page?.metadata?.totalElements ?? content.length ?? 0),
        }
        : null;
    });

    return map;
  }, [courseUuids, enrollmentQueries]);

  const isLoading = enrollmentQueries.some(q => q.isPending);

  return { courseEnrollmentMap, isLoading };
}

export type ClassEnrollmentMap = Map<string, Enrollment[]>;

export function useClassEnrollmentsMap(classUuids: string[]) {
  const enrollmentQueries = useQueries({
    queries: classUuids.map(uuid => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid },
      }),
      enabled: Boolean(uuid),
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const classEnrollmentsMap = useMemo<ClassEnrollmentMap>(() => {
    const map: ClassEnrollmentMap = new Map();

    classUuids.forEach((uuid, index) => {
      const data = enrollmentQueries[index]?.data?.data ?? [];
      map.set(uuid, data);
    });

    return map;
  }, [classUuids, enrollmentQueries]);

  const isLoading = enrollmentQueries.some(q => q.isPending);

  return { classEnrollmentsMap, isLoading };
}