'use client';

import { useInstructor } from '@/context/instructor-context';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import {
  getAssignmentSchedulesOptions,
  getEnrollmentsForClassOptions,
  getRevenueDashboard1Options,
  getStudentByIdOptions,
  listPaymentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassAssignmentSchedule,
  Enrollment,
  RevenueDashboardDto,
  RevenuePaymentDto,
  ScheduledInstance,
  Student,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  BookOpen,
  CheckSquare,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import type {
  OverviewCourse,
  OverviewCourseSummary,
  OverviewEarningCard,
  OverviewInvite,
  OverviewLiveClass,
  OverviewStat,
  OverviewUpcomingClass,
} from './_components/overview-data';

const COURSE_ICONS: LucideIcon[] = [BarChart3, BookOpen, CheckSquare, GraduationCap];
const ACTIVE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);

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

const pickDisplayCurrency = (dashboard?: RevenueDashboardDto, payments?: RevenuePaymentDto[]) =>
  dashboard?.estimated_earnings?.[0]?.currency_code ||
  dashboard?.gross_totals?.[0]?.currency_code ||
  payments?.[0]?.currency_code ||
  'KES';

export function useInstructorOverviewData() {
  const instructor = useInstructor();
  const instructorUuid = instructor?.uuid;

  const { classes: classesWithSchedules, isLoading: isLoadingClasses } =
    useInstructorClassesWithSchedules(instructorUuid);

  const classes = useMemo(
    () => classesWithSchedules.filter(item => item.is_active !== false),
    [classesWithSchedules]
  );

  const classSchedulesMap = useMemo(() => {
    const map = new Map<string, ScheduledInstance[]>();
    classes.forEach(cls => {
      if (!cls.uuid) return;
      map.set(cls.uuid, cls.schedule ?? []);
    });
    return map;
  }, [classes]);

  const enrollmentQueries = useQueries({
    queries: classes.map(cls => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: cls.uuid ?? '' },
      }),
      enabled: Boolean(cls.uuid),
      staleTime: 60 * 1000,
    })),
  });

  const classEnrollmentsMap = useMemo(() => {
    const map = new Map<string, Enrollment[]>();
    classes.forEach((cls, index) => {
      if (!cls.uuid) return;
      map.set(cls.uuid, enrollmentQueries[index]?.data?.data ?? []);
    });
    return map;
  }, [classes, enrollmentQueries]);

  const assignmentScheduleQueries = useQueries({
    queries: classes.map(cls => ({
      ...getAssignmentSchedulesOptions({
        path: { classUuid: cls.uuid ?? '' },
      }),
      enabled: Boolean(cls.uuid),
      staleTime: 60 * 1000,
    })),
  });

  const assignmentSchedules = useMemo(
    () =>
      assignmentScheduleQueries.flatMap(query => (query.data?.data ?? []) as ClassAssignmentSchedule[]),
    [assignmentScheduleQueries]
  );

  const waitlistedEnrollments = useMemo(
    () =>
      classes.flatMap(cls =>
        (classEnrollmentsMap.get(cls.uuid ?? '') ?? [])
          .filter(enrollment => enrollment.status === 'WAITLISTED')
          .map(enrollment => ({ classDefinition: cls, enrollment }))
      ),
    [classes, classEnrollmentsMap]
  );

  const waitlistedStudentIds = useMemo(
    () =>
      Array.from(
        new Set(
          waitlistedEnrollments
            .map(item => item.enrollment.student_uuid)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [waitlistedEnrollments]
  );

  const waitlistedStudentQueries = useQueries({
    queries: waitlistedStudentIds.map(studentId => ({
      ...getStudentByIdOptions({ path: { id: studentId } }),
      enabled: Boolean(studentId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    waitlistedStudentIds.forEach((studentId, index) => {
      const student = waitlistedStudentQueries[index]?.data?.data;
      if (student) {
        map.set(studentId, student);
      }
    });
    return map;
  }, [waitlistedStudentIds, waitlistedStudentQueries]);

  const { data: revenueDashboardResponse, isLoading: isLoadingRevenue } = useQuery({
    ...getRevenueDashboard1Options({
      query: {
        domain: 'instructor',
      },
    }),
    enabled: Boolean(instructorUuid),
    staleTime: 5 * 60 * 1000,
  });

  const { data: paymentsResponse, isLoading: isLoadingPayments } = useQuery({
    ...listPaymentsOptions({
      query: {
        domain: 'instructor',
        pageable: {
          page: 0,
          size: 4,
          sort: ['processed_at,desc'],
        },
      },
    }),
    enabled: Boolean(instructorUuid),
    staleTime: 60 * 1000,
  });

  const revenueDashboard = revenueDashboardResponse?.data;
  const payments = paymentsResponse?.data?.content ?? [];
  const displayCurrency = pickDisplayCurrency(revenueDashboard, payments);

  const allSchedules = useMemo(
    () =>
      classes.flatMap(cls =>
        (classSchedulesMap.get(cls.uuid ?? '') ?? []).map(instance => ({
          classDefinition: cls,
          instance,
          course: cls.course ?? null,
          enrollments: classEnrollmentsMap.get(cls.uuid ?? '') ?? [],
        }))
      ),
    [classes, classSchedulesMap, classEnrollmentsMap]
  );

  const activeCourses = useMemo<OverviewCourse[]>(() => {
    const uniqueCourses = new Map<string, OverviewCourse>();

    classes.forEach((cls, index) => {
      const course = cls.course;
      const courseId = course?.uuid;

      if (!courseId || uniqueCourses.has(courseId)) return;

      const enrollments = (classEnrollmentsMap.get(cls.uuid ?? '') ?? []).filter(
        enrollment => ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status ?? '')
      );

      // Courses can have multiple class definitions, so we collapse repeat learners per course card.
      const uniqueStudents = new Map<string, typeof enrollments[number]>();
      enrollments.forEach(enrollment => {
        const studentId = enrollment.student_uuid;
        if (studentId) {
          uniqueStudents.set(studentId, enrollment);
        }
      });

      const progress = calculateProgress(
        classSchedulesMap.get(cls.uuid ?? '') ?? []
      );

      uniqueCourses.set(courseId, {
        id: courseId,
        title: course?.name ?? cls.title,
        provider:
          course?.category_names?.[0] ??
          formatSessionFormat(cls.session_format),
        level: formatSessionFormat(cls.location_type),
        students: uniqueStudents.size,
        progress,
        actionLabel: 'View Class',
        icon: COURSE_ICONS[index % COURSE_ICONS.length],
      });
    });

    return Array.from(uniqueCourses.values());
  }, [classes, classEnrollmentsMap, classSchedulesMap]);

  const totalStudents = useMemo(
    () =>
      Array.from(
        new Set(
          classes.flatMap(
            cls =>
              (classEnrollmentsMap.get(cls.uuid ?? '') ?? [])
                .filter(enrollment => ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status ?? ''))
                .map(enrollment => enrollment.student_uuid)
                .filter((value): value is string => Boolean(value))
          )
        )
      ).length,
    [classes, classEnrollmentsMap]
  );

  const overallProgress = useMemo(() => {
    const allInstances = classes.flatMap(cls => classSchedulesMap.get(cls.uuid ?? '') ?? []);
    return calculateProgress(allInstances);
  }, [classes, classSchedulesMap]);

  const now = new Date();
  const futureInstances = useMemo(
    () =>
      allSchedules
        .filter(item => isFutureLikeInstance(item.instance, now))
        .sort(
          (left, right) =>
            new Date(left.instance.start_time).getTime() - new Date(right.instance.start_time).getTime()
        ),
    [allSchedules, now]
  );

  const liveSource = useMemo(() => {
    const imminent = futureInstances.filter(item => {
      if (item.instance.status === 'ONGOING') {
        return true;
      }

      const start = new Date(item.instance.start_time).getTime();
      const diff = start - now.getTime();
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24;
    });

    return (imminent.length ? imminent : futureInstances).slice(0, 2);
  }, [futureInstances, now]);

  const liveInstanceIds = new Set(liveSource.map(item => item.instance.uuid).filter(Boolean));

  const upcomingSource = useMemo(
    () =>
      futureInstances
        .filter(item => !liveInstanceIds.has(item.instance.uuid))
        .slice(0, 3),
    [futureInstances, liveInstanceIds]
  );

  const liveClasses = useMemo<OverviewLiveClass[]>(
    () =>
      liveSource.map(item => {
        const enrolledCount = item.enrollments.filter(
          enrollment =>
            enrollment.scheduled_instance_uuid === item.instance.uuid &&
            ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status ?? '')
        ).length;

        return {
          id: item.instance.uuid ?? item.classDefinition.uuid ?? item.instance.title,
          timeLabel: formatRelativeClassTime(item.instance.start_time),
          title: item.instance.title || item.course?.name || item.classDefinition.title,
          provider: item.course?.category_names?.[0] ?? formatSessionFormat(item.classDefinition.session_format),
          students: `${enrolledCount} students`,
          actionLabel: 'Manage',
          attendeeInitials: [],
        };
      }),
    [liveSource]
  );

  const upcomingClasses = useMemo<OverviewUpcomingClass[]>(
    () =>
      upcomingSource.map(item => ({
        id: item.instance.uuid ?? item.classDefinition.uuid ?? item.instance.title,
        title: item.instance.title || item.course?.name || item.classDefinition.title,
        scheduleLabel: formatDateTime(item.instance.start_time),
        metaLabel:
          item.instance.location_name ||
          formatSessionFormat(item.classDefinition.location_type) ||
          'Scheduled class',
        status: item.instance.status === 'ONGOING' ? 'Ongoing' : 'Scheduled',
      })),
    [upcomingSource]
  );

  const classInvites = useMemo<OverviewInvite[]>(
    () =>
      waitlistedEnrollments
        .sort((left, right) => {
          const leftSchedule = (classSchedulesMap.get(left.classDefinition.uuid ?? '') ?? []).find(
            instance => instance.uuid === left.enrollment.scheduled_instance_uuid
          );
          const rightSchedule = (classSchedulesMap.get(right.classDefinition.uuid ?? '') ?? []).find(
            instance => instance.uuid === right.enrollment.scheduled_instance_uuid
          );

          const leftTime = new Date(
            leftSchedule?.start_time ?? left.enrollment.created_date ?? 0
          ).getTime();
          const rightTime = new Date(
            rightSchedule?.start_time ?? right.enrollment.created_date ?? 0
          ).getTime();

          return leftTime - rightTime;
        })
        .map(({ classDefinition, enrollment }) => {
          const relatedInstance = (classSchedulesMap.get(classDefinition.uuid ?? '') ?? []).find(
            instance => instance.uuid === enrollment.scheduled_instance_uuid
          );
          const student = studentMap.get(enrollment.student_uuid);

          return {
            id:
              enrollment.uuid ??
              `${classDefinition.uuid ?? 'class'}-${enrollment.student_uuid ?? 'student'}`,
            title: relatedInstance?.title || classDefinition.title,
            host: student?.full_name ?? 'Interested student',
            schedule: formatDateTime(relatedInstance?.start_time ?? enrollment.created_date),
            actionLabel: 'Review',
            actionTone: 'accept',
          };
        })
        .slice(0, 3),
    [waitlistedEnrollments, classSchedulesMap, studentMap]
  );

  const earningOverview = useMemo<OverviewEarningCard[]>(() => {
    const summaryCards: OverviewEarningCard[] = revenueDashboard
      ? [
        {
          id: 'estimated-earnings',
          title: formatMoney(revenueDashboard.estimated_earnings?.[0]?.amount, displayCurrency),
          subtitle: 'Estimated earnings',
          provider: 'Gross sales',
          students: formatMoney(revenueDashboard.gross_totals?.[0]?.amount, displayCurrency),
          valueLabel: `${Number(revenueDashboard.order_count ?? 0n)} payments processed`,
          attendeeInitials: [],
        },
        {
          id: 'average-order-value',
          title: formatMoney(revenueDashboard.average_order_value?.[0]?.amount, displayCurrency),
          subtitle: 'Average order value',
          provider: 'Units sold',
          students: formatCompactNumber(Number(revenueDashboard.units_sold ?? 0n)),
          valueLabel: `${Number(revenueDashboard.line_item_count ?? 0n)} line items`,
          attendeeInitials: [],
        },
      ]
      : [];

    if (summaryCards.length) {
      return summaryCards;
    }

    return payments.slice(0, 2).map((payment, index) => ({
      id:
        payment.payment_uuid ??
        payment.order_uuid ??
        payment.external_reference ??
        `payment-${index + 1}`,
      title: formatMoney(payment.amount, payment.currency_code),
      subtitle: payment.provider || 'Payment received',
      provider: payment.status || 'Unknown status',
      students: payment.external_reference || payment.order_uuid || 'Transaction',
      valueLabel: formatDateTime(payment.processed_at),
      attendeeInitials: [],
    }));
  }, [displayCurrency, payments, revenueDashboard]);

  const stats = useMemo<OverviewStat[]>(
    () => [
      { label: 'Active Courses', value: formatCompactNumber(activeCourses.length), tone: 'blue' },
      { label: 'Total Students', value: formatCompactNumber(totalStudents), tone: 'green' },
      {
        label: 'Assigned Assignments',
        value: formatCompactNumber(assignmentSchedules.length),
        tone: 'red',
      },
      { label: 'Course Progress', value: `${overallProgress}%`, tone: 'orange' },
    ],
    [activeCourses.length, assignmentSchedules.length, overallProgress, totalStudents]
  );

  const courseSummary = useMemo<OverviewCourseSummary>(
    () => ({
      title: 'Training Progress',
      primaryValue: `${formatCompactNumber(totalStudents)} learners across ${formatCompactNumber(
        activeCourses.length
      )} active courses`,
      secondaryValue: `${formatCompactNumber(assignmentSchedules.length)} assignments scheduled`,
      percent: overallProgress,
      primaryActionLabel: 'View Classes',
      secondaryActionLabel: 'Review Assignments',
    }),
    [activeCourses.length, assignmentSchedules.length, overallProgress, totalStudents]
  );

  const isLoading =
    isLoadingClasses ||
    isLoadingRevenue ||
    isLoadingPayments ||
    enrollmentQueries.some(query => query.isLoading) ||
    assignmentScheduleQueries.some(query => query.isLoading) ||
    waitlistedStudentQueries.some(query => query.isLoading);

  return {
    activeCourses,
    classInvites,
    courseSummary,
    earningOverview,
    isLoading,
    liveClasses,
    stats,
    upcomingClasses,
  };
}
