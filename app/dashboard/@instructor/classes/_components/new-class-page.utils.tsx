import type { CourseLessonWithContent } from '@/hooks/use-courselessonwithcontent';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import type { Student } from '@/services/client';
import { useMemo } from 'react';

export type ClassTab =
  | 'overview'
  | 'waiting-list'
  | 'delivery-status'
  | 'students'
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
  'current-day': 'Classes scheduled for today are listed here.',
  'current-week': 'Classes scheduled for this week are listed here.',
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

export type LessonModule = CourseLessonWithContent;

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
  { value: 'students', label: 'Students' },
  { value: 'waiting-list', label: 'Waiting List' },
  { value: 'delivery-status', label: 'Delivery Status' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'tasks', label: 'Tasks' },
];

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
            `${classItem.uuid ?? 'class'}-${instance.start_time?.toString() ?? instanceIndex}`,
          classUuid: classItem.uuid ?? '',
          title: classItem.title,
          courseName: classItem.course?.name || 'No linked course',
          difficulty: classItem.course?.difficulty_uuid
            ? (difficultyMap[classItem.course.difficulty_uuid] ?? 'General')
            : 'General',
          sessionFormat: formatLabel(classItem.session_format),
          start_time: instance.start_time,
          end_time: instance.end_time,
          location_name: instance.location_name ?? classItem.location_name,
          classItem,
          instance,
        }))
      )
      .filter(instanceItem => {
        const matchesSearch =
          !normalizedSearch ||
          [
            instanceItem.title,
            instanceItem.courseName,
            instanceItem.sessionFormat,
            instanceItem.difficulty,
            formatDateTime(instanceItem.start_time),
            formatLabel(getInstanceStatus(instanceItem.start_time, instanceItem.end_time)),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesDateFilter =
          (dateFilter === 'all' && isUpcoming(instanceItem.start_time)) ||
          (dateFilter === 'current-day' && isCurrentDay(instanceItem.start_time)) ||
          (dateFilter === 'current-week' && isWithinCurrentWeek(instanceItem.start_time)) ||
          (dateFilter === 'upcoming' && isUpcoming(instanceItem.start_time));

        return matchesSearch && matchesDateFilter;
      })
      .sort(
        (left, right) =>
          new Date(left.start_time ?? 0).getTime() - new Date(right.start_time ?? 0).getTime()
      );
  }, [classes, dateFilter, difficultyMap, searchTerm]);

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
