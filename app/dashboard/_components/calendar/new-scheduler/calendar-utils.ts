import type {
  ClassDefinition,
  Course,
  ScheduledInstance,
  StudentSchedule,
} from '@/services/client/types.gen';
import type { SchedulerCategory, SchedulerEvent, SchedulerFilterValues, SchedulerProfile } from './types';

export type SchedulePreferences = {
  defaultClassDuration: string;
  eventColorMode: string;
  location: string;
  showHolidays: boolean;
  showWeekends: boolean;
  timezone: string;
  workingHoursEnd: string;
  workingHoursStart: string;
};

export type InstructorSummary = {
  uuid: string;
  fullName: string;
  avatarUrl?: string;
  subtitle?: string;
};

export type StudentSummary = {
  uuid: string;
  fullName: string;
  avatarUrl?: string;
  classDefinitionUuid?: string;
  enrollmentUuid?: string;
  studentEnrollmentKey?: string;
};

export type LocationSummary = {
  label: string;
  detail: string;
  meetingLink?: string;
};

export type SchedulerCalendarData = {
  allInstructors: InstructorSummary[];
  events: SchedulerEvent[];
  instructors: InstructorSummary[];
  isLoading: boolean;
  students: StudentSummary[];
};

export type ClassScheduleInput = {
  uuid?: string | null;
  instructor_uuid?: string | null;
  start_time?: Date | string | null;
  end_time?: Date | string | null;
  title?: string | null;
  location_name?: string | null;
  location_type?: string | null;
  max_participants?: number | null;
  status?: string | null;
};

export type ClassWithScheduleInput = {
  uuid?: string | null;
  title?: string | null;
  course_uuid?: string | null;
  course?: { uuid?: string | null; name?: string | null } | null;
  instructor?: {
    full_name?: string | null;
    professional_headline?: string | null;
    uuid?: string | null;
  } | null;
  default_instructor_uuid?: string | null;
  location_name?: string | null;
  meeting_link?: string | null;
  max_participants?: number | null;
  schedule?: ClassScheduleInput[] | null;
};

export const DEFAULT_PREFERENCES: SchedulePreferences = {
  defaultClassDuration: '60',
  eventColorMode: 'category',
  location: 'Main campus',
  showHolidays: true,
  showWeekends: true,
  timezone: 'Africa/Lagos',
  workingHoursEnd: '18:00',
  workingHoursStart: '08:00',
};

export const DEFAULT_FILTERS: SchedulerFilterValues = {
  category: '',
  course: '',
  instructor: '',
  location: '',
  statuses: [],
};

export const TIME_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const hour = index + 5;
  return `${hour.toString().padStart(2, '0')}:00`;
});

export const toApiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as unknown as Date;
};

export const formatDateRange = (date: Date, view: 'day' | 'week' | 'month' | 'year') => {
  if (view === 'day') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (view === 'month') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  if (view === 'year') {
    return String(date.getFullYear());
  }

  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

export const getNavigationStep = (
  date: Date,
  view: 'day' | 'week' | 'month' | 'year',
  direction: -1 | 1
) => {
  const next = new Date(date);

  if (view === 'day') {
    next.setDate(next.getDate() + direction);
    return next;
  }

  if (view === 'month') {
    next.setMonth(next.getMonth() + direction);
    return next;
  }

  if (view === 'year') {
    next.setFullYear(next.getFullYear() + direction);
    return next;
  }

  next.setDate(next.getDate() + direction * 7);
  return next;
};

export const isSameCalendarDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTimeValue = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export const findClosestDate = (reference: Date, events: SchedulerEvent[]) => {
  if (!events.length) return reference;

  const referenceTime = reference.getTime();
  return events.reduce((closest, event) => {
    const closestDelta = Math.abs(closest.startTime.getTime() - referenceTime);
    const eventDelta = Math.abs(event.startTime.getTime() - referenceTime);

    if (eventDelta < closestDelta) return event;

    if (eventDelta === closestDelta && event.startTime.getTime() < closest.startTime.getTime()) {
      return event;
    }

    return closest;
  }).startTime;
};

export const makeInitials = (value?: string | null) =>
  (value || 'NA')
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const formatStatus = (status?: string | null) =>
  status
    ? status
        .toLowerCase()
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Scheduled';

export const inferCategory = (value?: string | null): SchedulerCategory => {
  const normalized = value?.toLowerCase() ?? '';
  if (normalized.includes('sport') || normalized.includes('basket')) return 'Sports';
  if (normalized.includes('cert') || normalized.includes('aws')) return 'Certifications';
  if (
    normalized.includes('design') ||
    normalized.includes('art') ||
    normalized.includes('animation')
  ) {
    return 'Arts';
  }
  if (
    normalized.includes('coding') ||
    normalized.includes('robot') ||
    normalized.includes('digital')
  ) {
    return 'STEM';
  }
  return 'TVET / Vocational';
};

export const toClassLookup = (classes: ClassWithScheduleInput[]) => {
  const map = new Map<string, ClassWithScheduleInput>();

  classes.forEach(item => {
    if (item.uuid) {
      map.set(item.uuid, item);
    }
  });

  return map;
};

export const mapScheduledInstance = (
  instance: ScheduledInstance,
  instructorDetails: InstructorSummary,
  classDetails?: ClassWithScheduleInput | null
): SchedulerEvent | null => {
  if (!instance.start_time || !instance.end_time) return null;

  const title =
    instance.title || classDetails?.title || classDetails?.course?.name || 'Scheduled class';
  const courseName = classDetails?.course?.name || classDetails?.title || 'Class';
  const instructorName = instructorDetails.fullName || 'Instructor pending';
  const locationName = instance.location_name || classDetails?.location_name || '';

  return {
    id: instance.uuid || `${instance.class_definition_uuid}-${instance.start_time}`,
    instanceUuid: instance.uuid || undefined,
    classDefinitionUuid: instance.class_definition_uuid || undefined,
    title,
    course: courseName,
    instructor: instructorName,
    instructorUuid: instance.instructor_uuid || instructorDetails.uuid || undefined,
    location: locationName,
    meetingLink: classDetails?.meeting_link || undefined,
    locationType: instance.location_type || undefined,
    startTime: new Date(instance.start_time),
    endTime: new Date(instance.end_time),
    status: formatStatus(instance.status),
    category: inferCategory(title),
    students: [makeInitials(instructorName), 'ST', 'EN'],
    maxParticipants: instance.max_participants || undefined,
  };
};

export const mapStudentSchedule = (
  item: StudentSchedule,
  instructorDetails: InstructorSummary,
  classDetails?: ClassWithScheduleInput | null
): SchedulerEvent | null => {
  if (!item.start_time || !item.end_time) return null;

  const title = item.title || classDetails?.title || classDetails?.course?.name || 'Scheduled class';
  const courseName = classDetails?.course?.name || classDetails?.title || 'Class';
  const instructorName = instructorDetails.fullName || 'Unknown Instructor';
  const locationName = item.location_name || classDetails?.location_name || '';

  return {
    id: item.scheduled_instance_uuid || item.enrollment_uuid || `${title}-${item.start_time}`,
    instanceUuid: item.scheduled_instance_uuid || undefined,
    classDefinitionUuid: item.class_definition_uuid || undefined,
    title,
    course: courseName,
    instructor: instructorName,
    instructorUuid: item.instructor_uuid || instructorDetails.uuid || undefined,
    location: locationName,
    meetingLink: classDetails?.meeting_link || undefined,
    locationType: item.location_type || undefined,
    startTime: new Date(item.start_time),
    endTime: new Date(item.end_time),
    status: formatStatus(item.scheduling_status || item.enrollment_status),
    category: inferCategory(title),
    students: ['ME'],
    maxParticipants: 1,
  };
};

export const mapClassSchedule = (
  classDef: ClassWithScheduleInput,
  classIndex: number,
  instructorNameLookup?: Map<string, string>,
  instructorSummaryLookup?: Map<string, InstructorSummary>
) => {
  const resolvedInstructorUuid =
    classDef.default_instructor_uuid || classDef.instructor?.uuid || undefined;
  const resolvedInstructorName =
    (resolvedInstructorUuid ? instructorNameLookup?.get(resolvedInstructorUuid) : undefined) ||
    classDef.instructor?.full_name ||
    'Instructor pending';

  return (classDef.schedule ?? [])
    .filter(schedule => schedule.start_time && schedule.end_time)
    .map((schedule, scheduleIndex) => {
      const instructorUuid = schedule.instructor_uuid || resolvedInstructorUuid || undefined;
      const instructorDetails =
        (instructorUuid ? instructorSummaryLookup?.get(instructorUuid) : undefined) || {
          uuid: instructorUuid || '',
          fullName: resolvedInstructorName,
          subtitle: classDef.instructor?.professional_headline || 'Attached to class data',
        };

      const title = schedule.title || classDef.title || classDef.course?.name || 'Scheduled class';
      const courseName = classDef.course?.name || classDef.title || 'Class';
      const locationName = schedule.location_name || classDef.location_name || '';

      return {
        id: schedule.uuid || `${classDef.uuid}-${schedule.start_time}-${scheduleIndex}`,
        instanceUuid: schedule.uuid || undefined,
        classDefinitionUuid: classDef.uuid || undefined,
        title,
        course: courseName,
        instructor: instructorDetails.fullName,
        instructorUuid,
        location: locationName,
        meetingLink: classDef.meeting_link || undefined,
        locationType: schedule.location_type || undefined,
        startTime: new Date(schedule.start_time as Date | string),
        endTime: new Date(schedule.end_time as Date | string),
        status: formatStatus(schedule.status),
        category: inferCategory(courseName || title),
        students: [makeInitials(instructorDetails.fullName), `S${classIndex}`, 'EN'],
        maxParticipants: schedule.max_participants || classDef.max_participants || undefined,
      } satisfies SchedulerEvent;
    });
};

export const mapClassDefinitionDetails = (classDef: ClassDefinition, course?: Course | null) => ({
  ...classDef,
  course: course ? { uuid: course.uuid ?? null, name: course.name } : null,
  schedule: [],
});

export const normalizeProfileLabel = (profile: SchedulerProfile) =>
  profile.charAt(0).toUpperCase() + profile.slice(1);
