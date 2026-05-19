'use client';

import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  Building2,
  CalendarDays,
  ChevronDown,
  Globe,
  LockKeyhole,
  MapPin,
  Users
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { Calendar } from '../../../../../components/ui/calendar';
import { useInstructor } from '../../../../../context/instructor-context';
import { useClassDetails } from '../../../../../hooks/use-class-details';
import { normalizeLocationType, requiresPhysicalLocation, trimToUndefined } from '../../../../../lib/location-types';
import {
  createClassDefinitionMutation,
  getAllClassDefinitionsQueryKey,
  getAllCoursesOptions,
  getAllTrainingProgramsOptions,
  getClassDefinitionQueryKey,
  getClassDefinitionsForInstructorQueryKey,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
  updateClassDefinitionMutation,
} from '../../../../../services/client/@tanstack/react-query.gen';
import type { CreateClassDefinitionData } from '../../../../../services/client/types.gen';
import {
  ConflictResolutionEnum,
  LocationTypeEnum,
  RecurrenceTypeEnum,
  SessionFormatEnum,
} from '../../../../../services/client/types.gen';
import { ClassDetails, NotificationSettings, ScheduleSettings } from '../../trainings/create-new/page';
import { ClassCreationHeader } from './_components/class-creation-header';
import {
  ClassCreationPreviewRail,
  type ClassCreationPreviewData
} from './_components/class-creation-preview-rail';
import {
  ClassCreationRateCard,
  type ClassCreationRateSummary,
} from './_components/class-creation-rate-card';
import { ClassCreationSummaryStrip } from './_components/class-creation-summary-strip';

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
  { label: '1 day before class', value: '1d' },
  { label: '1 hour before class', value: '1h' },
  { label: '30 minutes before class', value: '30m' },
];

const schedulePresetOptions = [
  { key: 'standard', title: 'Standard Schedule', description: 'Set recurring days and times' },
  { key: 'pick-dates', title: 'Pick Dates', description: 'Select specific dates' },
  { key: 'academic-period', title: 'Academic Period', description: 'Align with academic term' },
] as const;

const CLASS_COLOR_OPTIONS = [
  { label: 'Brand', value: 'var(--color-brand)' },
  { label: 'Azure', value: 'var(--color-azure)' },
  { label: 'Amber', value: 'var(--color-amber)' },
  { label: 'Iris', value: 'var(--color-iris)' },
  { label: 'Jade', value: 'var(--color-jade)' },
  { label: 'Success', value: 'var(--color-success)' },
  { label: 'Warning', value: 'var(--color-warning)' },
  { label: 'Destructive', value: 'var(--color-destructive)' },
  { label: 'Muted', value: 'var(--color-muted)' },
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

const parseCoordinate = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Calculates the total number of session occurrences between startDate and endDate
 * based on the recurrence rule.
 */
const calculateOccurrences = (
  startDate: string,
  endDate: string,
  repeatUnit: string,
  repeatInterval: number,
  selectedDays?: number[]
) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0;

  let occurrences = 0;

  switch (repeatUnit) {
    case 'day': {
      let current = new Date(start);
      while (current <= end) {
        occurrences++;
        current.setDate(current.getDate() + repeatInterval);
      }
      break;
    }
    case 'week': {
      let weekStart = new Date(start);
      const startDow = weekStart.getDay();
      const daysToMon = startDow === 0 ? -6 : 1 - startDow;
      weekStart.setDate(weekStart.getDate() + daysToMon);

      while (weekStart <= end) {
        const daysToCheck = selectedDays?.length
          ? selectedDays
          : [0, 1, 2, 3, 4, 5, 6];

        for (const dayIdx of daysToCheck) {
          const candidate = new Date(weekStart);
          candidate.setDate(weekStart.getDate() + dayIdx);
          if (candidate >= start && candidate <= end) {
            occurrences++;
          }
        }

        weekStart.setDate(weekStart.getDate() + 7 * repeatInterval);
      }
      break;
    }
    case 'month': {
      let current = new Date(start);
      while (current <= end) {
        occurrences++;
        current.setMonth(current.getMonth() + repeatInterval);
      }
      break;
    }
    case 'year': {
      let current = new Date(start);
      while (current <= end) {
        occurrences++;
        current.setFullYear(current.getFullYear() + repeatInterval);
      }
      break;
    }
    default:
      break;
  }

  return occurrences;
};

const buildUtcIsoDateTime = (date?: string, time?: string) => {
  if (!date) {
    throw new Error('Missing date');
  }

  if (!time) {
    throw new Error(`Missing time for date: ${date}`);
  }

  // Supports HH:mm
  const normalizedTime =
    time.length === 5 ? `${time}:00` : time;

  const isoString = `${date}T${normalizedTime}Z`;

  const parsed = new Date(isoString);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid datetime: ${isoString}`);
  }

  return parsed.toISOString();
};

const formatClassType = (value?: string | null) => {
  if (!value) return 'Group Class';
  return value.toUpperCase() === 'PRIVATE' ? 'Private Class' : 'Group Class';
};

const formatLectureType = (value?: string | null) => {
  const normalized = value?.toUpperCase() ?? '';
  if (normalized === 'ONLINE') return 'Online';
  if (normalized === 'IN_PERSON') return 'In-Person';
  if (normalized === 'HYBRID') return 'Hybrid';
  return 'In-Person';
};

const formatScheduleTime = (start?: string, end?: string, allDay?: boolean) => {
  if (allDay) return 'All Day';
  if (!start || !end) return '10:00 AM - 12:00 PM';
  return `${start} - ${end}`;
};

const getMutationErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message?: unknown };
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
};

const getRepeatSummary = (scheduleSettings: ScheduleSettings) => {
  const days = scheduleSettings.repeat.days || [];
  const interval = scheduleSettings.repeat.interval || 1;

  if (scheduleSettings.repeat.unit === 'week') {
    const intervalLabel =
      interval > 1 ? `Every ${interval} weeks` : 'Weekly';

    if (days.length > 0) {
      return `${intervalLabel}\n${days
        .map(d => DAY_SHORT[d] ?? 'Mon')
        .join(', ')}`;
    }

    return intervalLabel;
  }

  return `Every ${interval}\n${scheduleSettings.repeat.unit}(s)`;
};

const NewClassCreationPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const instructor = useInstructor();
  const classId = searchParams.get('id');

  const [draftSavedTick, setDraftSavedTick] = useState(0);
  const [savedClassUuid, setSavedClassUuid] = useState<string | null>(null);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('standard');
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
  // pick-dates preset
  const [pickedDates, setPickedDates] = useState<
    {
      date: string;
      startTime: string;
      endTime: string;
    }[]
  >([]);

  const classDetailsCardRef = useRef<HTMLDivElement | null>(null);

  const resolvedId = classId || savedClassUuid;
  const { data: combinedClass, isLoading } = useClassDetails(resolvedId || undefined);
  const classData = combinedClass?.class;

  const createClassDefinition = useMutation(createClassDefinitionMutation());
  const updateClassDefinition = useMutation(updateClassDefinitionMutation());

  const { data: courses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));
  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: { applicant_uuid_eq: instructor?.uuid as string },
      },
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
      query: {
        pageable: {},
        searchParams: { applicant_uuid_eq: instructor?.uuid as string },
      },
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
    const locationType =
      classDetails.location_type === 'ONLINE'
        ? 'online'
        : classDetails.location_type === 'IN_PERSON'
          ? 'inperson'
          : 'inperson';
    const rateKey = `${classType}_${locationType}_rate`;
    return Number(rateCard[rateKey] ?? 0);
  }, [classDetails.class_type, classDetails.location_type, rateCard]);

  const sessionDuration = calculateSessionHours(
    scheduleSettings.startClass.startTime,
    scheduleSettings.startClass.endTime,
    scheduleSettings.allDay
  );

  const totalSessions = useMemo(() => {
    if (schedulePreset === 'standard') {
      return calculateOccurrences(
        scheduleSettings.startClass.date,
        scheduleSettings.endRepeat,
        scheduleSettings.repeat.unit,
        scheduleSettings.repeat.interval,
        scheduleSettings.repeat.days
      );
    }
    if (schedulePreset === 'pick-dates') {
      return pickedDates.length;
    }
    // academic-period
    return calculateOccurrences(
      scheduleSettings.academicPeriod.start,
      scheduleSettings.academicPeriod.end,
      scheduleSettings.repeat.unit,
      scheduleSettings.repeat.interval,
      scheduleSettings.repeat.days
    );
  }, [schedulePreset, scheduleSettings, pickedDates]);

  const feePerSession = Math.max(ratePerHour * sessionDuration, 0);
  const totalAmount = feePerSession * Math.max(totalSessions, 1);

  const rateSummary: ClassCreationRateSummary | null = ratePerHour
    ? {
      currency: rateCard?.currency as string | undefined,
      label: selectedCatalogItem?.label,
      ratePerHour,
    }
    : null;

  // When default times change in pick-dates mode, apply them to dates that have no custom time yet
  useEffect(() => {
    if (schedulePreset !== 'pick-dates' || pickedDates.length === 0) return;

    setPickedDates(prev =>
      prev.map(item => ({
        ...item,
        startTime: item.startTime || scheduleSettings.startClass.startTime || '09:00',
        endTime: item.endTime || scheduleSettings.startClass.endTime || '10:00',
      }))
    );
  }, [
    schedulePreset,
    scheduleSettings.startClass.startTime,
    scheduleSettings.startClass.endTime,
  ]);

  // ── Draft restore ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (resolvedId || isDataInitialized || typeof window === 'undefined') return;
    const savedDraft = window.localStorage.getItem(LOCAL_CLASS_DRAFT_KEY);
    if (!savedDraft) { setIsDataInitialized(true); return; }
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
          ...prev, ...saved,
          location_type: normalizeLocationType(saved.location_type),
        }));
      }
      if (parsed.scheduleSettings) {
        setScheduleSettings(prev => ({
          ...prev, ...parsed.scheduleSettings,
          academicPeriod: { ...prev.academicPeriod, ...parsed.scheduleSettings?.academicPeriod },
          registrationPeriod: { ...prev.registrationPeriod, ...parsed.scheduleSettings?.registrationPeriod },
          startClass: { ...prev.startClass, ...parsed.scheduleSettings?.startClass },
          repeat: { ...prev.repeat, ...parsed.scheduleSettings?.repeat },
          timetable: {
            ...prev.timetable, ...parsed.scheduleSettings?.timetable,
            time: { ...prev.timetable.time, ...parsed.scheduleSettings?.timetable?.time },
          },
        }));
      }
      if (parsed.notificationSettings) setNotificationSettings(prev => ({ ...prev, ...parsed.notificationSettings }));
      if (parsed.schedulePreset) setSchedulePreset(parsed.schedulePreset);
      if (typeof parsed.allowWaitlist === 'boolean') setAllowWaitlist(parsed.allowWaitlist);
      if (typeof parsed.locationLatitude === 'string') setLocationLatitude(parsed.locationLatitude);
      if (typeof parsed.locationLongitude === 'string') setLocationLongitude(parsed.locationLongitude);
      if (Array.isArray(parsed.pickedDates)) setPickedDates(parsed.pickedDates);
    } catch {
      window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
    } finally {
      setIsDataInitialized(true);
    }
  }, [resolvedId, isDataInitialized]);

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

  // ── Edit-mode hydration ────────────────────────────────────────────────────
  useEffect(() => {
    if (resolvedId && classData && !isLoading && !isDataInitialized) {
      const classRecord = classData as NonNullable<typeof classData> & {
        categories?: string[] | string | null;
        rate_card?: string | null;
        targetAudience?: string | null;
        training_fee?: string | null;
        meeting_link?: string | null;
        allow_waitlist?: boolean | null;
        location_latitude?: number | null;
        location_longitude?: number | null;
      };

      setClassDetails({
        uuid: classRecord.uuid || '',
        course_uuid: classRecord.course_uuid ?? '',
        program_uuid: classRecord.program_uuid ?? null,
        title: classRecord.title || '',
        description: classRecord.description || '',
        categories: Array.isArray(classRecord.categories)
          ? classRecord.categories
          : classRecord.categories ? [classRecord.categories] : [],
        class_type: classRecord.class_visibility || 'PUBLIC',
        location_type: normalizeLocationType(classRecord.location_type),
        rate_card: classRecord.rate_card || classRecord.training_fee || '',
        class_limit: classRecord.max_participants || 0,
        targetAudience: classRecord.targetAudience || '',
        location_name: classRecord.location_name || '',
        startDate: '', endDate: '', allDay: false, repeatUnit: '1',
        instructorName: instructor?.full_name,
        meeting_link: classRecord.meeting_link || '',
        classroom: '', class_color: classRecord.class_color || '', reminder: '',
      });

      setNotificationSettings(prev => ({
        ...prev,
        reminder: reminderFromMinutes(classRecord.class_reminder_minutes) || prev.reminder,
        classColour: classRecord.class_color || prev.classColour,
      }));
      setAllowWaitlist(classRecord.allow_waitlist ?? true);
      setLocationLatitude(typeof classRecord.location_latitude === 'number' ? String(classRecord.location_latitude) : '');
      setLocationLongitude(typeof classRecord.location_longitude === 'number' ? String(classRecord.location_longitude) : '');

      if (classRecord.academic_period_start_date || classRecord.academic_period_end_date ||
        classRecord.registration_period_start_date || classRecord.registration_period_end_date) {
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
          endRepeat: startDate.toISOString().slice(0, 10),
        }));
      }

      setIsDataInitialized(true);
    } else if (!resolvedId && !isDataInitialized) {
      setIsDataInitialized(true);
    }
  }, [classData, isLoading, resolvedId, isDataInitialized, instructor?.full_name]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const isFormValid = () => {
    if (!classDetails.course_uuid && !classDetails.program_uuid) {
      toast.error('Please select a course or program'); return false;
    }
    if (!classDetails.title.trim()) {
      toast.error('Please enter a class title'); return false;
    }
    const locationType = normalizeLocationType(classDetails.location_type);
    if (!locationType) {
      toast.error('Please select a lecture type'); return false;
    }
    if (requiresPhysicalLocation(locationType) && !trimToUndefined(classDetails.location_name)) {
      toast.error('Please enter a location'); return false;
    }

    if (schedulePreset === 'standard') {
      if (!scheduleSettings.startClass.date || !scheduleSettings.startClass.startTime || !scheduleSettings.startClass.endTime) {
        toast.error('Please fill in the schedule fields'); return false;
      }
      if (!scheduleSettings.endRepeat) {
        toast.error('Please set an end repeat date'); return false;
      }
    }

    if (schedulePreset === 'pick-dates' && pickedDates.length === 0) {
      toast.error('Please select at least one date'); return false;
    }

    if (schedulePreset === 'academic-period') {
      if (!scheduleSettings.academicPeriod.start || !scheduleSettings.academicPeriod.end) {
        toast.error('Please set the academic period dates'); return false;
      }
      if (!scheduleSettings.startClass.startTime || !scheduleSettings.startClass.endTime) {
        toast.error('Please set the class start and end times'); return false;
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

    const startTime = scheduleSettings.allDay ? '00:00' : scheduleSettings.startClass.startTime || '00:00';
    const endTime = scheduleSettings.allDay ? '23:59' : scheduleSettings.startClass.endTime || '23:59';
    const academicPeriodStart = buildDateFromInput(scheduleSettings.academicPeriod.start);
    const academicPeriodEnd = buildDateFromInput(scheduleSettings.academicPeriod.end);
    const registrationPeriodStart = buildDateFromInput(scheduleSettings.registrationPeriod.start);
    const registrationPeriodEnd = buildDateFromInput(scheduleSettings.registrationPeriod.end);

    const daysOfWeekString = (scheduleSettings.repeat.days || [])
      .slice()
      .sort()
      .map(idx => DAY_NAMES[idx])
      .join(',') || undefined;

    const totalOccurrences = totalSessions || 1;

    let referenceDate = scheduleSettings.startClass.date;
    if (schedulePreset === 'academic-period') {
      referenceDate = scheduleSettings.academicPeriod.start;
    }

    const startTimeIso = buildUtcIsoDateTime(referenceDate, startTime);
    const endTimeIso = buildUtcIsoDateTime(referenceDate, endTime);

    let session_templates: CreateClassDefinitionData['body']['session_templates'];

    if (schedulePreset === 'pick-dates') {
      // One template per individually picked date, using that date's own start/end times
      session_templates = pickedDates
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => {
          const effectiveStartTime = scheduleSettings.allDay
            ? '00:00'
            : item.startTime ?? startTime ?? '00:00';

          const effectiveEndTime = scheduleSettings.allDay
            ? '23:59'
            : item.endTime ?? endTime ?? '23:59';

          return {
            start_time: new Date(
              buildUtcIsoDateTime(item.date, effectiveStartTime)
            ),

            end_time: new Date(
              buildUtcIsoDateTime(item.date, effectiveEndTime)
            ),

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
      // Standard or academic-period: single recurrence template
      const recurrenceType =
        scheduleSettings.repeat.unit === 'day'
          ? RecurrenceTypeEnum.DAILY
          : scheduleSettings.repeat.unit === 'week'
            ? RecurrenceTypeEnum.WEEKLY
            : scheduleSettings.repeat.unit === 'month'
              ? RecurrenceTypeEnum.MONTHLY
              : RecurrenceTypeEnum.YEARLY;

      if (scheduleSettings.repeat.unit === 'week') {
        session_templates = (scheduleSettings.repeat.days || []).map(dayIndex => {
          const override = scheduleSettings.weeklyDayTimes[dayIndex];
          const effectiveStartTime = override?.startTime || startTime;
          const effectiveEndTime = override?.endTime || endTime;

          const startDateObj = new Date(referenceDate);
          while (((startDateObj.getDay() + 6) % 7) !== dayIndex) {
            startDateObj.setDate(startDateObj.getDate() + 1);
          }
          const sessionDate = startDateObj.toISOString().split('T')[0];

          return {
            start_time: new Date(buildUtcIsoDateTime(sessionDate, effectiveStartTime)),
            end_time: new Date(buildUtcIsoDateTime(sessionDate, effectiveEndTime)),
            recurrence: {
              recurrence_type: RecurrenceTypeEnum.WEEKLY,
              interval_value: scheduleSettings.repeat.interval,
              days_of_week: DAY_NAMES[dayIndex],
              occurrence_count: totalOccurrences,
            },
            conflict_resolution: ConflictResolutionEnum.FAIL,
          };
        });
      } else {
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

    const payload: CreateClassDefinitionData['body'] = {
      course_uuid: selectedSource === 'course' ? classDetails.course_uuid || undefined : undefined,
      program_uuid: selectedSource === 'program' ? classDetails.program_uuid || undefined : undefined,
      title: classDetails.title,
      description: classDetails.description || undefined,
      default_instructor_uuid: instructor?.uuid as string,
      class_visibility: classDetails.class_type === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
      session_format: classDetails.class_type === 'PRIVATE' ? SessionFormatEnum.INDIVIDUAL : SessionFormatEnum.GROUP,
      location_type: LocationTypeEnum[locationType as keyof typeof LocationTypeEnum],
      location_name: trimToUndefined(classDetails.location_name),
      location_latitude: -1.292066,
      location_longitude: 36.821945,
      max_participants: classDetails.class_limit > 0 ? classDetails.class_limit : undefined,
      classroom: trimToUndefined(classDetails.classroom),
      class_color: trimToUndefined(notificationSettings.classColour || classDetails.class_color),
      academic_period_start_date: academicPeriodStart,
      academic_period_end_date: academicPeriodEnd,
      registration_period_start_date: registrationPeriodStart,
      registration_period_end_date: registrationPeriodEnd,
      class_reminder_minutes: reminderToMinutes(notificationSettings.reminder),
      training_fee: ratePerHour,
      allow_waitlist: true,
      is_active: !isDraft,
      default_start_time: new Date(startTimeIso),
      default_end_time: new Date(endTimeIso),
      meeting_link: meetingLinkAllowed ? trimToUndefined(classDetails.meeting_link) : undefined,
      session_templates,
    };

    const onSuccess = () => {
      qc.invalidateQueries({
        queryKey: getClassDefinitionsForInstructorQueryKey({
          path: { instructorUuid: instructor?.uuid as string },
        }),
      });
      qc.invalidateQueries({ queryKey: getAllClassDefinitionsQueryKey({ query: { pageable: {} } }) });
      if (resolvedId) {
        qc.invalidateQueries({ queryKey: getClassDefinitionQueryKey({ path: { uuid: resolvedId } }) });
      }
      if (typeof window !== 'undefined') window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
      toast.success(isDraft ? 'Class saved as draft' : resolvedId ? 'Class updated successfully' : 'Class created successfully');
      router.push('/dashboard/classes');
    };

    if (resolvedId) {
      updateClassDefinition.mutate(
        { path: { uuid: resolvedId }, body: payload },
        { onSuccess, onError: error => toast.error(getMutationErrorMessage(error, 'Failed to update class')) }
      );
    } else {
      createClassDefinition.mutate(
        { body: payload },
        {
          onSuccess: response => {
            const savedUuid = response?.data?.class_definition?.uuid;
            if (savedUuid) setSavedClassUuid(savedUuid);
            onSuccess();
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
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
    }
    setClassDetails(createInitialClassDetails(instructor?.full_name));
    setScheduleSettings(createInitialScheduleSettings());
    setNotificationSettings(createInitialNotificationSettings());
    setSchedulePreset('standard');
    setAllowWaitlist(true);
    setLocationLatitude('');
    setLocationLongitude('');
    setPickedDates([]);
    setSavedClassUuid(null);
    setIsDataInitialized(true);
    toast.success('Draft cleared');
  };

  // ── Derived UI values ──────────────────────────────────────────────────────
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = resolvedId ? `${origin}/class-invite?id=${resolvedId}` : '';
  const meetingLink = classDetails.meeting_link || 'https://skillswallet.co/meet/john/uix101';
  const normalizedLocationType = normalizeLocationType(classDetails.location_type);
  const showMeetingLink = normalizedLocationType === 'ONLINE' || normalizedLocationType === 'HYBRID';

  const previewData: ClassCreationPreviewData = {
    classTitle: classDetails.title || selectedCatalogItem?.label || 'Class title',
    classTypeLabel: formatClassType(classDetails.class_type),
    instructorName: classDetails.instructorName || instructor?.full_name || 'John Doe',
    lectureTypeLabel: formatLectureType(classDetails.location_type),
    locationName: classDetails.location_name || 'Nairobi, Kenya',
    scheduleLabel:
      schedulePreset === 'pick-dates'
        ? `${pickedDates.length} selected date${pickedDates.length === 1 ? '' : 's'}`
        : schedulePreset === 'standard' && scheduleSettings.startClass.date
          ? `Every ${new Date(`${scheduleSettings.startClass.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })}`
          : 'Schedule pending',
    timeLabel: formatScheduleTime(
      scheduleSettings.startClass.startTime,
      scheduleSettings.startClass.endTime,
      scheduleSettings.allDay
    ),
    durationLabel: `${sessionDuration || 0} ${sessionDuration === 1 ? 'Hour' : 'Hours'}`,
    pricePerSessionLabel: `${rateCard?.currency || 'KES'} ${feePerSession.toLocaleString()}`,
    totalSessionsLabel: `${totalSessions} Session${totalSessions === 1 ? '' : 's'}`,
    totalAmountLabel: `${rateCard?.currency || 'KES'} ${totalAmount.toLocaleString()}`,
    meetingLink,
    inviteLink,
    summaryItems: [
      {
        icon: CalendarDays,
        label: 'Repeat',
        value: getRepeatSummary(scheduleSettings),
      },
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
    if (/^\d{2}:\d{2}$/.test(time)) return time;
    const [h = '0', m = '0'] = time.split(':');
    return `${String(Number(h)).padStart(2, '0')}:${String(Number(m)).padStart(2, '0')}`;
  };

  // ── Day-time grid (Mon–Sun rows with Start/End time per day) ──────────────
  // Used by both Standard and Academic Period presets
  const DayTimeGrid = (
    <div className='space-y-2'>
      {DAY_NAMES.map((day, index) => {
        const active = scheduleSettings.repeat.days?.includes(index);
        const override = scheduleSettings.weeklyDayTimes[index];

        const effectiveStartTime = override?.startTime || scheduleSettings.startClass.startTime || '';
        const effectiveEndTime = override?.endTime || scheduleSettings.startClass.endTime || '';

        return (
          <div
            key={day}
            className={`flex flex-row items-center gap-2 rounded-md border px-3 py-2 transition ${active ? 'border-primary bg-primary/5' : 'border-border bg-background'
              }`}
          >
            {/* Day toggle button */}
            <button
              type='button'
              onClick={() =>
                setScheduleSettings(prev => {
                  const currentDays = prev.repeat.days || [];
                  const nextDays = active
                    ? currentDays.filter(d => d !== index)
                    : [...currentDays, index].sort();
                  return {
                    ...prev,
                    repeat: { ...prev.repeat, days: nextDays, unit: 'week' },
                  };
                })
              }
              className={`w-14 shrink-0 rounded-md border px-2 py-1.5 text-xs font-semibold transition ${active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted text-muted-foreground hover:border-primary/50'
                }`}
            >
              {DAY_SHORT[index]}
            </button>

            {/* Start Time */}
            <div className='flex flex-1 flex-col gap-0.5'>
              <span className='text-muted-foreground text-[10px] font-medium'>Start Time</span>
              <Input
                type='time'
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
                          prev.weeklyDayTimes[index]?.endTime ||
                          prev.startClass.endTime ||
                          '',
                      },
                    },
                  }))
                }
                className='h-8 text-xs'
              />
            </div>

            {/* End Time */}
            <div className='flex flex-1 flex-col gap-0.5'>
              <span className='text-muted-foreground text-[10px] font-medium'>End Time</span>
              <Input
                type='time'
                disabled={!active || scheduleSettings.allDay}
                value={normalizeTime(effectiveEndTime)}
                onChange={e =>
                  setScheduleSettings(prev => ({
                    ...prev,
                    weeklyDayTimes: {
                      ...prev.weeklyDayTimes,
                      [index]: {
                        startTime:
                          prev.weeklyDayTimes[index]?.startTime ||
                          prev.startClass.startTime ||
                          '',
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

  // ── Right-column fields (Repeat Every, Start Date, End Repeat, Registration) ──
  const buildRightColumnFields = (preset: 'standard' | 'academic-period') => (
    <div className='space-y-4'>
      {/* Repeat Every */}
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

      {/* Start Date — standard uses startClass.date; academic uses academicPeriod.start */}
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

      {/* End Repeat — standard: endRepeat; academic: academicPeriod.end */}
      {preset === 'standard' ? (
        <FieldGroup label='End Repeat *'>
          <Input
            type='date'
            value={scheduleSettings.endRepeat}
            onChange={e =>
              setScheduleSettings(prev => ({ ...prev, endRepeat: e.target.value }))
            }
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

      {/* Registration Start */}
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

      {/* Registration End */}
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

      {/* All Day + Timezone */}
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
          <SelectTrigger>
            <SelectValue placeholder='Select timezone' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='EAT East Africa Time'>EAT East Africa Time</SelectItem>
            <SelectItem value='UTC Coordinated Universal Time'>UTC Coordinated Universal Time</SelectItem>
            <SelectItem value='WAT West Africa Time'>WAT West Africa Time</SelectItem>
          </SelectContent>
        </Select>
      </FieldGroup>

      {/* Session count badge */}
      {totalSessions > 0 && (
        <div className='bg-primary/10 text-primary border-primary/20 rounded-lg border px-4 py-2.5 text-sm font-medium'>
          Total sessions: <span className='font-bold'>{totalSessions}</span>
        </div>
      )}
    </div>
  );

  // ── Shared default time fields (used by pick-dates preset) ────────────────
  const SharedTimeFields = (
    <div className='flex flex-col gap-4 sm:flex-row'>
      <div className='flex-1'>
        <FieldGroup label='Default Start Time *'>
          <Input
            type='time'
            value={normalizeTime(scheduleSettings.startClass.startTime)}
            disabled={scheduleSettings.allDay}
            onChange={e =>
              setScheduleSettings(prev => ({
                ...prev,
                startClass: {
                  ...prev.startClass,
                  startTime: normalizeTime(e.target.value),
                },
              }))
            }
          />
        </FieldGroup>
      </div>
      <div className='flex-1'>
        <FieldGroup label='Default End Time *'>
          <Input
            type='time'
            value={normalizeTime(scheduleSettings.startClass.endTime)}
            disabled={scheduleSettings.allDay}
            onChange={e =>
              setScheduleSettings(prev => ({
                ...prev,
                startClass: {
                  ...prev.startClass,
                  endTime: normalizeTime(e.target.value),
                },
              }))
            }
          />
        </FieldGroup>
      </div>
    </div>
  );

  return (
    <div className='h-auto px-2 py-4 sm:px-3 sm:py-6 lg:px-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <ClassCreationHeader
          isSubmitting={createClassDefinition.isPending || updateClassDefinition.isPending}
          onSaveDraft={() => submitClass(true)}
          onPublish={() => submitClass(false)}
          onClearDraft={clearDraft}
          hasDraft={isDataInitialized && typeof window !== 'undefined' && !!window.localStorage.getItem(LOCAL_CLASS_DRAFT_KEY)}
          draftSavedTick={draftSavedTick}
        />

        <div className="flex flex-col items-start gap-4 xl:flex-row xl:sticky xl:top-4 h-fit self-start">
          <div className='min-w-0 flex-1 space-y-4'>
            {/* ── Class Details Card ─────────────────────────────────────── */}
            <div ref={classDetailsCardRef} className='scroll-mt-24'>
              <Card className='overflow-hidden border pt-0 shadow-sm rounded-md'>
                <div className='flex items-center justify-between gap-3 px-2 pt-4 sm:px-4'>
                  <h3 className='text-foreground text-lg font-semibold'>Class Details</h3>
                </div>

                <div className='flex flex-col gap-4 px-2 pb-4 sm:px-3 sm:pb-6 lg:flex-row'>
                  <div className='min-w-0 flex-1 space-y-4'>
                    <FieldGroup label='Select Course *'>
                      <Select
                        value={selectedCatalogItem?.uuid || ''}
                        onValueChange={value => {
                          const item = catalogItems.find(c => c.uuid === value);
                          if (!item) return;
                          if (item.source === 'course') {
                            setClassDetails(prev => ({ ...prev, course_uuid: item.uuid, program_uuid: null, class_limit: item.classLimit }));
                          } else {
                            setClassDetails(prev => ({ ...prev, program_uuid: item.uuid, course_uuid: '', class_limit: item.classLimit }));
                          }
                        }}
                      >
                        <SelectTrigger className='h-10 w-full rounded-md'>
                          <SelectValue placeholder='Select a course or program' />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogItems
                            .filter(item => `${item.source} ${item.label}`.toLowerCase().includes(catalogSearch.toLowerCase()))
                            .length === 0 ? (
                            <div className='text-muted-foreground p-4 text-center text-sm'>No matching classes found</div>
                          ) : (
                            catalogItems
                              .filter(item => `${item.source} ${item.label}`.toLowerCase().includes(catalogSearch.toLowerCase()))
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

                    <FieldGroup label='Class Title *'>
                      <Input
                        value={classDetails.title}
                        onChange={e => setClassDetails(prev => ({ ...prev, title: e.target.value }))}
                        placeholder='UI/UX Design Fundamentals'
                      />
                    </FieldGroup>
                  </div>

                  <div className='w-full lg:w-[300px] lg:shrink-0'>
                    <ClassCreationRateCard
                      durationHours={sessionDuration}
                      totalAmount={totalAmount}
                      totalSessions={totalSessions}
                      summary={rateSummary}
                      onEditRate={() =>
                        classDetailsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    />
                  </div>
                </div>

                <div className='border-t border-border/60 px-2 py-4 sm:px-3'>
                  <div className='flex flex-col gap-4 md:flex-row'>
                    <div className='flex-1'>
                      <ChoiceGroup
                        label='Class Type *'
                        options={CLASS_TYPE_OPTIONS}
                        value={classDetails.class_type}
                        onChange={value => setClassDetails(prev => ({ ...prev, class_type: value }))}
                      />
                    </div>
                    <div className='flex-1'>
                      <ChoiceGroup
                        label='Lecture Type *'
                        options={LECTURE_TYPE_OPTIONS}
                        value={classDetails.location_type}
                        onChange={value =>
                          setClassDetails(prev => ({
                            ...prev,
                            location_type: normalizeLocationType(value),
                            ...(normalizeLocationType(value) === 'ONLINE' ? { location_name: '' } : {}),
                            ...(normalizeLocationType(value) === 'IN_PERSON' ? { meeting_link: '' } : {}),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className='mt-4 flex flex-col gap-4 md:flex-row'>
                    <div className='flex-1'>
                      <FieldGroup label='Location *'>
                        <Input
                          value={classDetails.location_name}
                          onChange={e => setClassDetails(prev => ({ ...prev, location_name: e.target.value }))}
                          placeholder='Nairobi, Kenya'
                        />
                      </FieldGroup>
                    </div>
                    <div className='flex-1'>
                      <FieldGroup label='Classroom *'>
                        <Input
                          value={classDetails.classroom}
                          onChange={e => setClassDetails(prev => ({ ...prev, classroom: e.target.value }))}
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
                          onChange={e => setClassDetails(prev => ({ ...prev, meeting_link: e.target.value }))}
                          placeholder='https://meet.google.com/abc-defg-hij'
                        />
                      </FieldGroup>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* ── Schedule Options Card ──────────────────────────────────── */}
            <Card className='overflow-hidden border pt-0 shadow-sm rounded-md'>
              <div className='flex items-center justify-between gap-3 px-2 pt-4 sm:px-3'>
                <h3 className='text-foreground text-lg font-semibold'>Schedule Options</h3>
              </div>

              <div className='space-y-4 px-2 pb-4 sm:px-3 sm:pb-6'>
                {/* Preset selector */}
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

                {/* ── STANDARD SCHEDULE ──────────────────────────────────── */}
                {schedulePreset === 'standard' && (
                  <div className='rounded-md border border-border/60 p-4'>
                    <div className='mb-4'>
                      <p className='text-foreground text-sm font-semibold'>
                        Standard Schedule
                      </p>

                      <p className='text-muted-foreground mt-1 text-xs'>
                        Toggle days and set times. Use the right panel to configure recurrence and dates.
                      </p>
                    </div>

                    <div className='flex flex-wrap gap-6'>
                      {/* Left: Day-time grid */}
                      <div className='min-w-[320px] flex-1'>
                        {DayTimeGrid}
                      </div>

                      {/* Right: Recurrence + date fields */}
                      <div className='w-full min-w-[260px] flex-1 xl:max-w-[280px] xl:flex-none'>
                        {buildRightColumnFields('standard')}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PICK DATES ─────────────────────────────────────────── */}
                {schedulePreset === 'pick-dates' && (
                  <div className='flex flex-col gap-4 min-[1110px]:flex-row min-[1280px]:flex-col min-[1440px]:flex-row'>
                    <div className='min-w-0 flex-[1.2] space-y-4 rounded-md border border-border/60 p-4'>
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
                                startTime: scheduleSettings.startClass.startTime || '09:00',
                                endTime: scheduleSettings.startClass.endTime || '10:00',
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
                                setScheduleSettings(prev => ({ ...prev, endRepeat: e.target.value }))
                              }
                            />
                          </FieldGroup>
                        </div>
                      </div>

                      {/* Default times — applied to newly picked dates */}
                      <div>
                        <p className='text-foreground mb-2 text-xs font-semibold'>
                          Default Times <span className='text-muted-foreground font-normal'>(applied to new selections)</span>
                        </p>
                        {SharedTimeFields}
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
                            <SelectItem value='EAT East Africa Time'>EAT East Africa Time</SelectItem>
                            <SelectItem value='UTC Coordinated Universal Time'>UTC Coordinated Universal Time</SelectItem>
                            <SelectItem value='WAT West Africa Time'>WAT West Africa Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldGroup>
                    </div>

                    <div className='flex-[1.5] space-y-2 rounded-md border border-border/60 p-3'>
                      {pickedDates.length > 0 && (
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <p className='text-xs font-semibold text-foreground'>Selected Sessions</p>
                            <div className='bg-primary/10 text-primary border-primary/20 rounded border px-2 py-0.5 text-[10px] font-semibold'>
                              {pickedDates.length} {pickedDates.length === 1 ? 'Session' : 'Sessions'}
                            </div>
                          </div>

                          <div className='space-y-1.5'>
                            {pickedDates
                              .slice()
                              .sort((a, b) => a.date.localeCompare(b.date))
                              .map((item, idx) => {
                                // Use sorted index to find original index for mutation
                                const origIdx = pickedDates.findIndex(d => d.date === item.date);
                                return (
                                  <div
                                    key={item.date}
                                    className='flex flex-col gap-2 rounded-md border border-border/50 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between'
                                  >
                                    <div className='min-w-0 flex-1'>
                                      <p className='truncate text-[11px] font-medium text-foreground'>
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
                                            if (next[origIdx]) {
                                              next[origIdx] = {
                                                ...next[origIdx],
                                                startTime: normalizeTime(e.target.value),
                                              };
                                            }
                                            setPickedDates(next);
                                          }}
                                          className='h-7 w-[92px] px-2 text-[11px]'
                                        />
                                        <span className='text-[10px] text-muted-foreground'>→</span>
                                        <Input
                                          type='time'
                                          value={normalizeTime(item.endTime)}
                                          onChange={e => {
                                            const next = [...pickedDates];
                                            if (next[origIdx]) {
                                              next[origIdx] = {
                                                ...next[origIdx],
                                                endTime: normalizeTime(e.target.value),
                                              };
                                            }
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
                                      className='text-[11px] font-medium text-muted-foreground transition hover:text-destructive'
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

                {/* ── ACADEMIC PERIOD ────────────────────────────────────── */}
                {schedulePreset === 'academic-period' && (
                  <div className='rounded-md border border-border/60 p-4'>
                    <div className='mb-4'>
                      <p className='text-foreground text-sm font-semibold'>
                        Academic Period
                      </p>

                      <p className='text-muted-foreground mt-1 text-xs'>
                        Toggle days and set times. Use the right panel to configure the academic term and recurrence.
                      </p>
                    </div>

                    <div className='flex flex-wrap gap-6'>
                      {/* Left: Day-time grid */}
                      <div className='min-w-[320px] flex-1'>
                        {DayTimeGrid}
                      </div>

                      {/* Right: Recurrence + academic period date fields */}
                      <div className='w-full min-w-[260px] flex-1 xl:max-w-[280px] xl:flex-none'>
                        {buildRightColumnFields('academic-period')}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Optional Class Settings (color, capacity etc.) ─────── */}
                <Collapsible
                  open={showOptionalSettings}
                  onOpenChange={setShowOptionalSettings}
                  className='rounded-md border border-border/60'
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type='button'
                      className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left'
                    >
                      <div>
                        <p className='text-foreground text-sm font-semibold'>Optional Class Settings</p>
                        <p className='text-muted-foreground text-xs'>
                          Expand to adjust class color.
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showOptionalSettings ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className='border-t border-border/60 px-4 py-4'>
                    <div className='space-y-4'>
                      <div className='rounded-md border border-border/60 p-4'>
                        <div className='flex flex-row flex-wrap gap-2 sm:items-center sm:justify-between'>
                          <div>
                            <p className='text-foreground text-sm font-semibold'>Class Color</p>
                            <p className='text-muted-foreground text-xs'>Choose a color to represent your class.</p>
                          </div>
                          <div className='flex flex-wrap gap-3'>
                            {CLASS_COLOR_OPTIONS.map(color => (
                              <button
                                key={color.value}
                                type='button'
                                onClick={() => {
                                  setNotificationSettings(prev => ({ ...prev, classColour: color.value }));
                                  setClassDetails(prev => ({ ...prev, class_color: color.value }));
                                }}
                                className={`h-8 w-8 rounded-full border-2 ${notificationSettings.classColour === color.value ? 'border-primary' : 'border-transparent'}`}
                                style={{ backgroundColor: color.value }}
                                aria-label={`Select class color ${color.label}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </Card>

            {/* ── Reminder Options Card ──────────────────────────────────── */}
            <Card className='overflow-hidden border pt-0 shadow-sm rounded-md'>
              <div className='flex items-center justify-between gap-3 px-2 pt-4 sm:px-4'>
                <h3 className='text-foreground text-lg font-semibold'>Reminder Options</h3>
              </div>
              <div className='flex flex-col gap-4 px-2 pb-4 sm:px-4 sm:pb-6 lg:flex-row'>
                <div className='flex-1'>
                  <ReminderCard
                    title='Student Reminders'
                    enabled={notificationSettings.reminder !== ''}
                    onEnabledChange={() =>
                      setNotificationSettings(prev => ({ ...prev, reminder: prev.reminder ? '' : '24h' }))
                    }
                  >
                    <FieldGroup label='Email Reminder'>
                      <Select
                        value={notificationSettings.reminder}
                        onValueChange={value => setNotificationSettings(prev => ({ ...prev, reminder: value }))}
                      >
                        <SelectTrigger className='h-11'><SelectValue placeholder='Select reminder' /></SelectTrigger>
                        <SelectContent>
                          {REMINDER_OPTIONS.map(item => (
                            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                    <FieldGroup label='SMS Reminder'>
                      <Select defaultValue='1h'>
                        <SelectTrigger className='h-11'><SelectValue placeholder='Select reminder' /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value='1h'>1 hour before class</SelectItem>
                          <SelectItem value='30m'>30 minutes before class</SelectItem>
                          <SelectItem value='15m'>15 minutes before class</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                  </ReminderCard>
                </div>

                <div className='flex-1'>
                  <ReminderCard title='Instructor Reminders' enabled onEnabledChange={() => undefined}>
                    <FieldGroup label='Email Reminder'>
                      <Select defaultValue='1d'>
                        <SelectTrigger className='h-11'><SelectValue placeholder='Select reminder' /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value='1d'>1 day before class</SelectItem>
                          <SelectItem value='12h'>12 hours before class</SelectItem>
                          <SelectItem value='1h'>1 hour before class</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                    <FieldGroup label='SMS Reminder'>
                      <Select defaultValue='30m'>
                        <SelectTrigger className='h-11'><SelectValue placeholder='Select reminder' /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value='30m'>30 minutes before class</SelectItem>
                          <SelectItem value='15m'>15 minutes before class</SelectItem>
                          <SelectItem value='5m'>5 minutes before class</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                  </ReminderCard>
                </div>

                <div className='w-full lg:w-[220px] lg:shrink-0'>
                  <div className='bg-muted/20 flex h-full items-center justify-center rounded-md border border-border/60 px-4 py-4 text-center'>
                    <div className='space-y-2'>
                      <div className='bg-primary/10 text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-full'>
                        <BellRing className='h-5 w-5' />
                      </div>
                      <p className='text-muted-foreground text-xs leading-relaxed'>
                        Reminders help reduce no-shows and keep your class on track.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <ClassCreationSummaryStrip
              currency={rateCard?.currency as string | undefined || 'KES'}
              maxParticipants={classDetails.class_limit}
              totalAmount={totalAmount}
              totalSessions={totalSessions}
            />
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


// ── Shared sub-components ────────────────────────────────────────────────────

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='space-y-2'>
    <div className='text-foreground text-sm font-semibold'>{label}</div>
    {children}
  </div>
);

const ChoiceGroup = ({
  label, options, value, onChange,
}: {
  label: string;
  options: { label: string; value: string; icon: typeof Users }[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className='space-y-2'>
    <div className='text-foreground text-xs font-semibold'>{label}</div>
    <div className='flex flex-wrap gap-2 sm:flex-nowrap'>
      {options.map(option => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type='button'
            onClick={() => onChange(option.value)}
            className={`flex flex-1 items-center gap-2 rounded-md border px-2.5 py-2 text-left transition ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Icon className='h-3.5 w-3.5' />
            </div>
            <span className='text-xs font-medium leading-none'>{option.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const ReminderCard = ({
  title,
  enabled,
  onEnabledChange,
  children,
}: {
  children: React.ReactNode;
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
  title: string;
}) => (
  <div className='rounded-md border border-border/60 p-4'>
    <div className='flex items-center justify-between gap-3'>
      <div>
        <p className='text-foreground text-sm font-semibold'>{title}</p>
        <p className='text-muted-foreground text-xs'>Set reminders for your students.</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onEnabledChange} />
    </div>
    <div className='mt-4 space-y-4'>{children}</div>
  </div>
);