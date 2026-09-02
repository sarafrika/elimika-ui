// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import {
  type AcademicPeriod,
  type ApprovedRateCard,
  approvedRateFor,
  type DayKey,
  type DayRow,
  DEFAULT_RATE_BASIS,
  type RateBasis,
  type ReminderState,
} from '@/components/class-form/class-form-shared';
import {
  type InstructorClassWithSchedule,
  useInstructorClassesWithSchedules,
} from '@/hooks/use-instructor-classes-with-schedules';
import { type RecurrenceValue, toClassRecurrence } from '@/lib/recurrence';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AcademicPeriodsPanel,
  ClassMediaUpload,
  LocationVenue,
  type MediaFile,
  type Offering,
  OfferingPicker,
  PickDatesPanel,
  PricingCapacity,
  ReminderOptions,
  ScheduleModeCards,
  ServiceCards,
  type ServiceKey,
  StandardSchedule,
  UpcomingSessions,
} from '../../../../../components/class-form';
import { PageHeader } from '../../../../../components/page-header';
import { ResourceConflictAlert } from '../../../../../components/resourcing/ResourceConflictAlert';
import { Button } from '../../../../../components/ui/button';
import { useUserProfile } from '../../../../../context/profile-context';
import { useTimeZone } from '../../../../../context/timezone-context';
import { useUserDomain } from '../../../../../context/user-domain-context';
import { useCoursesByIds, useProgramsByIds } from '../../../../../hooks/use-batched-lookups';
import { useClassDetails } from '../../../../../hooks/use-class-details';
import {
  DEFAULT_CLASS_TIME_ZONE,
  normalizeScheduleTimeZone,
  parseApiDate,
  toUtcIsoDateTime,
} from '../../../../../lib/date';
import {
  normalizeLocationType,
  requiresPhysicalLocation,
  toCoordinate,
  trimToUndefined,
} from '../../../../../lib/location-types';
import {
  createClassDefinitionMultipartMutation,
  getAllClassDefinitionsQueryKey,
  getClassDefinitionQueryKey,
  getClassDefinitionsForInstructorQueryKey,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
  updateClassDefinitionMutation,
  uploadClassPromotionalVideoMutation,
  uploadClassThumbnailMutation,
} from '../../../../../services/client/@tanstack/react-query.gen';
import type { CreateClassDefinitionMultipartData } from '../../../../../services/client/types.gen';
import {
  ConflictResolutionEnum,
  LocationTypeEnum,
  RecurrenceTypeEnum,
  SessionFormatEnum,
} from '../../../../../services/client/types.gen';
import { TOKEN } from '../../../_components/color-charts';
import {
  ClassDetails,
  NotificationSettings,
  ScheduleSettings,
} from '../../trainings/create-new/page';
import { type ServiceType } from './_components/service-type-selector';

const LOCAL_CLASS_DRAFT_KEY = 'training-class-create-draft:new-class-creation';
const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_CLASS_DURATION_MINUTES = 60;

const schedulePresetOptions = [
  { key: 'standard', title: 'Standard Schedule', description: 'Set recurring days and times' },
  { key: 'pick-dates', title: 'Pick Dates', description: 'Select specific dates' },
  { key: 'academic-period', title: 'Academic Period', description: 'Align with academic term' },
] as const;

type SchedulePreset = (typeof schedulePresetOptions)[number]['key'];
type CatalogSource = 'course' | 'program';

type CatalogRateCard = {
  currency?: string;
  [key: string]: number | string | null | undefined;
};

type CatalogItem = {
  classLimit: number;
  label: string | undefined;
  rateCard?: CatalogRateCard;
  source: CatalogSource;
  uuid: string;
  thumbnailUrl: string;
};

type ScheduledSession = {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: string;
  timezone?: string;
};

type ScheduleConflict = {
  proposed: ScheduledSession;
  existing: {
    classUuid: string;
    classTitle: string;
    startTime: string;
    endTime: string;
  };
};

type PerDayOccurrence = {
  durationHours: number;
  occurrenceCount: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeDateTimeValue = (value: string | Date | undefined | null) => {
  return parseApiDate(value)?.toDate() ?? null;
};

const createInitialClassDetails = (instructorName?: string): ClassDetails => ({
  uuid: '',
  course_uuid: '',
  program_uuid: null,
  title: '',
  description: '',
  categories: [],
  class_type: 'PUBLIC',
  location_type: 'ONLINE',
  rate_card: '',
  class_limit: 0,
  targetAudience: '',
  location_name: '',
  startDate: '',
  endDate: '',
  allDay: false,
  repeatUnit: '1',
  instructorName,
  meeting_link: '',
  classroom: '',
  class_color: '',
  reminder: '',
});

const createInitialScheduleSettings = (
  timezone: string = DEFAULT_CLASS_TIME_ZONE
): ScheduleSettings => ({
  academicPeriod: { start: '', end: '' },
  registrationPeriod: { start: '', end: '', continuous: false },
  startClass: {
    date: '',
    startTime: '',
    endTime: '',
    durationMinutes: String(DEFAULT_CLASS_DURATION_MINUTES),
  },
  weeklyDayTimes: {},
  allDay: false,
  repeat: { interval: 1, unit: 'week', days: [] },
  endRepeat: '',
  alertAttendee: false,
  timetable: { days: [], time: { duration: '' } },
  recurringOptions: '',
  timezone: normalizeScheduleTimeZone(timezone),
  classType: '',
  location: '',
  pin: '',
  classroom: '',
  totalSlots: 0,
});

const createInitialNotificationSettings = (): NotificationSettings => ({
  reminder: '24h',
  classColour: TOKEN.primary,
});

const reminderToMinutes = (reminder?: string) => {
  switch (reminder) {
    case '24h':
    case '1d':
      return 24 * 60;
    case '1h':
      return 60;
    case '30m':
      return 30;
    case '15m':
      return 15;
    case '12h':
      return 12 * 60;
    case '5m':
      return 5;
    default:
      return undefined;
  }
};

const reminderFromMinutes = (minutes?: number | null) => {
  switch (minutes) {
    case 24 * 60:
      return '24h';
    case 12 * 60:
      return '12h';
    case 60:
      return '1h';
    case 30:
      return '30m';
    case 15:
      return '15m';
    case 5:
      return '5m';
    default:
      return undefined;
  }
};

const parsePositiveDurationMinutes = (value?: string | number | null) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : undefined;
  }
  const trimmed = value == null ? undefined : String(value).trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const durationMinutesOrDefault = (value?: string | number | null) =>
  parsePositiveDurationMinutes(value) ?? DEFAULT_CLASS_DURATION_MINUTES;

const sessionMinutesFromTimes = (start?: string, end?: string, allDay?: boolean) => {
  if (allDay) return 24 * 60;
  if (!start || !end) return undefined;
  const [startHour = 0, startMinute = 0] = start.split(':').map(Number);
  const [endHour = 0, endMinute = 0] = end.split(':').map(Number);
  if ([startHour, startMinute, endHour, endMinute].some(value => Number.isNaN(value))) {
    return undefined;
  }
  const diff = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return Number.isInteger(diff) && diff > 0 ? diff : undefined;
};

const formatDurationMinutes = (minutes?: number) => {
  if (minutes === undefined) return 'Invalid';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

const timeAfterDuration = (startTime: string, durationMinutes: string | number) => {
  const [hour = 0, minute = 0] = startTime.split(':').map(Number);
  const duration = durationMinutesOrDefault(durationMinutes);
  const total = (hour || 0) * 60 + (minute || 0) + duration;
  return `${String(Math.floor((total / 60) % 24)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const durationMinutesFromTimes = (start?: string, end?: string, allDay?: boolean) => {
  return sessionMinutesFromTimes(start, end, allDay) ?? DEFAULT_CLASS_DURATION_MINUTES;
};

const durationMinutesFromDates = (start: Date, end: Date) => {
  const diff = Math.round((end.getTime() - start.getTime()) / 60000);
  return Number.isInteger(diff) && diff > 0 ? diff : DEFAULT_CLASS_DURATION_MINUTES;
};

const buildDateFromInput = (date: string) => {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const buildUtcIsoDateTime = (date?: string, time?: string, timezone?: string | null) =>
  toUtcIsoDateTime(date, time, timezone);

const getSessionTimeRange = (
  date?: string,
  startTime?: string,
  endTime?: string,
  timezone?: string | null
) => {
  try {
    const start = new Date(buildUtcIsoDateTime(date, startTime, timezone));
    const end = new Date(buildUtcIsoDateTime(date, endTime, timezone));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return { start, end };
  } catch {
    return null;
  }
};

const hasValidSessionTimeRange = (session: ScheduledSession) => {
  const range = getSessionTimeRange(
    session.date,
    session.startTime,
    session.endTime,
    session.timezone
  );
  return Boolean(range && range.start < range.end);
};

const normalizeMeetingLink = (value?: string | null) => {
  const trimmed = trimToUndefined(value ?? '');
  if (!trimmed) return undefined;

  const markdownLinkMatch = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  return trimToUndefined(markdownLinkMatch?.[2] ?? trimmed);
};

const isValidMeetingLink = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const getStringValue = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const getMutationErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return getStringValue(error.message) ?? fallback;
  if (!isRecord(error)) return fallback;

  return (
    getStringValue(error.message) ??
    getStringValue(isRecord(error.error) ? error.error.message : undefined) ??
    getStringValue(isRecord(error.data) ? error.data.message : undefined) ??
    getStringValue(error.error) ??
    fallback
  );
};

const collectErrorDetails = (value: unknown, prefix = ''): string[] => {
  const text = getStringValue(value);
  if (text) return prefix ? [`${prefix}: ${text}`] : [text];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectErrorDetails(item, prefix || String(index + 1)));
  }

  if (!isRecord(value)) {
    return [];
  }

  const details: string[] = [];

  const nestedMessage = getStringValue(value.message);
  if (nestedMessage && prefix) {
    details.push(`${prefix}: ${nestedMessage}`);
  }

  const skippedKeys = new Set([
    'data',
    'error',
    'errors',
    'message',
    'path',
    'status',
    'success',
    'timestamp',
  ]);
  for (const [field, fieldValue] of Object.entries(value)) {
    if (skippedKeys.has(field)) {
      continue;
    }

    const fieldPath = prefix ? `${prefix}.${field}` : field;
    details.push(...collectErrorDetails(fieldValue, fieldPath));
  }

  details.push(...collectErrorDetails(value.error, prefix));
  details.push(...collectErrorDetails(value.errors, prefix));

  return details;
};

const getMutationErrorDetails = (error: unknown, message?: string) => {
  if (!isRecord(error)) return undefined;

  const details = [
    ...collectErrorDetails(error.error),
    ...collectErrorDetails(error.errors),
    ...collectErrorDetails(isRecord(error.data) ? error.data.error : undefined),
    ...collectErrorDetails(isRecord(error.data) ? error.data.errors : undefined),
  ];

  if (details.length === 0 && !('message' in error || 'error' in error || 'errors' in error)) {
    details.push(...collectErrorDetails(error));
  }

  const uniqueDetails = [...new Set(details)];
  const filteredDetails = uniqueDetails.filter(detail => detail !== message);
  return filteredDetails.length > 0 ? filteredDetails.join(' • ') : undefined;
};

const showMutationError = (error: unknown, fallback: string) => {
  const message = getMutationErrorMessage(error, fallback);
  const details = getMutationErrorDetails(error, message);

  if (details) {
    toast.error(message, {
      description: details,
      duration: 8000,
    });
    return;
  }

  toast.error(message);
};

const findScheduleConflicts = (
  sessions: ScheduledSession[],
  instructorClasses: InstructorClassWithSchedule[],
  resolveId: string | null,
  instructorUuid?: string
): ScheduleConflict[] => {
  if (!instructorUuid || sessions.length === 0) return [];

  const existingSchedules = instructorClasses
    .filter(c => c.uuid && c.uuid !== resolveId)
    .flatMap(c =>
      (c.schedule ?? []).map(s => ({
        classUuid: c.uuid,
        classTitle: c.title || 'Existing class',
        startTime: s.start_time,
        endTime: s.end_time,
      }))
    )
    .map(s => {
      const start = normalizeDateTimeValue(s.startTime);
      const end = normalizeDateTimeValue(s.endTime);
      if (!start || !end) return null;
      return { ...s, startTime: start.toISOString(), endTime: end.toISOString() };
    })
    .filter(Boolean) as (ScheduleConflict['existing'] & { startTime: string; endTime: string })[];

  return sessions.flatMap(session => {
    const proposedStart = new Date(
      buildUtcIsoDateTime(session.date, session.startTime, session.timezone)
    ).getTime();
    const proposedEnd = new Date(
      buildUtcIsoDateTime(session.date, session.endTime, session.timezone)
    ).getTime();
    if (Number.isNaN(proposedStart) || Number.isNaN(proposedEnd) || proposedStart >= proposedEnd)
      return [];

    return existingSchedules
      .filter(existing => {
        const existingStart = new Date(existing.startTime).getTime();
        const existingEnd = new Date(existing.endTime).getTime();
        return proposedStart < existingEnd && existingStart < proposedEnd;
      })
      .map(existing => ({ proposed: session, existing }));
  });
};

/** Expand the current schedule settings into a flat list of sessions for conflict checking. */
const expandSessionsForConflictCheck = (
  schedulePreset: SchedulePreset,
  scheduleSettings: ScheduleSettings,
  pickedDates: { date: string; startTime: string; endTime: string; durationMinutes?: string }[]
): ScheduledSession[] => {
  if (schedulePreset === 'pick-dates') {
    return pickedDates.map(item => ({
      date: item.date,
      startTime: scheduleSettings.allDay ? '00:00' : item.startTime,
      endTime: scheduleSettings.allDay ? '23:59' : item.endTime,
      timezone: scheduleSettings.timezone,
      durationMinutes: scheduleSettings.allDay
        ? String(24 * 60)
        : String(durationMinutesFromTimes(item.startTime, item.endTime)),
    }));
  }

  const referenceDate =
    schedulePreset === 'academic-period'
      ? scheduleSettings.academicPeriod.start
      : scheduleSettings.startClass.date;
  const endDate =
    schedulePreset === 'academic-period'
      ? scheduleSettings.academicPeriod.end
      : scheduleSettings.endRepeat;

  if (!referenceDate || !endDate) return [];

  const start = new Date(referenceDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

  const sessions: ScheduledSession[] = [];
  const { unit, interval, days = [] } = scheduleSettings.repeat;

  if (unit === 'week') {
    if (days.length === 0) return [];

    for (const dayIndex of days) {
      const override = scheduleSettings?.weeklyDayTimes[dayIndex];
      const startTime = scheduleSettings.allDay
        ? '00:00'
        : override?.startTime || scheduleSettings.startClass.startTime || '00:00';
      const endTime = scheduleSettings.allDay
        ? '23:59'
        : override?.endTime ||
        scheduleSettings.startClass.endTime ||
        timeAfterDuration(startTime, DEFAULT_CLASS_DURATION_MINUTES);
      const durationMinutes = String(
        durationMinutesFromTimes(startTime, endTime, scheduleSettings.allDay)
      );

      const cursor = new Date(referenceDate);
      const cursorDow = (cursor.getDay() + 6) % 7;
      const daysUntil = (dayIndex - cursorDow + 7) % 7;
      cursor.setDate(cursor.getDate() + daysUntil);

      while (cursor <= end) {
        sessions.push({
          date: cursor.toISOString().split('T')[0]!,
          startTime,
          endTime,
          timezone: scheduleSettings.timezone,
          durationMinutes,
        });
        cursor.setDate(cursor.getDate() + interval * 7);
      }
    }
  } else {
    const startTime = scheduleSettings.allDay
      ? '00:00'
      : scheduleSettings.startClass.startTime || '00:00';
    const endTime = scheduleSettings.allDay
      ? '23:59'
      : scheduleSettings.startClass.endTime ||
      timeAfterDuration(startTime, DEFAULT_CLASS_DURATION_MINUTES);
    const durationMinutes = String(
      durationMinutesFromTimes(startTime, endTime, scheduleSettings.allDay)
    );

    const cursor = new Date(referenceDate);
    while (cursor <= end) {
      sessions.push({
        date: cursor.toISOString().split('T')[0]!,
        startTime,
        endTime,
        timezone: scheduleSettings.timezone,
        durationMinutes,
      });
      if (unit === 'day') cursor.setDate(cursor.getDate() + interval);
      else if (unit === 'month') cursor.setMonth(cursor.getMonth() + interval);
      else if (unit === 'year') cursor.setFullYear(cursor.getFullYear() + interval);
      else break;
    }
  }

  return sessions;
};

// correct mobile screen layout issue
const InstructorClassCreationPage = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeDomain } = useUserDomain();
  const profile = useUserProfile();
  const instructor = profile?.instructor;
  const organisation = profile?.organisation_affiliations?.[0];
  const { zone: preferredTimeZone, source: preferredTimeZoneSource } = useTimeZone();
  const activeScheduleTimeZone = normalizeScheduleTimeZone(
    preferredTimeZoneSource === 'default' ? undefined : preferredTimeZone
  );

  const [classId, setClassId] = useState<string | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    setClassId(id);
    setIsClientReady(true);
  }, []);

  const [draftSavedTick, setDraftSavedTick] = useState(0);
  const [savedClassUuid, setSavedClassUuid] = useState<string | null>(null);

  // isDataInitialized gates draft restore (new-class path only).
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  // isEditHydrated gates edit-mode hydration independently so the two paths
  // never share the same boolean and can't block each other.
  const [isEditHydrated, setIsEditHydrated] = useState(false);

  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('standard');
  const [serviceType, setServiceType] = useState<ServiceType | undefined>(undefined);
  // The unit the approved rate is quoted in. It decides both which rate-card column is read and
  // how many units the class bills for, so it has to be an explicit choice rather than a default
  // nobody sees — an hourly figure billed per session is a different contract entirely.
  const [rateBasis, setRateBasis] = useState<RateBasis>(DEFAULT_RATE_BASIS);
  const [classDetails, setClassDetails] = useState<ClassDetails>(() =>
    createInitialClassDetails(instructor?.full_name)
  );
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>(() =>
    createInitialScheduleSettings(activeScheduleTimeZone)
  );
  const [scheduleTimezoneOverridden, setScheduleTimezoneOverridden] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    createInitialNotificationSettings()
  );
  const [reminderOptions, setReminderOptions] = useState<ReminderState>(() => ({
    window: '24h',
    sendStudents: true,
    sendInstructor: true,
    email: true,
    sms: false,
    push: true,
  }));
  const [allowWaitlist, setAllowWaitlist] = useState(true);
  const [locationLatitude, setLocationLatitude] = useState('');
  const [locationLongitude, setLocationLongitude] = useState('');
  const [pickedDates, setPickedDates] = useState<
    { date: string; startTime: string; endTime: string; durationMinutes: string }[]
  >([]);
  const [pickMonth, setPickMonth] = useState(() => new Date());
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([
    {
      id: 'academic-period-1',
      name: 'Academic Period 1',
      startDate: '',
      endDate: '',
      slots: [],
    },
  ]);

  const [perDayOccurrences, setPerDayOccurrences] = useState<Record<number, PerDayOccurrence>>({});

  const resolvedId = classId || savedClassUuid;
  const { data: combinedClass, isLoading } = useClassDetails(
    isClientReady && resolvedId ? resolvedId : undefined
  );
  const classData = combinedClass?.class;

  const { classes: instructorClasses = [] } = useInstructorClassesWithSchedules(instructor?.uuid);
  const sessionsForConflictCheck = useMemo(
    () => expandSessionsForConflictCheck(schedulePreset, scheduleSettings, pickedDates),
    [schedulePreset, scheduleSettings, pickedDates]
  );

  const scheduleConflicts = useMemo(
    () =>
      findScheduleConflicts(
        sessionsForConflictCheck,
        instructorClasses,
        resolvedId,
        instructor?.uuid
      ),
    [sessionsForConflictCheck, instructorClasses, resolvedId, instructor?.uuid]
  );

  const createClassDefinition = useMutation(createClassDefinitionMultipartMutation());
  const updateClassDefinition = useMutation(updateClassDefinitionMutation());
  const uploadThumbnail = useMutation(uploadClassThumbnailMutation());
  const uploadPromotionalVideo = useMutation(uploadClassPromotionalVideoMutation());
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [selectedPromotionalVideo, setSelectedPromotionalVideo] = useState<File | null>(null);
  const isSubmitting =
    createClassDefinition.isPending ||
    updateClassDefinition.isPending ||
    uploadThumbnail.isPending ||
    uploadPromotionalVideo.isPending;

  const uploadClassMedia = async (classUuid: string) => {
    await Promise.all([
      selectedThumbnail
        ? uploadThumbnail.mutateAsync({
          path: { uuid: classUuid },
          body: { thumbnail: selectedThumbnail },
        })
        : Promise.resolve(),
      selectedPromotionalVideo
        ? uploadPromotionalVideo.mutateAsync({
          path: { uuid: classUuid },
          body: { promotional_video: selectedPromotionalVideo },
        })
        : Promise.resolve(),
    ]);
  };

  const handleServiceTypeChange = (
    newServiceType: ServiceType,
    classType: 'PRIVATE' | 'GROUP',
    locationType: 'ONLINE' | 'IN_PERSON' | 'HYBRID',
    rateCardPrice?: number
  ) => {
    setServiceType(newServiceType);
    setClassDetails(prev => ({
      ...prev,
      class_type: classType === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
      location_type: locationType,
      rate_card: Number.isFinite(rateCardPrice ?? Number.NaN)
        ? String(rateCardPrice)
        : prev.rate_card,
    }));
  };

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: { applicant_uuid_eq: instructor?.uuid as string },
      },
    }),
    enabled: !!instructor?.uuid,
  });

  const courseIds = appliedCourses?.data?.content?.map(app => app.course_uuid) ?? [];
  const { courseMap } = useCoursesByIds(courseIds as string[]);

  const approvedCourses = useMemo(() => {
    if (!appliedCourses?.data?.content || !courseMap) return [];

    return appliedCourses.data.content
      .filter(app => app.status === 'approved')
      .map(app => {
        const course = courseMap[app?.course_uuid as string];

        if (!course || !course.admin_approved) return null;

        return {
          ...course,
          application: app,
        };
      })
      .filter(Boolean);
  }, [appliedCourses, courseMap]);

  const { data: appliedPrograms } = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: { applicant_uuid_eq: instructor?.uuid as string },
      },
    }),
    enabled: !!instructor?.uuid,
  });

  const programIds = appliedPrograms?.data?.content?.map(app => app.program_uuid) ?? [];

  const { programMap } = useProgramsByIds(programIds as string[]);

  const approvedPrograms = useMemo(() => {
    if (!appliedPrograms?.data?.content || !programMap) return [];

    return appliedPrograms.data.content
      .filter(app => app.status === 'approved')
      .map(app => {
        const program = programMap[app.program_uuid as string]; // or programMap.get(app.program_uuid)

        if (!program || !program.admin_approved) return null;

        return {
          ...program,
          application: app,
        };
      })
      .filter(Boolean);
  }, [appliedPrograms, programMap]);

  const catalogItems = useMemo<CatalogItem[]>(() => {
    const courseItems: CatalogItem[] = approvedCourses.map(course => ({
      label: course?.name,
      source: 'course',
      uuid: String(course?.uuid),
      classLimit: course?.class_limit ?? 0,
      thumbnailUrl: course?.thumbnail_url || 'NF',
      rateCard: course?.application?.rate_card as CatalogRateCard | undefined,
    }));
    const programItems: CatalogItem[] = approvedPrograms.map(program => ({
      label: program?.title,
      source: 'program',
      uuid: String(program?.uuid),
      classLimit: program?.class_limit ?? 0,
      rateCard: program?.application?.rate_card as CatalogRateCard | undefined,
      thumbnailUrl: '',
    }));
    return [...courseItems, ...programItems];
  }, [approvedCourses, approvedPrograms]);

  const selectedCatalogItem = useMemo(
    () =>
      catalogItems.find(item =>
        item.source === 'course'
          ? item.uuid === classDetails.course_uuid
          : item.uuid === classDetails.program_uuid
      ),
    [catalogItems, classDetails.course_uuid, classDetails.program_uuid]
  );

  const rateCard = selectedCatalogItem?.rateCard;
  // Reads the approved rate for the selected format, delivery mode and contracted basis. The
  // previous lookup built a `*_rate` key that no longer exists — the rate card was split into
  // hourly/session/daily columns — so it silently resolved to 0 and every class was priced free.
  const approvedRate = useMemo(() => {
    if (!rateCard || !classDetails.class_type || !classDetails.location_type) return 0;
    const format = classDetails.class_type === 'PRIVATE' ? 'INDIVIDUAL' : 'GROUP';
    const delivery = classDetails.location_type === 'ONLINE' ? 'ONLINE' : 'IN_PERSON';
    return approvedRateFor(rateCard as ApprovedRateCard, format, delivery, rateBasis) ?? 0;
  }, [classDetails.class_type, classDetails.location_type, rateCard, rateBasis]);

  const totalSessions = sessionsForConflictCheck.length || classData?.scheduled_session_count;

  const hasPerDayOccurrenceData = Object.keys(perDayOccurrences).length > 0;

  const totalHours = useMemo(() => {
    if (
      hasPerDayOccurrenceData &&
      schedulePreset === 'standard' &&
      scheduleSettings.repeat.unit === 'week'
    ) {
      return Object.values(perDayOccurrences).reduce(
        (sum, day) => sum + day.durationHours * day.occurrenceCount,
        0
      );
    }

    return sessionsForConflictCheck.reduce(
      (sum, session) =>
        sum +
        (scheduleSettings.allDay
          ? 24
          : (sessionMinutesFromTimes(session.startTime, session.endTime) ?? 0) / 60),
      0
    );
  }, [
    hasPerDayOccurrenceData,
    perDayOccurrences,
    schedulePreset,
    scheduleSettings.allDay,
    scheduleSettings.repeat.unit,
    sessionsForConflictCheck,
  ]);

  /** Distinct calendar days holding a session — two sessions in one day bill once on a daily rate. */
  const totalDays = useMemo(
    () => new Set(sessionsForConflictCheck.map(session => session.date)).size,
    [sessionsForConflictCheck]
  );

  useEffect(() => {
    if (resolvedId) {
      setIsEditHydrated(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    if (resolvedId || !isDataInitialized || scheduleTimezoneOverridden) return;

    setScheduleSettings(prev => {
      if (normalizeScheduleTimeZone(prev.timezone) === activeScheduleTimeZone) {
        return prev;
      }
      return { ...prev, timezone: activeScheduleTimeZone };
    });
  }, [activeScheduleTimeZone, resolvedId, isDataInitialized, scheduleTimezoneOverridden]);

  // ── Draft restore (new-class path only) ───────────────────────────────────
  useEffect(() => {
    if (!isClientReady || resolvedId || isDataInitialized || typeof window === 'undefined') return;

    const savedDraft = window.localStorage.getItem(LOCAL_CLASS_DRAFT_KEY);
    if (!savedDraft) {
      setIsDataInitialized(true);
      return;
    }
    try {
      const parsed = JSON.parse(savedDraft) as {
        classDetails?: Partial<ClassDetails>;
        scheduleSettings?: Partial<ScheduleSettings>;
        notificationSettings?: Partial<NotificationSettings>;
        schedulePreset?: SchedulePreset;
        allowWaitlist?: boolean;
        locationLatitude?: string;
        locationLongitude?: string;
        pickedDates?: {
          date: string;
          startTime: string;
          endTime: string;
          durationMinutes?: string;
        }[];
      };
      if (parsed.classDetails) {
        const saved = parsed.classDetails;
        setClassDetails(prev => ({
          ...prev,
          ...saved,
          location_type: normalizeLocationType(saved.location_type),
        }));
      }
      if (parsed.scheduleSettings) {
        const restoredTimeZone = normalizeScheduleTimeZone(
          parsed.scheduleSettings.timezone ?? activeScheduleTimeZone
        );
        if (parsed.scheduleSettings.timezone) {
          setScheduleTimezoneOverridden(true);
        }
        setScheduleSettings(prev => ({
          ...prev,
          ...parsed.scheduleSettings,
          timezone: restoredTimeZone,
          academicPeriod: { ...prev.academicPeriod, ...parsed.scheduleSettings?.academicPeriod },
          registrationPeriod: {
            ...prev.registrationPeriod,
            ...parsed.scheduleSettings?.registrationPeriod,
          },
          startClass: { ...prev.startClass, ...parsed.scheduleSettings?.startClass },
          repeat: { ...prev.repeat, ...parsed.scheduleSettings?.repeat },
          timetable: {
            ...prev.timetable,
            ...parsed.scheduleSettings?.timetable,
            time: { ...prev.timetable.time, ...parsed.scheduleSettings?.timetable?.time },
          },
        }));
      }
      if (parsed.notificationSettings)
        setNotificationSettings(prev => ({ ...prev, ...parsed.notificationSettings }));
      if (parsed.schedulePreset) setSchedulePreset(parsed.schedulePreset);
      if (typeof parsed.allowWaitlist === 'boolean') setAllowWaitlist(parsed.allowWaitlist);
      if (typeof parsed.locationLatitude === 'string') setLocationLatitude(parsed.locationLatitude);
      if (typeof parsed.locationLongitude === 'string')
        setLocationLongitude(parsed.locationLongitude);
      if (Array.isArray(parsed.pickedDates)) {
        setPickedDates(
          parsed.pickedDates.map(item => {
            const endTime =
              item.endTime ??
              timeAfterDuration(
                item.startTime,
                item.durationMinutes ?? String(DEFAULT_CLASS_DURATION_MINUTES)
              );
            return {
              ...item,
              endTime,
              durationMinutes: String(durationMinutesFromTimes(item.startTime, endTime)),
            };
          })
        );
      }
    } catch {
      window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
    } finally {
      setIsDataInitialized(true);
    }
  }, [resolvedId, isDataInitialized, isClientReady, activeScheduleTimeZone]);

  // ── Draft save ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (resolvedId || !isDataInitialized || typeof window === 'undefined') return;
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(
        LOCAL_CLASS_DRAFT_KEY,
        JSON.stringify({
          classDetails,
          scheduleSettings,
          notificationSettings,
          schedulePreset,
          allowWaitlist,
          locationLatitude,
          locationLongitude,
          pickedDates,
          savedAt: new Date().toISOString(),
        })
      );
      setDraftSavedTick(prev => prev + 1);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [
    classDetails,
    scheduleSettings,
    notificationSettings,
    schedulePreset,
    allowWaitlist,
    locationLatitude,
    locationLongitude,
    pickedDates,
    resolvedId,
    isDataInitialized,
  ]);

  useEffect(() => {
    if (!isClientReady || !resolvedId || !classData || isLoading || isEditHydrated) return;

    const classRecord = classData as NonNullable<typeof classData> & {
      categories?: string[] | string | null;
      rate_card?: string | null;
      targetAudience?: string | null;
      sale_price?: string | null;
      meeting_link?: string | null;
      allow_waitlist?: boolean | null;
      location_latitude?: number | null;
      location_longitude?: number | null;
      thumbnail_url?: string | null;
      promotional_video_url?: string | null;
      session_templates?: Array<{
        start_time: string | Date;
        end_time?: string | Date;
        duration_minutes?: number | string | bigint | null;
        timezone?: string | null;
        recurrence?: {
          recurrence_type?: string;
          interval_value?: number;
          days_of_week?: string;
          occurrence_count?: number;
        };
      }>;
    };

    setClassDetails({
      uuid: classRecord.uuid || '',
      course_uuid: classRecord.course_uuid ?? '',
      program_uuid: classRecord.program_uuid ?? null,
      title: classRecord.title || '',
      description: classRecord.description || '',
      categories: Array.isArray(classRecord.categories)
        ? classRecord.categories
        : classRecord.categories
          ? [classRecord.categories]
          : [],
      class_type: classRecord.class_visibility || 'PUBLIC',
      location_type: normalizeLocationType(classRecord.location_type),
      rate_card: classRecord.rate_card || classRecord.sale_price || '',
      class_limit: classRecord.max_participants || 0,
      targetAudience: classRecord.targetAudience || '',
      location_name: classRecord.location_name || '',
      startDate: '',
      endDate: '',
      allDay: false,
      repeatUnit: '1',
      instructorName: instructor?.full_name,
      meeting_link: classRecord.meeting_link || '',
      classroom: classRecord.classroom || '',
      class_color: classRecord.class_color || '',
      reminder: '',
      thumbnail_url: classRecord.thumbnail_url || '',
      promotional_video_url: classRecord.promotional_video_url || '',
    });

    setNotificationSettings(prev => ({
      ...prev,
      reminder: reminderFromMinutes(classRecord.class_reminder_minutes) || prev.reminder,
      classColour: classRecord.class_color || prev.classColour,
    }));
    setAllowWaitlist(classRecord.allow_waitlist ?? true);
    setLocationLatitude(
      typeof classRecord.location_latitude === 'number' ? String(classRecord.location_latitude) : ''
    );
    setLocationLongitude(
      typeof classRecord.location_longitude === 'number'
        ? String(classRecord.location_longitude)
        : ''
    );

    const loadedLocationType = normalizeLocationType(classRecord.location_type);
    const classTypeValue = classRecord.class_visibility === 'PRIVATE' ? 'PRIVATE' : 'GROUP';
    let computedServiceType: ServiceType | undefined;

    if (classTypeValue === 'PRIVATE' && loadedLocationType === 'ONLINE') {
      computedServiceType = 'PRIVATE_ONLINE';
    } else if (classTypeValue === 'GROUP' && loadedLocationType === 'ONLINE') {
      computedServiceType = 'GROUP_ONLINE';
    } else if (classTypeValue === 'GROUP' && loadedLocationType === 'IN_PERSON') {
      computedServiceType = 'GROUP_INPERSON';
    } else if (classTypeValue === 'PRIVATE' && loadedLocationType === 'IN_PERSON') {
      computedServiceType = 'PRIVATE_INPERSON';
    } else if (classTypeValue === 'PRIVATE' && loadedLocationType === 'HYBRID') {
      //   computedServiceType = 'PRIVATE_HYBRID';
      // } else if (classTypeValue === 'GROUP' && loadedLocationType === 'HYBRID') {
      //   computedServiceType = 'GROUP_HYBRID';
    }

    if (computedServiceType) setServiceType(computedServiceType);

    if (Array.isArray(classRecord.session_templates) && classRecord.session_templates.length > 0) {
      const templates = classRecord.session_templates;
      const firstTemplate = templates[0];

      if (!firstTemplate) {
        setIsEditHydrated(true);
        setIsDataInitialized(true);
        return;
      }

      const hydratedTimeZone = normalizeScheduleTimeZone(
        firstTemplate.timezone ?? activeScheduleTimeZone
      );
      const firstStart = new Date(firstTemplate.start_time);
      const firstEnd = firstTemplate.end_time
        ? new Date(firstTemplate.end_time)
        : new Date(
          firstStart.getTime() + durationMinutesOrDefault(firstTemplate.duration_minutes) * 60000
        );
      const firstStartDisplay = parseApiDate(firstTemplate.start_time)?.tz(hydratedTimeZone);
      const firstEndDisplay = firstTemplate.end_time
        ? parseApiDate(firstTemplate.end_time)?.tz(hydratedTimeZone)
        : null;
      const firstDate =
        firstStartDisplay?.format('YYYY-MM-DD') ?? firstStart.toISOString().slice(0, 10);
      const startTime = firstStartDisplay?.format('HH:mm') ?? firstStart.toTimeString().slice(0, 5);
      const endTime = firstEndDisplay?.format('HH:mm') ?? firstEnd.toTimeString().slice(0, 5);
      const durationMinutes = durationMinutesFromDates(firstStart, firstEnd);

      if (firstTemplate.timezone) {
        setScheduleTimezoneOverridden(true);
      }
      setScheduleSettings(prev => ({ ...prev, timezone: hydratedTimeZone }));

      const isAllDay = startTime === '00:00' && endTime === '23:59';

      const recurrenceType = firstTemplate.recurrence?.recurrence_type?.toUpperCase();
      const intervalValue = firstTemplate.recurrence?.interval_value || 1;

      const likelyPickDates =
        templates.length > 1 &&
        templates.every(
          t =>
            t.recurrence?.recurrence_type?.toUpperCase() === 'DAILY' &&
            t.recurrence?.occurrence_count === 1
        );

      if (likelyPickDates) {
        setSchedulePreset('pick-dates');
        const picked = templates.map(t => {
          const templateTimeZone = normalizeScheduleTimeZone(t.timezone ?? hydratedTimeZone);
          const tStart = new Date(t.start_time);
          const tEnd = t.end_time
            ? new Date(t.end_time)
            : new Date(tStart.getTime() + durationMinutesOrDefault(t.duration_minutes) * 60000);
          const tStartDisplay = parseApiDate(t.start_time)?.tz(templateTimeZone);
          const tEndDisplay = t.end_time ? parseApiDate(t.end_time)?.tz(templateTimeZone) : null;
          const tDurationMinutes = durationMinutesFromDates(tStart, tEnd);
          return {
            date: tStartDisplay?.format('YYYY-MM-DD') ?? tStart.toISOString().slice(0, 10),
            startTime: isAllDay
              ? '00:00'
              : (tStartDisplay?.format('HH:mm') ?? tStart.toTimeString().slice(0, 5)),
            endTime: isAllDay
              ? '23:59'
              : (tEndDisplay?.format('HH:mm') ?? tEnd.toTimeString().slice(0, 5)),
            durationMinutes: String(tDurationMinutes),
          };
        });
        setPickedDates(picked);
      } else if (recurrenceType === 'WEEKLY') {
        setSchedulePreset('standard');

        const weeklyDayTimes: Record<
          number,
          { startTime: string; endTime: string; durationMinutes: string }
        > = {};
        const allDaysSet = new Set<number>();
        const nextPerDayOccurrences: Record<number, PerDayOccurrence> = {};

        const weeklyTemplates = templates.filter(
          t => t.recurrence?.recurrence_type?.toUpperCase() === 'WEEKLY'
        );

        const firstTemplateEnd = firstTemplate.end_time
          ? new Date(firstTemplate.end_time)
          : firstEnd;

        const recurrenceEndDate = firstTemplate.recurrence?.end_date
          ? new Date(firstTemplate.recurrence.end_date)
          : null;

        const maxEndDate = templates.reduce((max, t) => {
          const start = new Date(t.start_time);
          const d = t.end_time
            ? new Date(t.end_time)
            : new Date(start.getTime() + durationMinutesOrDefault(t.duration_minutes) * 60000);
          return d > max ? d : max;
        }, firstTemplateEnd);

        const endRepeatDate = (recurrenceEndDate ?? maxEndDate).toISOString().slice(0, 10);
        // ────────────────────────────────────────────────────────────────

        weeklyTemplates.forEach(template => {
          const templateDaysStr = template.recurrence?.days_of_week;
          if (!templateDaysStr) return;

          const tStart = new Date(template.start_time);
          const tEnd = template.end_time
            ? new Date(template.end_time)
            : new Date(
              tStart.getTime() + durationMinutesOrDefault(template.duration_minutes) * 60000
            );
          const tStartDisplay = parseApiDate(template.start_time)?.tz(hydratedTimeZone);
          const tEndDisplay = template.end_time
            ? parseApiDate(template.end_time)?.tz(hydratedTimeZone)
            : null;
          const tStartTime = isAllDay
            ? '00:00'
            : (tStartDisplay?.format('HH:mm') ?? tStart.toTimeString().slice(0, 5));
          const tEndTime = isAllDay
            ? '23:59'
            : (tEndDisplay?.format('HH:mm') ?? tEnd.toTimeString().slice(0, 5));
          const tOccurrenceCount = template.recurrence?.occurrence_count ?? 1;
          const tDurationMinutes = durationMinutesFromDates(tStart, tEnd);
          const tDurationHours = isAllDay ? 24 : tDurationMinutes / 60;

          templateDaysStr.split(',').forEach(rawDay => {
            const dayIndex = DAY_NAMES.indexOf(rawDay.trim());
            if (dayIndex < 0) return;

            allDaysSet.add(dayIndex);
            weeklyDayTimes[dayIndex] = {
              startTime: tStartTime,
              endTime: tEndTime,
              durationMinutes: String(tDurationMinutes),
            };
            nextPerDayOccurrences[dayIndex] = {
              durationHours: tDurationHours,
              occurrenceCount: tOccurrenceCount,
            };
          });
        });

        const daysArray = Array.from(allDaysSet).sort((a, b) => a - b);

        setScheduleSettings(prev => ({
          ...prev,
          allDay: isAllDay,
          startClass: {
            date: firstDate,
            startTime,
            endTime,
            durationMinutes: String(durationMinutes),
          },
          repeat: { interval: intervalValue, unit: 'week', days: daysArray },
          weeklyDayTimes,
          endRepeat: endRepeatDate,
          timezone: hydratedTimeZone,
        }));

        setPerDayOccurrences(nextPerDayOccurrences);
      } else if (
        recurrenceType === 'DAILY' ||
        recurrenceType === 'MONTHLY' ||
        recurrenceType === 'YEARLY'
      ) {
        setSchedulePreset('standard');
        const repeatUnit =
          recurrenceType === 'DAILY' ? 'day' : recurrenceType === 'MONTHLY' ? 'month' : 'year';

        setScheduleSettings(prev => ({
          ...prev,
          allDay: isAllDay,
          startClass: {
            date: firstDate,
            startTime,
            endTime,
            durationMinutes: String(durationMinutes),
          },
          repeat: {
            interval: intervalValue,
            unit: repeatUnit as 'day' | 'week' | 'month' | 'year',
            days: [],
          },
          endRepeat: firstDate,
          timezone: hydratedTimeZone,
        }));
      }
    }

    if (
      classRecord.academic_period_start_date ||
      classRecord.academic_period_end_date ||
      classRecord.registration_period_start_date ||
      classRecord.registration_period_end_date
    ) {
      setScheduleSettings(prev => ({
        ...prev,
        academicPeriod: {
          start: classRecord.academic_period_start_date
            ? new Date(classRecord.academic_period_start_date).toISOString().slice(0, 10)
            : prev.academicPeriod.start,
          end: classRecord.academic_period_end_date
            ? new Date(classRecord.academic_period_end_date).toISOString().slice(0, 10)
            : prev.academicPeriod.end,
        },
        registrationPeriod: {
          ...prev.registrationPeriod,
          start: classRecord.registration_period_start_date
            ? new Date(classRecord.registration_period_start_date).toISOString().slice(0, 10)
            : prev.registrationPeriod.start,
          end: classRecord.registration_period_end_date
            ? new Date(classRecord.registration_period_end_date).toISOString().slice(0, 10)
            : prev.registrationPeriod.end,
        },
      }));
    }

    if (classRecord.default_start_time) {
      const startDate = new Date(classRecord.default_start_time);
      const endDate = new Date(classRecord.default_end_time || classRecord.default_start_time);
      setScheduleSettings(prev => ({
        ...prev,
        startClass: {
          ...prev.startClass,
          date: startDate.toISOString().slice(0, 10),
          startTime: startDate.toTimeString().slice(0, 5),
          endTime: endDate.toTimeString().slice(0, 5),
          durationMinutes: String(durationMinutesFromDates(startDate, endDate)),
        },
        endRepeat: prev.endRepeat ?? startDate.toISOString().slice(0, 10),
      }));
    }

    setIsEditHydrated(true);
    setIsDataInitialized(true);
  }, [
    classData,
    isLoading,
    resolvedId,
    isEditHydrated,
    instructor?.full_name,
    isClientReady,
    activeScheduleTimeZone,
  ]);

  useEffect(() => {
    if (!draftSavedTick) return;

    const timeout = window.setTimeout(() => {
      toast.success('Draft saved');
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [draftSavedTick]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const isFormValid = () => {
    if (!classDetails.course_uuid && !classDetails.program_uuid) {
      toast.error('Please select a course or program');
      return false;
    }
    if (!classDetails.title.trim()) {
      toast.error('Please enter a class title');
      return false;
    }
    if (!serviceType) {
      toast.error('Please select a service type');
      return false;
    }
    const locationType = normalizeLocationType(classDetails.location_type);
    if (!locationType) {
      toast.error('Please select a lecture type');
      return false;
    }
    if (!selectedCatalogItem) {
      toast.error('Please select a valid course or program');
      return false;
    }
    if (!Number.isFinite(Number(classDetails.rate_card)) || Number(classDetails.rate_card) <= 0) {
      toast.error('Please choose a service type with a valid approved rate');
      return false;
    }
    if (requiresPhysicalLocation(locationType) && !trimToUndefined(classDetails.location_name)) {
      toast.error('Please enter a location');
      return false;
    }
    if (locationType === 'ONLINE' || locationType === 'HYBRID') {
      const meetingLink = normalizeMeetingLink(classDetails.meeting_link);
      if (!meetingLink) {
        toast.error('Please enter a class meeting link');
        return false;
      }
      if (!isValidMeetingLink(meetingLink)) {
        toast.error('Please enter a valid class meeting link');
        return false;
      }
    }
    if (schedulePreset === 'pick-dates' && pickedDates.length === 0) {
      toast.error('Please select at least one date');
      return false;
    }
    if (schedulePreset === 'pick-dates' && !scheduleSettings.allDay) {
      const invalidPickedSession = pickedDates.find(
        item => !hasValidSessionTimeRange({ ...item, durationMinutes: undefined })
      );
      if (invalidPickedSession) {
        toast.error('Each picked session end time must be after its start time', {
          description: `${invalidPickedSession.date} ${invalidPickedSession.startTime} - ${invalidPickedSession.endTime}`,
        });
        return false;
      }
    }
    if (!scheduleSettings.allDay) {
      const invalidSession = sessionsForConflictCheck.find(
        session => !hasValidSessionTimeRange(session)
      );
      if (invalidSession) {
        toast.error('Each session end time must be after its start time', {
          description: `${invalidSession.date} ${invalidSession.startTime} - ${invalidSession.endTime}`,
        });
        return false;
      }
    }
    if (schedulePreset !== 'pick-dates' && sessionsForConflictCheck.length === 0) {
      toast.error('Please set at least one class session');
      return false;
    }
    if (schedulePreset === 'academic-period') {
      if (!scheduleSettings.academicPeriod.start || !scheduleSettings.academicPeriod.end) {
        toast.error('Please set the academic period dates');
        return false;
      }
    }
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submitClass = (isDraft = false) => {
    if (!isFormValid()) return;

    const locationType = normalizeLocationType(classDetails.location_type);
    const meetingLinkAllowed = locationType === 'ONLINE' || locationType === 'HYBRID';
    const meetingLink = meetingLinkAllowed
      ? normalizeMeetingLink(classDetails.meeting_link)
      : undefined;
    const selectedSource: CatalogSource =
      selectedCatalogItem?.source || (classDetails.program_uuid ? 'program' : 'course');

    const academicPeriodStart = buildDateFromInput(scheduleSettings.academicPeriod.start);
    const academicPeriodEnd = buildDateFromInput(scheduleSettings.academicPeriod.end);
    const registrationPeriodStart = buildDateFromInput(scheduleSettings.registrationPeriod.start);
    const registrationPeriodEnd = buildDateFromInput(scheduleSettings.registrationPeriod.end);
    const selectedClassColor = trimToUndefined(
      notificationSettings.classColour || classDetails.class_color
    );

    const totalOccurrences = totalSessions || 1;

    let referenceDate = scheduleSettings.startClass.date;
    if (schedulePreset === 'academic-period') referenceDate = scheduleSettings.academicPeriod.start;

    const getDefaultTimes = () => {
      if (scheduleSettings.allDay) {
        return { startTime: '00:00', endTime: '23:59', durationMinutes: 24 * 60 };
      }
      const sortedDays = [...(scheduleSettings.repeat.days || [])].sort((a, b) => a - b);
      if (sortedDays.length > 0) {
        const firstIdx = sortedDays[0]!;
        const override = scheduleSettings.weeklyDayTimes[firstIdx];
        const startTime = override?.startTime || scheduleSettings.startClass.startTime || '00:00';
        const endTime =
          override?.endTime ||
          scheduleSettings.startClass.endTime ||
          timeAfterDuration(startTime, DEFAULT_CLASS_DURATION_MINUTES);
        return {
          startTime,
          endTime,
          durationMinutes: durationMinutesFromTimes(startTime, endTime),
        };
      }
      const startTime = scheduleSettings.startClass.startTime || '00:00';
      const endTime =
        scheduleSettings.startClass.endTime ||
        timeAfterDuration(startTime, DEFAULT_CLASS_DURATION_MINUTES);
      return { startTime, endTime, durationMinutes: durationMinutesFromTimes(startTime, endTime) };
    };

    const { startTime: defaultStart, endTime: defaultEnd } = getDefaultTimes();
    const defaultRange = getSessionTimeRange(
      referenceDate,
      defaultStart,
      defaultEnd,
      scheduleSettings.timezone
    );

    if (!defaultRange) {
      toast.error('Please set a valid class date, start time, and end time');
      return;
    }

    if (defaultRange.start >= defaultRange.end) {
      toast.error('Class end time must be after start time', {
        description: `${referenceDate} ${defaultStart} - ${defaultEnd}`,
      });
      return;
    }

    const invalidSession = sessionsForConflictCheck.find(
      session => !hasValidSessionTimeRange(session)
    );
    if (invalidSession) {
      toast.error('Each session end time must be after its start time', {
        description: `${invalidSession.date} ${invalidSession.startTime} - ${invalidSession.endTime}`,
      });
      return;
    }

    let session_templates: CreateClassDefinitionMultipartData['body']['session_templates'];

    if (schedulePreset === 'pick-dates') {
      session_templates = pickedDates
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => {
          const effectiveStartTime = scheduleSettings.allDay
            ? '00:00'
            : (item.startTime ?? '00:00');
          const effectiveEndTime = scheduleSettings.allDay
            ? '23:59'
            : (item.endTime ??
              timeAfterDuration(effectiveStartTime, DEFAULT_CLASS_DURATION_MINUTES));
          return {
            start_time: buildUtcIsoDateTime(
              item.date,
              effectiveStartTime,
              scheduleSettings.timezone
            ) as unknown as Date,
            end_time: buildUtcIsoDateTime(
              item.date,
              effectiveEndTime,
              scheduleSettings.timezone
            ) as unknown as Date,
            timezone: scheduleSettings.timezone,
            recurrence: {
              recurrence_type: RecurrenceTypeEnum.DAILY,
              interval_value: 1,
              days_of_week: undefined,
              occurrence_count: 1,
            },
            conflict_resolution: ConflictResolutionEnum.FAIL,
          };
        });
    } else if (schedulePreset === 'standard') {
      // Standard preset uses the Google-style recurrence editor: a single session template whose
      // recurrence rule carries the frequency, interval, weekdays and end condition.
      const startTimeIso = buildUtcIsoDateTime(
        referenceDate,
        defaultStart,
        scheduleSettings.timezone
      );
      const endTimeIso = buildUtcIsoDateTime(referenceDate, defaultEnd, scheduleSettings.timezone);
      const recurrenceRule = toClassRecurrence({
        frequency:
          scheduleSettings.repeat.unit === 'day'
            ? 'DAILY'
            : scheduleSettings.repeat.unit === 'month'
              ? 'MONTHLY'
              : 'WEEKLY',
        interval: scheduleSettings.repeat.interval || 1,
        daysOfWeek: (scheduleSettings.repeat.days || [])
          .map(day => DAY_NAMES[day])
          .filter(Boolean),
        end: scheduleSettings.endRepeat
          ? { mode: 'on', date: scheduleSettings.endRepeat }
          : { mode: 'never' },
      } as RecurrenceValue);
      session_templates = [
        {
          start_time: startTimeIso as unknown as Date,
          end_time: endTimeIso as unknown as Date,
          timezone: scheduleSettings.timezone,
          ...(recurrenceRule ? { recurrence: recurrenceRule } : {}),
          conflict_resolution: ConflictResolutionEnum.FAIL,
        },
      ];
    } else {
      const recurrenceType =
        scheduleSettings.repeat.unit === 'day'
          ? RecurrenceTypeEnum.DAILY
          : scheduleSettings.repeat.unit === 'week'
            ? RecurrenceTypeEnum.WEEKLY
            : RecurrenceTypeEnum.MONTHLY;

      if (scheduleSettings.repeat.unit === 'week') {
        const seriesEndDate = scheduleSettings.endRepeat || referenceDate;

        session_templates = (scheduleSettings.repeat.days || []).map(dayIndex => {
          const override = scheduleSettings.weeklyDayTimes[dayIndex];
          const effectiveStartTime = scheduleSettings.allDay
            ? '00:00'
            : override?.startTime || scheduleSettings.startClass.startTime || '00:00';
          const effectiveEndTime = scheduleSettings.allDay
            ? '23:59'
            : override?.endTime ||
            scheduleSettings.startClass.endTime ||
            timeAfterDuration(effectiveStartTime, DEFAULT_CLASS_DURATION_MINUTES);

          const firstOccurrence = new Date(referenceDate);
          while ((firstOccurrence.getDay() + 6) % 7 !== dayIndex) {
            firstOccurrence.setDate(firstOccurrence.getDate() + 1);
          }

          const endBoundary = new Date(seriesEndDate);
          let occurrenceCountForDay = 0;
          let lastOccurrence = firstOccurrence;
          const cursor = new Date(firstOccurrence);

          while (cursor <= endBoundary) {
            occurrenceCountForDay += 1;
            lastOccurrence = new Date(cursor);
            cursor.setDate(cursor.getDate() + scheduleSettings.repeat.interval * 7);
          }

          if (occurrenceCountForDay === 0) {
            occurrenceCountForDay = 1;
            lastOccurrence = firstOccurrence;
          }

          const firstSessionDate = firstOccurrence.toISOString().split('T')[0]!;
          const lastSessionDate = lastOccurrence.toISOString().split('T')[0]!;

          return {
            start_time: buildUtcIsoDateTime(
              firstSessionDate,
              effectiveStartTime,
              scheduleSettings.timezone
            ) as unknown as Date,
            end_time: buildUtcIsoDateTime(
              lastSessionDate,
              effectiveEndTime,
              scheduleSettings.timezone
            ) as unknown as Date,
            timezone: scheduleSettings.timezone,
            recurrence: {
              recurrence_type: RecurrenceTypeEnum.WEEKLY,
              interval_value: scheduleSettings.repeat.interval,
              days_of_week: DAY_NAMES[dayIndex],
              occurrence_count: occurrenceCountForDay,
              end_date: new Date(
                buildUtcIsoDateTime(lastSessionDate, effectiveEndTime, scheduleSettings.timezone)
              ),
            },
            conflict_resolution: ConflictResolutionEnum.FAIL,
          };
        });
      } else {
        const startTimeIso = buildUtcIsoDateTime(
          referenceDate,
          defaultStart,
          scheduleSettings.timezone
        );
        const endTimeIso = buildUtcIsoDateTime(
          referenceDate,
          defaultEnd,
          scheduleSettings.timezone
        );
        const daysOfWeekString =
          (scheduleSettings.repeat.days || [])
            .slice()
            .sort()
            .map(idx => DAY_NAMES[idx])
            .join(',') || undefined;
        session_templates = [
          {
            start_time: startTimeIso as unknown as Date,
            end_time: endTimeIso as unknown as Date,
            timezone: scheduleSettings.timezone,
            recurrence: {
              recurrence_type: recurrenceType,
              interval_value: scheduleSettings.repeat.interval,
              days_of_week: daysOfWeekString,
              occurrence_count: totalOccurrences,
            },
            conflict_resolution: ConflictResolutionEnum.FAIL,
          },
        ];
      }
    }

    const payloadRefDate =
      schedulePreset === 'pick-dates' && pickedDates.length > 0
        ? pickedDates[0]!.date
        : referenceDate;
    const payloadStartTime =
      schedulePreset === 'pick-dates' && pickedDates.length > 0
        ? scheduleSettings.allDay
          ? '00:00'
          : pickedDates[0]!.startTime || '00:00'
        : defaultStart;
    const payloadEndTime =
      schedulePreset === 'pick-dates' && pickedDates.length > 0
        ? scheduleSettings.allDay
          ? '23:59'
          : pickedDates[0]!.endTime ||
          timeAfterDuration(payloadStartTime, DEFAULT_CLASS_DURATION_MINUTES)
        : defaultEnd;

    const payload: CreateClassDefinitionMultipartData['body'] = {
      default_instructor_uuid: instructor?.uuid as string,
      organisation_uuid: activeDomain === 'instructor' ? null : organisation?.organisation_uuid,
      course_uuid: selectedSource === 'course' ? classDetails.course_uuid || undefined : undefined,
      program_uuid:
        selectedSource === 'program' ? classDetails.program_uuid || undefined : undefined,
      title: classDetails.title.trim(),
      description: classDetails.description || undefined,
      class_visibility: classDetails.class_type === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
      session_format:
        classDetails.class_type === 'PRIVATE'
          ? SessionFormatEnum.INDIVIDUAL
          : SessionFormatEnum.GROUP,
      location_type: LocationTypeEnum[locationType as keyof typeof LocationTypeEnum],
      location_name: trimToUndefined(classDetails.location_name),
      location_latitude: toCoordinate(locationLatitude),
      location_longitude: toCoordinate(locationLongitude),
      max_participants: classDetails.class_limit > 0 ? classDetails.class_limit : undefined,
      classroom: trimToUndefined(classDetails.classroom),
      // class_color: trimToUndefined(notificationSettings.classColour || classDetails.class_color),
      class_color: TOKEN.primary,
      academic_period_start_date: academicPeriodStart,
      academic_period_end_date: academicPeriodEnd,
      registration_period_start_date: registrationPeriodStart,
      registration_period_end_date: registrationPeriodEnd,
      scheduled_session_count: totalSessions,
      class_reminder_minutes: reminderToMinutes(notificationSettings.reminder),
      sale_price: approvedRate,
      instructor_pay: approvedRate,
      rate_basis: rateBasis,
      allow_waitlist: allowWaitlist,
      is_active: !isDraft,
      default_start_time: buildUtcIsoDateTime(
        payloadRefDate,
        payloadStartTime,
        scheduleSettings.timezone
      ) as unknown as Date,
      default_end_time: buildUtcIsoDateTime(
        payloadRefDate,
        payloadEndTime,
        scheduleSettings.timezone
      ) as unknown as Date,
      meeting_link: meetingLink,
      session_templates,
    };

    const onSuccess = async () => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: getClassDefinitionsForInstructorQueryKey({
            path: { instructorUuid: instructor?.uuid as string },
          }),
        }),
        qc.invalidateQueries({
          queryKey: getAllClassDefinitionsQueryKey({
            query: { pageable: {} },
          }),
        }),
        qc.refetchQueries({
          predicate: query => {
            const key = query.queryKey[0] as
              | { _id?: string; path?: { instructorUuid?: string } }
              | undefined;

            return (
              key?._id === 'getClassDefinitionsForInstructor' &&
              key.path?.instructorUuid === instructor?.uuid
            );
          },
        }),
        qc.refetchQueries({
          predicate: query => {
            const key = query.queryKey[0] as
              | { _id?: string; path?: { instructorUuid?: string } }
              | undefined;

            return (
              key?._id === 'getInstructorSchedule' && key.path?.instructorUuid === instructor?.uuid
            );
          },
        }),
        resolvedId
          ? qc.invalidateQueries({
            queryKey: getClassDefinitionQueryKey({
              path: { uuid: resolvedId },
            }),
          })
          : Promise.resolve(),
      ]);

      if (typeof window !== 'undefined') window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
      toast.success(
        isDraft
          ? 'Class saved as draft'
          : resolvedId
            ? 'Class updated successfully'
            : 'Class created successfully'
      );
      router.push('/dashboard/instructor/training-hub');
    };

    if (resolvedId) {
      updateClassDefinition.mutate(
        { path: { uuid: resolvedId }, body: payload },
        {
          onSuccess: async () => {
            try {
              await uploadClassMedia(resolvedId);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Class media upload failed.');
            }
            onSuccess();
          },
          onError: error => showMutationError(error, 'Failed to update class'),
        }
      );
    } else {
      createClassDefinition.mutate(
        { body: payload, query: { formFields: {} } },
        {
          onSuccess: async response => {
            const savedUuid = response?.data?.class_definition?.uuid;
            if (savedUuid) {
              setSavedClassUuid(savedUuid);
              try {
                await uploadClassMedia(savedUuid);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Class media upload failed.');
              }
            }
            onSuccess();
          },
          onError: error => showMutationError(error, 'Failed to create class'),
        }
      );
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitClass(false);
  };

  const clearDraft = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
    setClassDetails(createInitialClassDetails(instructor?.full_name));
    setScheduleSettings(createInitialScheduleSettings(activeScheduleTimeZone));
    setScheduleTimezoneOverridden(false);
    setNotificationSettings(createInitialNotificationSettings());
    setReminderOptions({
      window: '24h',
      sendStudents: true,
      sendInstructor: true,
      email: true,
      sms: false,
      push: true,
    });
    setSchedulePreset('standard');
    setAllowWaitlist(true);
    setLocationLatitude('');
    setLocationLongitude('');
    setPickedDates([]);
    setPerDayOccurrences({});
    setSavedClassUuid(null);
    setIsDataInitialized(true);
    toast.success('Draft cleared');
  };

  const handleScheduleTimeZoneChange = (value: string) => {
    setScheduleTimezoneOverridden(true);
    setScheduleSettings(prev => ({ ...prev, timezone: normalizeScheduleTimeZone(value) }));
  };

  const instructorOfferings = useMemo<Offering[]>(
    () =>
      catalogItems.map(item => ({
        value: `${item.source}:${item.uuid}`,
        label: item.label ?? 'Untitled offering',
        kind: item.source === 'course' ? 'Course' : 'Program',
        categoryNames: [],
        rateCard: item.rateCard as ApprovedRateCard | undefined,
      })),
    [catalogItems]
  );

  const selectedOfferingValue = selectedCatalogItem
    ? `${selectedCatalogItem.source}:${selectedCatalogItem.uuid}`
    : '';

  const handleOfferingChange = (value: string) => {
    const [source, uuid] = value.split(':');
    const item = catalogItems.find(candidate => candidate.source === source && candidate.uuid === uuid);
    if (!item) return;

    setClassDetails(prev => ({
      ...prev,
      course_uuid: item.source === 'course' ? item.uuid : '',
      program_uuid: item.source === 'program' ? item.uuid : null,
      class_limit: item.classLimit,
      title: item.label || prev.title || '',
    }));
  };

  const serviceKey = useMemo<ServiceKey>(() => {
    const privateClass = classDetails.class_type === 'PRIVATE';
    const online = classDetails.location_type === 'ONLINE';
    if (privateClass) return online ? 'private-online' : '1on1';
    return online ? 'online' : 'group';
  }, [classDetails.class_type, classDetails.location_type]);

  const handleServiceChange = (value: ServiceKey) => {
    const serviceMap: Record<
      ServiceKey,
      { serviceType: ServiceType; classType: 'PRIVATE' | 'GROUP'; locationType: 'ONLINE' | 'IN_PERSON' }
    > = {
      '1on1': { serviceType: 'PRIVATE_INPERSON', classType: 'PRIVATE', locationType: 'IN_PERSON' },
      group: { serviceType: 'GROUP_INPERSON', classType: 'GROUP', locationType: 'IN_PERSON' },
      online: { serviceType: 'GROUP_ONLINE', classType: 'GROUP', locationType: 'ONLINE' },
      'private-online': {
        serviceType: 'PRIVATE_ONLINE',
        classType: 'PRIVATE',
        locationType: 'ONLINE',
      },
    };
    const selected = serviceMap[value];
    const format = selected.classType === 'PRIVATE' ? 'INDIVIDUAL' : 'GROUP';
    const price = approvedRateFor(
      rateCard as ApprovedRateCard | undefined,
      format,
      selected.locationType,
      rateBasis
    );
    handleServiceTypeChange(
      selected.serviceType,
      selected.classType,
      selected.locationType,
      price
    );
  };

  const sharedDays = useMemo<Record<DayKey, DayRow>>(() => {
    const days = {} as Record<DayKey, DayRow>;
    DAY_SHORT.forEach((day, index) => {
      const override = scheduleSettings.weeklyDayTimes[index];
      days[day as DayKey] = {
        active: scheduleSettings.repeat.days?.includes(index) ?? false,
        start: override?.startTime || scheduleSettings.startClass.startTime || '09:00',
        end:
          override?.endTime ||
          scheduleSettings.startClass.endTime ||
          timeAfterDuration(override?.startTime || scheduleSettings.startClass.startTime || '09:00', DEFAULT_CLASS_DURATION_MINUTES),
        allDay: scheduleSettings.allDay,
      };
    });
    return days;
  }, [scheduleSettings]);

  const updateSharedDay = (day: DayKey, patch: Partial<DayRow>) => {
    const index = DAY_SHORT.indexOf(day);
    if (index < 0) return;
    setScheduleSettings(prev => {
      const currentDays = prev.repeat.days || [];
      const active = patch.active ?? currentDays.includes(index);
      const nextDays = active
        ? [...new Set([...currentDays, index])].sort((a, b) => a - b)
        : currentDays.filter(value => value !== index);
      const currentOverride = prev.weeklyDayTimes[index] || {};
      const startTime =
        patch.start ?? currentOverride.startTime ?? prev.startClass.startTime ?? '09:00';
      const endTime = patch.end ?? currentOverride.endTime ?? prev.startClass.endTime ?? '11:00';

      return {
        ...prev,
        allDay: patch.allDay ?? prev.allDay,
        repeat: { ...prev.repeat, unit: 'week', days: nextDays },
        weeklyDayTimes: {
          ...prev.weeklyDayTimes,
          [index]: { ...currentOverride, startTime, endTime },
        },
        startClass: {
          ...prev.startClass,
          startTime: prev.startClass.startTime || startTime,
          endTime: prev.startClass.endTime || endTime,
        },
      };
    });
  };

  const scheduleMode = schedulePreset === 'pick-dates' ? 'pick' : schedulePreset === 'academic-period' ? 'academic' : 'standard';
  const sharedPickedDates = useMemo(
    () => pickedDates.map(item => buildDateFromInput(item.date)).filter(Boolean) as Date[],
    [pickedDates]
  );
  const sortedSharedPickedDates = useMemo(
    () => [...sharedPickedDates].sort((a, b) => a.getTime() - b.getTime()),
    [sharedPickedDates]
  );
  const sharedSessionStart = pickedDates[0]?.startTime || scheduleSettings.startClass.startTime || '10:00';
  const sharedSessionEnd = pickedDates[0]?.endTime || scheduleSettings.startClass.endTime || '12:00';

  const updatePickedDates = (dates: Date[]) => {
    setPickedDates(
      dates.map(date => {
        const dateValue = date.toISOString().split('T')[0]!;
        const existing = pickedDates.find(item => item.date === dateValue);
        const startTime = existing?.startTime || sharedSessionStart;
        const endTime = existing?.endTime || sharedSessionEnd;
        return {
          date: dateValue,
          startTime,
          endTime,
          durationMinutes: String(durationMinutesFromTimes(startTime, endTime)),
        };
      })
    );
  };

  const updatePickedSessionTime = (field: 'startTime' | 'endTime', value: string) => {
    setPickedDates(prev =>
      prev.map(item => {
        const startTime = field === 'startTime' ? value : item.startTime;
        const endTime = field === 'endTime' ? value : item.endTime;
        return {
          ...item,
          startTime,
          endTime,
          durationMinutes: String(durationMinutesFromTimes(startTime, endTime)),
        };
      })
    );
    setScheduleSettings(prev => ({
      ...prev,
      startClass: { ...prev.startClass, [field]: value },
    }));
  };

  const handleAcademicPeriodsChange = (periods: AcademicPeriod[]) => {
    setAcademicPeriods(periods);
    const slots = periods.flatMap(period => period.slots);
    const dayIndexes = [...new Set(slots.map(slot => DAY_SHORT.indexOf(slot.day)))].filter(
      index => index >= 0
    );
    const weeklyDayTimes = slots.reduce<Record<number, { startTime: string; endTime: string }>>(
      (map, slot) => {
        const index = DAY_SHORT.indexOf(slot.day);
        if (index >= 0) map[index] = { startTime: slot.start, endTime: slot.end };
        return map;
      },
      {}
    );
    const starts = periods.map(period => period.startDate).filter(Boolean).sort();
    const ends = periods.map(period => period.endDate).filter(Boolean).sort();
    setScheduleSettings(prev => ({
      ...prev,
      academicPeriod: {
        start: starts[0] || '',
        end: ends[ends.length - 1] || '',
      },
      endRepeat: ends[ends.length - 1] || prev.endRepeat,
      repeat: { ...prev.repeat, unit: 'week', days: dayIndexes },
      weeklyDayTimes,
    }));
  };

  const sharedReminder: ReminderState = {
    ...reminderOptions,
    window: notificationSettings.reminder || reminderOptions.window,
  };

  const handleReminderChange = (patch: Partial<ReminderState>) => {
    setReminderOptions(prev => ({ ...prev, ...patch }));
    if (patch.window) {
      setNotificationSettings(prev => ({ ...prev, reminder: patch.window ?? prev.reminder }));
    }
  };

  // ── Derived UI values ──────────────────────────────────────────────────────

  const sharedUpcomingSessions = useMemo(
    () =>
      sessionsForConflictCheck.map(session => ({
        date: new Date(`${session.date}T00:00:00`),
        label: format(new Date(`${session.date}T00:00:00`), 'EEE, MMM d, yyyy'),
        time: scheduleSettings.allDay ? 'All day' : `${session.startTime} - ${session.endTime}`,
        minutes: durationMinutesFromTimes(
          session.startTime,
          session.endTime,
          scheduleSettings.allDay
        ),
      })),
    [scheduleSettings.allDay, sessionsForConflictCheck]
  );

  const sharedConflicts = useMemo(
    () =>
      scheduleConflicts.map(conflict => ({
        start: `${conflict.proposed.date} ${conflict.proposed.startTime}`,
        end: conflict.proposed.endTime,
        reasons: [`Overlaps with ${conflict.existing.classTitle}`],
      })),
    [scheduleConflicts]
  );

  if (isLoading) {
    return (
      <div className='bg-background/95 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <div className='bg-primary/10 flex items-center justify-center rounded-full p-4'>
            <Loader2 className='text-primary h-8 w-8 animate-spin' />
          </div>

          {/* Text */}
          <div className='space-y-1'>
            <p className='text-foreground text-base font-semibold'>Loading class details</p>
            <p className='text-muted-foreground text-sm'>
              Please wait while we retrieve class details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-[1200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <PageHeader
          title='Create a class'
          description='For an approved offering you can deliver. The class is scheduled immediately on your calendar and can be published for learners to join.'
        />

        <OfferingPicker
          loading={!instructor}
          offerings={instructorOfferings}
          offering={selectedOfferingValue}
          onOfferingChange={handleOfferingChange}
          selectedOffering={instructorOfferings.find(item => item.value === selectedOfferingValue)}
          categories={[]}
          categoriesLoading={false}
          programCategoryUuid=''
          onProgramCategoryChange={() => undefined}
          title={classDetails.title}
          onTitleChange={value => setClassDetails(prev => ({ ...prev, title: value }))}
          showInstructor={false}
          showCategory={false}
          titleLabel='Class title'
          titleHint='This is the title learners will see on the class.'
          titlePlaceholder='Enter a class title'
        />

        <ServiceCards
          value={serviceKey}
          onChange={handleServiceChange}
          rateCard={rateCard as ApprovedRateCard | undefined}
          delivery={normalizeLocationType(classDetails.location_type) as 'ONLINE' | 'IN_PERSON' | 'HYBRID'}
          rateBasis={rateBasis}
        />

        <PricingCapacity
          approvedFee={approvedRate}
          currency={rateCard?.currency}
          salePrice={String(approvedRate || '')}
          onSalePriceChange={() => undefined}
          instructorPay={String(approvedRate || '')}
          onInstructorPayChange={() => undefined}
          maxParticipants={String(classDetails.class_limit || '')}
          onMaxChange={value =>
            setClassDetails(prev => ({ ...prev, class_limit: Number(value) || 0 }))
          }
          allowWaitlist={allowWaitlist}
          onAllowWaitlistChange={setAllowWaitlist}
          totalSessions={sessionsForConflictCheck.length}
          totalMinutes={totalHours * 60}
          totalDays={totalDays}
          rateBasis={rateBasis}
          onRateBasisChange={setRateBasis}
          readOnly
        />

        <LocationVenue
          delivery={normalizeLocationType(classDetails.location_type) as 'ONLINE' | 'IN_PERSON' | 'HYBRID'}
          onDeliveryChange={value =>
            setClassDetails(prev => ({ ...prev, location_type: value }))
          }
          meetingLink={classDetails.meeting_link}
          onMeetingLinkChange={value =>
            setClassDetails(prev => ({ ...prev, meeting_link: value }))
          }
          locationName={classDetails.location_name}
          onLocationNameChange={value =>
            setClassDetails(prev => ({ ...prev, location_name: value }))
          }
          locationLatitude={locationLatitude}
          onLocationLatitudeChange={setLocationLatitude}
          locationLongitude={locationLongitude}
          onLocationLongitudeChange={setLocationLongitude}
          venueUuid=''
          onVenueChange={() => undefined}
          venueResources={[]}
          onlyAvailable
          onOnlyAvailableChange={() => undefined}
          showVenue={false}
        />

        <ScheduleModeCards
          value={scheduleMode}
          onChange={value =>
            setSchedulePreset(
              value === 'pick' ? 'pick-dates' : value === 'academic' ? 'academic-period' : 'standard'
            )
          }
        />

        {scheduleMode === 'pick' ? (
          <PickDatesPanel
            pickedDates={sharedPickedDates}
            onPickedDatesChange={updatePickedDates}
            sortedPickedDates={sortedSharedPickedDates}
            pickMonth={pickMonth}
            onPickMonthChange={setPickMonth}
            sessionStart={sharedSessionStart}
            onSessionStartChange={value => updatePickedSessionTime('startTime', value)}
            sessionEnd={sharedSessionEnd}
            onSessionEndChange={value => updatePickedSessionTime('endTime', value)}
            timezone={scheduleSettings.timezone}
            onTimezoneChange={handleScheduleTimeZoneChange}
          />
        ) : scheduleMode === 'academic' ? (
          <AcademicPeriodsPanel periods={academicPeriods} onChange={handleAcademicPeriodsChange} />
        ) : (
          <StandardSchedule
            days={sharedDays}
            onDayChange={updateSharedDay}
            repeatEvery={String(scheduleSettings.repeat.interval || 1)}
            onRepeatEveryChange={value =>
              setScheduleSettings(prev => ({
                ...prev,
                repeat: { ...prev.repeat, interval: Number(value) || 1 },
              }))
            }
            repeatUnit={
              scheduleSettings.repeat.unit === 'day'
                ? 'Day'
                : scheduleSettings.repeat.unit === 'month'
                  ? 'Month'
                  : 'Week'
            }
            onRepeatUnitChange={value =>
              setScheduleSettings(prev => ({
                ...prev,
                repeat: {
                  ...prev.repeat,
                  unit: value.toLowerCase() as 'day' | 'week' | 'month',
                  days: value === 'Week' ? prev.repeat.days : [],
                },
              }))
            }
            startDate={scheduleSettings.startClass.date}
            onStartDateChange={value =>
              setScheduleSettings(prev => ({
                ...prev,
                startClass: { ...prev.startClass, date: value },
                endRepeat: prev.endRepeat || value,
              }))
            }
            endDate={scheduleSettings.endRepeat}
            onEndDateChange={value => setScheduleSettings(prev => ({ ...prev, endRepeat: value }))}
            regStart={scheduleSettings.registrationPeriod.start}
            onRegStartChange={value =>
              setScheduleSettings(prev => ({
                ...prev,
                registrationPeriod: { ...prev.registrationPeriod, start: value },
              }))
            }
            regEnd={scheduleSettings.registrationPeriod.end}
            onRegEndChange={value =>
              setScheduleSettings(prev => ({
                ...prev,
                registrationPeriod: { ...prev.registrationPeriod, end: value },
              }))
            }
            continuousReg={scheduleSettings.registrationPeriod.continuous ?? false}
            onContinuousRegChange={value =>
              setScheduleSettings(prev => ({
                ...prev,
                registrationPeriod: {
                  ...prev.registrationPeriod,
                  continuous: value,
                  end: value ? '' : prev.registrationPeriod.end,
                },
              }))
            }
            timezone={scheduleSettings.timezone}
            onTimezoneChange={handleScheduleTimeZoneChange}
            totalSessions={sessionsForConflictCheck.length}
          />
        )}

        <ClassMediaUpload
          selectedThumbnail={selectedThumbnail}
          selectedVideo={selectedPromotionalVideo}
          onMediaSelect={(media: MediaFile) =>
            media.type === 'thumbnail'
              ? setSelectedThumbnail(media.file)
              : setSelectedPromotionalVideo(media.file)
          }
          onRemoveThumbnail={() => setSelectedThumbnail(null)}
          onRemoveVideo={() => setSelectedPromotionalVideo(null)}
        />

        <ReminderOptions value={sharedReminder} onChange={handleReminderChange} />

        <UpcomingSessions sessions={sharedUpcomingSessions} />

        <ResourceConflictAlert
          title='These sessions conflict with existing instructor classes'
          conflicts={sharedConflicts}
        />

        <div className='border-border/70 flex flex-wrap justify-end gap-2 border-t pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/dashboard/instructor/classes')}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
            {isSubmitting ? 'Publishing...' : 'Publish Class'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InstructorClassCreationPage;

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='space-y-2'>
    <div className='text-foreground text-sm font-semibold'>{label}</div>
    {children}
  </div>
);
