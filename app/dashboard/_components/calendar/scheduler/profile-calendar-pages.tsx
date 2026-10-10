// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import useAmdinClassesWithDetails from '@/hooks/use-admin-classes';
import {
  useCoursesByIds,
  useInstructorsByIds,
  useStudentsByIds,
  useUsersByIds,
} from '@/hooks/use-batched-lookups';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import { type CalendarFetchRange, useCalendarFetchRange } from '@/lib/calendar-range';
import { dayjs, localDate, resolveDisplayZone } from '@/lib/date';
import {
  JOB_TIME_LABELS,
  type JobTimeKind,
  jobTimeKind,
  jobTimeTitle,
} from '@/lib/instructor-job-time';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCalendarOptions,
  getClassDefinitionOptions,
  getClassDefinitionsForOrganisationOptions,
  getEnrollmentsForClassOptions,
  getInstructorCalendarOptions,
  getOrganisationTimetableOptions,
  getStudentScheduleOptions,
  listResourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassDefinition,
  InstructorCalendarEntry,
  OrganisationTimetableEntry,
  Student,
  User,
} from '@/services/client/types.gen';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  ClassWithScheduleInput,
  InstructorSummary,
  SchedulerCalendarData,
  StudentSummary,
} from './calendar-utils';
import {
  formatStatus,
  mapClassDefinitionDetails,
  mapClassSchedule,
  mapStudentSchedule,
  toClassLookup,
  toStudentInitialsByClass,
} from './calendar-utils';
import { SchedulerCalendarView } from './scheduler-calendar-view';
import type { SchedulerEvent, SchedulerProfile } from './types';

/**
 * Reservations a recruitment hold or a confirmed booking puts on an organisation resource.
 * They are what the organisation sees when a venue or a piece of equipment is spoken for —
 * previously the calendar drew class sessions only, so a room reserved by a marketplace job
 * looked free right up until someone double-booked it.
 */
function useOrganisationResourceReservations(
  organisationUuid: string | undefined,
  visibleRange: CalendarFetchRange
) {
  const range = useMemo(
    () => ({ start_date: visibleRange.start, end_date: visibleRange.end }),
    [visibleRange.end, visibleRange.start]
  );

  const resourcesQuery = useQuery({
    ...listResourcesOptions({
      path: { organisationUuid: organisationUuid ?? '' },
      query: { pageable: { page: 0, size: 100 }, active: true },
    }),
    enabled: !!organisationUuid,
    staleTime: STALE_TIMES.live,
  });

  const resources = useMemo(
    () => (resourcesQuery.data?.data?.content ?? []).filter(resource => resource?.uuid),
    [resourcesQuery.data]
  );

  const calendarQueries = useQueries({
    queries: resources.map(resource => ({
      ...getCalendarOptions({
        path: { organisationUuid: organisationUuid ?? '', resourceUuid: resource.uuid as string },
        query: range,
      }),
      enabled: !!organisationUuid && !!resource.uuid,
      staleTime: STALE_TIMES.live,
      placeholderData: keepPreviousData,
    })),
  });

  const events = useMemo<SchedulerEvent[]>(
    () =>
      calendarQueries.flatMap((query, index) => {
        const resource = resources[index];
        const entries = query.data?.data ?? [];
        return entries
          // Open hours and blackouts describe when a resource *could* be used; only holds and
          // confirmed bookings are time somebody has actually taken.
          .filter(entry => entry.entry_type === 'HOLD' || entry.entry_type === 'CONFIRMED')
          .filter(entry => entry.start_time && entry.end_time)
          .map((entry, entryIndex) => {
            const held = entry.entry_type === 'HOLD';
            const resourceName = resource?.name ?? 'Resource';
            return {
              id: `resource-${resource?.uuid}-${entryIndex}`,
              classDefinitionUuid: entry.class_definition_uuid ?? undefined,
              eventType: 'resource_reservation' as const,
              title: held ? `${resourceName} — held` : `${resourceName} — reserved`,
              course: entry.notes ?? (held ? 'Recruitment hold' : 'Confirmed booking'),
              instructor: '',
              location: resourceName,
              locationType: resource?.resource_type ?? undefined,
              startTime: new Date(entry.start_time as unknown as string),
              endTime: new Date(entry.end_time as unknown as string),
              status: held ? 'Tentative' : 'Reserved',
              category: 'TVET / Vocational' as const,
              students: [],
              classCode: entry.quantity ? `x${entry.quantity}` : '',
            };
          });
      }),
    [calendarQueries, resources]
  );

  return {
    events,
    isLoading: resourcesQuery.isLoading || calendarQueries.some(query => query.isLoading),
  };
}

/**
 * The merged availability feed is the only place blocked time reaches - an instructor who closes
 * a window on the availability page saw their scheduler still offering it as free.
 */
function useInstructorMergedCalendar(
  instructorUuid: string | undefined,
  visibleRange: CalendarFetchRange
) {
  // The endpoint walks the window a day at a time server side, so it is asked for what is on screen.
  const range = useMemo(
    () => ({ start_date: localDate(visibleRange.start), end_date: localDate(visibleRange.end) }),
    [visibleRange.end, visibleRange.start]
  );

  const calendarQuery = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: range,
    }),
    enabled: !!instructorUuid,
    staleTime: STALE_TIMES.live,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const entries = useMemo<InstructorCalendarEntry[]>(
    () => calendarQuery.data?.data ?? [],
    [calendarQuery.data]
  );

  return { entries };
}

function useClassStudentSummaries(classUuids: Array<string | null | undefined>) {
  const normalizedClassUuids = useMemo(
    () =>
      Array.from(
        new Set(classUuids.filter((uuid): uuid is string => Boolean(uuid && uuid.trim())))
      ),
    [classUuids]
  );

  const enrollmentQueries = useQueries({
    queries: normalizedClassUuids.map(uuid => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid },
      }),

      enabled: !!uuid,
      // Somebody enrols or withdraws while the roster sits in the persisted cache, so the
      // stale window has to be the throttle rather than a dead refetchOnMount.
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
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

      enrollments.forEach(enrollment => {
        const studentUuid = enrollment.student_uuid?.trim();

        if (!studentUuid || seenInClass.has(studentUuid)) {
          return;
        }

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

  const uniqueStudentUuids = useMemo(
    () => Array.from(new Set(uniqueStudentEntries.map(entry => entry.studentUuid).filter(Boolean))),
    [uniqueStudentEntries]
  );

  const { studentMap: batchedStudents, isLoading: studentsLoading } =
    useStudentsByIds(uniqueStudentUuids);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    for (const uuid of uniqueStudentUuids) {
      const student = batchedStudents[uuid];
      if (student?.uuid) map.set(uuid, student);
    }
    return map;
  }, [batchedStudents, uniqueStudentUuids]);

  const studentUserUuids = useMemo(
    () =>
      Array.from(
        new Set(
          Array.from(studentMap.values())
            .map(student => student?.user_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [studentMap]
  );

  const { userMap: batchedStudentUsers, isLoading: studentUsersLoading } =
    useUsersByIds(studentUserUuids);

  const studentProfilesByUuid = useMemo(() => {
    const map = new Map<string, User>();
    for (const uuid of studentUserUuids) {
      const user = batchedStudentUsers[uuid];
      if (user?.uuid) map.set(uuid, user);
    }
    return map;
  }, [batchedStudentUsers, studentUserUuids]);

  const students = useMemo<StudentSummary[]>(
    () =>
      uniqueStudentEntries
        .map(entry => {
          const student = studentMap.get(entry.studentUuid);

          if (!student?.uuid) {
            return null;
          }

          const user = student.user_uuid ? studentProfilesByUuid.get(student.user_uuid) : undefined;

          return {
            uuid: student.uuid,

            fullName: student.full_name || user?.full_name || user?.display_name || 'Student',

            avatarUrl: user?.profile_image_url,

            classDefinitionUuid: entry.classDefinitionUuid,

            enrollmentUuid: entry.enrollmentUuid,

            studentEnrollmentKey: `${entry.classDefinitionUuid}:${student.uuid}`,
          };
        })
        .filter(Boolean) as StudentSummary[],
    [uniqueStudentEntries, studentMap, studentProfilesByUuid]
  );

  return {
    isLoading:
      enrollmentQueries.some(query => query.isLoading) || studentsLoading || studentUsersLoading,

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

  const { instructorMap: batchedInstructors, isLoading: instructorsLoading } =
    useInstructorsByIds(classInstructorUuids);

  const instructorUserUuids = useMemo(
    () =>
      Object.values(batchedInstructors)
        .map(instructor => instructor.user_uuid)
        .filter((uuid): uuid is string => !!uuid),
    [batchedInstructors]
  );

  const { userMap: batchedInstructorUsers } = useUsersByIds(instructorUserUuids);

  const instructorProfilesByUuid = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of Object.values(batchedInstructorUsers)) {
      if (user?.uuid) map.set(user.uuid, user);
    }
    return map;
  }, [batchedInstructorUsers]);

  const instructorSummaries = useMemo(() => {
    const map = new Map<string, InstructorSummary>();

    Object.values(batchedInstructors).forEach(instructor => {
      if (!instructor?.uuid) return;

      const user = instructor.user_uuid
        ? instructorProfilesByUuid.get(instructor.user_uuid)
        : undefined;

      map.set(instructor.uuid, {
        uuid: instructor.uuid,
        fullName:
          instructor.full_name || user?.full_name || user?.display_name || 'Instructor pending',
        avatarUrl: user?.profile_image_url,
        subtitle: instructor.professional_headline || user?.email || 'Attached to class data',
      });
    });

    return Array.from(map.values());
  }, [batchedInstructors, instructorProfilesByUuid]);

  const studentData = useClassStudentSummaries(
    classData.map(classDef => classDef.uuid ?? undefined)
  );

  const studentInitialsByClass = useMemo(
    () => toStudentInitialsByClass(studentData.students),
    [studentData.students]
  );

  const events = useMemo(
    () =>
      classData
        .flatMap(classDef =>
          mapClassSchedule(
            classDef,
            new Map(instructorSummaries.map(item => [item.uuid, item.fullName] as const)),
            new Map(instructorSummaries.map(item => [item.uuid, item])),
            studentInitialsByClass
          )
        )
        .filter(event => event.status !== 'Cancelled')
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [classData, instructorSummaries, studentInitialsByClass]
  );

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummaries,
    events,
    instructors: instructorSummaries,
    isLoading: adminClassesQuery.loading || instructorsLoading || studentData.isLoading,
    students: studentData.students,
  };

  return <SchedulerCalendarView profile='admin' data={data} />;
}

function InstructorCalendarPage() {
  const profile = useUserProfile();
  const instructorUuid = profile?.instructor?.uuid;
  const instructorClassesQuery = useInstructorClassesWithSchedules(instructorUuid);
  const [range, setVisibleRange] = useCalendarFetchRange();

  const classData = useMemo(
    () =>
      (instructorClassesQuery.classes ?? []) as Array<{
        default_instructor_uuid?: string | null;
        organisation_uuid?: string | null;
        organisation_name?: string | null;
        instructor?: {
          full_name?: string | null;
          professional_headline?: string | null;
          uuid?: string | null;
        } | null;
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
      ? [
        {
          uuid: instructorUuid,
          fullName: name,
          subtitle: profile?.instructor?.professional_headline || 'Your classes',
        },
      ]
      : [];
  }, [instructorUuid, profile?.instructor?.full_name, profile?.instructor?.professional_headline]);

  const studentData = useClassStudentSummaries(
    classData.map(classDef => classDef.uuid ?? undefined)
  );

  const studentInitialsByClass = useMemo(
    () => toStudentInitialsByClass(studentData.students),
    [studentData.students]
  );

  const mergedCalendar = useInstructorMergedCalendar(instructorUuid, range);

  const events = useMemo(() => {
    const classEvents = classData
      .flatMap(classDef =>
        mapClassSchedule(
          classDef,
          new Map(instructorSummary.map(item => [item.uuid, item.fullName] as const)),
          new Map(instructorSummary.map(item => [item.uuid, item])),
          studentInitialsByClass
        )
      )
      .filter(event => event.status !== 'Cancelled');

    // Anything the instructor's own schedule holds that the class list did not explain:
    // sessions of a class owned by an organisation that hired them, and instructor block
    // entries, which carry no class definition at all. Without these the instructor's
    // calendar showed free time they had already been booked for.
    const coveredInstanceUuids = new Set(
      classEvents.map(event => event.instanceUuid).filter(Boolean)
    );
    const name = profile?.instructor?.full_name || 'Instructor';
    const reservedEvents: SchedulerEvent[] = (instructorClassesQuery.schedule ?? [])
      .filter(instance => instance?.uuid && !coveredInstanceUuids.has(instance.uuid))
      .filter(instance => (instance.status ?? '').toUpperCase() !== 'CANCELLED')
      .map(instance => {
        const engagingOrganisation = instance.organisation_name ?? undefined;

        return {
          id: `reserved-${instance.uuid}`,
          instanceUuid: instance.uuid ?? undefined,
          classDefinitionUuid: instance.class_definition_uuid ?? undefined,
          eventType: instance.class_definition_uuid ? 'class' : 'resource_reservation',
          title: instance.title || 'Reserved time',
          // Say who the work is for. An instructor looking at a session they never scheduled
          // needs to see the organisation that engaged them, not the word "Assigned".
          course: instance.class_definition_uuid
            ? engagingOrganisation
              ? `Work for ${engagingOrganisation}`
              : 'Assigned class'
            : 'Blocked time',
          instructor: name,
          instructorUuid: instructorUuid,
          location: instance.location_name ?? '',
          locationType: instance.location_type ?? undefined,
          organisationUuid: instance.organisation_uuid ?? undefined,
          organisationName: engagingOrganisation,
          startTime: new Date(instance.start_time as unknown as string),
          endTime: new Date(instance.end_time as unknown as string),
          status: instance.status ?? 'Reserved',
          category: 'TVET / Vocational',
          students: [],
          classCode: '',
        } satisfies SchedulerEvent;
      });

    // Availability slots the instructor closed, plus any session only the merged feed knows
    // about. Open availability is not a commitment, so it stays off the calendar.
    const knownUuids = new Set(
      [...classEvents, ...reservedEvents].map(event => event.instanceUuid).filter(Boolean)
    );
    const availabilityEvents: SchedulerEvent[] = mergedCalendar.entries
      .filter(entry => entry.start_time && entry.end_time)
      .filter(entry => entry.entry_type === 'BLOCKED' || entry.entry_type === 'SCHEDULED_INSTANCE')
      .filter(entry => !entry.uuid || !knownUuids.has(entry.uuid))
      .filter(entry => (entry.status ?? '').toUpperCase() !== 'CANCELLED')
      .map((entry, entryIndex) => {
        const blocked = entry.entry_type === 'BLOCKED';
        const engagingOrganisation = entry.organisation_name ?? undefined;

        return {
          id: `availability-${entry.uuid ?? entryIndex}`,
          instanceUuid: blocked ? undefined : (entry.uuid ?? undefined),
          classDefinitionUuid: entry.class_definition_uuid ?? undefined,
          eventType: blocked ? 'resource_reservation' : 'class',
          title: entry.title || (blocked ? 'Blocked time' : 'Scheduled class'),
          course: blocked
            ? 'Blocked time'
            : engagingOrganisation
              ? `Work for ${engagingOrganisation}`
              : 'Assigned class',
          instructor: name,
          instructorUuid: instructorUuid,
          location: '',
          locationType: entry.location_type ?? undefined,
          organisationUuid: entry.organisation_uuid ?? undefined,
          organisationName: engagingOrganisation,
          startTime: new Date(entry.start_time as unknown as string),
          endTime: new Date(entry.end_time as unknown as string),
          status: blocked ? 'Blocked' : formatStatus(entry.status),
          category: 'TVET / Vocational',
          students: blocked
            ? []
            : (studentInitialsByClass.get(entry.class_definition_uuid ?? '') ?? []),
          classCode: '',
        } satisfies SchedulerEvent;
      });

    // Job time: held for a job the instructor was hired for, or merely applied to.
    const jobTimeEvents: SchedulerEvent[] = mergedCalendar.entries
      .filter(entry => entry.start_time && entry.end_time && jobTimeKind(entry.entry_type))
      .map((entry, entryIndex) => {
        const kind = jobTimeKind(entry.entry_type) as JobTimeKind;
        return {
          id: `job-${kind}-${entry.uuid ?? entryIndex}`,
          eventType: kind === 'hold' ? 'job_hold' : 'job_application',
          jobUuid: entry.job_uuid ?? undefined,
          title: jobTimeTitle(kind, entry.title),
          course: JOB_TIME_LABELS[kind].legend,
          instructor: name,
          instructorUuid: instructorUuid,
          location: '',
          organisationUuid: entry.organisation_uuid ?? undefined,
          organisationName: entry.organisation_name ?? undefined,
          startTime: new Date(entry.start_time as unknown as string),
          endTime: new Date(entry.end_time as unknown as string),
          status: JOB_TIME_LABELS[kind].status,
          category: 'TVET / Vocational',
          students: [],
          classCode: '',
        } satisfies SchedulerEvent;
      });

    return [...classEvents, ...reservedEvents, ...availabilityEvents, ...jobTimeEvents].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [
    classData,
    instructorSummary,
    instructorClassesQuery.schedule,
    instructorUuid,
    mergedCalendar.entries,
    profile?.instructor?.full_name,
    studentInitialsByClass,
  ]);

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummary,
    events,
    instructors: instructorSummary,
    // Blocked time is an overlay on the schedule, not the schedule itself, so it lands after
    // first paint rather than holding the whole grid behind a spinner.
    isLoading: instructorClassesQuery.isLoading || studentData.isLoading,
    students: studentData.students,
  };

  return (
    <SchedulerCalendarView
      profile='instructor'
      data={data}
      onVisibleRangeChange={setVisibleRange}
    />
  );
}

function StudentCalendarPage() {
  const profile = useUserProfile();
  const studentUuid = profile?.student?.uuid;

  const [range, setVisibleRange] = useCalendarFetchRange();

  const studentScheduleQuery = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: studentUuid ?? '' },
      query: { start: localDate(range.start), end: localDate(range.end) },
    }),
    enabled: !!studentUuid,
    staleTime: STALE_TIMES.live,
    placeholderData: keepPreviousData,
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
      // staleTime: STALE_TIMES.live,
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
          studentClassDefinitions.map(cd => cd.course_uuid).filter((uuid): uuid is string => !!uuid)
        )
      ),
    [studentClassDefinitions]
  );

  const { courseMap: studentCourseMap, isLoading: studentCoursesLoading } =
    useCoursesByIds(studentCourseUuids);

  const studentClassData = useMemo(
    () =>
      studentClassDefinitions.map(cd =>
        mapClassDefinitionDetails(
          cd,
          cd.course_uuid ? studentCourseMap[cd.course_uuid] : null
        )
      ),
    [studentClassDefinitions, studentCourseMap]
  );

  // -----------------------------
  // STUDENTS
  // -----------------------------

  const studentData = useClassStudentSummaries(studentClassData.map(cd => cd.uuid ?? undefined));

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

  const { instructorMap: studentInstructorMap, isLoading: studentInstructorsLoading } =
    useInstructorsByIds(instructorUuids);

  const instructorUserUuids = useMemo(
    () =>
      Object.values(studentInstructorMap)
        .map(instructor => instructor.user_uuid)
        .filter((uuid): uuid is string => !!uuid),
    [studentInstructorMap]
  );

  const { userMap: studentInstructorUsers } = useUsersByIds(instructorUserUuids);

  const instructorSummaries = useMemo(
    () =>
      instructorUuids.flatMap<InstructorSummary>(uuid => {
        const instructor = studentInstructorMap[uuid];
        if (!instructor?.uuid) return [];

        const user = instructor.user_uuid ? studentInstructorUsers[instructor.user_uuid] : undefined;

        return [
          {
            uuid: instructor.uuid,
            fullName:
              instructor.full_name || user?.full_name || user?.display_name || 'Instructor pending',
            avatarUrl: user?.profile_image_url,
            subtitle: instructor.professional_headline || user?.email || 'Attached to class data',
          },
        ];
      }),
    [instructorUuids, studentInstructorMap, studentInstructorUsers]
  );

  // -----------------------------
  // EVENTS
  // -----------------------------

  const events = useMemo(
    () =>
      (studentScheduleQuery.data?.data ?? [])
        .map(item => {
          const classDetails = item.class_definition_uuid
            ? (toClassLookup(studentClassData).get(item.class_definition_uuid) ?? null)
            : null;

          const instructorDetails = instructorSummaries.find(
            i => i.uuid === item.instructor_uuid
          ) || {
            uuid: item.instructor_uuid || '',
            fullName: '',
          };

          return mapStudentSchedule(item, instructorDetails, classDetails);
        })
        .filter(Boolean)
        .filter(event => event.status !== 'Cancelled')
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [studentScheduleQuery.data, studentClassData, instructorSummaries]
  );

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummaries,
    instructors: instructorSummaries,
    events,
    // Only real enrolments count: a schedule row is a session, not a classmate.
    students: studentData.students,
    isLoading:
      studentScheduleQuery.isLoading ||
      studentClassDefinitionQueries.some(q => q.isLoading) ||
      studentCoursesLoading ||
      studentInstructorsLoading ||
      studentData.isLoading,
  };

  return (
    <SchedulerCalendarView profile='student' data={data} onVisibleRangeChange={setVisibleRange} />
  );
}

function OrganizationCalendarPage() {
  const organisation = useOrganisation();
  const organizationUuid = organisation?.uuid;
  const [range, setVisibleRange] = useCalendarFetchRange();

  const organizationClassesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({
      path: { organisationUuid: organizationUuid ?? '' },
    }),
    enabled: !!organizationUuid,
    staleTime: STALE_TIMES.live,
  });

  const classData = useMemo(
    () =>
      (organizationClassesQuery.data?.data ?? [])
        .map(item => item.class_definition)
        .filter(Boolean) as ClassDefinition[],
    [organizationClassesQuery.data]
  );

  // One range request for every class the organisation owns, instead of a schedule page per class.
  const timetableQuery = useQuery({
    ...getOrganisationTimetableOptions({
      path: { organisationUuid: organizationUuid ?? '' },
      query: { start: localDate(range.start), end: localDate(range.end) },
    }),
    enabled: !!organizationUuid,
    staleTime: STALE_TIMES.live,
    placeholderData: keepPreviousData,
  });

  const sessionsByClass = useMemo(() => {
    const map = new Map<string, OrganisationTimetableEntry[]>();
    for (const entry of timetableQuery.data?.data ?? []) {
      if (!entry.class_definition_uuid) continue;
      const sessions = map.get(entry.class_definition_uuid) ?? [];
      sessions.push(entry);
      map.set(entry.class_definition_uuid, sessions);
    }
    return map;
  }, [timetableQuery.data]);

  const uniqueCourseUuids = useMemo(
    () =>
      Array.from(
        new Set(classData.map(cls => cls.course_uuid).filter((uuid): uuid is string => !!uuid))
      ),
    [classData]
  );

  const { courseMap } = useCoursesByIds(uniqueCourseUuids);

  const uniqueInstructorUuids = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...classData.map(cls => cls.default_instructor_uuid),
            ...(timetableQuery.data?.data ?? []).map(entry => entry.instructor_uuid),
          ].filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [classData, timetableQuery.data]
  );

  const { instructorMap } = useInstructorsByIds(uniqueInstructorUuids);
  const instructorUserUuids = useMemo(
    () =>
      Object.values(instructorMap)
        .filter(instructor => !instructor.full_name?.trim())
        .map(instructor => instructor.user_uuid)
        .filter((uuid): uuid is string => Boolean(uuid)),
    [instructorMap]
  );
  const { userMap: instructorUsers } = useUsersByIds(instructorUserUuids);

  const instructorSummaries = useMemo<InstructorSummary[]>(
    () =>
      uniqueInstructorUuids.map(uuid => {
        const instructor = instructorMap[uuid];
        const user = instructor?.user_uuid ? instructorUsers[instructor.user_uuid] : undefined;
        return {
          uuid,
          fullName:
            instructor?.full_name?.trim() ||
            user?.full_name?.trim() ||
            user?.display_name?.trim() ||
            'Instructor pending',
          subtitle: instructor?.professional_headline || 'Attached to class data',
        };
      }),
    [instructorMap, instructorUsers, uniqueInstructorUuids]
  );
  const instructorSummaryLookup = useMemo(
    () => new Map(instructorSummaries.map(instructor => [instructor.uuid, instructor])),
    [instructorSummaries]
  );

  const classesWithCourseAndInstructor = useMemo(
    () =>
      classData.map(cls => ({
        ...cls,
        course: cls.course_uuid ? (courseMap[cls.course_uuid] ?? null) : null,
        instructor: cls.default_instructor_uuid
          ? (instructorMap[cls.default_instructor_uuid] ?? null)
          : null,
        schedule: cls.uuid
          ? (sessionsByClass.get(cls.uuid) ?? []).map(entry => ({ ...entry, title: entry.class_title }))
          : [],
      })),
    [classData, courseMap, instructorMap, sessionsByClass]
  );

  const resourceReservations = useOrganisationResourceReservations(organizationUuid, range);

  // Rosters load for the focused day's classes only (what the rail lists); other cards show
  // the timetable's enrolled_count. The day is keyed in the grid's zone, as the rail does.
  const focusDayClassUuids = useMemo(() => {
    const zone = resolveDisplayZone(range.zone);
    return Array.from(
      new Set(
        (timetableQuery.data?.data ?? [])
          .filter(
            entry =>
              entry.start_time &&
              dayjs(new Date(entry.start_time as unknown as string))
                .tz(zone)
                .format('YYYY-MM-DD') === range.focus
          )
          .map(entry => entry.class_definition_uuid)
      )
    );
  }, [range.focus, range.zone, timetableQuery.data]);

  const studentData = useClassStudentSummaries(focusDayClassUuids);

  const studentInitialsByClass = useMemo(
    () => toStudentInitialsByClass(studentData.students),
    [studentData.students]
  );

  const events = useMemo(
    () =>
      classesWithCourseAndInstructor
        .flatMap(classDef =>
          mapClassSchedule(
            classDef as ClassWithScheduleInput,
            undefined,
            instructorSummaryLookup,
            studentInitialsByClass
          )
        )
        .filter(event => event.status !== 'Cancelled')
        .concat(resourceReservations.events)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [
      classesWithCourseAndInstructor,
      instructorSummaryLookup,
      resourceReservations.events,
      studentInitialsByClass,
    ]
  );

  const data: SchedulerCalendarData = {
    allInstructors: instructorSummaries,
    events,
    instructors: instructorSummaries,
    // Only the first load of the sessions holds the grid; names, rosters and reservations
    // fill in as they land so stepping through weeks never blanks it.
    isLoading: organizationClassesQuery.isLoading || timetableQuery.isLoading,
    students: studentData.students,
  };

  return (
    <SchedulerCalendarView
      profile='organization'
      data={data}
      onVisibleRangeChange={setVisibleRange}
    />
  );
}

export function SchedulerCalendarPage({ profile }: { profile: SchedulerProfile }) {
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
