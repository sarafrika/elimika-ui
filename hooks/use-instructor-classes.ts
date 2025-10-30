import { useQueries, useQuery } from '@tanstack/react-query';
import {
  getClassDefinitionsForInstructorOptions,
  getCourseByUuidOptions,
  getInstructorByUuidOptions,
} from '../services/client/@tanstack/react-query.gen';

function useInstructorClassesWithDetails(instructorUuid?: string) {
  const { data, isLoading, isPending, isFetching } = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: { activeOnly: false },
    }),
    enabled: !!instructorUuid,
  });

  const classes = data?.data ?? [];

  const courseQueries = useQueries({
    queries:
      classes.map((cls: any) => ({
        ...getCourseByUuidOptions({
          path: { uuid: cls.course_uuid },
        }),
        enabled: !!cls.course_uuid,
      })) || [],
  });

  const instructorQueries = useQueries({
    queries:
      classes.map((cls: any) => ({
        ...getInstructorByUuidOptions({
          path: { uuid: cls.default_instructor_uuid },
        }),
        enabled: !!cls.default_instructor_uuid,
      })) || [],
  });

  const courses = courseQueries.map(q => q.data?.data ?? null);
  // @ts-ignore
  const instructors = instructorQueries.map(q => q.data?.data ?? null);

  const classesWithCourseAndInstructor = classes.map((cls: any, i: number) => ({
    ...cls,
    course: courses[i],
    instructor: instructors[i],
  }));

  const isCoursesLoading = courseQueries.some(q => q.isLoading || q.isFetching);
  const isInstructorsLoading = instructorQueries.some(q => q.isLoading || q.isFetching);

  const loading = isLoading || isFetching || isCoursesLoading || isInstructorsLoading;

  return {
    classes: classesWithCourseAndInstructor,
    loading,
    isPending,
  };
}

export default useInstructorClassesWithDetails;
