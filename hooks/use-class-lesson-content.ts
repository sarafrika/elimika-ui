import { getProgramCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useCourseLessonsWithContent } from './use-courselessonwithcontent';
import { useProgramLessonsWithContent } from './use-programlessonwithcontent';

export type UseClassLessonContentParams = {
  courseUuid?: string | null;
  programUuid?: string | null;
};

export function useClassLessonContent({
  courseUuid,
  programUuid,
}: UseClassLessonContentParams) {
  const hasProgram = Boolean(programUuid);

  const { data: programCoursesResp, isLoading: isLoadingProgramCourses } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programUuid ?? '' } }),
    enabled: hasProgram,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const programCourses = useMemo(() => programCoursesResp?.data ?? [], [programCoursesResp]);

  const courseLessonResult = useCourseLessonsWithContent({
    courseUuid: hasProgram ? undefined : courseUuid ?? undefined,
    enabled: !hasProgram && Boolean(courseUuid),
  });

  const programLessonResult = useProgramLessonsWithContent({
    programUuid: programUuid ?? undefined,
    programCourses,
    enabled: hasProgram,
  });

  const lessonModules = useMemo(
    () =>
      hasProgram
        ? programLessonResult.coursesWithLessons.flatMap(({ course, lessons }) =>
            lessons.map(lesson => ({
              ...lesson,
              course,
            }))
          )
        : courseLessonResult.lessons ?? [],
    [courseLessonResult.lessons, hasProgram, programLessonResult.coursesWithLessons]
  );

  return {
    contentTypeMap: hasProgram ? programLessonResult.contentTypeMap : courseLessonResult.contentTypeMap,
    isLoading:
      (hasProgram ? isLoadingProgramCourses || programLessonResult.isLoading : courseLessonResult.isLoading),
    isFetching:
      hasProgram
        ? isLoadingProgramCourses || programLessonResult.isFetching
        : courseLessonResult.isFetching,
    lessonModules,
    programCourses,
  };
}
