import { useQueries, useQuery } from '@tanstack/react-query';
import {
  getClassDefinitionOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getStudentScheduleOptions,
} from '../services/client/@tanstack/react-query.gen';

function useStudentClassDefinitions(student?: any) {
  // 1️⃣ Fetch student enrollments
  const { data: enrollmentsData } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: { start: '2024-10-10' as any, end: '2025-10-10' as any },
    }),
    enabled: !!student?.uuid,
  });

  const enrollments = enrollmentsData?.data ?? [];

  // 2️⃣ Extract all unique class definition UUIDs
  const classDefinitionUuids = Array.from(
    new Set(enrollments.map((en: any) => en.class_definition_uuid))
  );

  // 3️⃣ Fetch each class definition
  const classQueries = useQueries({
    queries:
      classDefinitionUuids.map((uuid: string) => ({
        ...getClassDefinitionOptions({ path: { uuid } }),
        enabled: !!uuid,
      })) || [],
  });

  // 3️⃣ Fetch each class definition
  const scheduleQueries = useQueries({
    queries:
      classDefinitionUuids.map((uuid: string) => ({
        ...getClassScheduleOptions({ path: { uuid }, query: { pageable: {} } }),
        enabled: !!uuid,
      })) || [],
  });

  // Extract class details after fetching
  const classDetailsArray = classQueries.map(q => q.data?.data ?? null);

  // 4️⃣ Extract unique course UUIDs from the resolved class details
  const courseUuids = Array.from(
    new Set(
      classDetailsArray
        .map((cls: any) => cls?.course_uuid)
        .filter((uuid: string | undefined) => !!uuid)
    )
  );

  // 5️⃣ Fetch courses associated with these class definitions
  const courseQueries = useQueries({
    queries:
      courseUuids.map((uuid: string) => ({
        ...getCourseByUuidOptions({ path: { uuid } }),
        enabled: !!uuid,
      })) || [],
  });

  const classScheduleArray = scheduleQueries.map(q => q.data?.data?.content);
  const courseDetailsArray = courseQueries.map(q => q.data?.data ?? null);

  // 6️⃣ Merge class + course + enrollment data
  const classDefinitions = classDefinitionUuids.map((uuid: string, i: number) => {
    const classDetails = classDetailsArray[i];
    const course = courseDetailsArray.find((c: any) => c?.uuid === classDetails?.course_uuid);

    return {
      uuid,
      classDetails,
      course,
      enrollments: enrollments.filter((en: any) => en.class_definition_uuid === uuid),
      schedules: classScheduleArray,
    };
  });

  // 7️⃣ Handle loading and error states
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
