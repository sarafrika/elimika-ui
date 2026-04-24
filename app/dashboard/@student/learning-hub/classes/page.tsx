'use client';

import { useStudent } from '@/context/student-context';
import {
  getClassEnrollmentsForStudentOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import StudentClassPage from './_components/StudentClassPage';

export default function Page() {
  const student = useStudent();

  const { data: studentEnrolledClassResp } = useQuery({
    ...getClassEnrollmentsForStudentOptions({ path: { studentUuid: student?.uuid as string }, query: { pageable: {} } })
  })
  const studentEnrolledClasses = studentEnrolledClassResp?.data?.content || []

  return (
    <StudentClassPage
      studentEnrolledClasses={studentEnrolledClasses ?? []}
      loading={false}
    />
  );
}
