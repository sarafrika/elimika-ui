// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
import {
  getCourseByUuid,
  getCourseLessons,
  getInstructorByUuid,
  getProgramCourses,
  getTrainingProgramByUuid,
  getUserByUuid,
} from '@/services/client';
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
  getEnrollmentsForClassOptions,
  getInstructorByUuidOptions,
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
export type CombinedClassDetailsData = {
  class: ClassDetailsClass | undefined;
  schedule: ClassDetailsScheduleItem[];
  course: ClassDetailsCourse | undefined;
  pCourses: ClassDetailsProgramCourse[];
  program: ClassDetailsProgram | undefined;
  lessons: ClassDetailsLesson[];
  enrollments: ClassDetailsEnrollment[];
  instructor: Awaited<ReturnType<typeof getInstructorByUuidOptions>> extends infer T ? T : unknown;
  instructorProfile: unknown;
};

/**
 * Everything that depends on the class definition is fetched in a single
 * queryFn with Promise.all, so the waterfall is two steps deep
 * (definition → related) instead of chaining query-by-query across render
 * cycles. The instructor's user profile is the only inherently sequential
 * fetch and runs inside the same step.
 */
async function fetchClassRelated(params: {
  courseUuid?: string;
  programUuid?: string;
  instructorUuid?: string;
}) {
  const { courseUuid, programUuid, instructorUuid } = params;

  const [course, lessons, pCourses, program, instructorWithProfile] = await Promise.all([
    courseUuid ? getCourseByUuid({ path: { uuid: courseUuid } }) : null,
    courseUuid
      ? getCourseLessons({ path: { courseUuid }, query: { pageable: {} } })
      : null,
    programUuid ? getProgramCourses({ path: { programUuid } }) : null,
    programUuid ? getTrainingProgramByUuid({ path: { uuid: programUuid } }) : null,
    (async () => {
      if (!instructorUuid) return { instructor: undefined, profile: undefined };
      const instructorResp = await getInstructorByUuid({ path: { uuid: instructorUuid } });
      const instructor = instructorResp.data;
      const profile = instructor?.user_uuid
        ? (await getUserByUuid({ path: { uuid: instructor.user_uuid } })).data?.data
        : undefined;
      return { instructor, profile };
    })(),
  ]);

  return {
    course: course?.data?.data,
    lessons: course ? (lessons?.data?.data?.content ?? []) : [],
    pCourses: pCourses?.data?.data ?? [],
    program: program?.data?.data,
    instructor: instructorWithProfile.instructor,
    instructorProfile: instructorWithProfile.profile,
  };
}

export const useClassDetails = (classId?: string) => {
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

  // Schedule and enrollments only need the class id — fetched in parallel
  // with the definition.
  const { data: classScheduleData, isLoading: isLoadingSchedule } = useQuery({
    ...getClassScheduleOptions({
      path: { uuid: classId as string },
      query: { pageable: { size: 200 } },
    }),
    enabled: !!classId,
  });

  const { data: classEnrollments, isLoading: isLoadingEnrollments } = useQuery({
    ...getEnrollmentsForClassOptions({
      path: { uuid: classId as string },
    }),
    enabled: !!classId,
  });

  const courseUuid = classDefinition?.course_uuid;
  const programUuid = classDefinition?.program_uuid;
  const instructorUuid = classDefinition?.default_instructor_uuid;

  const { data: related, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['class-details-related', { courseUuid, programUuid, instructorUuid }],
    queryFn: () => fetchClassRelated({ courseUuid, programUuid, instructorUuid }),
    enabled: Boolean(courseUuid || programUuid || instructorUuid),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    isLoadingClass ||
    isLoadingSchedule ||
    isLoadingEnrollments ||
    (Boolean(classDefinition) && isLoadingRelated);

  return {
    data: {
      class: classDefinition,
      schedule: classScheduleData?.data?.content ?? [],
      course: related?.course,
      pCourses: related?.pCourses ?? [],
      program: related?.program,
      lessons: related?.lessons ?? [],
      enrollments: classEnrollments?.data ?? [],
      instructor: related?.instructor,
      instructorProfile: related?.instructorProfile,
    },
    isLoading,
    isError: isClassError,
  };
};
