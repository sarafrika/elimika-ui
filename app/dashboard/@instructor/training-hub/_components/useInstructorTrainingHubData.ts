'use client';

import { useInstructor } from '@/context/instructor-context';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import {
  getAllCoursesOptions,
  getEnrollmentsForClassOptions,
  getInstructorBookingsOptions,
  getStudentByIdOptions,
  getUserByUuidOptions,
  searchEnrollmentsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { BookingResponse, Enrollment, ScheduledInstance, Student, User } from '@/services/client/types.gen';
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

const formatDayLabel = (value?: Date | string | null) => {
  if (!value) return 'Upcoming';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Upcoming';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const formatTimeRange = (start?: Date | string | null, end?: Date | string | null) => {
  if (!start || !end) return 'Time pending';

  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Time pending';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
};

const formatDateTime = (value?: Date | string | null) => {
  if (!value) return 'Schedule pending';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Schedule pending';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
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

const isNonCancelledInstance = (instance: ScheduledInstance) => instance.status !== 'CANCELLED';

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
      classes.filter(
        classItem =>
          Boolean(classItem.course_uuid) && approvedApplicationMap.has(classItem.course_uuid ?? '')
      ),
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
        ctaHref: '/dashboard/classes/create-new',
        accent: ACCENTS[index % ACCENTS.length] ?? 'blue',
        imageUrl: course.thumbnail_url ?? course.banner_url,
        status: 'approved',
      };
    });
  }, [approvedCourses, classesByCourse, enrollmentsByClass]);

  const waitlistQueries = useQueries({
    queries: relevantClasses.map(classItem => ({
      ...searchEnrollmentsOptions({
        query: {
          pageable: {
            page: 0,
            size: 100,
          },
          searchParams: {
            class_definition_uuid_eq: classItem.uuid ?? '',
            status_eq: 'WAITLISTED',
          },
        },
      }),
      enabled: Boolean(classItem.uuid),
      staleTime: 60 * 1000,
    })),
  });

  const waitlistEnrollmentsByClass = useMemo(() => {
    const map = new Map<string, Enrollment[]>();
    relevantClasses.forEach((classItem, index) => {
      if (!classItem.uuid) return;
      map.set(classItem.uuid, waitlistQueries[index]?.data?.data?.content ?? []);
    });
    return map;
  }, [relevantClasses, waitlistQueries]);

  const liveClassItems = useMemo(() => {
    const now = new Date();

    return relevantClasses
      .flatMap(classItem =>
        (classItem.schedule ?? []).map(instance => ({
          classItem,
          instance,
        }))
      )
      .filter(({ instance }) => {
        const endTime = new Date(instance.end_time);
        return isNonCancelledInstance(instance) && endTime.getTime() >= now.getTime();
      })
      .sort(
        (left, right) =>
          new Date(left.instance.start_time).getTime() - new Date(right.instance.start_time).getTime()
      );
  }, [relevantClasses]);

  const liveClasses = useMemo<TrainingHubLiveClass[]>(() => {
    return liveClassItems.slice(0, 5).map(({ classItem, instance }) => {
      const enrollments = enrollmentsByClass.get(classItem.uuid ?? '') ?? [];
      const students = enrollments.filter(
        enrollment =>
          enrollment.scheduled_instance_uuid === instance.uuid &&
          ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status ?? '')
      ).length;
      const waitlistedStudents = (waitlistEnrollmentsByClass.get(classItem.uuid ?? '') ?? []).filter(
        enrollment => enrollment.scheduled_instance_uuid === instance.uuid
      ).length;

      const dayLabel = formatDayLabel(instance.start_time);

      return {
        id: instance.uuid ?? classItem.uuid ?? classItem.title,
        day: dayLabel,
        time: formatTimeRange(instance.start_time, instance.end_time),
        title: instance.title || classItem.course?.name || classItem.title,
        provider: classItem.course?.category_names?.[0] ?? 'Approved course',
        students: `${students} students`,
        waitlistedStudents: `${waitlistedStudents} students`,
        fee: formatCurrency(classItem.training_fee),
        sessions: `${classItem.schedule?.filter(isNonCancelledInstance).length ?? 0}`,
        href: '/dashboard/classes',
        status: dayLabel === 'Today' ? 'today' : dayLabel === 'Tomorrow' ? 'tomorrow' : 'upcoming',
      };
    });
  }, [enrollmentsByClass, liveClassItems, waitlistEnrollmentsByClass]);

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

  const waitlistStudentQueries = useQueries({
    queries: waitlistStudentUuids.map(uuid => ({
      ...getStudentByIdOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 60 * 1000,
    })),
  });

  const waitlistStudentsById = useMemo(() => {
    const map: Record<string, Student> = {};
    waitlistStudentQueries.forEach(queryResult => {
      const student = queryResult.data;
      if (student?.uuid) {
        map[student.uuid] = student;
      }
    });
    return map;
  }, [waitlistStudentQueries]);

  const waitlistUserUuids = useMemo(
    () =>
      Array.from(
        new Set(
          waitlistStudentQueries
            .map(queryResult => queryResult.data?.user_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [waitlistStudentQueries]
  );

  const waitlistUserQueries = useQueries({
    queries: waitlistUserUuids.map(uuid => ({
      ...getUserByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 60 * 1000,
    })),
  });

  const waitlistUsersById = useMemo(() => {
    const map: Record<string, User> = {};
    waitlistUserQueries.forEach(queryResult => {
      const user = queryResult.data?.data;
      if (user?.uuid) {
        map[user.uuid] = user;
      }
    });
    return map;
  }, [waitlistUserQueries]);

  const waitingList = useMemo<TrainingHubWaitingStudent[]>(() => {
    const items: TrainingHubWaitingStudent[] = [];

    relevantClasses.forEach(classItem => {
      const classUuid = classItem.uuid ?? '';
      const classWaitlist = waitlistEnrollmentsByClass.get(classUuid) ?? [];

      classWaitlist.forEach(enrollment => {
        const student = waitlistStudentsById[enrollment.student_uuid];
        const user = student?.user_uuid ? waitlistUsersById[student.user_uuid] : undefined;
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
  }, [relevantClasses, waitlistEnrollmentsByClass, waitlistStudentsById, waitlistUsersById]);

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

  const bookingStudentQueries = useQueries({
    queries: bookingStudentUuids.map(uuid => ({
      ...getStudentByIdOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 60 * 1000,
    })),
  });

  const bookingStudentsById = useMemo(() => {
    const map: Record<string, Student> = {};
    bookingStudentQueries.forEach(queryResult => {
      const student = queryResult.data;
      if (student?.uuid) {
        map[student.uuid] = student;
      }
    });
    return map;
  }, [bookingStudentQueries]);

  const bookingUserUuids = useMemo(
    () =>
      Array.from(
        new Set(
          bookingStudentQueries
            .map(queryResult => queryResult.data?.user_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [bookingStudentQueries]
  );

  const bookingUserQueries = useQueries({
    queries: bookingUserUuids.map(uuid => ({
      ...getUserByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 60 * 1000,
    })),
  });

  const bookingUsersById = useMemo(() => {
    const map: Record<string, User> = {};
    bookingUserQueries.forEach(queryResult => {
      const user = queryResult.data?.data;
      if (user?.uuid) {
        map[user.uuid] = user;
      }
    });
    return map;
  }, [bookingUserQueries]);

  const upcomingBookings = useMemo<TrainingHubBooking[]>(() => {
    const now = new Date();

    return bookings
      .filter(booking => isUpcomingBooking(booking, now))
      .sort((left, right) => left.start_time.getTime() - right.start_time.getTime())
      .map(booking => {
        const student = bookingStudentsById[booking.student_uuid];
        const user = student?.user_uuid ? bookingUsersById[student.user_uuid] : undefined;
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
  }, [bookingStudentsById, bookingUsersById, bookings]);

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
      waitlistQueries.some(query => query.isLoading) ||
      waitlistStudentQueries.some(query => query.isLoading) ||
      waitlistUserQueries.some(query => query.isLoading) ||
      bookingsQuery.isLoading ||
      bookingStudentQueries.some(query => query.isLoading) ||
      bookingUserQueries.some(query => query.isLoading),
  };
}
