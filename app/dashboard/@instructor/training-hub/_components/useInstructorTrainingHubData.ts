'use client';

import { useInstructor } from '@/context/instructor-context';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import {
  getAllCoursesOptions,
  getEnrollmentsForClassOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Enrollment, ScheduledInstance } from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { TrainingHubLiveClass, TrainingHubManagedCourse } from './training-hub-data';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);
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

const isNonCancelledInstance = (instance: ScheduledInstance) => instance.status !== 'CANCELLED';

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
    () => new Map(approvedApplications.map(application => [application.course_uuid ?? '', application])),
    [approvedApplications]
  );

  const approvedCourses = useMemo(
    () =>
      (coursesResponse?.data?.content ?? []).filter(
        course => Boolean(course.uuid) && course.admin_approved && approvedApplicationMap.has(course.uuid ?? '')
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
          if (
            enrollment.student_uuid &&
            ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status ?? '')
          ) {
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
        ctaLabel: 'Create Classes',
        ctaHref: '/dashboard/classes/create-new',
        accent: ACCENTS[index % ACCENTS.length],
        imageUrl: course.thumbnail_url ?? course.banner_url,
        status: 'approved',
      };
    });
  }, [approvedCourses, classesByCourse, enrollmentsByClass]);

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

      return {
        id: instance.uuid ?? classItem.uuid ?? classItem.title,
        day: formatDayLabel(instance.start_time),
        time: formatTimeRange(instance.start_time, instance.end_time),
        title: instance.title || classItem.course?.name || classItem.title,
        provider: classItem.course?.category_names?.[0] ?? 'Approved course',
        students: `${students} students`,
        fee: formatCurrency(classItem.training_fee),
        sessions: `${classItem.schedule?.filter(isNonCancelledInstance).length ?? 0}`,
        href: '/dashboard/classes',
        status:
          formatDayLabel(instance.start_time) === 'Today'
            ? 'today'
            : formatDayLabel(instance.start_time) === 'Tomorrow'
              ? 'tomorrow'
              : 'upcoming',
      };
    });
  }, [enrollmentsByClass, liveClassItems]);

  return {
    liveClasses,
    managedCourses,
    isLoading:
      isLoadingClasses ||
      isLoadingCourses ||
      isLoadingApplications ||
      enrollmentQueries.some(query => query.isLoading),
  };
}
