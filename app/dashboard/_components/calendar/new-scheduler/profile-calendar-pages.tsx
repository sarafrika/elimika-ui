'use client';

import { useUserProfile } from '@/context/profile-context';
import useAmdinClassesWithDetails from '@/hooks/use-admin-classes';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import { getClassDefinitionOptions, getClassDefinitionsForOrganisationOptions, getClassScheduleOptions, getCourseByUuidOptions, getInstructorByUuidOptions, getStudentScheduleOptions, getUserByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
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
      //@ts-ignore
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
    isLoading: adminClassesQuery.loading || instructorQueries.some(query => query.isLoading),
    students: [],
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
    isLoading: instructorClassesQuery.isLoading,
    students: [],
  };

  return <SchedulerCalendarView profile='instructor' data={data} />;
}

function StudentCalendarPage() {
  const profile = useUserProfile();
  const studentUuid = profile?.student?.uuid;

  const today = new Date();

  // 1 year ago
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear() - 1);

  // 2 years ahead
  const endDate = new Date(today);
  endDate.setFullYear(today.getFullYear() + 2);

  // format to YYYY-MM-DD (safe for APIs)
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
      refetchOnWindowFocus: false,
    })),
  });

  const studentClassDefinitions = useMemo<ClassDefinition[]>(
    () =>
      studentClassDefinitionQueries.flatMap(query => {
        const classDefinition = query.data?.data?.class_definition;
        return classDefinition?.uuid ? [classDefinition] : [];
      }),
    [studentClassDefinitionQueries]
  );

  const studentCourseUuids = useMemo(
    () =>
      Array.from(
        new Set(
          studentClassDefinitions
            .map(classDef => classDef.course_uuid)
            .filter((uuid): uuid is string => Boolean(uuid && uuid.trim()))
        )
      ),
    [studentClassDefinitions]
  );

  const studentCourseQueries = useQueries({
    queries: studentCourseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const studentCourseLookup = useMemo(() => {
    const map = new Map<string, Course>();

    studentCourseUuids.forEach((uuid, index) => {
      const course = studentCourseQueries[index]?.data?.data;
      if (course) {
        map.set(uuid, course);
      }
    });

    return map;
  }, [studentCourseQueries, studentCourseUuids]);

  const studentClassData = useMemo(
    () =>
      studentClassDefinitions.map(classDef =>
        mapClassDefinitionDetails(
          classDef,
          classDef.course_uuid ? studentCourseLookup.get(classDef.course_uuid) : null
        )
      ),
    [studentClassDefinitions, studentCourseLookup]
  );

  const studentInstructorUuids = useMemo(
    () =>
      Array.from(
        new Set((studentScheduleQuery.data?.data ?? []).map(item => item.instructor_uuid).filter(Boolean))
      ) as string[],
    [studentScheduleQuery.data]
  );

  const instructorQueries = useQueries({
    queries: studentInstructorUuids.map(uuid => ({
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
      //@ts-ignore
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

  const events = useMemo(
    () =>
      (studentScheduleQuery.data?.data ?? [])
        .map(item => {
          const classDetails = item.class_definition_uuid
            ? toClassLookup(studentClassData).get(item.class_definition_uuid) ?? null
            : null;
          const instructorDetails = instructorSummaries.find(
            summary => summary.uuid === item.instructor_uuid
          ) || {
            uuid: item.instructor_uuid || '',
            fullName: '',
          };
          return mapStudentSchedule(item, instructorDetails, classDetails);
        })
        .filter((item): item is NonNullable<ReturnType<typeof mapStudentSchedule>> => Boolean(item))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [instructorSummaries, studentClassData, studentScheduleQuery.data]
  );

  const studentSummaries = useMemo(() => {
    const map = new Map<string, StudentSummary>();
    (studentScheduleQuery.data?.data ?? []).forEach(item => {
      const key = item.enrollment_uuid || item.scheduled_instance_uuid || item.class_definition_uuid;
      if (!key || map.has(key)) return;
      map.set(key, {
        uuid: key,
        fullName: profile?.student?.full_name || 'Student',
      });
    });
    return Array.from(map.values());
  }, [profile?.student?.full_name, studentScheduleQuery.data]);

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummaries,
    events,
    instructors: instructorSummaries,
    isLoading:
      studentScheduleQuery.isLoading ||
      studentClassDefinitionQueries.some(query => query.isLoading) ||
      studentCourseQueries.some(query => query.isLoading) ||
      instructorQueries.some(query => query.isLoading),
    students: studentSummaries,
  };

  return <SchedulerCalendarView profile='student' data={data} />;
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

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummaries,
    events,
    instructors: instructorSummaries,
    isLoading:
      organizationClassesQuery.isLoading ||
      courseQueries.some(query => query.isLoading) ||
      instructorQueries.some(query => query.isLoading) ||
      scheduleQueries.some(query => query.isLoading),
    students: [],
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
