import {
  getEnrollmentsForClassOptions,
  getStudentByIdOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useClassRoster(classId: string | undefined) {
  const enrollmentQuery = useQuery(
    getEnrollmentsForClassOptions({
      path: { uuid: classId as string },
    })
  );

  const allEnrollments = enrollmentQuery?.data?.data ?? [];

  const uniqueEnrollments = useMemo(() => {
    return Object.values(
      allEnrollments.reduce((acc: any, e: any) => {
        acc[e.student_uuid] = e;
        return acc;
      }, {})
    );
  }, [allEnrollments]);

  const studentQueries = useQueries({
    queries: uniqueEnrollments.map((enrol: any) => ({
      ...getStudentByIdOptions({
        path: { uuid: enrol?.student_uuid },
      }),
      enabled: !!enrol?.student_uuid,
    })),
  });

  const students = studentQueries.map((q: any) => q?.data?.data).filter(Boolean);

  const userQueries = useQueries({
    queries: students.map((stu: any) => ({
      ...getUserByUuidOptions({
        path: { uuid: stu.user_uuid },
      }),
      enabled: !!stu.user_uuid,
    })),
  });

  const users = userQueries.map(q => q.data?.data).filter(Boolean);

  const roster = useMemo(() => {
    return uniqueEnrollments.map((enrollment: any, index: any) => ({
      enrollment,
      student: studentQueries[index]?.data,
      user: userQueries[index]?.data?.data,
    }));
  }, [uniqueEnrollments, studentQueries, userQueries]);

  const rosterAllEnrollments = useMemo(() => {
    return allEnrollments.map(enrollment => {
      const student = students.find(s => s.uuid === enrollment.student_uuid);
      const user = student ? users.find(u => u.uuid === student.user_uuid) : null;
      return { enrollment, student, user };
    });
  }, [allEnrollments, students, users]);

  return {
    roster, // unique enrollments
    rosterAllEnrollments, // all enrollments
    uniqueEnrollments,
    allEnrollments,
    isLoading:
      enrollmentQuery.isLoading ||
      studentQueries.some(q => q.isLoading) ||
      userQueries.some(q => q.isLoading),

    isError:
      enrollmentQuery.isError ||
      studentQueries.some(q => q.isError) ||
      userQueries.some(q => q.isError),

    errors: {
      enrollmentError: enrollmentQuery.error,
      studentErrors: studentQueries.map(q => q.error),
      userErrors: userQueries.map(q => q.error),
    },
  };
}
