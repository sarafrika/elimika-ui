import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getAllContentTypesOptions,
  getCourseLessonsOptions,
  getLessonContentOptions,
} from '../services/client/@tanstack/react-query.gen';

type Params = {
  courseUuid?: string;
};

export function useCourseLessonsWithContent({ courseUuid }: Params) {
  const {
    data: cLessons,
    isLoading: lessonsLoading,
    isError: lessonsError,
  } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseUuid as string },
      query: { pageable: {} },
    }),
    enabled: !!courseUuid,
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
        enabled: !!lesson.uuid,
      })) || [],
  });

  const isLessonContentLoading = lessonContentQueries.some(q => q.isLoading);
  const isAllLessonsDataLoading = lessonsLoading || isLessonContentLoading;

  const lessonsWithContent = cLessons?.data?.content?.map((lesson, index) => ({
    lesson,
    content: lessonContentQueries[index]?.data,
  }));

  const { data: contentTypeList } = useQuery(
    getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } })
  );

  const contentTypeData = useMemo(() => {
    const content = contentTypeList?.data?.content;
    return Array.isArray(content) ? content : [];
  }, [contentTypeList]);

  const contentTypeMap = useMemo(() => {
    return Object.fromEntries(contentTypeData.map(ct => [ct.uuid, ct.name.toLowerCase()]));
  }, [contentTypeData]);

  return {
    isLoading: isAllLessonsDataLoading,
    isError: lessonsError,
    lessons: lessonsWithContent,
    contentTypes: contentTypeData,
    contentTypeMap,
  };
}
