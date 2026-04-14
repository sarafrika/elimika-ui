import {
  getEnrollmentsForClassOptions,
  getStudentByIdOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  GetEnrollmentsForClassResponse,
  GetStudentByIdResponse,
  GetUserByUuidResponse,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type Enrollment = NonNullable<GetEnrollmentsForClassResponse['data']>[number];
type Student = GetStudentByIdResponse;
type User = NonNullable<GetUserByUuidResponse['data']>;
export type RosterEntry = {
  enrollment: Enrollment;
  student: Student | undefined;
  user: User | null | undefined;
};

export function useClassRoster(classId: string | undefined) {
  const enrollmentQuery = useQuery(
    getEnrollmentsForClassOptions({
      path: { uuid: classId as string },
    })
  );

  const allEnrollments = enrollmentQuery?.data?.data ?? [];

  const uniqueEnrollments = useMemo(() => {
    return Object.values(
      allEnrollments.reduce<Record<string, Enrollment>>((acc, e) => {
        acc[e.student_uuid] = e;
        return acc;
      }, {})
    );
  }, [allEnrollments]);

  const studentQueries = useQueries({
    queries: uniqueEnrollments.map(enrol => ({
      ...getStudentByIdOptions({
        path: { uuid: enrol?.student_uuid },
      }),
      enabled: !!enrol?.student_uuid,
    })),
  });

  const students = studentQueries
    .map(q => q.data)
    .filter((student): student is Student => Boolean(student));

  const userQueries = useQueries({
    queries: students.map(stu => ({
      ...getUserByUuidOptions({
        path: { uuid: stu?.data?.user_uuid },
      }),
      enabled: !!stu?.data?.user_uuid,
    })),
  });

  const users = userQueries.map(q => q.data?.data).filter((user): user is User => Boolean(user));

  const roster = useMemo<RosterEntry[]>(() => {
    return uniqueEnrollments.map((enrollment, index) => ({
      enrollment,
      student: studentQueries[index]?.data,
      user: userQueries[index]?.data?.data,
    }));
  }, [uniqueEnrollments, studentQueries, userQueries]);

  const rosterAllEnrollments = useMemo<RosterEntry[]>(() => {
    return allEnrollments.map(enrollment => {
      const student = students.find(s => s.data.uuid === enrollment.student_uuid).data;
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
