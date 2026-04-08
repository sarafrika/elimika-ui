import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { GetAllContentTypesResponse, GetCourseLessonsResponse } from '../services/client';
import {
  getAllContentTypesOptions,
  getCourseLessonsOptions,
  getLessonContentOptions,
} from '../services/client/@tanstack/react-query.gen';

type CourseLesson = NonNullable<NonNullable<GetCourseLessonsResponse['data']>['content']>[number];
type CourseLessonWithUuid = CourseLesson & { uuid: string };
export type ProgramCourseLike = {
  uuid: string;
  name?: string;
  description?: string;
};
export type ProgramCourseLessonWithContent = {
  lesson: CourseLesson;
  content: unknown;
};
export type ProgramCourseWithLessons = {
  course: ProgramCourseLike;
  lessons: ProgramCourseLessonWithContent[];
};

export function useProgramLessonsWithContent({
  programUuid,
  programCourses,
}: {
  programUuid: string;
  programCourses: ProgramCourseLike[] | undefined;
}) {
  // Flatten all courses in the program
  const courseList = (programCourses || []).filter((course): course is ProgramCourseLike =>
    Boolean(course?.uuid)
  );

  // Fetch lessons for each course
  const courseLessonsQueries = useQueries({
    queries: courseList.map(course => ({
      ...getCourseLessonsOptions({
        path: { courseUuid: course.uuid },
        query: { pageable: {} },
      }),
      enabled: !!course.uuid,
    })),
  });

  // For each course, fetch content for each lesson
  const allLessonContentQueries = useQueries({
    queries: courseLessonsQueries.flatMap((q, courseIndex) => {
      const lessons = (q.data?.data?.content || []).filter(
        (lesson): lesson is CourseLessonWithUuid => Boolean(lesson?.uuid)
      );
      const course = courseList[courseIndex];

      if (!course) {
        return [];
      }

      return lessons.map(lesson => ({
        ...getLessonContentOptions({
          path: {
            courseUuid: course.uuid,
            lessonUuid: lesson.uuid,
          },
        }),
        enabled: !!lesson.uuid,
      }));
    }),
  });

  // Aggregate loading states
  const isLessonsLoading = courseLessonsQueries.some(q => q.isLoading);
  const isLessonsFetching = courseLessonsQueries.some(q => q.isFetching);

  const isLessonContentLoading = allLessonContentQueries.some(q => q.isLoading);
  const isLessonContentFetching = allLessonContentQueries.some(q => q.isFetching);

  const isAllDataLoading = isLessonsLoading || isLessonContentLoading;
  const isAllDataFetching = isLessonsFetching || isLessonContentFetching;

  // Map lessons with content per course
  let contentIndex = 0; // keep track of content query index
  const coursesWithLessons = courseList.map((course, courseIndex): ProgramCourseWithLessons => {
    const lessons = courseLessonsQueries[courseIndex]?.data?.data?.content || [];
    const lessonsWithContent = lessons.map(lesson => {
      const content = allLessonContentQueries[contentIndex]?.data;
      contentIndex += 1;
      return { lesson, content };
    });
    return { course, lessons: lessonsWithContent };
  });

  // Fetch content types (same as course hook)
  const { data: contentTypeList, isFetching: contentTypeFetching } = useQuery(
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
    isLoading: isAllDataLoading,
    isFetching: isAllDataFetching || contentTypeFetching,
    coursesWithLessons,
    contentTypes: contentTypeData,
    contentTypeMap,
  };
}
