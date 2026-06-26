'use client';

import { useInstructor } from '@/context/instructor-context';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import { dayjs } from '@/lib/date';
import {
  getClassRatingSummaryOptions,
  getInstructorRatingSummaryOptions,
  getInstructorReviewsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Enrollment, InstructorReview } from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  DEFAULT_ANALYTICS_FILTERS,
  type InstructorAnalyticsFilters,
} from './analytics-filters';
import { useAnalyticsFilters } from './analytics-filters-context';

export type AnalyticsSession = {
  id: string;
  classUuid?: string;
  program: string;
  session: string;
  dateRange: string;
  location: string;
  instructor: string;
  enrolled: number;
  attended: number;
  completionRate: number;
  satisfaction: number | null;
  totalHours: number;
  avgHours: number;
  instanceCount: number;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  instances: Array<{
    id: string;
    date: string;
    location: string;
    hours: number;
    status: string;
    startTime: Date;
    endTime: Date | null;
  }>;
};

export type PerformancePoint = {
  label: string;
  sessions: number;
  participants: number;
  completion: number;
};

export type ProgramCompletionRate = {
  name: string;
  rate: number;
};

export type StatusBreakdownItem = {
  label: string;
  value: number;
  pct: number;
  color: string;
};

export type LocationSummary = {
  name: string;
  sessions: number;
  pct: number;
};

export type SatisfactionBucket = {
  label: string;
  count: number;
  pct: number;
  color: string;
};

export type AnalyticsMetrics = {
  totalSessions: number;
  completedSessions: number;
  participantsTrained: number;
  completionRate: number;
  averageSatisfaction: number | null;
  trainingHours: number;
  reviewCount: number;
  numberOfPrograms: number;
  activeParticipants: number;
  totalInstructors: number;
  assessmentsConducted: number;
  certificatesIssues: number;
  surveysCompleted: number;
};

const ACTIVE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);
const ATTENDED_STATUSES = new Set(['ATTENDED', 'attended']);
const COMPLETED_STATUS = new Set(['COMPLETED', 'completed']);
const CANCELLED_STATUS = new Set(['CANCELLED', 'cancelled']);
const IN_PROGRESS_STATUS = new Set(['ONGOING', 'in_progress', 'in progress', 'active']);
const UPCOMING_STATUS = new Set(['SCHEDULED', 'scheduled', 'pending', 'confirmed']);

const formatStatusLabel = (status?: string) => {
  if (!status) return 'Upcoming';
  const lower = status.toLowerCase();
  if (COMPLETED_STATUS.has(status) || lower.includes('completed')) return 'Completed';
  if (CANCELLED_STATUS.has(status) || lower.includes('cancel')) return 'Cancelled';
  if (IN_PROGRESS_STATUS.has(status) || lower.includes('ongoing')) return 'Ongoing';
  if (UPCOMING_STATUS.has(status) || lower.includes('schedule') || lower.includes('pending')) return 'Upcoming';
  return 'Upcoming';
};

const normalizeLocation = (value?: string) => {
  if (!value) return 'TBD';
  const upper = value.toString().toUpperCase();
  if (upper === 'ONLINE') return 'Online';
  if (upper === 'IN_PERSON') return 'In person';
  if (upper === 'HYBRID') return 'Hybrid';
  return value;
};

const formatLocation = (instance: { location_name?: string; location_type?: string }) => {
  if (instance.location_name) return instance.location_name;
  return normalizeLocation(instance.location_type);
};

const getClassLocation = (
  instances: Array<{ location_name?: string; location_type?: string }>,
  fallback?: { location_name?: string; location_type?: string }
) => {
  const locations = instances.map(formatLocation).filter((value) => value && value !== 'TBD');

  if (locations.length === 0) {
    return formatLocation(fallback ?? {});
  }

  const uniqueLocations = [...new Set(locations)];
  if (uniqueLocations.length === 1) {
    return uniqueLocations[0];
  }

  if (uniqueLocations.includes('Hybrid')) {
    return 'Hybrid';
  }

  return 'Mixed';
};

const getClassStatus = (instances: Array<{ status?: string }>) => {
  const statusLabels = instances.map((instance) => formatStatusLabel(instance.status));
  if (!statusLabels.length) return 'Upcoming';
  if (statusLabels.every((label) => label === 'Cancelled')) return 'Cancelled';
  if (statusLabels.some((label) => label === 'Ongoing')) return 'Ongoing';
  if (statusLabels.every((label) => label === 'Completed')) return 'Completed';
  return 'Upcoming';
};

const formatDateRange = (start?: Date, end?: Date) => {
  if (!start || !end) return 'TBD';
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  if (startDate.isSame(endDate, 'day')) {
    return startDate.format('MMM D, YYYY');
  }
  return `${startDate.format('MMM D, YYYY')} — ${endDate.format('MMM D, YYYY')}`;
};

const getDurationMinutes = (instance: {
  duration_minutes?: number | bigint;
  start_time?: Date;
  end_time?: Date;
}) => {
  if (typeof instance.duration_minutes === 'number') {
    return instance.duration_minutes;
  }
  if (typeof instance.duration_minutes === 'bigint') {
    return Number(instance.duration_minutes);
  }

  if (instance.start_time && instance.end_time) {
    return Math.max(0, Math.round((instance.end_time.getTime() - instance.start_time.getTime()) / 60000));
  }

  return 0;
};

const formatDate = (value?: Date | string) => (value ? dayjs(value).format('MMM D, YYYY') : 'TBD');

const formatHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

const getWeekBuckets = () => {
  const start = dayjs().startOf('week').subtract(4, 'week');
  return Array.from({ length: 5 }, (_, index) => {
    const weekStart = start.add(index, 'week');
    return {
      label: `${weekStart.format('MMM D')} - ${weekStart.endOf('week').format('D')}`,
      start: weekStart.toDate(),
      end: weekStart.endOf('week').toDate(),
    };
  });
};

const parseFilterDate = (value: string) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const overlapsDateRange = (
  start: Date | null | undefined,
  end: Date | null | undefined,
  from: string,
  to: string
) => {
  const rangeStart = parseFilterDate(from);
  const rangeEnd = parseFilterDate(to);

  if (!rangeStart && !rangeEnd) {
    return true;
  }

  const itemStart = start ? dayjs(start) : null;
  const itemEnd = end ? dayjs(end) : itemStart;

  if (rangeStart && itemEnd && itemEnd.isBefore(rangeStart, 'day')) {
    return false;
  }

  if (rangeEnd && itemStart && itemStart.isAfter(rangeEnd, 'day')) {
    return false;
  }

  return true;
};

const hasSelectedStatus = (selectedStatuses: string[], status: string) => {
  if (selectedStatuses.length === 0) {
    return false;
  }

  return selectedStatuses.includes(status);
};

export function useInstructorAnalyticsData(filters?: Partial<InstructorAnalyticsFilters>) {
  const contextFilters = useAnalyticsFilters().filters;
  const activeFilters = useMemo(
    () => ({
      ...DEFAULT_ANALYTICS_FILTERS,
      ...contextFilters,
      ...filters,
      statuses:
        filters?.statuses?.length
          ? filters.statuses
          : contextFilters.statuses?.length
            ? contextFilters.statuses
            : [...DEFAULT_ANALYTICS_FILTERS.statuses],
    }),
    [contextFilters, filters]
  );

  const instructor = useInstructor();
  const instructorUuid = instructor?.uuid;
  const { classes, isLoading: isLoadingClasses } = useInstructorClassesWithSchedules(instructorUuid);

  const ratingSummaryQuery = useQuery({
    ...getInstructorRatingSummaryOptions({
      path: {
        instructorUuid: instructorUuid ?? '',
      },
    }),
    enabled: Boolean(instructorUuid),
    staleTime: 60 * 1000,
  });

  const reviewsQuery = useQuery({
    ...getInstructorReviewsOptions({
      path: { instructorUuid: instructorUuid ?? '' },
    }),
    enabled: Boolean(instructorUuid),
    staleTime: 60 * 1000,
  });

  const reviewItems = reviewsQuery.data?.data ?? [];

  const classRatingQueries = useQueries({
    queries: classes.map((classItem) => ({
      ...getClassRatingSummaryOptions({
        path: { uuid: classItem.uuid ?? '' },
      }),
      enabled: Boolean(classItem.uuid),
      staleTime: 60 * 1000,
    })),
  });

  const ratingsByClass = useMemo(
    () =>
      new Map(
        classes.map((classItem, index) => [
          classItem.uuid,
          classRatingQueries[index]?.data?.data?.average_rating ?? 0,
        ])
      ),
    [classes, classRatingQueries]
  );


  const classSessionBundle = useMemo(() => {
    if (!classes.length) {
      return { sessions: [] as AnalyticsSession[], sessionByClassId: new Map<string, AnalyticsSession>() };
    }

    const instructorName = [instructor?.full_name, ''].filter(Boolean).join(' ').trim();
    const sessionByClassId = new Map<string, AnalyticsSession>();

    const sessions = classes
      .flatMap((classItem) => {
        const enrollments = (classItem.enrollments ?? []) as Array<{
          status?: string;
          student_uuid?: string;
        }>;

        const enrolled = enrollments.filter((enrollment) => ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status ?? '')).length;
        const attended = enrollments.filter((enrollment) => ATTENDED_STATUSES.has(enrollment.status ?? '')).length;

        return (classItem.schedule ?? []).map((instance) => {
          const durationMinutes = getDurationMinutes(instance);
          const startTime = instance.start_time ? new Date(instance.start_time) : new Date(0);
          const session: AnalyticsSession = {
            id: instance.uuid ?? `${classItem.uuid}-${startTime.toISOString()}`,
            classUuid: classItem.uuid,
            program: classItem.course?.name ?? classItem.title ?? 'Untitled session',
            session: classItem.title ?? 'Untitled session',
            date: formatDate(instance.start_time),
            location: formatLocation(instance),
            instructor: instructorName || 'You',
            enrolled,
            attended,
            completionRate: enrolled > 0 ? Math.round((attended / enrolled) * 100) : 0,
            satisfaction: ratingsByClass.get(classItem.uuid) ?? null,
            hours: formatHours(durationMinutes),
            status: formatStatusLabel(instance.status),
            startTime,
          };

          return session;
        });
      })
      .sort((left, right) => right.startTime.getTime() - left.startTime.getTime());

    classes.forEach((classItem) => {
      const enrollments = (classItem.enrollments ?? []) as Array<Enrollment>;
      const classUuid = classItem.uuid ?? '';
      if (!classUuid) return;

      const session = sessions.find((item) => item.classUuid === classUuid) ?? null;
      if (session) {
        sessionByClassId.set(classUuid, session);
      }

      // Preserve a direct mapping for review filtering below.
      enrollments.forEach((enrollment) => {
        if (!enrollment.uuid) return;
        if (session) {
          sessionByClassId.set(enrollment.uuid, session);
        }
      });
    });

    return { sessions, sessionByClassId };
  }, [classes, instructor?.full_name, ratingsByClass]);

  const fullSessions = classSessionBundle.sessions;

  // COMPILED SESSIONS - BUNDLED ALL SESSION INFORMATION INTO ONE CLASS
  const compiledSessions = useMemo(() => {
    if (!classes.length) return [];

    const instructorName = instructor?.full_name || 'You';

    const classSessions = classes.map((classItem) => {
      const enrollments = classItem.enrollments ?? [];

      const enrolled = enrollments.filter((e) =>
        ACTIVE_ENROLLMENT_STATUSES.has(e.status ?? '')
      ).length;

      const attended = enrollments.filter((e) =>
        ATTENDED_STATUSES.has(e.status ?? '')
      ).length;

      const instances = (classItem.schedule ?? []).map((instance) => {
        const startTime = instance.start_time
          ? new Date(instance.start_time)
          : new Date(0);
        const endTime = instance.end_time
          ? new Date(instance.end_time)
          : null;
        return {
          id: instance.uuid ?? `${classItem.uuid}-${startTime.toISOString()}`,
          date: formatDate(instance.start_time),
          location: formatLocation(instance),
          hours: formatHours(getDurationMinutes(instance)),
          status: formatStatusLabel(instance.status),
          startTime,
          endTime,
        };
      });

      const sortedInstances = [...instances].sort(
        (left, right) => left.startTime.getTime() - right.startTime.getTime()
      );

      const startDate = sortedInstances[0]?.startTime ?? null;
      const endDate =
        sortedInstances[sortedInstances.length - 1]?.endTime ??
        sortedInstances[sortedInstances.length - 1]?.startTime ??
        null;

      const totalHours = instances.reduce(
        (acc, item) => acc + Number(item.hours),
        0
      );
      const avgHours = instances.length
        ? Math.round((totalHours / instances.length) * 10) / 10
        : 0;

      return {
        id: classItem.uuid ?? `class-${Math.random().toString(36).slice(2)}`,
        program:
          classItem.course?.name ??
          classItem.title ??
          'Untitled Session',
        session:
          classItem.title ??
          'Untitled Session',
        dateRange: formatDateRange(startDate ?? undefined, endDate ?? undefined),
        location: getClassLocation(sortedInstances, classItem),
        instructor: instructorName,
        enrolled,
        attended,
        completionRate:
          enrolled > 0
            ? Math.round((attended / enrolled) * 100)
            : 0,
        satisfaction:
          ratingsByClass.get(classItem.uuid) ?? null,
        totalHours,
        avgHours,
        instanceCount: instances.length,
        status: getClassStatus(classItem.schedule ?? []),
        startDate,
        endDate,
        instances: sortedInstances,
      };
    });

    return classSessions.sort((left, right) => {
      const leftTime = left.startDate?.getTime() ?? 0;
      const rightTime = right.startDate?.getTime() ?? 0;
      return rightTime - leftTime;
    });
  }, [classes, instructor, ratingSummaryQuery.data]);


  // FILTERING WITH FULL SESSIONS
  const filteredSessions = useMemo(() => {
    return fullSessions.filter((session) => {
      const matchesProgram = activeFilters.program === 'all' || session.program === activeFilters.program;
      const matchesLocation = activeFilters.location === 'all' || session.location === activeFilters.location;
      const matchesStatus = hasSelectedStatus(activeFilters.statuses, session.status);
      const matchesDate = overlapsDateRange(
        session.startDate,
        session.endDate,
        activeFilters.dateFrom,
        activeFilters.dateTo
      );

      return matchesProgram && matchesLocation && matchesStatus && matchesDate;
    });
  }, [activeFilters.dateFrom, activeFilters.dateTo, activeFilters.location, activeFilters.program, activeFilters.statuses, fullSessions]);

  const filteredSessionIds = useMemo(
    () => new Set(filteredSessions.map((session) => session.classUuid ?? session.id)),
    [filteredSessions]
  );

  const filteredClasses = useMemo(
    () => classes.filter((classItem) => classItem.uuid && filteredSessionIds.has(classItem.uuid)),
    [classes, filteredSessionIds]
  );

  const enrollmentToClassId = useMemo(() => {
    const map = new Map<string, string>();

    classes.forEach((classItem) => {
      const classUuid = classItem.uuid ?? '';
      if (!classUuid) return;

      (classItem.enrollments ?? []).forEach((enrollment) => {
        const record = enrollment as Enrollment;
        if (record.uuid) {
          map.set(record.uuid, classUuid);
        }
      });
    });

    return map;
  }, [classes]);

  const filteredReviewItems = useMemo(() => {
    return reviewItems.filter((review) => {
      if (!overlapsDateRange(review.created_date ?? null, review.created_date ?? null, activeFilters.dateFrom, activeFilters.dateTo)) {
        return false;
      }

      if (!review.enrollment_uuid) {
        return activeFilters.program === 'all' && activeFilters.location === 'all';
      }

      const classUuid = enrollmentToClassId.get(review.enrollment_uuid);
      if (!classUuid) {
        return activeFilters.program === 'all' && activeFilters.location === 'all';
      }

      return filteredSessionIds.has(classUuid);
    });
  }, [activeFilters.dateFrom, activeFilters.dateTo, activeFilters.location, activeFilters.program, enrollmentToClassId, filteredSessionIds, reviewItems]);

  const filteredMetrics = useMemo<AnalyticsMetrics>(() => {
    const totalSessions = filteredSessions.filter((session) => session.status !== 'Cancelled').length;
    const completedSessions = filteredSessions.filter((session) => session.status === 'Completed').length;
    const trainingHours = filteredSessions
      .filter((session) => session.status === 'Completed')
      .reduce((sum, session) => sum + session.hours, 0);

    const numberOfPrograms = new Set(filteredSessions.map((session) => session.program).filter(Boolean)).size;
    const totalInstructors = new Set(filteredClasses.map((classItem) => classItem.default_instructor_uuid).filter(Boolean)).size;

    const uniqueLearnerIds = new Set<string>();
    filteredClasses.forEach((classItem) => {
      (classItem.enrollments ?? []).forEach((enrollment) => {
        const record = enrollment as Enrollment;
        if (record.student_uuid && ACTIVE_ENROLLMENT_STATUSES.has(record.status ?? '')) {
          uniqueLearnerIds.add(record.student_uuid);
        }
      });
    });

    const averageSatisfaction =
      filteredReviewItems.length > 0
        ? Math.round(
          (filteredReviewItems.reduce((sum, review) => sum + Number((review as InstructorReview).rating ?? 0), 0) /
            filteredReviewItems.length) *
          10
        ) / 10
        : ratingSummaryQuery.data?.data?.average_rating ?? null;

    return {
      totalSessions,
      completedSessions,
      participantsTrained: uniqueLearnerIds.size,
      activeParticipants: uniqueLearnerIds.size,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      averageSatisfaction,
      trainingHours,
      reviewCount: filteredReviewItems.length,
      numberOfPrograms,
      totalInstructors,
      assessmentsConducted: 0,
      certificatesIssues: 0,
      surveysCompleted: 0,
    };
  }, [filteredClasses, filteredReviewItems, filteredSessions, ratingSummaryQuery.data]);

  const performance = useMemo(() => {
    const weeks = getWeekBuckets();

    return weeks.map((week) => {
      const weeklySessions = filteredSessions.filter(
        (session) =>
          session.startDate &&
          session.startDate >= week.start &&
          session.startDate <= week.end &&
          session.status !== 'Cancelled'
      );
      const sessionCount = weeklySessions.length;
      const participantCount = weeklySessions.reduce((sum, session) => sum + session.enrolled, 0);
      const completedCount = weeklySessions.filter((session) => session.status === 'Completed').length;

      return {
        label: week.label,
        sessions: sessionCount,
        participants: participantCount,
        completion: sessionCount > 0 ? Math.round((completedCount / sessionCount) * 100) : 0,
      };
    });
  }, [filteredSessions]);

  const programCompletion = useMemo(() => {
    const programMap = new Map<string, { completed: number; total: number }>();

    filteredSessions.forEach((session) => {
      const key = session.program;
      const current = programMap.get(key) ?? { completed: 0, total: 0 };
      current.total += 1;
      if (session.status === 'Completed') {
        current.completed += 1;
      }
      programMap.set(key, current);
    });

    return Array.from(programMap.entries())
      .map(([name, counts]) => ({
        name,
        rate: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
      }))
      .sort((left, right) => right.rate - left.rate)
      .slice(0, 6);
  }, [filteredSessions]);

  const statusBreakdown = useMemo<StatusBreakdownItem[]>(() => {
    const counts = new Map<string, number>();
    filteredSessions.forEach((session) => {
      counts.set(session.status, (counts.get(session.status) ?? 0) + 1);
    });

    const total = filteredSessions.length;
    const mapping: Record<string, string> = {
      Completed: 'text-success',
      'In Progress': 'text-warning',
      Upcoming: 'text-primary',
      Cancelled: 'text-destructive',
      Ongoing: 'text-warning',
    };

    return Array.from(counts.entries()).map(([label, value]) => ({
      label,
      value,
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
      color: mapping[label] ?? 'text-muted-foreground',
    }));
  }, [filteredSessions]);

  const locations = useMemo<LocationSummary[]>(() => {
    const counts = new Map<string, number>();

    filteredSessions.forEach((session) => {
      counts.set(session.location, (counts.get(session.location) ?? 0) + 1);
    });

    const total = filteredSessions.length;
    return Array.from(counts.entries())
      .map(([name, sessionsCount]) => ({
        name,
        sessions: sessionsCount,
        pct: total > 0 ? Math.round((sessionsCount / total) * 100) : 0,
      }))
      .sort((left, right) => right.sessions - left.sessions)
      .slice(0, 5);
  }, [filteredSessions]);

  const satisfactionBuckets = useMemo<SatisfactionBucket[]>(() => {
    const counts = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0,
    };

    filteredReviewItems.forEach((review) => {
      const rating = review.rating ?? 0;
      if (rating >= 4.5) counts.excellent += 1;
      else if (rating >= 3.5) counts.good += 1;
      else if (rating >= 2.5) counts.average += 1;
      else if (rating > 0) counts.poor += 1;
    });

    const total = filteredReviewItems.length;

    return [
      {
        label: 'Excellent (4.5 – 5)',
        count: counts.excellent,
        pct: total > 0 ? Math.round((counts.excellent / total) * 100) : 0,
        color: 'bg-success',
      },
      {
        label: 'Good (3.5 – 4.4)',
        count: counts.good,
        pct: total > 0 ? Math.round((counts.good / total) * 100) : 0,
        color: 'bg-primary',
      },
      {
        label: 'Average (2.5 – 3.4)',
        count: counts.average,
        pct: total > 0 ? Math.round((counts.average / total) * 100) : 0,
        color: 'bg-warning',
      },
      {
        label: 'Poor (1 – 2.4)',
        count: counts.poor,
        pct: total > 0 ? Math.round((counts.poor / total) * 100) : 0,
        color: 'bg-destructive',
      },
    ];
  }, [filteredReviewItems]);

  const availablePrograms = useMemo(
    () => [...new Set(fullSessions.map((session) => session.program))].sort((left, right) => left.localeCompare(right)),
    [fullSessions]
  );

  const availableLocations = useMemo(
    () => [...new Set(fullSessions.map((session) => session.location))].sort((left, right) => left.localeCompare(right)),
    [fullSessions]
  );

  return {
    isLoading: isLoadingClasses || ratingSummaryQuery.isLoading || reviewsQuery.isLoading,
    isError: ratingSummaryQuery.isError || reviewsQuery.isError,
    sessions: filteredSessions,
    fullSessions,
    filteredSessions,
    metrics: filteredMetrics,
    performance,
    programCompletion,
    statusBreakdown,
    locations,
    satisfactionBuckets,
    reviewCount: filteredReviewItems.length,
    availablePrograms,
    availableLocations,
    activeFilters,
  };
}
