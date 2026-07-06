'use client';

import { useInstructor } from '@/context/instructor-context';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import { dayjs } from '@/lib/date';
import {
  getAllCoursesOptions,
  getEnrollmentsForClassOptions,
  getInstructorBookingsOptions,
  searchEnrollmentsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { BookingResponse, Enrollment } from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  TrainingHubBooking,
  TrainingHubLiveClass,
  TrainingHubManagedCourse,
  TrainingHubWaitingStudent,
} from './training-hub-data';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);
const COMPLETED_BOOKING_STATUSES = new Set(['cancelled', 'declined', 'expired']);
const ACCENTS: TrainingHubManagedCourse['accent'][] = ['blue', 'indigo', 'orange', 'yellow'];

const formatCurrency = (amount?: number | null, currency = 'KES') => {
  if (typeof amount !== 'number') {
    return `${currency} 0`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
};

const formatRelativeAge = (createdDate?: Date | string | null) => {
  if (!createdDate) return 'New';

  const date = createdDate instanceof Date ? createdDate : new Date(createdDate);
  if (Number.isNaN(date.getTime())) return 'New';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;

  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `${diffMinutes}m`;
};

const formatDateTime = (value?: Date | string | null) =>
  value ? dayjs(value).format('ddd, MMM D \u00b7 h:mm A') : 'TBD';

const formatTimeRange = (start?: Date | string | null, end?: Date | string | null) =>
  start && end ? `${dayjs(start).format('h:mm A')} \u2013 ${dayjs(end).format('h:mm A')}` : '';

const normalizeStatusLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const resolvePersonName = (firstName?: string, lastName?: string, fallback = '') => {
  const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
  return combined || fallback;
};

const isUpcomingBooking = (booking: BookingResponse, now: Date) => {
  if (booking.start_time < now) return false;
  return !COMPLETED_BOOKING_STATUSES.has(booking.status ?? '');
};

const getBookingStatusTone = (status?: BookingResponse['status']) =>
  status && ['confirmed', 'accepted_confirmed'].includes(status) ? 'info' : 'warning';

export function useInstructorTrainingHubData() {
  const instructor = useInstructor();
  const instructorUuid = instructor?.uuid;

  const { classes, isLoading: isLoadingClasses } = useInstructorClassesWithSchedules(instructorUuid);

  const { data: coursesResponse, isLoading: isLoadingCourses } = useQuery({
    ...getAllCoursesOptions({
      query: {
        pageable: {
          page: 0,
          size: 100,
        },
      },
    }),
    enabled: Boolean(instructorUuid),
    refetchOnWindowFocus: false,
  });

  const { data: applicationsResponse, isLoading: isLoadingApplications } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {
          page: 0,
          size: 100,
        },
        searchParams: {
          applicant_uuid_eq: instructorUuid ?? '',
        },
      },
    }),
    enabled: Boolean(instructorUuid),
    refetchOnWindowFocus: false,
  });

  const approvedApplications = useMemo(
    () =>
      (applicationsResponse?.data?.content ?? []).filter(
        application => application.status === 'approved' && application.course_uuid
      ),
    [applicationsResponse?.data?.content]
  );

  const approvedApplicationMap = useMemo(
    () =>
      new Map(
        approvedApplications.map(application => [application.course_uuid ?? '', application])
      ),
    [approvedApplications]
  );

  const approvedCourses = useMemo(
    () =>
      (coursesResponse?.data?.content ?? []).filter(
        course =>
          Boolean(course.uuid) &&
          course.admin_approved &&
          approvedApplicationMap.has(course.uuid ?? '')
      ),
    [approvedApplicationMap, coursesResponse?.data?.content]
  );

  const relevantClasses = useMemo(
    () =>
      classes.filter(classItem => {
        const resourceUuid =
          classItem?.course_uuid ?? classItem?.program_uuid;

        return (
          Boolean(resourceUuid) &&
          approvedApplicationMap.has(resourceUuid as string)
        );
      }),
    [approvedApplicationMap, classes]
  );

  const classesByCourse = useMemo(() => {
    const map = new Map<string, typeof relevantClasses>();

    relevantClasses.forEach(classItem => {
      const courseUuid = classItem.course_uuid;
      if (!courseUuid) return;

      const current = map.get(courseUuid) ?? [];
      current.push(classItem);
      map.set(courseUuid, current);
    });

    return map;
  }, [relevantClasses]);

  const enrollmentQueries = useQueries({
    queries: relevantClasses.map(classItem => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.uuid ?? '' },
      }),
      enabled: Boolean(classItem.uuid),
      staleTime: 60 * 1000,
    })),
  });

  const enrollmentsByClass = useMemo(() => {
    const map = new Map<string, Enrollment[]>();
    relevantClasses.forEach((classItem, index) => {
      if (!classItem.uuid) return;
      map.set(classItem.uuid, enrollmentQueries[index]?.data?.data ?? []);
    });
    return map;
  }, [enrollmentQueries, relevantClasses]);

  const managedCourses = useMemo<TrainingHubManagedCourse[]>(() => {
    return approvedCourses.map((course, index) => {
      const courseClasses = classesByCourse.get(course.uuid ?? '') ?? [];
      const learnerIds = new Set<string>();

      courseClasses.forEach(classItem => {
        (enrollmentsByClass.get(classItem.uuid ?? '') ?? []).forEach(enrollment => {
          if (enrollment.student_uuid && ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status ?? '')) {
            learnerIds.add(enrollment.student_uuid);
          }
        });
      });

      return {
        id: course.uuid ?? `course-${index + 1}`,
        title: course.name,
        provider: course.category_names?.[0] ?? 'Approved course',
        level: course.total_duration_display || `${course.duration_hours}h ${course.duration_minutes}m`,
        students: `${learnerIds.size} students`,
        classes: `${courseClasses.length} classes`,
        ctaLabel: 'Create New Class',
        ctaHref: '/dashboard/classes/new',
        accent: ACCENTS[index % ACCENTS.length] ?? 'blue',
        imageUrl: course.thumbnail_url ?? course.banner_url,
        status: 'approved',
      };
    });
  }, [approvedCourses, classesByCourse, enrollmentsByClass]);

  const relevantClassUuids = useMemo(
    () =>
      relevantClasses
        .map(classItem => classItem.uuid)
        .filter((uuid): uuid is string => Boolean(uuid))
        .sort((a, b) => a.localeCompare(b)),
    [relevantClasses]
  );

  // One waitlist search across all classes (class_definition_uuid_in)
  // instead of one search request per class.
  const waitlistQuery = useQuery({
    ...searchEnrollmentsOptions({
      query: {
        pageable: {
          page: 0,
          size: 500,
        },
        searchParams: {
          class_definition_uuid_in: relevantClassUuids.join(','),
          status_eq: 'WAITLISTED',
        },
      },
    }),
    enabled: relevantClassUuids.length > 0,
    staleTime: 60 * 1000,
  });

  // Enrollments don't carry class_definition_uuid, so group them via the
  // scheduled instance → class mapping that the schedules already provide.
  const instanceToClassUuid = useMemo(() => {
    const map = new Map<string, string>();
    relevantClasses.forEach(classItem => {
      if (!classItem.uuid) return;
      (classItem.schedule ?? []).forEach(instance => {
        if (instance.uuid) map.set(instance.uuid, classItem.uuid as string);
      });
    });
    return map;
  }, [relevantClasses]);

  const waitlistEnrollmentsByClass = useMemo(() => {
    const map = new Map<string, Enrollment[]>();
    for (const enrollment of waitlistQuery.data?.data?.content ?? []) {
      const classUuid = instanceToClassUuid.get(enrollment.scheduled_instance_uuid ?? '');
      if (!classUuid) continue;
      const current = map.get(classUuid) ?? [];
      current.push(enrollment);
      map.set(classUuid, current);
    }
    return map;
  }, [instanceToClassUuid, waitlistQuery.data]);

  const liveClasses = useMemo<TrainingHubLiveClass[]>(() => {
    return relevantClasses.map(classItem => {
      const enrollments =
        enrollmentsByClass.get(classItem.uuid ?? '') ?? [];

      const students = new Set(
        enrollments
          .filter(enrollment =>
            ACTIVE_ENROLLMENT_STATUSES.has(
              enrollment.status ?? ''
            )
          )
          .map(enrollment => enrollment.student_uuid)
          .filter(Boolean)
      ).size;

      const classSchedules =
        classItem.schedule?.filter(
          instance => instance.status !== 'CANCELLED'
        ) ?? [];

      const nextSession = classSchedules[0] ?? null;

      return {
        id: classItem.uuid ?? classItem.title,
        class: classItem,
        classUuid: classItem.uuid ?? '',
        title: classItem.title,
        duration_minutes:
          classItem.duration_minutes ?? 'N/A',
        provider:
          classItem.course?.category_names?.[0] ??
          'Approved course',
        level:
          classItem.course?.total_duration_display ||
          classItem.course?.category_names?.[0] ||
          'General',
        students: `${students} student${students === 1 ? '' : 's'
          }`,
        classes: `${classSchedules.length} class${classSchedules.length === 1 ? '' : 'es'
          }`,
        fee: formatCurrency(classItem.training_fee),
        sessions: `${classSchedules.length}`,
        status: nextSession ? 'scheduled' : 'draft',
        href: classItem.uuid
          ? `/dashboard/classes/overview/${classItem.uuid}`
          : '/dashboard/classes',
        imageUrl: classItem.thumbnail_url,
        promotionalVideoUrl: classItem.promotional_video_url,
        programCourses: classItem.programCourses,
        manageHref: classItem.uuid
          ? `/dashboard/classes/overview/${classItem.uuid}`
          : '/dashboard/classes',
        inviteHref:
          '/dashboard/training-hub/waiting-list',
      };
    });
  }, [enrollmentsByClass, relevantClasses]);

  const waitlistStudentUuids = useMemo(() => {
    const studentUuids = Array.from(
      new Set(
        Array.from(waitlistEnrollmentsByClass.values())
          .flat()
          .map(enrollment => enrollment.student_uuid)
          .filter(Boolean)
      )
    );

    return studentUuids;
  }, [waitlistEnrollmentsByClass]);

  const bookingsQuery = useQuery({
    ...getInstructorBookingsOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: {
        pageable: {
          page: 0,
          size: 100,
        },
      },
    }),
    enabled: Boolean(instructorUuid),
    refetchOnWindowFocus: false,
  });

  const bookings = useMemo<BookingResponse[]>(
    () => bookingsQuery.data?.data?.content ?? [],
    [bookingsQuery.data]
  );

  const bookingStudentUuids = useMemo(
    () =>
      Array.from(
        new Set(
          bookings
            .map(booking => booking.student_uuid)
            .filter((studentUuid): studentUuid is string => Boolean(studentUuid))
        )
      ),
    [bookings]
  );

  // One batched lookup for waitlist + booking students together, then one for
  // their users — replaces a request per student and per user.
  const personStudentUuids = useMemo(
    () => [...waitlistStudentUuids, ...bookingStudentUuids],
    [bookingStudentUuids, waitlistStudentUuids]
  );

  const { studentMap: personStudentsById, isLoading: isLoadingPersonStudents } =
    useStudentsByIds(personStudentUuids);

  const personUserUuids = useMemo(
    () =>
      Object.values(personStudentsById)
        .map(student => student.user_uuid)
        .filter((uuid): uuid is string => Boolean(uuid)),
    [personStudentsById]
  );

  const { userMap: personUsersById, isLoading: isLoadingPersonUsers } =
    useUsersByIds(personUserUuids);

  const waitingList = useMemo<TrainingHubWaitingStudent[]>(() => {
    const items: TrainingHubWaitingStudent[] = [];

    relevantClasses.forEach(classItem => {
      const classUuid = classItem.uuid ?? '';
      const classWaitlist = waitlistEnrollmentsByClass.get(classUuid) ?? [];

      classWaitlist.forEach(enrollment => {
        const student = personStudentsById[enrollment.student_uuid];
        const user = student?.user_uuid ? personUsersById[student.user_uuid] : undefined;
        const scheduledInstance = classItem.schedule?.find(
          instance => instance.uuid === enrollment.scheduled_instance_uuid
        );

        items.push({
          id:
            enrollment.uuid ??
            `${classUuid}-${enrollment.student_uuid}-${enrollment.scheduled_instance_uuid}`,
          name:
            resolvePersonName(user?.first_name, user?.last_name, user?.display_name ?? user?.email) ||
            enrollment.student_uuid.slice(0, 8),
          email: user?.email ?? 'No email available',
          status:
            enrollment.status === 'WAITLISTED'
              ? 'Waitlisted'
              : normalizeStatusLabel(enrollment.status ?? 'WAITLISTED'),
          age: formatRelativeAge(enrollment.created_date),
          classTitle: classItem.course?.name || classItem.title,
          scheduleLabel: formatDateTime(scheduledInstance?.start_time),
          classId: classUuid,
        });
      });
    });

    return items.sort((left, right) => left.name.localeCompare(right.name));
  }, [relevantClasses, waitlistEnrollmentsByClass, personStudentsById, personUsersById]);

  const upcomingBookings = useMemo<TrainingHubBooking[]>(() => {
    const now = new Date();

    return bookings
      .filter(booking => isUpcomingBooking(booking, now))
      .sort((left, right) => left.start_time.getTime() - right.start_time.getTime())
      .map(booking => {
        const student = personStudentsById[booking.student_uuid];
        const user = student?.user_uuid ? personUsersById[student.user_uuid] : undefined;
        const title =
          resolvePersonName(user?.first_name, user?.last_name, user?.display_name ?? user?.email) ||
          booking.purpose ||
          'Upcoming booking';

        return {
          id: booking.uuid ?? `${booking.student_uuid}-${booking.start_time.toISOString()}`,
          title,
          subtitle: booking.purpose || formatDateTime(booking.start_time),
          status: normalizeStatusLabel(booking.status || 'confirmed'),
          statusTone: getBookingStatusTone(booking.status),
          meta: `${formatTimeRange(booking.start_time, booking.end_time)} • ${booking.currency ? formatCurrency(booking.price_amount, booking.currency) : 'Booking'
            }`,
          actionLabel: 'View booking',
          actionTone: 'primary',
          href: '/dashboard/training-hub/bookings',
        };
      });
  }, [personStudentsById, personUsersById, bookings]);

  return {
    classes: relevantClasses,
    liveClasses,
    managedCourses,
    waitingList,
    upcomingBookings,
    isLoading:
      isLoadingClasses ||
      isLoadingCourses ||
      isLoadingApplications ||
      enrollmentQueries.some(query => query.isLoading) ||
      waitlistQuery.isLoading ||
      isLoadingPersonStudents ||
      isLoadingPersonUsers ||
      bookingsQuery.isLoading,
  };
}
