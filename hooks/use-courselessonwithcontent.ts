import type {
  ContentType,
  GetCourseLessonsResponse,
  GetLessonContentResponse,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getAllContentTypesOptions,
  getCourseLessonsOptions,
  getLessonContentOptions,
} from '../services/client/@tanstack/react-query.gen';

type Params = {
  courseUuid?: string;
  enabled?: boolean;
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

export function useCourseLessonsWithContent({ courseUuid, enabled = true }: Params) {
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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const lessonContentQueries = useQueries({
    queries:
      cLessons?.data?.content?.map(lesson => ({
        ...getLessonContentOptions({
          path: {
            courseUuid: courseUuid as string,
            lessonUuid: lesson.uuid as string,
          },
        }),
        enabled: isEnabled && !!lesson.uuid,
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      })) || [],
  });

  // Aggregate loading/fetching states
  const isLessonContentLoading = lessonContentQueries.some(q => q.isLoading);
  const isLessonContentFetching = lessonContentQueries.some(q => q.isFetching);

  const isAllLessonsDataLoading = lessonsLoading || isLessonContentLoading;
  const isAllLessonsDataFetching = lessonsFetching || isLessonContentFetching;

  const lessonContentData = useMemo(
    () => lessonContentQueries.map(q => q.data),
    [lessonContentQueries]
  );

  const lessonsWithContent = useMemo(() => {
    return (
      cLessons?.data?.content?.map(
        (lesson, index): CourseLessonWithContent => ({
          lesson,
          content: lessonContentData[index],
        })
      ) ?? []
    );
  }, [cLessons?.data?.content, lessonContentData]);

  const { data: contentTypeList, isFetching: contentTypeFetching } = useQuery(
    {
      ...getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } }),
      enabled: isEnabled,
    }
  );

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
    lessons: lessonsWithContent,
    contentTypes: contentTypeData,
    contentTypeMap,
    contentTypeDetailsMap,
  };
}
