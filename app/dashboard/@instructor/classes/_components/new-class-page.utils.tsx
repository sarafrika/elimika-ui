import type { CourseLessonWithContent } from '@/hooks/use-courselessonwithcontent';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import type { ProgramCourseLike } from '@/hooks/use-programlessonwithcontent';
import type { Student } from '@/services/client';
import { useMemo } from 'react';

export type ClassTab =
  | 'overview'
  | 'lessons'
  | 'schedule'
  | 'students'
  | 'delivery'
  | 'waiting-list'
  | 'announcements'
  | 'tasks';

export type DateFilter = 'current-day' | 'current-week' | 'upcoming' | 'all';

export const dateFilterHeadings: Record<DateFilter, string> = {
  'current-day': "Today's Classes",
  'current-week': "This Week's Classes",
  upcoming: 'Upcoming Classes',
  all: 'All Upcoming Scheduled Classes',
};

export const dateFilterDescriptions: Record<DateFilter, string> = {
  'current-day': 'Classes with sessions scheduled for today are listed here.',
  'current-week': 'Classes with sessions scheduled for this week are listed here.',
  upcoming: 'Upcoming instructor class schedules are listed here.',
  all: 'All of your future scheduled classes are listed here.',
};

export type StudentTableRow = {
  studentUuid: string;
  fullName: string;
  status: string;
  enrolledOn: string;
};

export type LessonContentItem = NonNullable<
  NonNullable<CourseLessonWithContent['content']>['data']
>[number];

export type LessonModule = CourseLessonWithContent & {
  course?: ProgramCourseLike | null;
};

export type ClassInstanceItem = {
  instanceUuid: string;
  classUuid: string;
  title: string;
  courseName: string;
  difficulty: string;
  sessionFormat: string;
  start_time?: string | Date;
  end_time?: string | Date;
  location_name?: string | null;
  classItem: InstructorClassWithSchedule;
  instance: NonNullable<InstructorClassWithSchedule['schedule']>[number];
};

export const classTabs: { value: ClassTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'lessons', label: 'Lessons' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'students', label: 'Students' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'announcements', label: 'Announcements' },
];

export const studentClassTabs: { value: ClassTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'lessons', label: 'Lessons' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'announcements', label: 'Announcements' },
];

const isNonCancelledInstance = (instance: NonNullable<InstructorClassWithSchedule['schedule']>[number]) =>
  instance.status?.toUpperCase() !== 'CANCELLED';

export const getPreferredScheduleInstance = (
  schedule: InstructorClassWithSchedule['schedule'] = [],
  requestedScheduleUuid?: string | null
) => {
  const sortedSchedule = [...schedule]
    .filter(isNonCancelledInstance)
    .sort(
      (left, right) =>
        new Date(left.start_time).getTime() -
        new Date(right.start_time).getTime()
    );

  if (sortedSchedule.length === 0) {
    return null;
  }

  if (requestedScheduleUuid) {
    const requestedSchedule = sortedSchedule.find(
      instance => instance.uuid === requestedScheduleUuid
    );

    if (requestedSchedule) {
      return requestedSchedule;
    }
  }

  const now = new Date();

  // Find first schedule whose day has not yet arrived
  const nextIndex = sortedSchedule.findIndex(instance => {
    const start = new Date(instance.start_time);

    return (
      start.getFullYear() > now.getFullYear() ||
      start.getMonth() > now.getMonth() ||
      start.getDate() > now.getDate() ||
      (
        start.getFullYear() === now.getFullYear() &&
        start.getMonth() === now.getMonth() &&
        start.getDate() === now.getDate()
      )
    );
  });

  if (nextIndex === -1) {
    return sortedSchedule[sortedSchedule.length - 1];
  }

  return nextIndex > 0
    ? sortedSchedule[nextIndex - 1]
    : sortedSchedule[0];
};

export const formatPreferredScheduleLabel = (classItem: InstructorClassWithSchedule) => {
  const nextSession = getPreferredScheduleInstance(classItem.schedule);

  if (!nextSession) return 'No sessions scheduled';

  const start = new Date(nextSession.start_time);
  if (Number.isNaN(start.getTime())) return 'Session time pending';

  return start.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getStartOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getEndOfWeek = (date: Date) => {
  const result = getStartOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const formatLabel = (value?: string | null) => {
  if (!value) return 'Not available';
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'TBD';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';

  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatDateOnly = (value?: string | Date | null) => {
  if (!value) return 'TBD';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDuration = (
  startValue?: string | Date | null,
  endValue?: string | Date | null
) => {
  if (!startValue || !endValue) return 'TBD';

  const start = new Date(startValue);
  const end = new Date(endValue);
  const diffInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  if (Number.isNaN(diffInMinutes) || diffInMinutes <= 0) return 'TBD';

  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${minutes}m`;
};

export const formatTimeRange = (
  startValue?: string | Date | null,
  endValue?: string | Date | null
) => {
  if (!startValue || !endValue) return 'TBD';

  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'TBD';

  return `${start.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
};

export const getContentTypeLabel = (contentTypeMap: Record<string, string>, uuid?: string) => {
  const typeName = uuid ? contentTypeMap[uuid] : '';
  return typeName ? formatLabel(typeName) : 'Content';
};

export const isCurrentDay = (value?: string | Date | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export const isWithinCurrentWeek = (value?: string | Date | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return date >= getStartOfWeek(now) && date <= getEndOfWeek(now);
};

export const isUpcoming = (value?: string | Date | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= new Date();
};

export const getInstanceStatus = (
  startValue?: string | Date | null,
  endValue?: string | Date | null
) => {
  if (!startValue || !endValue) return 'Scheduled';

  const start = new Date(startValue);
  const end = new Date(endValue);
  const now = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Scheduled';
  if (end < now) return 'Completed';
  if (start <= now && end >= now) return 'In progress';
  return 'Upcoming';
};

export const useFilteredClassInstances = ({
  classes,
  difficultyMap,
  searchTerm,
  dateFilter,
}: {
  classes: InstructorClassWithSchedule[];
  difficultyMap: Record<string, string>;
  searchTerm: string;
  dateFilter: DateFilter;
}) =>
  useMemo<ClassInstanceItem[]>(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return classes
      .flatMap(classItem =>
        (classItem.schedule ?? []).map((instance, instanceIndex) => ({
          instanceUuid:
            instance.uuid ??
            `${classItem.uuid ?? 'class'}-${instance.start_time?.toString() ?? instanceIndex
            }`,

          classUuid: classItem.uuid ?? '',

          title: classItem.title,

          courseName:
            classItem.course?.name || 'No linked course',

          difficulty: classItem.course?.difficulty_uuid
            ? (
              difficultyMap[
              classItem.course.difficulty_uuid
              ] ?? 'General'
            )
            : 'General',

          sessionFormat: formatLabel(
            classItem.session_format
          ),

          start_time: instance.start_time,

          end_time: instance.end_time,

          location_name:
            instance.location_name ??
            classItem.location_name,

          classItem,

          instance,
        }))
      )

      .filter(instanceItem => {
        // Exclude cancelled instances
        const isNotCancelled =
          instanceItem.instance.status?.toUpperCase() !==
          'CANCELLED';

        const matchesSearch =
          !normalizedSearch ||
          [
            instanceItem.title,
            instanceItem.courseName,
            instanceItem.sessionFormat,
            instanceItem.difficulty,
            formatDateTime(instanceItem.start_time),
            formatLabel(
              getInstanceStatus(
                instanceItem.start_time,
                instanceItem.end_time
              )
            ),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesDateFilter =
          (dateFilter === 'all' &&
            isUpcoming(instanceItem.start_time)) ||

          (dateFilter === 'current-day' &&
            isCurrentDay(instanceItem.start_time)) ||

          (dateFilter === 'current-week' &&
            isWithinCurrentWeek(
              instanceItem.start_time
            )) ||

          (dateFilter === 'upcoming' &&
            isUpcoming(instanceItem.start_time));

        return (
          isNotCancelled &&
          matchesSearch &&
          matchesDateFilter
        );
      })

      .sort(
        (left, right) =>
          new Date(left.start_time ?? 0).getTime() -
          new Date(right.start_time ?? 0).getTime()
      );
  }, [classes, dateFilter, difficultyMap, searchTerm]);

export const useFilteredInstructorClasses = ({
  classes,
  searchTerm,
  dateFilter,
}: {
  classes: InstructorClassWithSchedule[];
  searchTerm: string;
  dateFilter: DateFilter;
}) =>
  useMemo<InstructorClassWithSchedule[]>(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = new Date();

    return classes
      .filter(classItem => {
        const schedule = classItem.schedule ?? [];
        const hasActiveSession = schedule.some(isNonCancelledInstance);

        const matchesSearch =
          !normalizedSearch ||
          [
            classItem.title,
            classItem.course?.name,
            classItem.course?.category_names?.join(' '),
            classItem.session_format,
            classItem.location_name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesDateFilter =
          dateFilter === 'all'
            ? hasActiveSession
            : schedule.some(instance => {
              if (!isNonCancelledInstance(instance)) return false;
              const start = new Date(instance.start_time);
              if (Number.isNaN(start.getTime())) return false;

              if (dateFilter === 'current-day') {
                return (
                  start.getFullYear() === now.getFullYear() &&
                  start.getMonth() === now.getMonth() &&
                  start.getDate() === now.getDate()
                );
              }

              if (dateFilter === 'current-week') {
                const startOfWeek = new Date(now);
                const day = startOfWeek.getDay();
                const diff = day === 0 ? -6 : 1 - day;
                startOfWeek.setDate(startOfWeek.getDate() + diff);
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                return start >= startOfWeek && start <= endOfWeek;
              }

              return start >= now;
            });

        return matchesSearch && matchesDateFilter;
      })
      .sort((left, right) => {
        const leftDate = getPreferredScheduleInstance(left.schedule)?.start_time ?? null;
        const rightDate = getPreferredScheduleInstance(right.schedule)?.start_time ?? null;
        const leftTime = leftDate ? new Date(leftDate).getTime() : Number.POSITIVE_INFINITY;
        const rightTime = rightDate ? new Date(rightDate).getTime() : Number.POSITIVE_INFINITY;

        if (leftTime !== rightTime) {
          return leftTime - rightTime;
        }

        return left.title.localeCompare(right.title);
      });
  }, [classes, dateFilter, searchTerm]);

export const buildStudentRows = ({
  enrollments,
  studentMap,
}: {
  enrollments: Array<{
    student_uuid?: string | null;
    status?: string | null;
    created_date?: string | Date | null;
  }>;
  studentMap: Map<string, Student>;
}) => {
  const rows = new Map<string, StudentTableRow>();

  enrollments.forEach(enrollment => {
    if (!enrollment.student_uuid || enrollment.status === 'CANCELLED') return;
    if (rows.has(enrollment.student_uuid)) return;

    const student = studentMap.get(enrollment.student_uuid);

    rows.set(enrollment.student_uuid, {
      studentUuid: enrollment.student_uuid,
      fullName: student?.full_name || 'Unknown student',
      status: formatLabel(enrollment.status),
      enrolledOn: formatDateOnly(enrollment.created_date),
    });
  });

  return Array.from(rows.values()).sort((left, right) =>
    left.fullName.localeCompare(right.fullName)
  );
};
