import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAllContentTypesOptions,
  getCourseLessonsOptions,
  getProgramCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ContentType,
  GetLessonContentResponse,
  LessonContent,
  OrganisationCourseContent,
} from '@/services/client/types.gen';
import { courseContentQueryOptions } from '@/src/features/course-record/course-content-query';
import {
  type ProgramCourseLike,
  type ProgramLessonModule,
  useProgramLessonsWithContent,
} from './use-programlessonwithcontent';

type UseClassLessonContentParams = {
  courseUuid?: string | null;
  programUuid?: string | null;
};

export function useClassLessonContent({ courseUuid, programUuid }: UseClassLessonContentParams) {
  const hasProgram = Boolean(programUuid);
  const singleCourseUuid = hasProgram ? '' : (courseUuid ?? '');
  const hasCourse = Boolean(singleCourseUuid);

  const { data: programCoursesResp, isLoading: isLoadingProgramCourses } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programUuid ?? '' } }),
    enabled: hasProgram,
    // A programme's course list is edited by its owner, rarely by whoever is reading the class, so
    // mount revalidation stays on behind the cached paint.
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const programCourses = useMemo<ProgramCourseLike[]>(
    () =>
      (programCoursesResp?.data ?? []).filter((course): course is ProgramCourseLike =>
        Boolean(course?.uuid)
      ),
    [programCoursesResp]
  );

  // Single course: the lesson list and every lesson's content arrive in two parallel calls.
  const lessonsQuery = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: singleCourseUuid },
      query: { pageable: {} },
    }),
    enabled: hasCourse,
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: false,
  });

  const courseContentQuery = useQuery({
    ...courseContentQueryOptions(singleCourseUuid),
    enabled: hasCourse,
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: false,
  });

  const contentTypesQuery = useQuery({
    ...getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    staleTime: STALE_TIMES.reference,
    refetchOnWindowFocus: false,
  });

  const programLessonResult = useProgramLessonsWithContent({
    programUuid: programUuid ?? undefined,
    programCourses,
    enabled: hasProgram,
  });

  const courseLessonModules = useMemo<ProgramLessonModule[]>(() => {
    const lessons = lessonsQuery.data?.data?.content ?? [];
    const courseContent: OrganisationCourseContent | undefined = courseContentQuery.data?.data;
    // Without full access the per-lesson endpoint would deny content too, so lessons stay bare.
    const contentsByLesson = new Map<string, LessonContent[]>();
    if (courseContent?.full_access) {
      for (const lesson of courseContent.lessons ?? []) {
        if (lesson.uuid) contentsByLesson.set(lesson.uuid, lesson.contents ?? []);
      }
    }
    return lessons.map(lesson => {
      const contents = lesson.uuid ? contentsByLesson.get(lesson.uuid) : undefined;
      const content: GetLessonContentResponse | undefined = contents
        ? { success: true, data: contents }
        : undefined;
      return { lesson, content };
    });
  }, [lessonsQuery.data, courseContentQuery.data]);

  const contentTypeData = useMemo<ContentType[]>(() => {
    const content = contentTypesQuery.data?.data?.content;
    return Array.isArray(content) ? content : [];
  }, [contentTypesQuery.data]);

  const contentTypeMap = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        contentTypeData.flatMap(ct => (ct.uuid ? [[ct.uuid, (ct.name ?? '').toLowerCase()]] : []))
      ),
    [contentTypeData]
  );

  const contentTypeDetailsMap = useMemo<Record<string, ContentType>>(
    () => Object.fromEntries(contentTypeData.flatMap(ct => (ct.uuid ? [[ct.uuid, ct]] : []))),
    [contentTypeData]
  );

  const lessonModules = useMemo<ProgramLessonModule[]>(
    () =>
      hasProgram
        ? programLessonResult.coursesWithLessons.flatMap(({ course, lessons }) =>
          lessons.map(lesson => ({
            ...lesson,
            course,
          }))
        )
        : courseLessonModules,
    [courseLessonModules, hasProgram, programLessonResult.coursesWithLessons]
  );
  return {
    contentTypeMap: hasProgram ? programLessonResult.contentTypeMap : contentTypeMap,
    contentTypeDetailsMap: hasProgram
      ? programLessonResult.contentTypeDetailsMap
      : contentTypeDetailsMap,
    isLoading: hasProgram
      ? isLoadingProgramCourses || programLessonResult.isLoading
      : lessonsQuery.isLoading || courseContentQuery.isLoading,
    isFetching: hasProgram
      ? isLoadingProgramCourses || programLessonResult.isFetching
      : lessonsQuery.isFetching || courseContentQuery.isFetching || contentTypesQuery.isFetching,
    lessonModules,
    programCourses,
  };
}
