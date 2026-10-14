'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { STALE_TIMES } from '@/lib/query-client';
import type { Course, Lesson } from '@/services/client';
import {
  getCourseLessonsOptions,
  getProgramCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ApplyKind } from '../types';
import type { PlanLesson } from './model';

const MAX_PROGRAM_COURSES = 12;
const LESSON_PAGE = { page: 0, size: 200 };

/** Active lessons by lesson number, as the server counts them. */
function activeLessons(lessons: Lesson[] | undefined, course: Pick<Course, 'uuid' | 'name'>) {
  return (lessons ?? [])
    .filter(lesson => lesson.active === true && lesson.uuid)
    .sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0))
    .map<PlanLesson>(lesson => ({
      uuid: lesson.uuid as string,
      number: lesson.lesson_number,
      title: lesson.title || `Lesson ${lesson.lesson_number}`,
      courseUuid: course.uuid ?? lesson.course_uuid,
      courseTitle: course.name ?? null,
    }));
}

type LessonPageResult = {
  data?: { data?: { content?: Lesson[] } };
  isLoading: boolean;
  error: unknown;
  refetch: () => unknown;
};

/** Module-level so React Query keeps the combined value stable between renders. */
function combineMemberLessons(results: LessonPageResult[]) {
  return {
    pages: results.map(result => result.data?.data?.content),
    loading: results.some(result => result.isLoading),
    error: results.find(result => result.error)?.error ?? null,
    refetch: () => {
      for (const result of results) void result.refetch();
    },
  };
}

/**
 * The lessons a lesson plan must cover: a course's active lessons, or each member
 * course's in programme sequence.
 */
export function usePlanLessons(kind: ApplyKind | null, uuid: string | null) {
  const forCourse = kind === 'course' && Boolean(uuid);
  const forProgram = kind === 'program' && Boolean(uuid);

  const courseLessons = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: uuid ?? '' },
      query: { pageable: LESSON_PAGE },
    }),
    enabled: forCourse,
    staleTime: STALE_TIMES.entity,
  });

  const programCourses = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: uuid ?? '' } }),
    enabled: forProgram,
    staleTime: STALE_TIMES.entity,
  });
  const courses = useMemo(
    // Capped so a large programme cannot fan out into one request per course.
    () =>
      forProgram
        ? (programCourses.data?.data ?? [])
            .filter(course => course.uuid)
            .slice(0, MAX_PROGRAM_COURSES)
        : [],
    [forProgram, programCourses.data]
  );

  const member = useQueries({
    queries: courses.slice(0, MAX_PROGRAM_COURSES).map(course => ({
      ...getCourseLessonsOptions({
        path: { courseUuid: course.uuid as string },
        query: { pageable: LESSON_PAGE },
      }),
      staleTime: STALE_TIMES.entity,
    })),
    combine: combineMemberLessons,
  });

  const lessons = useMemo<PlanLesson[]>(() => {
    if (forCourse)
      return activeLessons(courseLessons.data?.data?.content, { uuid: uuid ?? '', name: '' }).map(
        lesson => ({ ...lesson, courseTitle: null })
      );
    if (forProgram)
      return courses.flatMap((course, index) => activeLessons(member.pages[index], course));
    return [];
  }, [forCourse, forProgram, courseLessons.data, courses, uuid, member.pages]);

  const loading = forCourse
    ? courseLessons.isLoading
    : forProgram
      ? programCourses.isLoading || member.loading
      : false;
  const error = forCourse
    ? courseLessons.error
    : forProgram
      ? (programCourses.error ?? member.error)
      : null;

  const refetch = () => {
    if (forCourse) void courseLessons.refetch();
    if (forProgram) {
      void programCourses.refetch();
      member.refetch();
    }
  };

  return { lessons, courses, loading, error, refetch };
}
