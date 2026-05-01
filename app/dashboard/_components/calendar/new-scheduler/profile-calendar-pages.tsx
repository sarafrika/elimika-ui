'use client';

import { useUserProfile } from '@/context/profile-context';
import useAmdinClassesWithDetails from '@/hooks/use-admin-classes';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import {
  getClassDefinitionOptions,
  getClassDefinitionsForOrganisationOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getEnrollmentsForClassOptions,
  getInstructorByUuidOptions,
  getStudentByIdOptions,
  getStudentScheduleOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course } from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { ClassWithScheduleInput, InstructorSummary, SchedulerCalendarData, StudentSummary } from './calendar-utils';
import { mapClassDefinitionDetails, mapClassSchedule, mapStudentSchedule, toClassLookup } from './calendar-utils';
import { SchedulerCalendarView } from './new-scheduler-calendar-view';
import type { SchedulerProfile } from './types';

function useUserOrganisationUuid() {
  const profile = useUserProfile();
  return (
    profile?.organizations?.[0]?.uuid ||
    profile?.organisation_affiliations?.[0]?.organisation_uuid ||
    undefined
  );
}

function useClassStudentSummaries(classUuids: Array<string | null | undefined>) {
  const normalizedClassUuids = useMemo(
    () => Array.from(new Set(classUuids.filter((uuid): uuid is string => Boolean(uuid && uuid.trim())))),
    [classUuids]
  );

  const enrollmentQueries = useQueries({
    queries: normalizedClassUuids.map(uuid => ({
      ...getEnrollmentsForClassOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const uniqueStudentEntries = useMemo(() => {
    const entries: Array<{
      classDefinitionUuid: string;
      enrollmentUuid?: string;
      studentUuid: string;
    }> = [];

    normalizedClassUuids.forEach((classDefinitionUuid, index) => {
      const enrollments = enrollmentQueries[index]?.data?.data ?? [];
      const seenInClass = new Set<string>();

      // Keep one summary row per student within each class definition.
      // The enrollments endpoint can return multiple rows for the same student,
      // but the calendar rail only needs a single representative entry.
      enrollments.forEach(enrollment => {
        const studentUuid = enrollment.student_uuid?.trim();
        if (!studentUuid || seenInClass.has(studentUuid)) return;

        seenInClass.add(studentUuid);
        entries.push({
          classDefinitionUuid,
          enrollmentUuid: enrollment.uuid,
          studentUuid,
        });
      });
    });

    return entries;
  }, [enrollmentQueries, normalizedClassUuids]);

  const studentQueries = useQueries({
    queries: uniqueStudentEntries.map(entry => ({
      ...getStudentByIdOptions({ path: { uuid: entry.studentUuid } }),
      enabled: !!entry.studentUuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const studentUserUuids = useMemo(
    () =>
      studentQueries
        //@ts-ignore
        .map(query => query?.data?.data?.user_uuid)
        .filter((uuid): uuid is string => !!uuid),
    [studentQueries]
  );

  const studentUserQueries = useQueries({
    queries: studentUserUuids.map(uuid => ({
      ...getUserByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });


  const studentProfilesByUuid = useMemo(() => {
    const map = new Map<string, any>();

    studentUserQueries.forEach(query => {
      const user = query?.data?.data;
      if (user?.uuid) {
        map.set(user.uuid, user);
      }
    });

    return map;
  }, [studentUserQueries]);

  const students = useMemo<StudentSummary[]>(
    () =>
      uniqueStudentEntries
        .map((entry, index) => {
          // @ts-ignore
          const student = studentQueries[index]?.data?.data;
          if (!student?.uuid) return null;

          const user = student.user_uuid ? studentProfilesByUuid.get(student.user_uuid)?.data : undefined;

          return {
            uuid: student.uuid,
            fullName: student.full_name || user?.full_name || user?.display_name || 'Student',
            avatarUrl: user?.profile_image_url,
            classDefinitionUuid: entry.classDefinitionUuid,
            enrollmentUuid: entry.enrollmentUuid,
            studentEnrollmentKey: `${entry.classDefinitionUuid}:${student.uuid}`,
          };
        })
        .filter(value => value !== null) as StudentSummary[],
    [studentProfilesByUuid, studentQueries, uniqueStudentEntries]
  );

  return {
    isLoading:
      enrollmentQueries.some(query => query.isLoading) ||
      studentQueries.some(query => query.isLoading) ||
      studentUserQueries.some(query => query.isLoading),
    students,
  };
}

function AdminCalendarPage() {
  const adminClassesQuery = useAmdinClassesWithDetails();

  const classData = adminClassesQuery.classes ?? [];

  const classInstructorUuids = useMemo(
    () =>
      Array.from(
        new Set(
          classData
            .flatMap(classDef => [
              classDef.default_instructor_uuid,
              classDef.instructor?.uuid,
              ...(classDef.schedule ?? []).map(schedule => schedule.instructor_uuid),
            ])
            .filter((uuid): uuid is string => Boolean(uuid && uuid.trim()))
            .map(uuid => uuid.trim())
        )
      ),
    [classData]
  );

  const instructorQueries = useQueries({
    queries: classInstructorUuids.map(uuid => ({
      ...getInstructorByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const instructorUserUuids = useMemo(
    () =>
      instructorQueries
        .map(query => query.data?.user_uuid)
        .filter((uuid): uuid is string => !!uuid),
    [instructorQueries]
  );

  const instructorProfileQueries = useQueries({
    queries: instructorUserUuids.map(uuid => ({
      ...getUserByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const instructorProfilesByUuid = useMemo(() => {
    const map = new Map<string, (typeof instructorProfileQueries)[number]['data']>();

    instructorUserUuids.forEach((uuid, index) => {
      const queryData = instructorProfileQueries[index]?.data;
      if (queryData) {
        map.set(uuid, queryData);
      }
    });

    return map;
  }, [instructorProfileQueries, instructorUserUuids]);

  const instructorSummaries = useMemo(() => {
    const map = new Map<string, InstructorSummary>();

    instructorQueries.forEach(query => {
      // @ts-ignore
      const instructorRecord = query.data.data;
      if (!instructorRecord?.uuid) return;

      const user = instructorRecord.user_uuid
        ? instructorProfilesByUuid.get(instructorRecord.user_uuid)?.data
        : undefined;
      map.set(instructorRecord.uuid, {
        uuid: instructorRecord.uuid,
        fullName: instructorRecord.full_name || user?.full_name || user?.display_name || 'Instructor pending',
        avatarUrl: user?.profile_image_url,
        subtitle: instructorRecord.professional_headline || user?.email || 'Attached to class data',
      });
    });

    return Array.from(map.values());
  }, [instructorProfilesByUuid, instructorQueries]);

  const studentData = useClassStudentSummaries(classData.map(classDef => classDef.uuid ?? undefined));

  const events = useMemo(
    () =>
      classData
        .flatMap((classDef, classIndex) =>
          mapClassSchedule(
            classDef,
            classIndex,
            new Map(instructorSummaries.map(item => [item.uuid, item.fullName] as const)),
            new Map(instructorSummaries.map(item => [item.uuid, item]))
          )
        )
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [classData, instructorSummaries]
  );

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummaries,
    events,
    instructors: instructorSummaries,
    isLoading: adminClassesQuery.loading || instructorQueries.some(query => query.isLoading) || studentData.isLoading,
    students: studentData.students,
  };

  return <SchedulerCalendarView profile='admin' data={data} />;
}

function InstructorCalendarPage() {
  const profile = useUserProfile();
  const instructorUuid = profile?.instructor?.uuid;
  const instructorClassesQuery = useInstructorClassesWithSchedules(instructorUuid);

  const classData = useMemo(
    () => (instructorClassesQuery.classes ?? []) as Array<{
      default_instructor_uuid?: string | null;
      instructor?: { full_name?: string | null; professional_headline?: string | null; uuid?: string | null } | null;
      schedule?: Array<{
        uuid?: string | null;
        instructor_uuid?: string | null;
        start_time?: Date | string | null;
        end_time?: Date | string | null;
        title?: string | null;
        location_name?: string | null;
        location_type?: string | null;
        max_participants?: number | null;
        status?: string | null;
      }>;
      uuid?: string | null;
      title?: string | null;
      course?: { uuid?: string | null; name?: string | null } | null;
      location_name?: string | null;
      meeting_link?: string | null;
      max_participants?: number | null;
    }>,
    [instructorClassesQuery.classes]
  );

  const instructorSummary = useMemo<InstructorSummary[]>(() => {
    const name = profile?.instructor?.full_name || 'Instructor';
    return instructorUuid
      ? [{ uuid: instructorUuid, fullName: name, subtitle: profile?.instructor?.professional_headline || 'Your classes' }]
      : [];
  }, [instructorUuid, profile?.instructor?.full_name, profile?.instructor?.professional_headline]);


  const studentData = useClassStudentSummaries(classData.map(classDef => classDef.uuid ?? undefined));

  const events = useMemo(
    () =>
      classData
        .flatMap((classDef, classIndex) =>
          mapClassSchedule(
            classDef,
            classIndex,
            new Map(instructorSummary.map(item => [item.uuid, item.fullName] as const)),
            new Map(instructorSummary.map(item => [item.uuid, item]))
          )
        )
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [classData, instructorSummary]
  );

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummary,
    events,
    instructors: instructorSummary,
    isLoading: instructorClassesQuery.isLoading || studentData.isLoading,
    students: studentData.students,
  };

  return <SchedulerCalendarView profile='instructor' data={data} />;
}

function StudentCalendarPage() {
  const profile = useUserProfile();
  const studentUuid = profile?.student?.uuid;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear() - 1);

  const endDate = new Date(today);
  endDate.setFullYear(today.getFullYear() + 2);

  const rangeStart = startDate.toISOString().split('T')[0];
  const rangeEnd = endDate.toISOString().split('T')[0];

  const studentScheduleQuery = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: studentUuid ?? '' },
      query: {
        start: rangeStart as unknown as Date,
        end: rangeEnd as unknown as Date,
      },
    }),
    enabled: !!studentUuid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // -----------------------------
  // CLASS DEFINITIONS
  // -----------------------------

  const studentClassDefinitionUuids = useMemo(
    () =>
      Array.from(
        new Set(
          (studentScheduleQuery.data?.data ?? [])
            .map(item => item.class_definition_uuid)
            .filter((uuid): uuid is string => Boolean(uuid && uuid.trim()))
        )
      ),
    [studentScheduleQuery.data]
  );

  const studentClassDefinitionQueries = useQueries({
    queries: studentClassDefinitionUuids.map(uuid => ({
      ...getClassDefinitionOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const studentClassDefinitions = useMemo(
    () =>
      studentClassDefinitionQueries.flatMap(query => {
        const classDefinition = query.data?.data?.class_definition;
        return classDefinition?.uuid ? [classDefinition] : [];
      }),
    [studentClassDefinitionQueries]
  );

  // -----------------------------
  // COURSES
  // -----------------------------

  const studentCourseUuids = useMemo(
    () =>
      Array.from(
        new Set(
          studentClassDefinitions
            .map(cd => cd.course_uuid)
            .filter((uuid): uuid is string => !!uuid)
        )
      ),
    [studentClassDefinitions]
  );

  const studentCourseQueries = useQueries({
    queries: studentCourseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const studentCourseLookup = useMemo(() => {
    const map = new Map<string, Course>();

    studentCourseQueries.forEach(query => {
      const course = query.data?.data;
      if (course?.uuid) {
        map.set(course.uuid, course);
      }
    });

    return map;
  }, [studentCourseQueries]);

  const studentClassData = useMemo(
    () =>
      studentClassDefinitions.map(cd =>
        mapClassDefinitionDetails(
          cd,
          cd.course_uuid ? studentCourseLookup.get(cd.course_uuid) : null
        )
      ),
    [studentClassDefinitions, studentCourseLookup]
  );

  // -----------------------------
  // STUDENTS
  // -----------------------------

  const studentData = useClassStudentSummaries(
    studentClassData.map(cd => cd.uuid ?? undefined)
  );

  // -----------------------------
  // INSTRUCTORS (FIXED)
  // -----------------------------

  const instructorUuids = useMemo(
    () =>
      Array.from(
        new Set(
          (studentScheduleQuery.data?.data ?? [])
            .map(item => item.instructor_uuid)
            .filter((uuid): uuid is string => !!uuid)
        )
      ),
    [studentScheduleQuery.data]
  );

  const instructorQueries = useQueries({
    queries: instructorUuids.map(uuid => ({
      ...getInstructorByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // ✅ FIXED: correct data shape
  const instructorUserUuids = useMemo(
    () =>
      instructorQueries
        .map(q => q.data?.data?.user_uuid)
        .filter((uuid): uuid is string => !!uuid),
    [instructorQueries]
  );

  const instructorProfileQueries = useQueries({
    queries: instructorUserUuids.map(uuid => ({
      ...getUserByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // ✅ FIXED: no index coupling
  const instructorProfilesByUuid = useMemo(() => {
    const map = new Map<string, any>();

    instructorProfileQueries.forEach(query => {
      const user = query.data?.data;
      if (user?.uuid) {
        map.set(user.uuid, user);
      }
    });

    return map;
  }, [instructorProfileQueries]);

  // ✅ FIXED: clean summary mapping
  const instructorSummaries = useMemo(() => {
    const map = new Map<string, InstructorSummary>();

    instructorQueries.forEach(query => {
      const instructor = query.data?.data;
      if (!instructor?.uuid) return;

      const user = instructor.user_uuid
        ? instructorProfilesByUuid.get(instructor.user_uuid)
        : undefined;

      map.set(instructor.uuid, {
        uuid: instructor.uuid,
        fullName:
          instructor.full_name ||
          user?.full_name ||
          user?.display_name ||
          'Instructor pending',
        avatarUrl: user?.profile_image_url,
        subtitle:
          instructor.professional_headline ||
          user?.email ||
          'Attached to class data',
      });
    });

    return Array.from(map.values());
  }, [instructorQueries, instructorProfilesByUuid]);

  // -----------------------------
  // EVENTS
  // -----------------------------

  const events = useMemo(
    () =>
      (studentScheduleQuery.data?.data ?? [])
        .map(item => {
          const classDetails = item.class_definition_uuid
            ? toClassLookup(studentClassData).get(item.class_definition_uuid) ?? null
            : null;

          const instructorDetails =
            instructorSummaries.find(i => i.uuid === item.instructor_uuid) || {
              uuid: item.instructor_uuid || '',
              fullName: '',
            };

          return mapStudentSchedule(item, instructorDetails, classDetails);
        })
        .filter(Boolean)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [studentScheduleQuery.data, studentClassData, instructorSummaries]
  );

  const studentSummaries = useMemo(() => {
    return studentData.students.length
      ? studentData.students
      : (studentScheduleQuery.data?.data ?? []).reduce<StudentSummary[]>(
        (acc, item) => {
          const classDefinitionUuid = item.class_definition_uuid?.trim();
          const enrollmentUuid =
            item.enrollment_uuid?.trim() ||
            item.scheduled_instance_uuid?.trim();

          const studentUuid = enrollmentUuid || classDefinitionUuid;
          if (!studentUuid) return acc;

          if (acc.some(entry => entry.uuid === studentUuid)) return acc;

          acc.push({
            uuid: studentUuid,
            fullName: profile?.student?.full_name || 'Student',
            classDefinitionUuid,
            enrollmentUuid,
          });

          return acc;
        },
        []
      );
  }, [studentData.students, studentScheduleQuery.data, profile?.student?.full_name]);

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummaries,
    instructors: instructorSummaries,
    events,
    students: studentSummaries,
    isLoading:
      studentScheduleQuery.isLoading ||
      studentClassDefinitionQueries.some(q => q.isLoading) ||
      studentCourseQueries.some(q => q.isLoading) ||
      instructorQueries.some(q => q.isLoading) ||
      studentData.isLoading,
  };

  return <SchedulerCalendarView profile="student" data={data} />;
}

function OrganizationCalendarPage() {
  const organizationUuid = useUserOrganisationUuid();

  const organizationClassesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({
      path: { organisationUuid: organizationUuid ?? '' },
    }),
    enabled: !!organizationUuid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const classData = useMemo(
    () =>
      (organizationClassesQuery.data?.data ?? [])
        .map(item => item.class_definition)
        .filter(Boolean) as ClassDefinition[],
    [organizationClassesQuery.data]
  );

  const uniqueCourseUuids = useMemo(() => {
    const set = new Set<string>();
    classData.forEach(cls => {
      if (cls.course_uuid) set.add(cls.course_uuid);
    });
    return Array.from(set);
  }, [classData]);

  const uniqueInstructorUuids = useMemo(() => {
    const set = new Set<string>();
    classData.forEach(cls => {
      if (cls.default_instructor_uuid) set.add(cls.default_instructor_uuid);
    });
    return Array.from(set);
  }, [classData]);

  const courseQueries = useQueries({
    queries: uniqueCourseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const courseDataArray = useMemo(
    () => courseQueries.map(query => query.data?.data ?? null),
    [courseQueries]
  );

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    uniqueCourseUuids.forEach((uuid, index) => {
      const course = courseDataArray[index];
      if (course) map.set(uuid, course);
    });
    return map;
  }, [courseDataArray, uniqueCourseUuids]);

  const instructorQueries = useQueries({
    queries: uniqueInstructorUuids.map(uuid => ({
      ...getInstructorByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const instructorDataArray = useMemo(
    () => instructorQueries.map(query => query.data ?? null),
    [instructorQueries]
  );

  const instructorMap = useMemo(() => {
    const map = new Map<string, NonNullable<(typeof instructorDataArray)[number]>>();
    uniqueInstructorUuids.forEach((uuid, index) => {
      const instructor = instructorDataArray[index];
      if (instructor) map.set(uuid, instructor);
    });
    return map;
  }, [instructorDataArray, uniqueInstructorUuids]);

  const scheduleQueries = useQueries({
    queries: classData.map(cls => ({
      ...getClassScheduleOptions({
        path: { uuid: cls.uuid ?? '' },
        query: { pageable: {} },
      }),
      enabled: !!cls.uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const scheduleData = useMemo(
    () => scheduleQueries.map(query => query.data?.data?.content ?? []),
    [scheduleQueries]
  );

  const classesWithCourseAndInstructor = useMemo(() => {
    return classData.map((cls, i) => ({
      ...cls,
      course: cls.course_uuid ? (courseMap.get(cls.course_uuid) ?? null) : null,
      instructor: cls.default_instructor_uuid
        ? (instructorMap.get(cls.default_instructor_uuid) ?? null)
        : null,
      schedule: scheduleData[i] ?? null,
    }));
  }, [classData, courseMap, instructorMap, scheduleData]);

  const events = useMemo(
    () =>
      classesWithCourseAndInstructor
        .flatMap((classDef, classIndex) =>
          mapClassSchedule(
            classDef as ClassWithScheduleInput,
            classIndex
          )
        )
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [classesWithCourseAndInstructor]
  );

  const instructorSummaries = useMemo<InstructorSummary[]>(() => {
    return uniqueInstructorUuids.map(uuid => {
      const instructor = instructorMap.get(uuid);
      return {
        uuid,
        fullName: instructor?.full_name || 'Instructor pending',
        subtitle: instructor?.professional_headline || 'Attached to class data',
      };
    });
  }, [instructorMap, uniqueInstructorUuids]);

  const studentData = useClassStudentSummaries(classData.map(classDef => classDef.uuid ?? undefined));

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummaries,
    events,
    instructors: instructorSummaries,
    isLoading:
      organizationClassesQuery.isLoading ||
      courseQueries.some(query => query.isLoading) ||
      instructorQueries.some(query => query.isLoading) ||
      scheduleQueries.some(query => query.isLoading) ||
      studentData.isLoading,
    students: studentData.students,
  };

  return <SchedulerCalendarView profile='organization' data={data} />;
}

export function NewSchedulerCalendarPage({ profile }: { profile: SchedulerProfile }) {
  if (profile === 'admin') {
    return <AdminCalendarPage />;
  }

  if (profile === 'instructor') {
    return <InstructorCalendarPage />;
  }

  if (profile === 'student') {
    return <StudentCalendarPage />;
  }

  return <OrganizationCalendarPage />;
}
