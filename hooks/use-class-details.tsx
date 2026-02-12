import { useQuery } from '@tanstack/react-query';
import {
  getClassDefinitionOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getCourseLessonsOptions,
  getEnrollmentsForClassOptions,
  getProgramCoursesOptions,
  getTrainingProgramByUuidOptions,
} from '../services/client/@tanstack/react-query.gen';

export const useClassDetails = (classId?: string) => {
  //  Fetch class definition
  const {
    data: classDefinitionData,
    isLoading: isLoadingClass,
    isError: isClassError,
  } = useQuery({
    ...getClassDefinitionOptions({
      path: { uuid: classId as string },
    }),
    enabled: !!classId,
  });
  const classDefinition = classDefinitionData?.data?.class_definition;

  //  Fetch class schedule
  const { data: classScheduleData, isLoading: isLoadingSchedule } = useQuery({
    ...getClassScheduleOptions({
      path: { uuid: classId as string },
      query: { pageable: {} },
    }),
    enabled: !!classId,
  });

  //  Fetch class enrollment
  const { data: classEnrollments, isLoading: isLoadingEnrollments } = useQuery({
    ...getEnrollmentsForClassOptions({
      path: { uuid: classId as string },
    }),
    enabled: !!classId,
  });

  const courseUuid = classDefinition?.course_uuid;
  const programUuid = classDefinition?.program_uuid

  //  Fetch course details
  const { data: courseDetailData, isLoading: isLoadingCourse } = useQuery({
    ...getCourseByUuidOptions({
      path: { uuid: courseUuid as string },
    }),
    enabled: !!courseUuid,
  });

  const { data: pCourses, isLoading: isPCoursesLoading } = useQuery({
    ...getProgramCoursesOptions({
      path: { programUuid: programUuid as string },
    }),
    enabled: !!programUuid,
  });

  //  Fetch program details
  const { data: programDetailData, isLoading: isLoadingProgram } = useQuery({
    ...getTrainingProgramByUuidOptions({
      path: { uuid: programUuid as string },
    }),
    enabled: !!programUuid,
  });

  // Fetch course lessons
  const { data: courseLessonsData, isLoading: isLoadingLessons } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseUuid as string },
      query: { pageable: {} },
    }),
    enabled: !!courseUuid,
  });


  // 🧩 Combined loading state
  const isLoading =
    isLoadingClass ||
    isLoadingSchedule ||
    isLoadingEnrollments ||
    isLoadingCourse ||
    isLoadingLessons || isPCoursesLoading || isLoadingProgram;

  return {
    data: {
      class: classDefinition,
      schedule: classScheduleData?.data?.content ?? [],
      course: courseDetailData?.data,
      pCourses: pCourses?.data || [],
      program: programDetailData?.data,
      lessons: courseLessonsData?.data?.content ?? [],
      enrollments: classEnrollments?.data ?? [],
    },
    isLoading,
    isError: isClassError,
  };
};
