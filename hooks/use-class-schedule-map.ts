// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Enrollment } from '../services/client';
import {
  getClassScheduleOptions,
  getEnrollmentsForClassOptions,
} from '../services/client/@tanstack/react-query.gen';
import { ClassScheduleInstance } from './use-instructor-classes';

export type ScheduleMap = Record<string, ClassScheduleInstance[] | null>;
export type EnrollmentMap = Record<string, Enrollment[] | null>;

export function useClassSchedulesMap(classUuids: string[]) {
  const scheduleQueries = useQueries({
    queries: classUuids.map(uuid => ({
      ...getClassScheduleOptions({
        path: { uuid },
        query: { pageable: { size: 200 } },
      }),
      enabled: !!uuid,
      // A reschedule or cancellation made anywhere but the two schedule managers reaches no
      // invalidation path — getClassSchedule is outside the volatile restore set — so the timed
      // mount refetch is the only correction, and staleTime is what throttles the per-class fan-out.
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const scheduleMap = useMemo<ScheduleMap>(() => {
    const map: ScheduleMap = {};

    classUuids.forEach((uuid, index) => {
      map[uuid] = scheduleQueries[index]?.data?.data?.content ?? null;
    });

    return map;
  }, [classUuids, scheduleQueries]);

  const isLoading = scheduleQueries.some(q => q.isPending);

  return { scheduleMap, isLoading };
}

export function useEnrollmentMap(classUuids: string[]) {
  const enrollmentQueries = useQueries({
    queries: classUuids.map(uuid => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid },
        query: { pageable: { size: 500 } },
      }),
      enabled: !!uuid,
      // The enrolment workflow and the cache-restore predicate both invalidate this key, so gate the
      // mount refetch on that rather than on age: a routine remount must not re-fan-out per class,
      // but an invalidation still has to survive the unmount that plain refetchOnMount:false ate.
      staleTime: 5 * 60 * 1000,
      refetchOnMount: query => query.state.isInvalidated,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const enrollmentMap = useMemo<EnrollmentMap>(() => {
    const map: EnrollmentMap = {};

    classUuids.forEach((uuid, index) => {
      map[uuid] = enrollmentQueries[index]?.data?.data ?? null;
    });

    return map;
  }, [classUuids, enrollmentQueries]);

  const isLoading = enrollmentQueries.some(q => q.isPending);

  return { enrollmentMap, isLoading };
}
