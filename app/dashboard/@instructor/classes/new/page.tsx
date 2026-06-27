'use client';

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
  useInstructorClassesWithSchedules,
  type InstructorClassWithSchedule,
} from '@/hooks/use-instructor-classes-with-schedules';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ClassMediaUpload, type MediaFile } from './_components/class-media-upload';
import { ServiceTypeSelector, type ServiceType } from './_components/service-type-selector';

import { format } from 'date-fns';
import { Button } from '../../../../../components/ui/button';
import { Calendar } from '../../../../../components/ui/calendar';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { useInstructor } from '../../../../../context/instructor-context';
import { useClassDetails } from '../../../../../hooks/use-class-details';
import {
  normalizeLocationType,
  requiresPhysicalLocation,
  trimToUndefined,
} from '../../../../../lib/location-types';
import {
  createClassDefinitionMultipartMutation,
  getAllClassDefinitionsQueryKey,
  getAllCoursesOptions,
  getAllTrainingProgramsOptions,
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
import { CLASS_COLOR_OPTIONS } from '../../../_components/class-colors';
import {
  ClassDetails,
  NotificationSettings,
  ScheduleSettings,
} from '../../trainings/create-new/page';
import { ClassCreationHeader } from './_components/class-creation-header';
import {
  ClassCreationPreviewRail,
  type ClassCreationPreviewData,
} from './_components/class-creation-preview-rail';

const LOCAL_CLASS_DRAFT_KEY = 'training-class-create-draft:new-class-creation';
const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  label: string;
  rateCard?: CatalogRateCard;
  source: CatalogSource;
  uuid: string;
  thumbnailUrl: string;
};

type ScheduledSession = { date: string; startTime: string; endTime: string };

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

const normalizeDateTimeValue = (value: string | Date | undefined | null) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

const createInitialScheduleSettings = (): ScheduleSettings => ({
  academicPeriod: { start: '', end: '' },
  registrationPeriod: { start: '', end: '', continuous: false },
  startClass: { date: '', startTime: '', endTime: '' },
  weeklyDayTimes: {},
  allDay: false,
  repeat: { interval: 1, unit: 'week', days: [] },
  endRepeat: '',
  alertAttendee: false,
  timetable: { days: [], time: { duration: '' } },
  recurringOptions: '',
  timezone: 'EAT East Africa Time',
  classType: '',
  location: '',
  pin: '',
  classroom: '',
  totalSlots: 0,
});

const createInitialNotificationSettings = (): NotificationSettings => ({
  reminder: '24h',
  classColour: 'var(--chart-1)',
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

const calculateSessionHours = (start?: string, end?: string, allDay?: boolean) => {
  if (allDay) return 24;
  if (!start || !end) return 0;

  const [startHour = 0, startMinute = 0] = start.split(':').map(Number);
  const [endHour = 0, endMinute = 0] = end.split(':').map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0;
  }

  const startValue = startHour + startMinute / 60;
  const endValue = endHour + endMinute / 60;

  return Number(Math.max(endValue - startValue, 0).toFixed(2));
};

const buildDateFromInput = (date: string) => {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const buildUtcIsoDateTime = (date?: string, time?: string) => {
  if (!date) throw new Error('Missing date');
  if (!time) throw new Error(`Missing time for date: ${date}`);
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const isoString = `${date}T${normalizedTime}Z`;
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid datetime: ${isoString}`);
  return parsed.toISOString();
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

const getMutationErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message?: unknown };
    if (typeof message === 'string' && message.trim().length > 0) return message;
  }
  return fallback;
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
    const proposedStart = new Date(buildUtcIsoDateTime(session.date, session.startTime)).getTime();
    const proposedEnd = new Date(buildUtcIsoDateTime(session.date, session.endTime)).getTime();
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
  pickedDates: { date: string; startTime: string; endTime: string }[]
): ScheduledSession[] => {
  if (schedulePreset === 'pick-dates') {
    return pickedDates.map(item => ({
      date: item.date,
      startTime: scheduleSettings.allDay ? '00:00' : item.startTime,
      endTime: scheduleSettings.allDay ? '23:59' : item.endTime,
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
        : override?.endTime || scheduleSettings.startClass.endTime || '23:59';

      const cursor = new Date(referenceDate);
      const cursorDow = (cursor.getDay() + 6) % 7;
      const daysUntil = (dayIndex - cursorDow + 7) % 7;
      cursor.setDate(cursor.getDate() + daysUntil);

      while (cursor <= end) {
        sessions.push({
          date: cursor.toISOString().split('T')[0]!,
          startTime,
          endTime,
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
      : scheduleSettings.startClass.endTime || '23:59';

    const cursor = new Date(referenceDate);
    while (cursor <= end) {
      sessions.push({
        date: cursor.toISOString().split('T')[0]!,
        startTime,
        endTime,
      });
      if (unit === 'day') cursor.setDate(cursor.getDate() + interval);
      else if (unit === 'month') cursor.setMonth(cursor.getMonth() + interval);
      else if (unit === 'year') cursor.setFullYear(cursor.getFullYear() + interval);
      else break;
    }
  }

  return sessions;
};

const NewClassCreationPage = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const instructor = useInstructor();

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
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [classDetails, setClassDetails] = useState<ClassDetails>(() =>
    createInitialClassDetails(instructor?.full_name)
  );
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>(() =>
    createInitialScheduleSettings()
  );
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    createInitialNotificationSettings()
  );
  const [showOptionalSettings, setShowOptionalSettings] = useState(true);
  const [allowWaitlist, setAllowWaitlist] = useState(true);
  const [locationLatitude, setLocationLatitude] = useState('');
  const [locationLongitude, setLocationLongitude] = useState('');
  const [pickedDates, setPickedDates] = useState<
    { date: string; startTime: string; endTime: string }[]
  >([]);

  const [perDayOccurrences, setPerDayOccurrences] = useState<Record<number, PerDayOccurrence>>({});

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

  const handleServiceTypeChange = (
    newServiceType: ServiceType,
    classType: 'PRIVATE' | 'GROUP',
    locationType: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
  ) => {
    setServiceType(newServiceType);
    setClassDetails(prev => ({
      ...prev,
      class_type: classType === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
      location_type: locationType,
    }));
  };

  const { data: courses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));
  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: !!instructor?.uuid,
  });
  const approvedCourses = useMemo(() => {
    if (!courses?.data?.content || !appliedCourses?.data?.content) return [];
    const approvedApplicationMap = new Map(
      appliedCourses.data.content
        .filter(app => app.status === 'approved')
        .map(app => [app.course_uuid, app])
    );
    return courses.data.content
      .filter(course => approvedApplicationMap.has(course.uuid) && course.admin_approved)
      .map(course => ({ ...course, application: approvedApplicationMap.get(course.uuid) }));
  }, [courses, appliedCourses]);

  const { data: programs } = useQuery(getAllTrainingProgramsOptions({ query: { pageable: {} } }));
  const { data: appliedPrograms } = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: !!instructor?.uuid,
  });
  const approvedPrograms = useMemo(() => {
    if (!programs?.data?.content || !appliedPrograms?.data?.content) return [];
    const approvedApplicationMap = new Map(
      appliedPrograms.data.content
        .filter(app => app.status === 'approved')
        .map(app => [app.program_uuid, app])
    );
    return programs.data.content
      .filter(program => approvedApplicationMap.has(program.uuid) && program.admin_approved)
      .map(program => ({ ...program, application: approvedApplicationMap.get(program.uuid) }));
  }, [programs, appliedPrograms]);

  const catalogItems = useMemo<CatalogItem[]>(() => {
    const courseItems: CatalogItem[] = approvedCourses.map(course => ({
      label: course.name,
      source: 'course',
      uuid: String(course.uuid),
      classLimit: course.class_limit ?? 0,
      thumbnailUrl: course?.thumbnail_url || 'NF',
      rateCard: course.application?.rate_card as CatalogRateCard | undefined,
    }));
    const programItems: CatalogItem[] = approvedPrograms.map(program => ({
      label: program.title,
      source: 'program',
      uuid: String(program.uuid),
      classLimit: program.class_limit ?? 0,
      rateCard: program.application?.rate_card as CatalogRateCard | undefined,
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
  const ratePerHour = useMemo(() => {
    if (!rateCard || !classDetails.class_type || !classDetails.location_type) return 0;
    const classType = classDetails.class_type === 'PRIVATE' ? 'private' : 'group';
    const locationType = classDetails.location_type === 'ONLINE' ? 'online' : 'inperson';
    const rateKey = `${classType}_${locationType}_rate`;
    return Number(rateCard[rateKey] ?? 0);
  }, [classDetails.class_type, classDetails.location_type, rateCard]);

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
        sum + calculateSessionHours(session.startTime, session.endTime, scheduleSettings.allDay),
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

  const totalHoursInMinutes = BigInt(Math.round(totalHours * 60));

  const totalAmount =
    Math.max(ratePerHour * totalHours, 0) ||
    Math.max(Number(classData?.training_fee) * totalHours) | 0;

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
        pickedDates?: { date: string; startTime: string; endTime: string }[];
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
        setScheduleSettings(prev => ({
          ...prev,
          ...parsed.scheduleSettings,
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
      if (Array.isArray(parsed.pickedDates)) setPickedDates(parsed.pickedDates);
    } catch {
      window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
    } finally {
      setIsDataInitialized(true);
    }
  }, [resolvedId, isDataInitialized, isClientReady]);

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
      training_fee?: string | null;
      meeting_link?: string | null;
      allow_waitlist?: boolean | null;
      location_latitude?: number | null;
      location_longitude?: number | null;
      thumbnail_url?: string | null;
      promotional_video_url?: string | null;
      session_templates?: Array<{
        start_time: string | Date;
        end_time: string | Date;
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
      rate_card: classRecord.rate_card || classRecord.training_fee || '',
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

    if (classRecord.thumbnail_url) setExistingThumbnailUrl(classRecord.thumbnail_url);
    if (classRecord.promotional_video_url) setExistingVideoUrl(classRecord.promotional_video_url);

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

      const firstStart = new Date(firstTemplate.start_time);
      const firstEnd = new Date(firstTemplate.end_time);
      const firstDate = firstStart.toISOString().slice(0, 10);
      const startTime = firstStart.toTimeString().slice(0, 5);
      const endTime = firstEnd.toTimeString().slice(0, 5);

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
          const tStart = new Date(t.start_time);
          const tEnd = new Date(t.end_time);
          return {
            date: tStart.toISOString().slice(0, 10),
            startTime: isAllDay ? '00:00' : tStart.toTimeString().slice(0, 5),
            endTime: isAllDay ? '23:59' : tEnd.toTimeString().slice(0, 5),
          };
        });
        setPickedDates(picked);
      } else if (recurrenceType === 'WEEKLY') {
        setSchedulePreset('standard');

        const weeklyDayTimes: Record<number, { startTime: string; endTime: string }> = {};
        const allDaysSet = new Set<number>();
        const nextPerDayOccurrences: Record<number, PerDayOccurrence> = {};

        const weeklyTemplates = templates.filter(
          t => t.recurrence?.recurrence_type?.toUpperCase() === 'WEEKLY'
        );

        const firstTemplateEnd = new Date(firstTemplate.end_time);

        const recurrenceEndDate = firstTemplate.recurrence?.end_date
          ? new Date(firstTemplate.recurrence.end_date)
          : null;

        const maxEndDate = templates.reduce((max, t) => {
          const d = new Date(t.end_time);
          return d > max ? d : max;
        }, firstTemplateEnd);

        const endRepeatDate = (recurrenceEndDate ?? maxEndDate).toISOString().slice(0, 10);
        // ────────────────────────────────────────────────────────────────

        weeklyTemplates.forEach(template => {
          const templateDaysStr = template.recurrence?.days_of_week;
          if (!templateDaysStr) return;

          const tStart = new Date(template.start_time);
          const tEnd = new Date(template.end_time);
          const tStartTime = isAllDay ? '00:00' : tStart.toTimeString().slice(0, 5);
          const tEndTime = isAllDay ? '23:59' : tEnd.toTimeString().slice(0, 5);
          const tOccurrenceCount = template.recurrence?.occurrence_count ?? 1;
          const tDurationHours = calculateSessionHours(tStartTime, tEndTime, isAllDay);

          templateDaysStr.split(',').forEach(rawDay => {
            const dayIndex = DAY_NAMES.indexOf(rawDay.trim());
            if (dayIndex < 0) return;

            allDaysSet.add(dayIndex);
            weeklyDayTimes[dayIndex] = { startTime: tStartTime, endTime: tEndTime };
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
          startClass: { date: firstDate, startTime, endTime },
          repeat: { interval: intervalValue, unit: 'week', days: daysArray },
          weeklyDayTimes,
          endRepeat: endRepeatDate,
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
          startClass: { date: firstDate, startTime, endTime },
          repeat: {
            interval: intervalValue,
            unit: repeatUnit as 'day' | 'week' | 'month' | 'year',
            days: [],
          },
          endRepeat: firstDate,
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
        },
        endRepeat: prev.endRepeat ?? startDate.toISOString().slice(0, 10),
      }));
    }

    setIsEditHydrated(true);
    setIsDataInitialized(true);
  }, [classData, isLoading, resolvedId, isEditHydrated, instructor?.full_name, isClientReady]);

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
    if (requiresPhysicalLocation(locationType) && !trimToUndefined(classDetails.location_name)) {
      toast.error('Please enter a location');
      return false;
    }
    if (schedulePreset === 'pick-dates' && pickedDates.length === 0) {
      toast.error('Please select at least one date');
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
      if (scheduleSettings.allDay) return { startTime: '00:00', endTime: '23:59' };
      const sortedDays = [...(scheduleSettings.repeat.days || [])].sort((a, b) => a - b);
      if (sortedDays.length > 0) {
        const firstIdx = sortedDays[0]!;
        const override = scheduleSettings.weeklyDayTimes[firstIdx];
        return {
          startTime: override?.startTime || scheduleSettings.startClass.startTime || '00:00',
          endTime: override?.endTime || scheduleSettings.startClass.endTime || '23:59',
        };
      }
      return {
        startTime: scheduleSettings.startClass.startTime || '00:00',
        endTime: scheduleSettings.startClass.endTime || '23:59',
      };
    };

    const { startTime: defaultStart, endTime: defaultEnd } = getDefaultTimes();

    let session_templates: CreateClassDefinitionMultipartData['body']['session_templates'];

    if (schedulePreset === 'pick-dates') {
      session_templates = pickedDates
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => {
          const effectiveStartTime = scheduleSettings.allDay
            ? '00:00'
            : (item.startTime ?? '00:00');
          const effectiveEndTime = scheduleSettings.allDay ? '23:59' : (item.endTime ?? '23:59');
          return {
            start_time: new Date(buildUtcIsoDateTime(item.date, effectiveStartTime)),
            end_time: new Date(buildUtcIsoDateTime(item.date, effectiveEndTime)),
            recurrence: {
              recurrence_type: RecurrenceTypeEnum.DAILY,
              interval_value: 1,
              days_of_week: undefined,
              occurrence_count: 1,
            },
            conflict_resolution: ConflictResolutionEnum.FAIL,
          };
        });
    } else {
      const recurrenceType =
        scheduleSettings.repeat.unit === 'day'
          ? RecurrenceTypeEnum.DAILY
          : scheduleSettings.repeat.unit === 'week'
            ? RecurrenceTypeEnum.WEEKLY
            : scheduleSettings.repeat.unit === 'month'
              ? RecurrenceTypeEnum.MONTHLY
              : RecurrenceTypeEnum.YEARLY;

      if (scheduleSettings.repeat.unit === 'week') {
        const seriesEndDate = scheduleSettings.endRepeat || referenceDate;

        session_templates = (scheduleSettings.repeat.days || []).map(dayIndex => {
          const override = scheduleSettings.weeklyDayTimes[dayIndex];
          const effectiveStartTime = scheduleSettings.allDay
            ? '00:00'
            : override?.startTime || scheduleSettings.startClass.startTime || '00:00';
          const effectiveEndTime = scheduleSettings.allDay
            ? '23:59'
            : override?.endTime || scheduleSettings.startClass.endTime || '23:59';

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
            start_time: new Date(buildUtcIsoDateTime(firstSessionDate, effectiveStartTime)),
            end_time: new Date(buildUtcIsoDateTime(lastSessionDate, effectiveEndTime)),
            recurrence: {
              recurrence_type: RecurrenceTypeEnum.WEEKLY,
              interval_value: scheduleSettings.repeat.interval,
              days_of_week: DAY_NAMES[dayIndex],
              occurrence_count: occurrenceCountForDay,
              end_date: new Date(buildUtcIsoDateTime(lastSessionDate, effectiveEndTime)),
            },
            conflict_resolution: ConflictResolutionEnum.FAIL,
          };
        });
      } else {
        const startTimeIso = buildUtcIsoDateTime(referenceDate, defaultStart);
        const endTimeIso = buildUtcIsoDateTime(referenceDate, defaultEnd);
        const daysOfWeekString =
          (scheduleSettings.repeat.days || [])
            .slice()
            .sort()
            .map(idx => DAY_NAMES[idx])
            .join(',') || undefined;
        session_templates = [
          {
            start_time: new Date(startTimeIso),
            end_time: new Date(endTimeIso),
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
          : pickedDates[0]!.endTime || '23:59'
        : defaultEnd;

    const payload: CreateClassDefinitionMultipartData['body'] = {
      course_uuid: selectedSource === 'course' ? classDetails.course_uuid || undefined : undefined,
      program_uuid:
        selectedSource === 'program' ? classDetails.program_uuid || undefined : undefined,
      title: classDetails.title,
      description: classDetails.description || undefined,
      default_instructor_uuid: instructor?.uuid as string,
      class_visibility: classDetails.class_type === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
      session_format:
        classDetails.class_type === 'PRIVATE'
          ? SessionFormatEnum.INDIVIDUAL
          : SessionFormatEnum.GROUP,
      location_type: LocationTypeEnum[locationType as keyof typeof LocationTypeEnum],
      location_name: trimToUndefined(classDetails.location_name),
      location_latitude: -1.292066,
      location_longitude: 36.821945,
      max_participants: classDetails.class_limit > 0 ? classDetails.class_limit : undefined,
      classroom: trimToUndefined(classDetails.classroom),
      class_color: trimToUndefined(CLASS_COLOR_OPTIONS?.[0]?.value || classDetails.class_color),
      academic_period_start_date: academicPeriodStart,
      academic_period_end_date: academicPeriodEnd,
      registration_period_start_date: registrationPeriodStart,
      registration_period_end_date: registrationPeriodEnd,
      scheduled_session_count: totalSessions,
      class_reminder_minutes: reminderToMinutes(notificationSettings.reminder),
      duration_minutes: totalHoursInMinutes,
      training_fee: ratePerHour,
      allow_waitlist: true,
      is_active: !isDraft,
      default_start_time: new Date(buildUtcIsoDateTime(payloadRefDate, payloadStartTime)),
      default_end_time: new Date(buildUtcIsoDateTime(payloadRefDate, payloadEndTime)),
      meeting_link: meetingLinkAllowed ? trimToUndefined(classDetails.meeting_link) : undefined,
      session_templates,
    };

    const onSuccess = (createdUuid?: string) => {
      const finalUuid = createdUuid || resolvedId;

      if (finalUuid && !isDraft && (selectedThumbnail || selectedVideo)) {
        if (selectedThumbnail) {
          addClassThumbnailMut.mutate(
            { path: { uuid: finalUuid }, body: { thumbnail: selectedThumbnail } },
            {
              onSuccess: () => toast.success('Thumbnail uploaded'),
              onError: error =>
                toast.error(getMutationErrorMessage(error, 'Failed to upload thumbnail')),
            }
          );
        }

        if (selectedVideo) {
          addClassIntroVideoMut.mutate(
            { path: { uuid: finalUuid }, body: { promotional_video: selectedVideo } },
            {
              onSuccess: () => toast.success('Video uploaded'),
              onError: error =>
                toast.error(getMutationErrorMessage(error, 'Failed to upload video')),
            }
          );
        }
      }

      qc.invalidateQueries({
        queryKey: getClassDefinitionsForInstructorQueryKey({
          path: { instructorUuid: instructor?.uuid as string },
        }),
      });
      qc.invalidateQueries({
        queryKey: getAllClassDefinitionsQueryKey({ query: { pageable: {} } }),
      });
      if (resolvedId)
        qc.invalidateQueries({
          queryKey: getClassDefinitionQueryKey({ path: { uuid: resolvedId } }),
        });
      if (typeof window !== 'undefined') window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
      toast.success(
        isDraft
          ? 'Class saved as draft'
          : resolvedId
            ? 'Class updated successfully'
            : 'Class created successfully'
      );
      router.push('/dashboard/training-hub');
    };

    if (resolvedId) {
      updateClassDefinition.mutate(
        { path: { uuid: resolvedId }, body: payload },
        {
          onSuccess: () => onSuccess(resolvedId),
          onError: error => toast.error(getMutationErrorMessage(error, 'Failed to update class')),
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
          onError: error => toast.error(getMutationErrorMessage(error, 'Failed to create class')),
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
    setScheduleSettings(createInitialScheduleSettings());
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
    pricePerHourLabel: `${rateCard?.currency || 'KES'} ${ratePerHour.toLocaleString()}`,
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
        value: scheduleSettings.timezone || 'EAT East Africa Time',
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
        const effectiveEndTime = override?.endTime || scheduleSettings.startClass.endTime || '';

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
            className={`flex flex-row items-center gap-2 rounded-md border px-3 py-2 transition ${active ? 'border-primary bg-primary/5' : 'border-border bg-background'
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
              className={`w-14 shrink-0 rounded-md border px-2 py-1.5 text-xs font-semibold transition ${active
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
                onChange={e =>
                  setScheduleSettings(prev => ({
                    ...prev,
                    weeklyDayTimes: {
                      ...prev.weeklyDayTimes,
                      [index]: {
                        startTime: normalizeTime(e.target.value),
                        endTime:
                          prev.weeklyDayTimes[index]?.endTime || prev.startClass.endTime || '',
                      },
                    },
                  }))
                }
                className='h-8 text-xs'
              />
            </div>

            <div className='flex flex-1 flex-col gap-0.5'>
              <span className='text-muted-foreground text-[10px] font-medium'>End Time</span>
              <Input
                type='time'
                disabled={!active || scheduleSettings.allDay}
                value={normalizeTime(effectiveEndTime)}
                onClick={e => e.stopPropagation()}
                onChange={e =>
                  setScheduleSettings(prev => ({
                    ...prev,
                    weeklyDayTimes: {
                      ...prev.weeklyDayTimes,
                      [index]: {
                        startTime:
                          prev.weeklyDayTimes[index]?.startTime || prev.startClass.startTime || '',
                        endTime: normalizeTime(e.target.value),
                      },
                    },
                  }))
                }
                className='h-8 text-xs'
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Right-column fields ────────────────────────────────────────────────────
  const buildRightColumnFields = (preset: 'standard' | 'academic-period') => (
    <div className='space-y-4'>
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
              <SelectItem value='year'>Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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

      {preset === 'standard' ? (
        <FieldGroup label='End Repeat *'>
          <Input
            type='date'
            value={scheduleSettings.endRepeat}
            onChange={e => setScheduleSettings(prev => ({ ...prev, endRepeat: e.target.value }))}
          />
        </FieldGroup>
      ) : (
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
      )}

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
        <Select
          value={scheduleSettings.timezone}
          onValueChange={value => setScheduleSettings(prev => ({ ...prev, timezone: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select timezone' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='EAT East Africa Time'>EAT East Africa Time</SelectItem>
            <SelectItem value='UTC Coordinated Universal Time'>
              UTC Coordinated Universal Time
            </SelectItem>
            <SelectItem value='WAT West Africa Time'>WAT West Africa Time</SelectItem>
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
    <div className='h-auto px-2 py-4 sm:px-3 sm:py-6 lg:px-6'>
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

        <div className='flex h-fit flex-col items-start gap-4 self-start xl:sticky xl:top-4 xl:flex-row'>
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
                  <ServiceTypeSelector
                    value={serviceType}
                    onChange={handleServiceTypeChange}
                    rateCard={
                      rateCard as Record<string, number | string | null | undefined> | undefined
                    }
                  />

                  <div className='mt-4 flex flex-col gap-4 md:flex-row'>
                    <div className='flex-1'>
                      <FieldGroup label='Location *'>
                        <Input
                          value={classDetails.location_name}
                          onChange={e =>
                            setClassDetails(prev => ({ ...prev, location_name: e.target.value }))
                          }
                          placeholder='Nairobi, Kenya'
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
                      className={`flex-1 rounded-md border px-4 py-3 text-left transition ${schedulePreset === option.key
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
                        Toggle days and set times. Configure recurrence and dates on the right.
                      </p>
                    </div>
                    <div className='flex flex-wrap gap-6'>
                      <div className='min-w-[320px] flex-1'>{DayTimeGrid}</div>
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
                              existing || { date: formatted, startTime: '09:00', endTime: '10:00' }
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
                          onValueChange={value =>
                            setScheduleSettings(prev => ({ ...prev, timezone: value }))
                          }
                        >
                          <SelectTrigger className='h-11 w-full'>
                            <SelectValue placeholder='Select timezone' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='EAT East Africa Time'>
                              EAT East Africa Time
                            </SelectItem>
                            <SelectItem value='UTC Coordinated Universal Time'>
                              UTC Coordinated Universal Time
                            </SelectItem>
                            <SelectItem value='WAT West Africa Time'>
                              WAT West Africa Time
                            </SelectItem>
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
                                          onChange={e => {
                                            const next = [...pickedDates];
                                            if (next[origIdx])
                                              next[origIdx] = {
                                                ...next[origIdx]!,
                                                startTime: normalizeTime(e.target.value),
                                              };
                                            setPickedDates(next);
                                          }}
                                          className='h-7 w-[92px] px-2 text-[11px]'
                                        />
                                        <span className='text-muted-foreground text-[10px]'>→</span>
                                        <Input
                                          type='time'
                                          value={normalizeTime(item.endTime)}
                                          onChange={e => {
                                            const next = [...pickedDates];
                                            if (next[origIdx])
                                              next[origIdx] = {
                                                ...next[origIdx]!,
                                                endTime: normalizeTime(e.target.value),
                                              };
                                            setPickedDates(next);
                                          }}
                                          className='h-7 w-[92px] px-2 text-[11px]'
                                        />
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
                            {new Date(conflict.existing.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}{' '}
                            –{' '}
                            {new Date(conflict.existing.endTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
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

            <div className='w-full flex self-end justify-end'>
              <Button
                type='button'
                className='h-10 rounded-md bg-primary px-5 text-sm font-medium shadow-sm sm:w-auto'
                onClick={() => submitClass(false)}
                disabled={createClassDefinition.isPending || updateClassDefinition.isPending}
              >
                Publish Class
              </Button>
            </div>
          </div>

          <div className='w-full xl:w-[360px] xl:shrink-0'>
            <ClassCreationPreviewRail data={previewData} />
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewClassCreationPage;

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='space-y-2'>
    <div className='text-foreground text-sm font-semibold'>{label}</div>
    {children}
  </div>
);
