import { useQueries, useQuery } from '@tanstack/react-query';
import {
  getClassDefinitionsForInstructorOptions,
  getCourseByUuidOptions,
  getInstructorByUuidOptions
} from '../services/client/@tanstack/react-query.gen';


// hook
function useInstructorClassesWithDetails(instructorUuid?: string) {
  const { data, isLoading, isPending, isFetching } = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: {},
    }),
    enabled: !!instructorUuid,
  });

  const classesData = data?.data ?? [];
  const classes = classesData?.map(item => item.class_definition)

  const courseQueries = useQueries({
    queries:
      classes.map((cls: any) => ({
        ...getCourseByUuidOptions({
          path: { uuid: cls.course_uuid },
        }),
        enabled: !!cls.course_uuid,
      })) || [],
  });

  // const scheduleQueries = useQueries({
  //   queries:
  //     classes.map((cls: any) => ({
  //       ...getClassScheduleOptions({
  //         path: { uuid: cls.course_uuid }, query: { pageable: {} }
  //       }),
  //       enabled: !!cls.course_uuid,
  //     })) || [],
  // });

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
  // @ts-expect-error
  const instructors = instructorQueries.map(q => q.data?.data ?? null);
  // const schedules = scheduleQueries.map(q => q.data?.data?.content ?? null)

  const classesWithCourseAndInstructor = classes.map((cls: any, i: number) => ({
    ...cls,
    course: courses[i],
    instructor: instructors[i],
    // schedule: schedules[i]
  }));

  const isCoursesLoading = courseQueries.some(q => q.isLoading || q.isFetching);
  const isInstructorsLoading = instructorQueries.some(q => q.isLoading || q.isFetching);
  // const isSchedulesLoading = scheduleQueries.some(q => q.isLoading || q.isFetching);


  const loading = isLoading || isFetching || isCoursesLoading || isInstructorsLoading;

  return {
    classes: classesWithCourseAndInstructor,
    loading,
    isPending,
  };
}

export default useInstructorClassesWithDetails;
