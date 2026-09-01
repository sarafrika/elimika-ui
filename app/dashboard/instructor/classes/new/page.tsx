// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import {
  type ApprovedRateCard,
  approvedRateFor,
  DEFAULT_RATE_BASIS,
  RATE_BASES,
  type RateBasis,
  rateBasisUnit,
} from '@/components/class-form/class-form-shared';
import LocationInput from '@/components/locationInput';
import { RecurrenceEditor } from '@/components/scheduling/recurrence-editor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type InstructorClassWithSchedule,
  useInstructorClassesWithSchedules,
} from '@/hooks/use-instructor-classes-with-schedules';
import { defaultRecurrenceValue, type RecurrenceValue, toClassRecurrence } from '@/lib/recurrence';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle,
  BellRing,
  Building2,
  CalendarDays,
  Globe,
  Loader2,
  LockKeyhole,
  MapPin,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../../components/ui/button';
import { Calendar } from '../../../../../components/ui/calendar';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { useTimeZone } from '../../../../../context/timezone-context';
import { useUserProfile } from '../../../../../context/profile-context';
import { useUserDomain } from '../../../../../context/user-domain-context';
import { useCoursesByIds, useProgramsByIds } from '../../../../../hooks/use-batched-lookups';
import { useClassDetails } from '../../../../../hooks/use-class-details';
import {
  DEFAULT_CLASS_TIME_ZONE,
  formatScheduleClockTime,
  normalizeScheduleTimeZone,
  parseApiDate,
  scheduleTimeZoneLabel,
  scheduleTimeZoneOptions,
  toUtcIsoDateTime,
} from '../../../../../lib/date';
import {
  coordinatesFromPlace,
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
import { toAuthenticatedMediaUrl } from '../../../../../src/lib/media-url';
import { TOKEN } from '../../../_components/color-charts';
import {
  ClassDetails,
  NotificationSettings,
  ScheduleSettings,
} from '../../trainings/create-new/page';
import { ClassCreationHeader } from './_components/class-creation-header';
import {
  type ClassCreationPreviewData,
  ClassCreationPreviewRail,
} from './_components/class-creation-preview-rail';
import { ClassMediaUpload, type MediaFile } from './_components/class-media-upload';
import { type ServiceType, ServiceTypeSelector } from './_components/service-type-selector';

const LOCAL_CLASS_DRAFT_KEY = 'training-class-create-draft:new-class-creation';
const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_CLASS_DURATION_MINUTES = 60;

const CLASS_TYPE_OPTIONS = [
  { label: 'Group Class', value: 'PUBLIC', icon: Users },
  { label: 'Private Class', value: 'PRIVATE', icon: LockKeyhole },
];

const LECTURE_TYPE_OPTIONS = [
  { label: 'Online', value: 'ONLINE', icon: Globe },
  { label: 'In-Person', value: 'IN_PERSON', icon: MapPin },
  { label: 'Hybrid', value: 'HYBRID', icon: Building2 },
];

const REMINDER_OPTIONS = [
  { label: '24 hours before class', value: '24h' },
  { label: '1 hour before class', value: '1h' },
  { label: '30 minutes before class', value: '30m' },
];

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

export const formatClassType = (value?: string | null) => {
  if (!value) return 'Group Class';
  return value.toUpperCase() === 'PRIVATE' ? 'Private Class' : 'Group Class';
};

export const formatLectureType = (value?: string | null) => {
  const normalized = value?.toUpperCase() ?? '';
  if (normalized === 'ONLINE') return 'Online';
  if (normalized === 'IN_PERSON') return 'In-Person';
  if (normalized === 'HYBRID') return 'Hybrid';
  return 'In-Person';
};

const formatScheduleTime = (start?: string, end?: string, allDay?: boolean) => {
  if (allDay) return 'All Day';
  if (!start || !end) return '';
  return `${start} - ${end}`;
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

const getRepeatSummary = (scheduleSettings: ScheduleSettings) => {
  const days = scheduleSettings.repeat.days || [];
  const interval = scheduleSettings.repeat.interval || 1;

  if (scheduleSettings.repeat.unit === 'week') {
    const intervalLabel = interval > 1 ? `Every ${interval} weeks` : 'Weekly';
    if (days.length > 0) {
      return `${intervalLabel}\n${days.map(d => DAY_SHORT[d] ?? 'Mon').join(', ')}`;
    }
    return intervalLabel;
  }

  return `Every ${interval}\n${scheduleSettings.repeat.unit}(s)`;
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
const ClassCreationPage = () => {
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

  const [catalogSearch, setCatalogSearch] = useState('');
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('standard');
  const [serviceType, setServiceType] = useState<ServiceType | undefined>(undefined);
  // The unit the approved rate is quoted in. It decides both which rate-card column is read and
  // how many units the class bills for, so it has to be an explicit choice rather than a default
  // nobody sees — an hourly figure billed per session is a different contract entirely.
  const [rateBasis, setRateBasis] = useState<RateBasis>(DEFAULT_RATE_BASIS);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
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
  const [showOptionalSettings, setShowOptionalSettings] = useState(true);
  const [allowWaitlist, setAllowWaitlist] = useState(true);
  const [locationLatitude, setLocationLatitude] = useState('');
  const [locationLongitude, setLocationLongitude] = useState('');
  const [pickedDates, setPickedDates] = useState<
    { date: string; startTime: string; endTime: string; durationMinutes: string }[]
  >([]);

  const [perDayOccurrences, setPerDayOccurrences] = useState<Record<number, PerDayOccurrence>>({});

  // Google Calendar–style recurrence for the "Standard Schedule" preset. Source of truth for the
  // submitted payload; also mirrored into scheduleSettings.repeat so the live session preview and
  // conflict detection (which read scheduleSettings) keep reflecting the selection.
  const [recurrence, setRecurrence] = useState<RecurrenceValue>(() => defaultRecurrenceValue());
  const applyRecurrence = (value: RecurrenceValue) => {
    setRecurrence(value);
    setScheduleSettings(prev => ({
      ...prev,
      repeat: {
        interval: value.interval,
        unit:
          value.frequency === 'DAILY' ? 'day' : value.frequency === 'MONTHLY' ? 'month' : 'week',
        days:
          value.frequency === 'WEEKLY'
            ? value.daysOfWeek.map(day => DAY_NAMES.indexOf(day)).filter(index => index >= 0)
            : [],
      },
      endRepeat: value.end.mode === 'on' && value.end.date ? value.end.date : prev.endRepeat,
    }));
  };

  const classDetailsCardRef = useRef<HTMLDivElement | null>(null);

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
  const addClassThumbnailMut = useMutation(uploadClassThumbnailMutation());
  const addClassIntroVideoMut = useMutation(uploadClassPromotionalVideoMutation());
  const isSubmitting = createClassDefinition.isPending || updateClassDefinition.isPending;

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

  /** How many units of the contracted basis this schedule adds up to. */
  const billableUnits = useMemo(() => {
    if (rateBasis === 'per_session') return totalSessions || 0;
    if (rateBasis === 'per_day') return totalDays;
    return totalHours || 0;
  }, [rateBasis, totalSessions, totalDays, totalHours]);

  const totalAmount = Math.max(approvedRate * billableUnits, 0);

  const firstSessionTimeLabel = useMemo(() => {
    if (scheduleSettings.allDay) return 'All Day';
    if (schedulePreset === 'pick-dates') {
      if (pickedDates.length === 0) return '';
      const first = pickedDates[0];
      return formatScheduleTime(first?.startTime, first?.endTime, false);
    }
    const sortedDays = [...(scheduleSettings.repeat.days || [])].sort((a, b) => a - b);
    if (sortedDays.length === 0) return '';
    const firstDayIdx = sortedDays[0]!;
    const override = scheduleSettings.weeklyDayTimes[firstDayIdx];
    const startTime = override?.startTime || scheduleSettings.startClass.startTime || '';
    const endTime = override?.endTime || scheduleSettings.startClass.endTime || '';
    return formatScheduleTime(startTime, endTime, false);
  }, [schedulePreset, scheduleSettings, pickedDates]);

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

    const thumbnailUrl = toAuthenticatedMediaUrl(classRecord?.thumbnail_url);
    if (thumbnailUrl) {
      setExistingThumbnailUrl(thumbnailUrl);
    }

    const videoUrl = toAuthenticatedMediaUrl(classRecord?.promotional_video_url);
    if (videoUrl) {
      setExistingVideoUrl(videoUrl);
    }

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
      const recurrenceRule = toClassRecurrence(recurrence);
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
      title: classDetails.title,
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

    const onSuccess = async (createdUuid?: string) => {
      const finalUuid = createdUuid || resolvedId;

      if (finalUuid && !isDraft) {
        const uploads: Promise<unknown>[] = [];

        if (selectedThumbnail) {
          uploads.push(
            addClassThumbnailMut.mutateAsync({
              path: { uuid: finalUuid },
              body: { thumbnail: selectedThumbnail },
            })
          );
        }

        if (selectedVideo) {
          uploads.push(
            addClassIntroVideoMut.mutateAsync({
              path: { uuid: finalUuid },
              body: { promotional_video: selectedVideo },
            })
          );
        }

        try {
          await Promise.all(uploads);

          if (selectedThumbnail) {
            toast.success('Thumbnail uploaded');
          }

          if (selectedVideo) {
            toast.success('Video uploaded');
          }
        } catch (error) {
          showMutationError(error, 'Failed to upload class media');
        }
      }

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
          onSuccess: () => onSuccess(resolvedId),
          onError: error => showMutationError(error, 'Failed to update class'),
        }
      );
    } else {
      createClassDefinition.mutate(
        { body: payload, query: { formFields: {} } },
        {
          onSuccess: response => {
            const savedUuid = response?.data?.class_definition?.uuid;
            if (savedUuid) {
              setSavedClassUuid(savedUuid);
              onSuccess(savedUuid);
            } else {
              onSuccess();
            }
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

  // ── Derived UI values ──────────────────────────────────────────────────────
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = resolvedId ? `${origin}/class-invite?id=${resolvedId}` : '';
  const meetingLink = classDetails.meeting_link || 'Enter your meeting link.';
  const normalizedLocationType = normalizeLocationType(classDetails.location_type);
  const showMeetingLink =
    normalizedLocationType === 'ONLINE' || normalizedLocationType === 'HYBRID';

  const previewData: ClassCreationPreviewData = {
    thumbnailUrl: selectedCatalogItem?.thumbnailUrl as string,
    classTitle: classDetails.title || selectedCatalogItem?.label || 'Class title',
    classTypeLabel: formatClassType(classDetails.class_type),
    instructorName: classDetails.instructorName || instructor?.full_name || 'John Doe',
    lectureTypeLabel: formatLectureType(classDetails.location_type),
    locationName: classDetails.location_name || 'Nairobi, Kenya',
    scheduleLabel:
      schedulePreset === 'pick-dates'
        ? `${pickedDates.length} selected date${pickedDates.length === 1 ? '' : 's'}`
        : schedulePreset === 'standard' && scheduleSettings.startClass.date
          ? `Start ${new Date(`${scheduleSettings.startClass.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })}`
          : '',
    timeLabel: firstSessionTimeLabel,
    classroom: classDetails.classroom,
    totalHoursLabel: `${totalHours || 0} ${totalHours === 1 ? 'Hour' : 'Hours'}`,
    priceUnitLabel: `Price per ${rateBasisUnit(rateBasis)}`,
    pricePerHourLabel: `${rateCard?.currency || 'KES'} ${approvedRate.toLocaleString()}`,
    billingBasisLabel: `${billableUnits.toLocaleString()} ${rateBasisUnit(rateBasis)}${billableUnits === 1 ? '' : 's'} × ${rateCard?.currency || 'KES'} ${approvedRate.toLocaleString()}`,
    totalSessionsLabel: `${totalSessions || 0} Class${totalSessions === 1 ? '' : 'es'}`,
    totalAmountLabel: `${rateCard?.currency || 'KES'} ${totalAmount.toLocaleString() || '0'}`,
    meetingLink,
    inviteLink,
    summaryItems: [
      { icon: CalendarDays, label: 'Repeat', value: getRepeatSummary(scheduleSettings) },
      {
        icon: BellRing,
        label: 'Reminder',
        value: notificationSettings.reminder || '24 hours before class',
      },
      {
        icon: MapPin,
        label: 'Timezone',
        value: scheduleTimeZoneLabel(scheduleSettings.timezone),
      },
    ],
  };

  const normalizeTime = (time?: string) => {
    if (!time) return '';
    const [hour = '00', minute = '00'] = time.split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  // ── Day-time grid ──────────────────────────────────────────────────────────
  const DayTimeGrid = (
    <div className='space-y-2'>
      {DAY_NAMES.map((day, index) => {
        const active = scheduleSettings.repeat.days?.includes(index);
        const override = scheduleSettings.weeklyDayTimes[index];
        const effectiveStartTime =
          override?.startTime || scheduleSettings.startClass.startTime || '';
        const effectiveEndTime =
          override?.endTime ||
          scheduleSettings.startClass.endTime ||
          (effectiveStartTime
            ? timeAfterDuration(effectiveStartTime, DEFAULT_CLASS_DURATION_MINUTES)
            : '');
        const effectiveMinutes = sessionMinutesFromTimes(effectiveStartTime, effectiveEndTime);
        const isInvalidTime = Boolean(
          active && !scheduleSettings.allDay && effectiveMinutes === undefined
        );

        const toggleDay = () =>
          setScheduleSettings(prev => {
            const currentDays = prev.repeat.days || [];
            const nextDays = active
              ? currentDays.filter(d => d !== index)
              : [...currentDays, index].sort();

            return {
              ...prev,
              repeat: {
                ...prev.repeat,
                days: nextDays,
                unit: 'week',
              },
            };
          });

        return (
          <div
            key={day}
            onClick={toggleDay}
            className={`flex flex-row items-center gap-2 rounded-md border px-3 py-2 transition ${
              active ? 'border-primary bg-primary/5' : 'border-border bg-background'
            }`}
          >
            <button
              type='button'
              // onClick={() =>
              //   setScheduleSettings(prev => {
              //     const currentDays = prev.repeat.days || [];
              //     const nextDays = active
              //       ? currentDays.filter(d => d !== index)
              //       : [...currentDays, index].sort();
              //     return { ...prev, repeat: { ...prev.repeat, days: nextDays, unit: 'week' } };
              //   })
              // }
              className={`w-14 shrink-0 rounded-md border px-2 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground hover:border-primary/50'
              }`}
            >
              {DAY_SHORT[index]}
            </button>

            <div className='flex flex-1 flex-col gap-0.5'>
              <span className='text-muted-foreground text-[10px] font-medium'>Start Time</span>
              <Input
                type='time'
                onClick={e => e.stopPropagation()}
                disabled={!active || scheduleSettings.allDay}
                value={normalizeTime(effectiveStartTime)}
                onChange={e => {
                  const startTime = normalizeTime(e.target.value);
                  setScheduleSettings(prev => ({
                    ...prev,
                    weeklyDayTimes: {
                      ...prev.weeklyDayTimes,
                      [index]: {
                        startTime,
                        endTime:
                          prev.weeklyDayTimes[index]?.endTime ||
                          prev.startClass.endTime ||
                          (startTime
                            ? timeAfterDuration(startTime, DEFAULT_CLASS_DURATION_MINUTES)
                            : ''),
                        durationMinutes: String(
                          durationMinutesFromTimes(
                            startTime,
                            prev.weeklyDayTimes[index]?.endTime || prev.startClass.endTime
                          )
                        ),
                      },
                    },
                  }));
                }}
                className='h-8 text-xs'
              />
            </div>

            <div className='flex flex-1 flex-col gap-0.5'>
              <span className='text-muted-foreground text-[10px] font-medium'>End Time</span>
              <Input
                type='time'
                disabled={!active || scheduleSettings.allDay}
                value={normalizeTime(effectiveEndTime)}
                aria-invalid={isInvalidTime}
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  const endTime = normalizeTime(e.target.value);
                  setScheduleSettings(prev => {
                    const startTime =
                      prev.weeklyDayTimes[index]?.startTime || prev.startClass.startTime || '';
                    return {
                      ...prev,
                      weeklyDayTimes: {
                        ...prev.weeklyDayTimes,
                        [index]: {
                          startTime,
                          endTime,
                          durationMinutes: String(durationMinutesFromTimes(startTime, endTime)),
                        },
                      },
                    };
                  });
                }}
                className='h-8 text-xs'
              />
            </div>
            <div className='text-muted-foreground w-16 shrink-0 text-right text-[10px] font-medium tabular-nums'>
              {scheduleSettings.allDay ? '24h' : formatDurationMinutes(effectiveMinutes)}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Right-column fields ────────────────────────────────────────────────────
  const buildRightColumnFields = (preset: 'standard' | 'academic-period') => {
    const defaultSessionMinutes = sessionMinutesFromTimes(
      scheduleSettings.startClass.startTime,
      scheduleSettings.startClass.endTime,
      scheduleSettings.allDay
    );
    const hasDefaultTimes = Boolean(
      scheduleSettings.allDay ||
        (scheduleSettings.startClass.startTime && scheduleSettings.startClass.endTime)
    );
    const defaultTimeInvalid = Boolean(
      !scheduleSettings.allDay &&
        scheduleSettings.startClass.startTime &&
        scheduleSettings.startClass.endTime &&
        defaultSessionMinutes === undefined
    );

    return (
      <div className='space-y-4'>
        {preset === 'academic-period' ? (
          <div className='space-y-2'>
            <span className='text-foreground text-sm font-semibold'>Repeat Every</span>
            <div className='flex gap-2'>
              <Input
                type='number'
                min={1}
                value={scheduleSettings.repeat.interval}
                onChange={e =>
                  setScheduleSettings(prev => ({
                    ...prev,
                    repeat: { ...prev.repeat, interval: parseInt(e.target.value, 10) || 1 },
                  }))
                }
                className='w-20'
              />
              <Select
                value={scheduleSettings.repeat.unit}
                onValueChange={value =>
                  setScheduleSettings(prev => ({
                    ...prev,
                    repeat: {
                      ...prev.repeat,
                      unit: value as 'day' | 'week' | 'month' | 'year',
                      days: value !== 'week' ? [] : prev.repeat.days,
                    },
                  }))
                }
              >
                <SelectTrigger className='flex-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='day'>Day</SelectItem>
                  <SelectItem value='week'>Week</SelectItem>
                  <SelectItem value='month'>Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {preset === 'standard' ? (
          <div className='grid grid-cols-2 gap-2'>
            <FieldGroup label='Start Time'>
              <Input
                type='time'
                disabled={scheduleSettings.allDay}
                value={scheduleSettings.startClass.startTime || ''}
                onChange={e => {
                  const startTime = e.target.value;
                  setScheduleSettings(prev => ({
                    ...prev,
                    startClass: {
                      ...prev.startClass,
                      startTime,
                      endTime:
                        prev.startClass.endTime ||
                        (startTime
                          ? timeAfterDuration(startTime, DEFAULT_CLASS_DURATION_MINUTES)
                          : ''),
                      durationMinutes: String(
                        durationMinutesFromTimes(startTime, prev.startClass.endTime)
                      ),
                    },
                  }));
                }}
              />
            </FieldGroup>
            <FieldGroup label='End Time'>
              <Input
                type='time'
                disabled={scheduleSettings.allDay}
                value={scheduleSettings.startClass.endTime || ''}
                aria-invalid={defaultTimeInvalid}
                onChange={e => {
                  const endTime = e.target.value;
                  setScheduleSettings(prev => ({
                    ...prev,
                    startClass: {
                      ...prev.startClass,
                      endTime,
                      durationMinutes: String(
                        durationMinutesFromTimes(prev.startClass.startTime, endTime)
                      ),
                    },
                  }));
                }}
              />
            </FieldGroup>
          </div>
        ) : null}
        {preset === 'standard' ? (
          <div
            className={`text-xs ${defaultTimeInvalid ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {defaultTimeInvalid
              ? 'End time must be after the start time.'
              : hasDefaultTimes
                ? `Duration: ${formatDurationMinutes(defaultSessionMinutes)}`
                : 'Set start and end times to preview duration.'}
          </div>
        ) : null}

        {preset === 'standard' ? (
          <FieldGroup label='Start Date *'>
            <Input
              type='date'
              value={scheduleSettings.startClass.date}
              onChange={e =>
                setScheduleSettings(prev => ({
                  ...prev,
                  startClass: { ...prev.startClass, date: e.target.value },
                  endRepeat: prev.endRepeat || e.target.value,
                }))
              }
            />
          </FieldGroup>
        ) : (
          <FieldGroup label='Period Start *'>
            <Input
              type='date'
              value={scheduleSettings.academicPeriod.start}
              onChange={e =>
                setScheduleSettings(prev => ({
                  ...prev,
                  academicPeriod: { ...prev.academicPeriod, start: e.target.value },
                }))
              }
            />
          </FieldGroup>
        )}

        {preset === 'academic-period' ? (
          <FieldGroup label='Period End *'>
            <Input
              type='date'
              value={scheduleSettings.academicPeriod.end}
              onChange={e =>
                setScheduleSettings(prev => ({
                  ...prev,
                  academicPeriod: { ...prev.academicPeriod, end: e.target.value },
                }))
              }
            />
          </FieldGroup>
        ) : null}

        <FieldGroup label='Registration Start'>
          <Input
            type='date'
            value={scheduleSettings.registrationPeriod.start}
            onChange={e =>
              setScheduleSettings(prev => ({
                ...prev,
                registrationPeriod: { ...prev.registrationPeriod, start: e.target.value },
              }))
            }
          />
        </FieldGroup>

        <FieldGroup label='Registration End'>
          <Input
            type='date'
            value={scheduleSettings.registrationPeriod.end}
            disabled={scheduleSettings.registrationPeriod.continuous}
            onChange={e =>
              setScheduleSettings(prev => ({
                ...prev,
                registrationPeriod: { ...prev.registrationPeriod, end: e.target.value },
              }))
            }
          />
        </FieldGroup>

        <label className='flex cursor-pointer items-center gap-2 text-xs font-medium'>
          <input
            type='checkbox'
            checked={scheduleSettings.registrationPeriod.continuous || false}
            onChange={e =>
              setScheduleSettings(prev => ({
                ...prev,
                registrationPeriod: {
                  ...prev.registrationPeriod,
                  continuous: e.target.checked,
                  end: e.target.checked ? '' : prev.registrationPeriod.end,
                },
              }))
            }
            className='h-4 w-4 rounded'
          />
          Continuous Registration (no closing date)
        </label>

        <label className='flex cursor-pointer items-center gap-2 text-sm font-medium'>
          <input
            type='checkbox'
            checked={scheduleSettings.allDay}
            onChange={e => setScheduleSettings(prev => ({ ...prev, allDay: e.target.checked }))}
            className='h-4 w-4 rounded'
          />
          All Day
        </label>

        <FieldGroup label='Timezone'>
          <Select value={scheduleSettings.timezone} onValueChange={handleScheduleTimeZoneChange}>
            <SelectTrigger>
              <SelectValue placeholder='Select timezone' />
            </SelectTrigger>
            <SelectContent>
              {scheduleTimeZoneOptions(scheduleSettings.timezone).map(zone => (
                <SelectItem key={zone} value={zone}>
                  {scheduleTimeZoneLabel(zone)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {totalSessions > 0 && (
          <div className='bg-primary/10 text-primary border-primary/20 rounded-lg border px-4 py-2.5 text-sm font-medium'>
            Total sessions: <span className='font-bold'>{totalSessions}</span>
          </div>
        )}
      </div>
    );
  };

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
    <div className='overflow-x-hidden px-2 py-4 pb-8 sm:px-3 sm:py-6 lg:px-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <ClassCreationHeader
          isSubmitting={createClassDefinition.isPending || updateClassDefinition.isPending}
          onSaveDraft={() => submitClass(true)}
          onPublish={() => submitClass(false)}
          onClearDraft={clearDraft}
          hasDraft={
            isDataInitialized &&
            typeof window !== 'undefined' &&
            !!window.localStorage.getItem(LOCAL_CLASS_DRAFT_KEY)
          }
          draftSavedTick={draftSavedTick}
        />

        <div className='flex w-full min-w-0 flex-col gap-4 xl:flex-row xl:items-start'>
          <div className='min-w-0 flex-1 space-y-4'>
            {/* ── Class Details Card ─────────────────────────────────────── */}
            <div ref={classDetailsCardRef} className='scroll-mt-24'>
              <Card className='overflow-hidden rounded-md border pt-0 shadow-sm'>
                <div className='px-2 pt-4 sm:px-4'>
                  <Input
                    value={classDetails.title}
                    onChange={e =>
                      setClassDetails(prev => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder='Class Title'
                    className='text-md border-muted-foreground/30 focus-visible:border-primary rounded-none border-0 border-b px-0 py-2.5 focus-visible:ring-0'
                  />
                </div>

                <div className='flex flex-col gap-4 px-2 sm:px-3 lg:flex-row'>
                  <div className='min-w-0 flex-1 space-y-4'>
                    <FieldGroup label='Select Course *'>
                      <Select
                        value={selectedCatalogItem?.uuid || ''}
                        onValueChange={value => {
                          const item = catalogItems.find(c => c.uuid === value);
                          if (!item) return;
                          if (item.source === 'course') {
                            setClassDetails(prev => ({
                              ...prev,
                              course_uuid: item.uuid,
                              program_uuid: null,
                              class_limit: item.classLimit,
                            }));
                          } else {
                            setClassDetails(prev => ({
                              ...prev,
                              program_uuid: item.uuid,
                              course_uuid: '',
                              class_limit: item.classLimit,
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className='h-10 w-full rounded-md'>
                          <SelectValue placeholder='Select a course or program' />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogItems.filter(item =>
                            `${item.source} ${item.label}`
                              .toLowerCase()
                              .includes(catalogSearch.toLowerCase())
                          ).length === 0 ? (
                            <div className='text-muted-foreground p-4 text-center text-sm'>
                              No matching classes found
                            </div>
                          ) : (
                            catalogItems
                              .filter(item =>
                                `${item.source} ${item.label}`
                                  .toLowerCase()
                                  .includes(catalogSearch.toLowerCase())
                              )
                              .map(item => (
                                <SelectItem key={`${item.source}-${item.uuid}`} value={item.uuid}>
                                  {item.label}
                                  <span className='text-muted-foreground ml-2 text-xs'>
                                    {item.source === 'course' ? 'Course' : 'Program'}
                                  </span>
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                  </div>
                </div>

                <div className='border-border/60 border-t px-2 py-4 sm:px-3'>
                  <div className='mb-4 flex flex-col gap-1.5'>
                    <FieldGroup label='Billing basis *'>
                      <Select
                        value={rateBasis}
                        onValueChange={value => setRateBasis(value as RateBasis)}
                      >
                        <SelectTrigger className='w-full sm:w-64'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RATE_BASES.map(basis => (
                            <SelectItem key={basis.value} value={basis.value}>
                              {basis.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                    <p className='text-muted-foreground text-xs'>
                      The unit this class is contracted and paid in. It picks which approved rate
                      applies and how many units are billed — {billableUnits.toLocaleString()}{' '}
                      {rateBasisUnit(rateBasis)}
                      {billableUnits === 1 ? '' : 's'} on the current schedule.
                    </p>
                  </div>

                  <ServiceTypeSelector
                    value={serviceType}
                    onChange={handleServiceTypeChange}
                    rateBasis={rateBasis}
                    rateCard={
                      rateCard as Record<string, number | string | null | undefined> | undefined
                    }
                  />

                  <div className='mt-4 flex flex-col gap-4 md:flex-row'>
                    <div className='flex-1'>
                      <FieldGroup label='Location *'>
                        <LocationInput
                          value={classDetails.location_name}
                          onChange={value =>
                            setClassDetails(prev => ({ ...prev, location_name: value }))
                          }
                          placeholder='Search for the venue — e.g. Sarit Centre, Nairobi'
                          coordinates={{
                            latitude: locationLatitude,
                            longitude: locationLongitude,
                          }}
                          onSuggest={response => {
                            const { latitude, longitude } = coordinatesFromPlace(response);
                            if (latitude !== undefined) setLocationLatitude(String(latitude));
                            if (longitude !== undefined) setLocationLongitude(String(longitude));
                            return response;
                          }}
                        />
                      </FieldGroup>
                    </div>
                    <div className='flex-1'>
                      <FieldGroup label='Classroom *'>
                        <Input
                          value={classDetails.classroom}
                          onChange={e =>
                            setClassDetails(prev => ({ ...prev, classroom: e.target.value }))
                          }
                          placeholder='Room 101'
                        />
                      </FieldGroup>
                    </div>
                  </div>

                  {showMeetingLink && (
                    <div className='mt-4'>
                      <FieldGroup label='Class Meeting Link *'>
                        <Input
                          type='url'
                          value={classDetails.meeting_link}
                          onChange={e =>
                            setClassDetails(prev => ({ ...prev, meeting_link: e.target.value }))
                          }
                          onBlur={() =>
                            setClassDetails(prev => ({
                              ...prev,
                              meeting_link: normalizeMeetingLink(prev.meeting_link) ?? '',
                            }))
                          }
                          placeholder='https://meet.google.com/abc-defg-hij'
                        />
                      </FieldGroup>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* ── Schedule Options Card ──────────────────────────────────── */}
            <Card className='overflow-hidden rounded-md border pt-0 shadow-sm'>
              <div className='flex items-center justify-between gap-3 px-2 pt-4 sm:px-3'>
                <h3 className='text-foreground text-lg font-semibold'>Schedule Options</h3>
              </div>

              <div className='space-y-4 px-2 pb-4 sm:px-3 sm:pb-6'>
                <div className='flex flex-col gap-3 md:flex-row'>
                  {schedulePresetOptions.map(option => (
                    <button
                      key={option.key}
                      type='button'
                      onClick={() => setSchedulePreset(option.key)}
                      className={`flex-1 rounded-md border px-4 py-3 text-left transition ${
                        schedulePreset === option.key
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className='text-sm font-semibold'>{option.title}</div>
                      <div className='text-muted-foreground mt-1 text-xs'>{option.description}</div>
                    </button>
                  ))}
                </div>

                {/* ── STANDARD SCHEDULE ─────────────────────────────────── */}
                {schedulePreset === 'standard' && (
                  <div className='border-border/60 rounded-md border p-4'>
                    <div className='mb-4'>
                      <p className='text-foreground text-sm font-semibold'>Standard Schedule</p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Set how sessions repeat and when they start. Times apply to every session.
                      </p>
                    </div>
                    <div className='flex flex-wrap gap-6'>
                      <div className='min-w-[320px] flex-1'>
                        <RecurrenceEditor
                          value={recurrence}
                          onChange={applyRecurrence}
                          startDate={scheduleSettings.startClass.date}
                        />
                      </div>
                      <div className='w-full min-w-[260px] flex-1 xl:max-w-[280px] xl:flex-none'>
                        {buildRightColumnFields('standard')}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PICK DATES ────────────────────────────────────────── */}
                {schedulePreset === 'pick-dates' && (
                  <div className='flex flex-col gap-4 min-[1110px]:flex-row min-[1280px]:flex-col min-[1440px]:flex-row'>
                    <div className='border-border/60 min-w-0 flex-[1.2] space-y-4 rounded-md border p-4'>
                      <Calendar
                        mode='multiple'
                        selected={pickedDates.map(item => new Date(item.date))}
                        onSelect={dates => {
                          if (!dates) {
                            setPickedDates([]);
                            return;
                          }
                          const next = dates.map(date => {
                            const formatted = format(date, 'yyyy-MM-dd');
                            const existing = pickedDates.find(item => item.date === formatted);
                            return (
                              existing || {
                                date: formatted,
                                startTime: '09:00',
                                durationMinutes: String(DEFAULT_CLASS_DURATION_MINUTES),
                                endTime: timeAfterDuration(
                                  '09:00',
                                  String(DEFAULT_CLASS_DURATION_MINUTES)
                                ),
                              }
                            );
                          });
                          setPickedDates(next);
                        }}
                        className='w-full'
                        classNames={{
                          day: 'mx-auto flex h-7 w-7 items-center justify-center rounded-md text-[11px] transition',
                        }}
                      />

                      <div className='flex flex-col gap-4 sm:flex-row'>
                        <div className='flex-1'>
                          <FieldGroup label='Start Date *'>
                            <Input
                              type='date'
                              value={scheduleSettings.startClass.date}
                              onChange={e =>
                                setScheduleSettings(prev => ({
                                  ...prev,
                                  startClass: { ...prev.startClass, date: e.target.value },
                                  endRepeat: prev.endRepeat || e.target.value,
                                }))
                              }
                            />
                          </FieldGroup>
                        </div>

                        <div className='flex-1'>
                          <FieldGroup label='End Date *'>
                            <Input
                              type='date'
                              value={scheduleSettings.endRepeat}
                              onChange={e =>
                                setScheduleSettings(prev => ({
                                  ...prev,
                                  endRepeat: e.target.value,
                                }))
                              }
                            />
                          </FieldGroup>
                        </div>
                      </div>

                      <label className='flex cursor-pointer items-center gap-2 text-sm font-medium'>
                        <input
                          type='checkbox'
                          checked={scheduleSettings.allDay}
                          onChange={e =>
                            setScheduleSettings(prev => ({ ...prev, allDay: e.target.checked }))
                          }
                          className='h-4 w-4 rounded'
                        />
                        All Day
                      </label>

                      <FieldGroup label='Timezone'>
                        <Select
                          value={scheduleSettings.timezone}
                          onValueChange={handleScheduleTimeZoneChange}
                        >
                          <SelectTrigger className='h-11 w-full'>
                            <SelectValue placeholder='Select timezone' />
                          </SelectTrigger>
                          <SelectContent>
                            {scheduleTimeZoneOptions(scheduleSettings.timezone).map(zone => (
                              <SelectItem key={zone} value={zone}>
                                {scheduleTimeZoneLabel(zone)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldGroup>
                    </div>

                    <div className='border-border/60 flex-[1.5] space-y-2 rounded-md border p-3'>
                      {pickedDates.length > 0 && (
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <p className='text-foreground text-xs font-semibold'>
                              Selected Sessions
                            </p>
                            <div className='bg-primary/10 text-primary border-primary/20 rounded border px-2 py-0.5 text-[10px] font-semibold'>
                              {pickedDates.length}{' '}
                              {pickedDates.length === 1 ? 'Session' : 'Sessions'}
                            </div>
                          </div>
                          <div className='space-y-1.5'>
                            {pickedDates
                              .slice()
                              .sort((a, b) => a.date.localeCompare(b.date))
                              .map(item => {
                                const origIdx = pickedDates.findIndex(d => d.date === item.date);
                                const sessionMinutes = sessionMinutesFromTimes(
                                  item.startTime,
                                  item.endTime
                                );
                                return (
                                  <div
                                    key={item.date}
                                    className='border-border/50 flex flex-col gap-2 rounded-md border px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between'
                                  >
                                    <div className='min-w-0 flex-1'>
                                      <p className='text-foreground truncate text-[11px] font-medium'>
                                        {format(new Date(item.date), 'EEE, MMM d, yyyy')}
                                      </p>
                                    </div>
                                    {!scheduleSettings.allDay && (
                                      <div className='flex items-center gap-1.5'>
                                        <Input
                                          type='time'
                                          value={normalizeTime(item.startTime)}
                                          aria-invalid={sessionMinutes === undefined}
                                          onChange={e => {
                                            const next = [...pickedDates];
                                            if (next[origIdx]) {
                                              const startTime = normalizeTime(e.target.value);
                                              next[origIdx] = {
                                                ...next[origIdx]!,
                                                startTime,
                                                durationMinutes: String(
                                                  durationMinutesFromTimes(
                                                    startTime,
                                                    next[origIdx]!.endTime
                                                  )
                                                ),
                                              };
                                            }
                                            setPickedDates(next);
                                          }}
                                          className='h-7 w-[92px] px-2 text-[11px]'
                                        />
                                        <span className='text-muted-foreground text-[10px]'>→</span>
                                        <Input
                                          type='time'
                                          value={normalizeTime(item.endTime)}
                                          aria-invalid={sessionMinutes === undefined}
                                          onChange={e => {
                                            const endTime = normalizeTime(e.target.value);
                                            const next = [...pickedDates];
                                            if (next[origIdx]) {
                                              next[origIdx] = {
                                                ...next[origIdx]!,
                                                endTime,
                                                durationMinutes: String(
                                                  durationMinutesFromTimes(
                                                    next[origIdx]!.startTime,
                                                    endTime
                                                  )
                                                ),
                                              };
                                            }
                                            setPickedDates(next);
                                          }}
                                          className='h-7 w-[92px] px-2 text-[11px]'
                                        />
                                        <span
                                          className={`min-w-[58px] text-right text-[10px] ${sessionMinutes === undefined ? 'text-destructive' : 'text-muted-foreground'}`}
                                        >
                                          {formatDurationMinutes(sessionMinutes)}
                                        </span>
                                      </div>
                                    )}
                                    <button
                                      type='button'
                                      onClick={() =>
                                        setPickedDates(prev => prev.filter((_, i) => i !== origIdx))
                                      }
                                      className='text-muted-foreground hover:text-destructive text-[11px] font-medium transition'
                                    >
                                      Remove
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── ACADEMIC PERIOD ───────────────────────────────────── */}
                {schedulePreset === 'academic-period' && (
                  <div className='border-border/60 rounded-md border p-4'>
                    <div className='mb-4'>
                      <p className='text-foreground text-sm font-semibold'>Academic Period</p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Toggle days and set times. Configure the academic term and recurrence on the
                        right.
                      </p>
                    </div>
                    <div className='flex flex-wrap gap-6'>
                      <div className='min-w-[320px] flex-1'>{DayTimeGrid}</div>
                      <div className='w-full min-w-[260px] flex-1 xl:max-w-[280px] xl:flex-none'>
                        {buildRightColumnFields('academic-period')}
                      </div>
                    </div>
                  </div>
                )}

                {scheduleConflicts.length > 0 && (
                  <Alert
                    variant='destructive'
                    className='border-destructive/30 bg-destructive/8 text-foreground rounded-xl border shadow-sm'
                  >
                    <AlertTriangle className='text-destructive mt-0.5' />
                    <AlertTitle className='text-destructive text-base font-semibold'>
                      Schedule conflict detected
                    </AlertTitle>
                    <AlertDescription className='space-y-2'>
                      <p className='text-muted-foreground text-sm'>
                        One or more sessions overlap with this instructor&apos;s existing classes.
                        Adjust the times below before publishing.
                      </p>
                      <ul className='marker:text-destructive text-muted-foreground list-disc space-y-1.5 pl-5 text-sm'>
                        {scheduleConflicts.slice(0, 5).map(conflict => (
                          <li
                            key={`${conflict.proposed.date}-${conflict.proposed.startTime}-${conflict.existing.classTitle}-${conflict.existing.startTime}`}
                            className='leading-relaxed'
                          >
                            <span className='text-foreground font-medium'>
                              {new Date(`${conflict.proposed.date}T00:00:00`).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}{' '}
                              {conflict.proposed.startTime}–{conflict.proposed.endTime}
                            </span>{' '}
                            overlaps with{' '}
                            <span className='text-foreground font-medium'>
                              {conflict.existing.classTitle}
                            </span>{' '}
                            (
                            {formatScheduleClockTime(
                              conflict.existing.startTime,
                              conflict.proposed.timezone
                            )}{' '}
                            –{' '}
                            {formatScheduleClockTime(
                              conflict.existing.endTime,
                              conflict.proposed.timezone
                            )}
                            )
                          </li>
                        ))}
                        {scheduleConflicts.length > 5 && (
                          <li className='font-medium'>
                            …and {scheduleConflicts.length - 5} more conflict
                            {scheduleConflicts.length - 5 > 1 ? 's' : ''}.
                          </li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>

            {/* ── Class Media Upload Card ───────────────────────────────── */}
            <ClassMediaUpload
              onMediaSelect={(media: MediaFile) => {
                if (media.type === 'thumbnail') {
                  setSelectedThumbnail(media.file);
                } else if (media.type === 'video') {
                  setSelectedVideo(media.file);
                }
              }}
              selectedThumbnail={selectedThumbnail}
              selectedVideo={selectedVideo}
              onRemoveThumbnail={() => setSelectedThumbnail(null)}
              onRemoveVideo={() => setSelectedVideo(null)}
              existingThumbnailUrl={existingThumbnailUrl}
              existingVideoUrl={existingVideoUrl}
              classId={classId}
            />

            {/* ── Reminder Options Card ──────────────────────────────────── */}
            <Card className='overflow-hidden rounded-md border pt-0 shadow-sm'>
              <div className='flex items-center justify-between gap-3 px-2 pt-4 sm:px-4'>
                <h3 className='text-foreground text-lg font-semibold'>Reminder Options</h3>
              </div>

              <div className='space-y-5 px-2 pb-4 sm:px-4 sm:pb-6'>
                <div className='flex items-center gap-4'>
                  <label className='text-foreground w-[80px] text-xs font-semibold'>Reminder</label>

                  <Select
                    value={notificationSettings.reminder}
                    onValueChange={value =>
                      setNotificationSettings(prev => ({
                        ...prev,
                        reminder: value,
                      }))
                    }
                  >
                    <SelectTrigger className='h-9 w-[120px]'>
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>

                    <SelectContent>
                      {REMINDER_OPTIONS.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex flex-row items-start justify-between'>
                  <div className='flex flex-col items-start gap-4'>
                    <label className='text-foreground w-[80px] text-xs font-semibold'>
                      Send To
                    </label>

                    <div className='flex items-center gap-4'>
                      <label className='flex items-center gap-2 text-xs'>
                        <Checkbox />
                        Students
                      </label>

                      <label className='flex items-center gap-2 text-xs'>
                        <Checkbox />
                        Instructor
                      </label>
                    </div>
                  </div>

                  <div className='flex flex-col items-start gap-4'>
                    <label className='text-foreground w-[80px] text-xs font-semibold'>
                      Send Via
                    </label>

                    <div className='flex flex-wrap items-center gap-4'>
                      <label className='flex items-center gap-2 text-xs'>
                        <Checkbox />
                        Email
                      </label>

                      <label className='flex items-center gap-2 text-xs'>
                        <Checkbox />
                        SMS
                      </label>

                      <label className='flex items-center gap-2 text-xs'>
                        <Checkbox />
                        Push Notification
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className='flex w-full justify-end self-end'>
              <Button
                type='button'
                className='bg-primary h-10 rounded-md px-5 text-sm font-medium shadow-sm sm:w-auto'
                onClick={() => submitClass(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Class'}
              </Button>
            </div>
          </div>

          <div className='w-full min-w-0 xl:sticky xl:top-4 xl:w-[360px] xl:shrink-0 xl:self-start'>
            <ClassCreationPreviewRail data={previewData} />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClassCreationPage;

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='space-y-2'>
    <div className='text-foreground text-sm font-semibold'>{label}</div>
    {children}
  </div>
);
