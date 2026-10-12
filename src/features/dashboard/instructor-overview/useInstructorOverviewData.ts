// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { BarChart3, BookOpen, CheckSquare, GraduationCap, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useInstructor } from '@/context/instructor-context';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import {
  type InstructorClassWithSchedule,
  useInstructorClassesWithSchedules,
} from '@/hooks/use-instructor-classes-with-schedules';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAssignmentSchedulesOptions,
  getRevenueDashboard1Options,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassAssignmentSchedule,
  RevenueDashboardDto,
  ScheduledInstance,
} from '@/services/client/types.gen';
import type {
  OverviewCourse,
  OverviewCourseSummary,
  OverviewEarningCard,
  OverviewInvite,
  OverviewLiveClass,
  OverviewStat,
  OverviewUpcomingClass,
} from './_components/overview-data';
import { ACTIVE_ENROLLMENT_STATUSES, summarizeCourseEnrollments } from './overview-enrollments';

const COURSE_ICONS: LucideIcon[] = [BarChart3, BookOpen, CheckSquare, GraduationCap];

const formatCompactNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const formatMoney = (amount?: number | null, currencyCode?: string | null) => {
  if (typeof amount !== 'number') {
    return 'N/A';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'KES',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode || 'KES'} ${amount.toFixed(0)}`;
  }
};

const formatDateTime = (value?: Date | string | null) => {
  if (!value) {
    return 'Schedule pending';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Schedule pending';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatRelativeClassTime = (value?: Date | string | null) => {
  if (!value) {
    return 'Upcoming session';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Upcoming session';
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  if (diffDays === 0) return `Today · ${time}`;
  if (diffDays === 1) return `Tomorrow · ${time}`;

  return `${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)} · ${time}`;
};

const formatSessionFormat = (value?: string | null) => {
  if (!value) return 'Class';

  return value
    .toLowerCase()
    .split('_')
    .map(part => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
};

const buildInitials = (value?: string | null) =>
  value
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') ?? '';

const isNonCancelledInstance = (instance: ScheduledInstance) => instance.status !== 'CANCELLED';

const isFutureLikeInstance = (instance: ScheduledInstance, now: Date) => {
  const end = new Date(instance.end_time);
  return isNonCancelledInstance(instance) && end.getTime() >= now.getTime();
};

const calculateProgress = (instances: ScheduledInstance[]) => {
  const eligible = instances.filter(isNonCancelledInstance);
  if (!eligible.length) {
    return 0;
  }

  const completed = eligible.filter(instance => instance.status === 'COMPLETED').length;
  return Math.round((completed / eligible.length) * 100);
};

const pickDisplayCurrency = (dashboard?: RevenueDashboardDto) =>
  dashboard?.estimated_earnings?.[0]?.currency_code ||
  dashboard?.gross_totals?.[0]?.currency_code ||
  'KES';

/**
 * Shared class source for every overview section. It never blocks rendering: each section
 * reads the per-source loading flags it actually depends on and resolves on its own.
 */
export function useOverviewClasses() {
  const instructor = useInstructor();
  const {
    classes: classesWithSchedules,
    isLoadingDefinitions,
    isLoadingCourses,
    isLoadingEnrollments,
    isLoadingSchedule,
    error,
    refetch,
  } = useInstructorClassesWithSchedules(instructor?.uuid);

  const classes = useMemo(
    () => classesWithSchedules.filter(item => item.is_active !== false),
    [classesWithSchedules]
  );

  return {
    classes,
    isLoadingDefinitions,
    isLoadingCourses,
    isLoadingEnrollments,
    isLoadingSchedule,
    error,
    refetch,
  };
}

export type OverviewClassesSource = ReturnType<typeof useOverviewClasses>;

const scheduleOf = (cls: InstructorClassWithSchedule) => cls.schedule ?? [];

/** Assignment count across the instructor's classes; feeds the stat card and course summary. */
export function useOverviewAssignmentCount(classes: InstructorClassWithSchedule[]) {
  return useQueries({
    queries: classes
      .filter(cls => Boolean(cls.uuid))
      .map(cls => ({
        ...getAssignmentSchedulesOptions({ path: { classUuid: cls.uuid as string } }),
        staleTime: STALE_TIMES.live,
      })),
    combine: results => ({
      count: results.reduce(
        (total, query) => total + ((query.data?.data ?? []) as ClassAssignmentSchedule[]).length,
        0
      ),
      isLoading: results.some(query => query.isLoading),
    }),
  });
}

/** Active courses, learner totals and overall progress; needs definitions, courses, enrolments, schedule. */
export function useOverviewCourses(source: OverviewClassesSource) {
  const { classes } = source;
  const { studentsByCourse, totalStudents } = useMemo(
    () => summarizeCourseEnrollments(classes),
    [classes]
  );

  const activeCourses = useMemo<OverviewCourse[]>(() => {
    const uniqueCourses = new Map<string, OverviewCourse>();
    const now = new Date();

    classes.forEach((cls, index) => {
      const course = cls.course;
      const courseId = course?.uuid;
      if (!courseId || uniqueCourses.has(courseId)) return;

      const courseInstances = classes
        .filter(item => item.course?.uuid === courseId)
        .flatMap(scheduleOf)
        .sort(
          (left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime()
        );
      const selectedInstance =
        courseInstances.find(instance => isFutureLikeInstance(instance, now)) ??
        courseInstances[0] ??
        null;

      uniqueCourses.set(courseId, {
        id: courseId,
        title: course?.name ?? cls.title,
        provider: course?.category_names?.[0] ?? formatSessionFormat(cls.session_format),
        level: formatSessionFormat(cls.location_type),
        students: studentsByCourse.get(courseId)?.size ?? 0,
        progress: calculateProgress(scheduleOf(cls)),
        actionLabel: 'View Class',
        viewHref: selectedInstance?.uuid
          ? `/dashboard/class-instance/${selectedInstance.uuid}`
          : `/dashboard/classes/class-training/${cls.uuid ?? ''}`,
        editHref: `/dashboard/classes/overview/${cls.uuid ?? ''}`,
        icon: COURSE_ICONS[index % COURSE_ICONS.length]!,
      });
    });

    return Array.from(uniqueCourses.values());
  }, [classes, studentsByCourse]);

  const overallProgress = useMemo(() => calculateProgress(classes.flatMap(scheduleOf)), [classes]);

  return {
    activeCourses,
    totalStudents,
    overallProgress,
    isLoading:
      source.isLoadingDefinitions ||
      source.isLoadingCourses ||
      source.isLoadingEnrollments ||
      source.isLoadingSchedule,
  };
}

const PENDING_VALUE = '…';

export function buildOverviewStats(
  courses: ReturnType<typeof useOverviewCourses>,
  assignments: { count: number; isLoading: boolean }
): OverviewStat[] {
  return [
    {
      label: 'Active Courses',
      value: formatCompactNumber(courses.activeCourses.length),
      tone: 'blue',
    },
    { label: 'Total Students', value: formatCompactNumber(courses.totalStudents), tone: 'green' },
    {
      label: 'Assigned Assignments',
      value: assignments.isLoading ? PENDING_VALUE : formatCompactNumber(assignments.count),
      tone: 'red',
    },
    { label: 'Course Progress', value: `${courses.overallProgress}%`, tone: 'orange' },
  ];
}

export function buildCourseSummary(
  courses: ReturnType<typeof useOverviewCourses>,
  assignments: { count: number; isLoading: boolean }
): OverviewCourseSummary {
  return {
    title: 'Training Progress',
    primaryValue: `${formatCompactNumber(courses.totalStudents)} learners across ${formatCompactNumber(
      courses.activeCourses.length
    )} active courses`,
    secondaryValue: assignments.isLoading
      ? 'Counting scheduled assignments…'
      : `${formatCompactNumber(assignments.count)} assignments scheduled`,
    percent: courses.overallProgress,
    primaryActionLabel: 'View Classes',
    secondaryActionLabel: 'Review Assignments',
  };
}

function useFutureInstances(classes: InstructorClassWithSchedule[]) {
  return useMemo(() => {
    const now = new Date();
    return classes
      .flatMap(cls =>
        scheduleOf(cls).map(instance => ({
          classDefinition: cls,
          instance,
          course: cls.course ?? null,
          enrollments: cls.enrollments ?? [],
        }))
      )
      .filter(item => isFutureLikeInstance(item.instance, now))
      .sort(
        (left, right) =>
          new Date(left.instance.start_time).getTime() -
          new Date(right.instance.start_time).getTime()
      );
  }, [classes]);
}

type FutureInstance = ReturnType<typeof useFutureInstances>[number];

function pickLiveSource(futureInstances: FutureInstance[]) {
  const now = Date.now();
  const imminent = futureInstances.filter(item => {
    if (item.instance.status !== 'SCHEDULED') return false;
    const diff = new Date(item.instance.start_time).getTime() - now;
    return diff >= 0 && diff <= 1000 * 60 * 60 * 24;
  });
  return (imminent.length ? imminent : futureInstances).slice(0, 3);
}

/** Next three sessions (imminent first); needs definitions, schedule and enrolments for counts. */
export function useOverviewLiveClasses(source: OverviewClassesSource) {
  const futureInstances = useFutureInstances(source.classes);

  const liveClasses = useMemo<OverviewLiveClass[]>(
    () =>
      pickLiveSource(futureInstances).map(item => {
        const enrolledCount = item.enrollments.filter(
          enrollment =>
            enrollment.scheduled_instance_uuid === item.instance.uuid &&
            ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status ?? '')
        ).length;

        return {
          id: item.classDefinition.uuid ?? '',
          timeLabel: formatRelativeClassTime(item.instance.start_time),
          title: item.classDefinition.title,
          provider:
            item.course?.category_names?.[0] ??
            formatSessionFormat(item.classDefinition.session_format),
          students: `${enrolledCount} students`,
          actionLabel: 'Manage class',
          infoHref: item.classDefinition.uuid
            ? `/dashboard/classes/overview/${item.classDefinition.uuid}`
            : item.instance.uuid
              ? `/dashboard/class-instance/${item.instance.uuid}`
              : `/dashboard/classes/class-training/${item.classDefinition.uuid ?? ''}`,
          href: item.instance.uuid
            ? `/dashboard/class-instance/${item.instance.uuid}`
            : `/dashboard/classes/class-training/${item.classDefinition.uuid ?? ''}`,
          attendeeInitials: [],
        };
      }),
    [futureInstances]
  );

  return {
    liveClasses,
    isLoading:
      source.isLoadingDefinitions ||
      source.isLoadingSchedule ||
      source.isLoadingCourses ||
      source.isLoadingEnrollments,
  };
}

/** Sessions after the live ones; needs only class definitions and the schedule. */
export function useOverviewUpcomingClasses(source: OverviewClassesSource) {
  const futureInstances = useFutureInstances(source.classes);

  const upcomingClasses = useMemo<OverviewUpcomingClass[]>(() => {
    const liveIds = new Set(pickLiveSource(futureInstances).map(item => item.instance.uuid));
    return futureInstances
      .filter(item => !liveIds.has(item.instance.uuid))
      .slice(0, 3)
      .map(item => ({
        id: item.classDefinition.uuid ?? '',
        title: item.classDefinition.title,
        scheduleLabel: formatDateTime(item.instance.start_time),
        metaLabel:
          item.instance.location_name ||
          formatSessionFormat(item.classDefinition.location_type) ||
          'Scheduled class',
        status: item.instance.status === 'ONGOING' ? 'Ongoing' : 'Scheduled',
        href: item.classDefinition.uuid
          ? `/dashboard/class-instance/${item.instance.uuid}`
          : `/dashboard/classes/class-training/${item.classDefinition.uuid ?? ''}`,
      }));
  }, [futureInstances]);

  return {
    upcomingClasses,
    isLoading: source.isLoadingDefinitions || source.isLoadingSchedule,
  };
}

/** Waitlisted learners awaiting review; student names come from one batched lookup. */
export function useOverviewClassInvites(source: OverviewClassesSource) {
  const { classes } = source;

  const waitlistedEnrollments = useMemo(
    () =>
      classes.flatMap(cls =>
        (cls.enrollments ?? [])
          .filter(enrollment => enrollment.status === 'WAITLISTED')
          .map(enrollment => ({ classDefinition: cls, enrollment }))
      ),
    [classes]
  );

  const waitlistedStudentIds = useMemo(
    () =>
      waitlistedEnrollments
        .map(item => item.enrollment.student_uuid)
        .filter((value): value is string => Boolean(value)),
    [waitlistedEnrollments]
  );

  const { studentMap, isLoading: isLoadingStudents } = useStudentsByIds(waitlistedStudentIds);

  const classInvites = useMemo<OverviewInvite[]>(() => {
    const instanceFor = (item: (typeof waitlistedEnrollments)[number]) =>
      scheduleOf(item.classDefinition).find(
        instance => instance.uuid === item.enrollment.scheduled_instance_uuid
      );
    const sortTime = (item: (typeof waitlistedEnrollments)[number]) =>
      new Date(instanceFor(item)?.start_time ?? item.enrollment.created_date ?? 0).getTime();

    return [...waitlistedEnrollments]
      .sort((left, right) => sortTime(left) - sortTime(right))
      .slice(0, 3)
      .map(item => {
        const { classDefinition, enrollment } = item;
        const relatedInstance = instanceFor(item);
        const student = enrollment.student_uuid ? studentMap[enrollment.student_uuid] : undefined;

        return {
          id:
            enrollment.uuid ??
            `${classDefinition.uuid ?? 'class'}-${enrollment.student_uuid ?? 'student'}`,
          title: relatedInstance?.title || classDefinition.title,
          host: student?.full_name ?? 'Interested student',
          schedule: formatDateTime(relatedInstance?.start_time ?? enrollment.created_date),
          actionLabel: 'Review',
          actionTone: 'accept' as const,
        };
      });
  }, [waitlistedEnrollments, studentMap]);

  return {
    classInvites,
    isLoading:
      source.isLoadingDefinitions ||
      source.isLoadingEnrollments ||
      source.isLoadingSchedule ||
      isLoadingStudents,
  };
}

/** Earnings cards from the revenue dashboard; independent of the class graph. */
export function useOverviewEarnings() {
  const instructor = useInstructor();
  const instructorUuid = instructor?.uuid;

  // listPayments(domain=instructor) is admin-only (always 403 here); the revenue dashboard is the source.
  const query = useQuery({
    ...getRevenueDashboard1Options({ query: { domain: 'instructor' } }),
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.entity,
  });

  const revenueDashboard = query.data?.data;

  const earningOverview = useMemo<OverviewEarningCard[]>(() => {
    if (!revenueDashboard) return [];
    const displayCurrency = pickDisplayCurrency(revenueDashboard);

    return [
      {
        id: 'estimated-earnings',
        title: formatMoney(revenueDashboard.estimated_earnings?.[0]?.amount ?? 0, displayCurrency),
        subtitle: 'Estimated earnings',
        provider: 'Gross sales',
        students: formatMoney(revenueDashboard.gross_totals?.[0]?.amount ?? 0, displayCurrency),
        valueLabel: `${Number(revenueDashboard.order_count ?? 0n)} payments processed`,
        attendeeInitials: [],
      },
      {
        id: 'average-order-value',
        title: formatMoney(revenueDashboard.average_order_value?.[0]?.amount ?? 0, displayCurrency),
        subtitle: 'Average order value',
        provider: 'Units sold',
        students: formatCompactNumber(Number(revenueDashboard.units_sold ?? 0n)),
        valueLabel: `${Number(revenueDashboard.line_item_count ?? 0n)} line items`,
        attendeeInitials: [],
      },
    ];
  }, [revenueDashboard]);

  return {
    earningOverview,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
