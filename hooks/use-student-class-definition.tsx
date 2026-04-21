import { useQueries, useQuery } from '@tanstack/react-query';
import type {
  GetClassDefinitionResponse,
  GetCourseByUuidResponse,
  GetClassEnrollmentsForStudentResponse,
} from '../services/client';
import {
  getClassEnrollmentsForStudentOptions,
  getClassDefinitionOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
} from '../services/client/@tanstack/react-query.gen';

type StudentLike = {
  uuid?: string;
};

type StudentEnrollment = NonNullable<
  NonNullable<GetClassEnrollmentsForStudentResponse['data']>['content']
>[number];
type ClassDetails = NonNullable<
  NonNullable<GetClassDefinitionResponse['data']>['class_definition']
>;
type CourseDetails = NonNullable<GetCourseByUuidResponse['data']>;

const isDefined = <T,>(value: T | null | undefined): value is T => value != null;

function useStudentClassDefinitions(student?: StudentLike) {
  // 1️⃣ Fetch student class enrollments
  const { data: enrollmentsData } = useQuery({
    ...getClassEnrollmentsForStudentOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!student?.uuid,
  });

  const enrollments = enrollmentsData?.data?.content ?? [];

  // 2️⃣ Extract all unique class definition UUIDs
  const classDefinitionUuids = Array.from(
    new Set(enrollments.map(en => en.class_definition_uuid).filter(isDefined))
  );

  // 3️⃣ Fetch each class definition
  const classQueries = useQueries({
    queries:
      classDefinitionUuids.map((uuid: string) => ({
        ...getClassDefinitionOptions({ path: { uuid } }),
        enabled: !!uuid,
      })) || [],
  });

  // 4️⃣ Fetch each class schedule
  const scheduleQueries = useQueries({
    queries:
      classDefinitionUuids.map((uuid: string) => ({
        ...getClassScheduleOptions({ path: { uuid }, query: { pageable: {} } }),
        enabled: !!uuid,
      })) || [],
  });

  // Extract class details after fetching
  const classDetailsArray = classQueries.map(q => q.data?.data?.class_definition ?? null);

  // 5️⃣ Extract unique course UUIDs from the resolved class details
  const courseUuids = Array.from(
    new Set(classDetailsArray.map(cls => cls?.course_uuid).filter(isDefined))
  );

  // 6️⃣ Fetch courses associated with these class definitions
  const courseQueries = useQueries({
    queries:
      courseUuids.map((uuid: string) => ({
        ...getCourseByUuidOptions({ path: { uuid } }),
        enabled: !!uuid,
      })) || [],
  });

  const classScheduleArray = scheduleQueries.map(q => q.data?.data?.content);
  const courseDetailsArray = courseQueries.map(q => q.data?.data ?? null);

  // 7️⃣ Merge class + course + enrollment data
  const classDefinitions = classDefinitionUuids.map((uuid: string, i: number) => {
    const classDetails = classDetailsArray[i];
    const course = courseDetailsArray.find(
      (c): c is CourseDetails => c?.uuid === classDetails?.course_uuid
    );

    return {
      uuid,
      classDetails,
      course,
      enrollments: enrollments.filter((en: StudentEnrollment) => en.class_definition_uuid === uuid),
      schedules: classScheduleArray[i] ?? [],
    };
  });

  // 8️⃣ Handle loading and error states
  const loading =
    classQueries.some(q => q.isLoading || q.isFetching) ||
    courseQueries.some(q => q.isLoading || q.isFetching);

  const isError = classQueries.some(q => q.isError) || courseQueries.some(q => q.isError);

  return {
    classDefinitions,
    loading,
    isError,
  };
}

export default useStudentClassDefinitions;
