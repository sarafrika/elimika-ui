// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)

import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  ContentType,
  GetCourseLessonsResponse,
  GetLessonContentResponse,
} from '@/services/client/types.gen';
import { courseContentQueryOptions } from '@/src/features/course-record/course-content-query';
import { useUserDomain } from '../context/user-domain-context';
import {
  getAllContentTypesOptions,
  getCourseLessonsOptions,
  getLessonContentOptions,
} from '../services/client/@tanstack/react-query.gen';

type Params = {
  courseUuid?: string;
  enabled?: boolean;
  includeContent?: boolean;
  /** False defers the lesson content fetch, e.g. until a curriculum tab opens. */
  contentEnabled?: boolean;
};

export type CourseLesson = NonNullable<
  NonNullable<GetCourseLessonsResponse['data']>['content']
>[number];
export type CourseLessonContent = NonNullable<
  NonNullable<GetLessonContentResponse['data']>['content']
>[number];
export type CourseLessonWithContent = {
  lesson: CourseLesson;
  content: GetLessonContentResponse | undefined;
};

export function useCourseLessonsWithContent({
  courseUuid,
  enabled = true,
  includeContent = false,
  contentEnabled = true,
}: Params) {
  const { activeDomain } = useUserDomain();
  const isEnabled = enabled && !!courseUuid;

  const {
    data: cLessons,
    isLoading: lessonsLoading,
    isError: lessonsError,
    isFetching: lessonsFetching,
  } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseUuid as string },
      query: { pageable: {} },
    }),
    enabled: isEnabled,
    // Publishing a course restamps its lessons, so the list a reader sees can change without them
    // touching anything; the lesson bodies below are immutable and stay cached.
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const contentAllowed =
    isEnabled && contentEnabled && (includeContent || activeDomain !== 'student');

  // One call returns every lesson's content when the reader has course-level access.
  const courseContentQuery = useQuery({
    ...courseContentQueryOptions(courseUuid as string),
    enabled: contentAllowed,
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: false,
  });

  // Staff without course access (e.g. a hired instructor) can still read each lesson,
  // so only then fall back to the per-lesson content endpoint.
  const needsPerLessonContent =
    contentAllowed &&
    (courseContentQuery.isError ||
      (courseContentQuery.isSuccess && !courseContentQuery.data?.data?.full_access));
  const lessonList = cLessons?.data?.content;

  const perLessonContent = useQueries({
    queries: needsPerLessonContent
      ? (lessonList ?? []).flatMap(lesson =>
          lesson.uuid
            ? [
                {
                  ...getLessonContentOptions({
                    path: { courseUuid: courseUuid as string, lessonUuid: lesson.uuid },
                  }),
                  staleTime: STALE_TIMES.entity,
                  refetchOnWindowFocus: false,
                },
              ]
            : []
        )
      : [],
    combine: results => ({
      byLesson: results.map(result => result.data),
      isLoading: results.some(result => result.isLoading),
      isFetching: results.some(result => result.isFetching),
    }),
  });

  const isAllLessonsDataLoading =
    lessonsLoading || courseContentQuery.isLoading || perLessonContent.isLoading;
  const isAllLessonsDataFetching =
    lessonsFetching || courseContentQuery.isFetching || perLessonContent.isFetching;

  const lessonsWithContent = useMemo(() => {
    const lessons = lessonList ?? [];
    const contentByLesson = new Map<string, GetLessonContentResponse | undefined>();
    if (needsPerLessonContent) {
      lessons
        .filter(lesson => Boolean(lesson.uuid))
        .forEach((lesson, index) => {
          contentByLesson.set(lesson.uuid as string, perLessonContent.byLesson[index]);
        });
    } else if (courseContentQuery.data?.data?.full_access) {
      for (const lesson of courseContentQuery.data.data.lessons ?? []) {
        if (lesson.uuid) {
          contentByLesson.set(lesson.uuid, { success: true, data: lesson.contents ?? [] });
        }
      }
    }
    return lessons.map(
      (lesson): CourseLessonWithContent => ({
        lesson,
        content: lesson.uuid ? contentByLesson.get(lesson.uuid) : undefined,
      })
    );
  }, [lessonList, needsPerLessonContent, perLessonContent.byLesson, courseContentQuery.data]);

  const { data: contentTypeList, isFetching: contentTypeFetching } = useQuery({
    ...getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    enabled: isEnabled,
  });

  const contentTypeData = useMemo(() => {
    const content = contentTypeList?.data?.content;
    return Array.isArray(content) ? content : [];
  }, [contentTypeList]);

  const contentTypeMap = useMemo(() => {
    return Object.fromEntries(contentTypeData.map(ct => [ct.uuid, ct.name.toLowerCase()]));
  }, [contentTypeData]);

  const contentTypeDetailsMap = useMemo<Record<string, ContentType>>(() => {
    return Object.fromEntries(
      contentTypeData
        .filter((ct): ct is ContentType & { uuid: string } => Boolean(ct.uuid))
        .map(ct => [ct.uuid, ct])
    );
  }, [contentTypeData]);

  return {
    isLoading: isAllLessonsDataLoading,
    isFetching: isAllLessonsDataFetching || contentTypeFetching,
    isError: lessonsError,
    isLessonListLoading: lessonsLoading,
    isLessonListFetching: lessonsFetching,
    lessons: lessonsWithContent,
    contentTypes: contentTypeData,
    contentTypeMap,
    contentTypeDetailsMap,
  };
}
