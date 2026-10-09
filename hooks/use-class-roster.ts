import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getEnrollmentsForClassOptions } from '@/services/client/@tanstack/react-query.gen';
import type {
  GetEnrollmentsForClassResponse,
  GetUserByUuidResponse,
  Student as StudentRecord,
} from '@/services/client/types.gen';
import { useStudentsByIds, useUsersByIds } from './use-batched-lookups';

type Enrollment = NonNullable<GetEnrollmentsForClassResponse['data']>[number];
// The single-record response wrapper that roster consumers read as `student.data`.
type Student = { success?: boolean; data?: StudentRecord };
type User = NonNullable<GetUserByUuidResponse['data']>;
export type RosterEntry = {
  enrollment: Enrollment;
  student: Student | undefined;
  user: User | null | undefined;
};

const START_ELIGIBLE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);

function isStartEligibleEnrollmentStatus(status: string | null | undefined) {
  return START_ELIGIBLE_ENROLLMENT_STATUSES.has(String(status ?? '').toUpperCase());
}

export function isStartEligibleRosterEntry(entry: RosterEntry | null | undefined) {
  return isStartEligibleEnrollmentStatus(entry?.enrollment?.status);
}

export function useClassRoster(classId: string | undefined) {
  const enrollmentQuery = useQuery({
    ...getEnrollmentsForClassOptions({
      path: { uuid: classId as string },
    }),
    // `enabled` was previously nested inside the API `query` params, where it
    // did nothing — the request fired with a literal {uuid} placeholder
    // whenever classId was undefined.
    enabled: Boolean(classId),
  });

  const allEnrollments = useMemo(() => enrollmentQuery.data?.data ?? [], [enrollmentQuery.data]);

  const uniqueEnrollments = useMemo(() => {
    return Object.values(
      allEnrollments.reduce<Record<string, Enrollment>>((acc, e) => {
        acc[e.student_uuid] = e;
        return acc;
      }, {})
    );
  }, [allEnrollments]);

  const studentIds = useMemo(
    () => uniqueEnrollments.map(enrollment => enrollment.student_uuid).filter(Boolean),
    [uniqueEnrollments]
  );
  const studentsLookup = useStudentsByIds(studentIds);
  const studentMap: Record<string, StudentRecord> = studentsLookup.studentMap;

  const userIds = useMemo(
    () =>
      studentIds
        .map(id => studentMap[id]?.user_uuid)
        .filter((id): id is string => Boolean(id)),
    [studentIds, studentMap]
  );
  const usersLookup = useUsersByIds(userIds);
  const userMap: Record<string, User> = usersLookup.userMap;

  const rosterEntryFor = useMemo(
    () =>
      (enrollment: Enrollment): RosterEntry => {
        const record = studentMap[enrollment.student_uuid];
        const student: Student | undefined = record ? { success: true, data: record } : undefined;
        const user = record?.user_uuid ? userMap[record.user_uuid] : record ? null : undefined;
        return { enrollment, student, user };
      },
    [studentMap, userMap]
  );

  const roster = useMemo<RosterEntry[]>(
    () => uniqueEnrollments.map(rosterEntryFor),
    [uniqueEnrollments, rosterEntryFor]
  );

  const rosterAllEnrollments = useMemo<RosterEntry[]>(
    () => allEnrollments.map(rosterEntryFor),
    [allEnrollments, rosterEntryFor]
  );

  return {
    roster, // unique enrollments
    rosterAllEnrollments, // all enrollments
    uniqueEnrollments,
    allEnrollments,
    isLoading: enrollmentQuery.isLoading || studentsLookup.isLoading || usersLookup.isLoading,

    isError: enrollmentQuery.isError || studentsLookup.isError || usersLookup.isError,

    errors: {
      enrollmentError: enrollmentQuery.error,
      studentErrors: [studentsLookup.error],
      userErrors: [usersLookup.error],
    },
  };
}
