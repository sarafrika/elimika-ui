import { localDate } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getAllClassDefinitionsOptions,
  getInstructorScheduleOptions,
} from '../services/client/@tanstack/react-query.gen';
import type {
  ClassDefinition,
  Course,
  Instructor,
  ScheduledInstance,
} from '../services/client/types.gen';
import { useCoursesByIds, useInstructorsByIds } from './use-batched-lookups';

type ClassWithDetails = ClassDefinition & {
  course: Course | null;
  instructor: Instructor | null;
  schedule: Array<ScheduledInstance> | null;
};

/**
 * Previously fetched one course, one instructor and one schedule page per
 * class (3N requests; the admin calendar measured 86 requests). Courses and
 * instructors are now batched lookups, and schedules come from one timetable
 * call per distinct instructor (instances carry class_definition_uuid).
 */
function useAmdinClassesWithDetails() {
  const { data, isLoading, isPending, isFetching } = useQuery({
    ...getAllClassDefinitionsOptions({ query: { pageable: {} } }),
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const classesData = data?.data?.content ?? [];

  const classes = useMemo(
    () =>
      classesData
        .map(item => item.class_definition)
        .filter((item): item is ClassDefinition => item != null),
    [classesData]
  );

  const uniqueCourseUuids = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(cls => {
      if (cls.course_uuid) set.add(cls.course_uuid);
    });
    return Array.from(set);
  }, [classes]);

  const uniqueInstructorUuids = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(cls => {
      if (cls.default_instructor_uuid) set.add(cls.default_instructor_uuid);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [classes]);

  const { courseMap, isLoading: isCoursesLoading } = useCoursesByIds(uniqueCourseUuids);
  const { instructorMap, isLoading: isInstructorsLoading } =
    useInstructorsByIds(uniqueInstructorUuids);

  const scheduleRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 2);
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 2);
    return { start: localDate(start), end: localDate(end) };
  }, []);

  const instructorScheduleQueries = useQueries({
    queries: uniqueInstructorUuids.map(instructorUuid => ({
      ...getInstructorScheduleOptions({
        path: { instructorUuid },
        query: scheduleRange,
      }),
      enabled: !!instructorUuid,
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const schedulesByClass = useMemo(() => {
    const map = new Map<string, ScheduledInstance[]>();
    for (const query of instructorScheduleQueries) {
      for (const instance of query.data?.data ?? []) {
        const classUuid = instance.class_definition_uuid;
        if (!classUuid) continue;
        const current = map.get(classUuid) ?? [];
        current.push(instance);
        map.set(classUuid, current);
      }
    }
    for (const instances of map.values()) {
      instances.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
    }
    return map;
  }, [instructorScheduleQueries]);

  const classesWithCourseAndInstructor = useMemo<Array<ClassWithDetails>>(() => {
    return classes.map(cls => ({
      ...cls,
      course: cls.course_uuid ? ((courseMap[cls.course_uuid] as Course) ?? null) : null,
      instructor: cls.default_instructor_uuid
        ? (instructorMap[cls.default_instructor_uuid] ?? null)
        : null,
      schedule: cls.uuid ? (schedulesByClass.get(cls.uuid) ?? null) : null,
    }));
  }, [classes, courseMap, instructorMap, schedulesByClass]);

  const isSchedulesLoading = instructorScheduleQueries.some(q => q.isLoading);

  const loading =
    isLoading || isFetching || isCoursesLoading || isInstructorsLoading || isSchedulesLoading;

  return {
    classes: classesWithCourseAndInstructor,
    loading,
    isPending,
  };
}

export default useAmdinClassesWithDetails;
