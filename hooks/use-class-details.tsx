import type {
  GetClassDefinitionResponse,
  GetClassScheduleResponse,
  GetCourseByUuidResponse,
  GetCourseLessonsResponse,
  GetEnrollmentsForClassResponse,
  GetProgramCoursesResponse,
  GetTrainingProgramByUuidResponse,
} from '@/services/client/types.gen';
import { useQuery } from '@tanstack/react-query';
import {
  getClassDefinitionOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getCourseLessonsOptions,
  getEnrollmentsForClassOptions,
  getInstructorByUuidOptions,
  getProgramCoursesOptions,
  getTrainingProgramByUuidOptions,
  getUserByUuidOptions,
} from '../services/client/@tanstack/react-query.gen';

export type ClassDetailsClass = NonNullable<
  NonNullable<GetClassDefinitionResponse['data']>['class_definition']
>;
export type ClassDetailsScheduleItem = NonNullable<
  NonNullable<GetClassScheduleResponse['data']>['content']
>[number];
export type ClassDetailsCourse = NonNullable<GetCourseByUuidResponse['data']>;
export type ClassDetailsProgramCourse = NonNullable<
  NonNullable<GetProgramCoursesResponse['data']>[number]
>;
export type ClassDetailsProgram = NonNullable<GetTrainingProgramByUuidResponse['data']>;
export type ClassDetailsLesson = NonNullable<
  NonNullable<GetCourseLessonsResponse['data']>['content']
>[number];
export type ClassDetailsEnrollment = NonNullable<
  NonNullable<GetEnrollmentsForClassResponse['data']>[number]
>;

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
  const programUuid = classDefinition?.program_uuid;

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

  // Fetch instructor details
  const { data: instructorResp } = useQuery({
    ...getInstructorByUuidOptions({
      path: { uuid: classDefinition?.default_instructor_uuid as string },
    }),
    enabled: !!classDefinition?.default_instructor_uuid,
  });

  const { data: instructorProfile } = useQuery({
    ...getUserByUuidOptions({
      path: { uuid: instructorResp?.user_uuid as string },
    }),
    enabled: !!instructorResp?.user_uuid,
  });


  // 🧩 Combined loading state
  const isLoading =
    isLoadingClass ||
    isLoadingSchedule ||
    isLoadingEnrollments ||
    isLoadingCourse ||
    isLoadingLessons ||
    isPCoursesLoading ||
    isLoadingProgram;

  return {
    data: {
      class: classDefinition,
      schedule: classScheduleData?.data?.content ?? [],
      course: courseDetailData?.data,
      pCourses: pCourses?.data || [],
      program: programDetailData?.data,
      lessons: courseLessonsData?.data?.content ?? [],
      enrollments: classEnrollments?.data ?? [],
      instructor: instructorResp,
      instructorProfile: instructorProfile?.data,
    },
    isLoading,
    isError: isClassError,
  };
};
