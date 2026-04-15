'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  type InstructorClassWithSchedule,
  useInstructorClassesWithSchedules,
} from '@/hooks/use-instructor-classes-with-schedules';
import type { CreateClassDefinitionData } from '@/services/client/types.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useInstructor } from '../../../../../context/instructor-context';
import { useClassDetails } from '../../../../../hooks/use-class-details';
import {
  createClassDefinitionMutation,
  getAllClassDefinitionsQueryKey,
  getClassDefinitionQueryKey,
  getClassDefinitionsForInstructorQueryKey,
  updateClassDefinitionMutation,
} from '../../../../../services/client/@tanstack/react-query.gen';
import { ClassDetailsSection } from './ClassDetailsSection';
import { ClassInformationSection } from './ClassInfoSection';
import { NotificationSection } from './NotificationSection';
import { PreviewSection } from './PreviewSection';
import { ScheduleSection } from './ScheduleSection';
import {
  buildUtcIsoDateTime,
  generateScheduleInstances,
  ScheduledSessionInstance,
  ScheduleMode,
} from './schedule-utils';

const LOCAL_CLASS_DRAFT_KEY = 'training-class-create-draft:new';

// Types
export interface ClassDetails {
  uuid: string;
  course_uuid: null | string;
  program_uuid: null | string;
  title: string;
  description: string;
  categories: string[];
  class_type: string; // 'group' | 'private'
  location_type: string; // 'online' | 'in_person' | 'hybrid'
  rate_card: string;
  class_limit: number;
  targetAudience: string;
  location_name: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  repeatUnit: string;
  instructorName?: string;
  meeting_link: string;
  classroom: string;
  class_color: string;
  reminder: string;
}

export interface ScheduleSettings {
  academicPeriod: {
    start: string;
    end: string;
  };
  registrationPeriod: {
    start: string;
    end: string;
    continuous?: boolean;
  };
  startClass: {
    date: string;
    startTime?: string;
    endTime?: string;
  };
  allDay: boolean;
  repeat: {
    interval: number;
    unit: 'day' | 'week' | 'month' | 'year';
    days?: number[];
  };
  endRepeat: string;
  alertAttendee: boolean;
  timetable: {
    days: string[];
    time: {
      duration: string;
    };
  };
  recurringOptions: string;
  timezone: string;
  classType: string;
  location: string;
  pin: string;
  classroom: string;
  totalSlots: number;
}

export interface NotificationSettings {
  reminder: string;
  classColour: string;
}

const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const RECURRENCE_TYPE_MAP: Record<string, string> = {
  day: 'DAILY',
  week: 'WEEKLY',
  month: 'MONTHLY',
  year: 'YEARLY',
};
type SubmitEventLike = {
  preventDefault(): void;
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

type ScheduleConflict = {
  proposed: ScheduledSessionInstance;
  existing: {
    classUuid: string;
    classTitle: string;
    startTime: string;
    endTime: string;
  };
};

const normalizeDateTimeValue = (value: string | Date | undefined | null) => {
  if (!value) {
    return null;
  }

  const parsedValue = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return null;
  }

  return parsedValue;
};

const findScheduleConflicts = (
  sessions: ScheduledSessionInstance[],
  instructorClasses: InstructorClassWithSchedule[],
  resolveId: string | null,
  instructorUuid?: string
): ScheduleConflict[] => {
  if (!instructorUuid || sessions.length === 0) {
    return [];
  }

  const existingSchedules = instructorClasses
    .filter(classItem => classItem.uuid && classItem.uuid !== resolveId)
    .flatMap(classItem =>
      (classItem.schedule ?? []).map(schedule => ({
        classUuid: classItem.uuid,
        classTitle: classItem.title || 'Existing class',
        startTime: schedule.start_time,
        endTime: schedule.end_time,
      }))
    )
    .map(schedule => {
      const startTime = normalizeDateTimeValue(schedule.startTime);
      const endTime = normalizeDateTimeValue(schedule.endTime);

      if (!startTime || !endTime) {
        return null;
      }

      return {
        ...schedule,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
    })
    .filter(Boolean);

  return sessions.flatMap(session => {
    const proposedStart = new Date(buildUtcIsoDateTime(session.date, session.startTime)).getTime();
    const proposedEnd = new Date(buildUtcIsoDateTime(session.date, session.endTime)).getTime();

    if (Number.isNaN(proposedStart) || Number.isNaN(proposedEnd) || proposedStart >= proposedEnd) {
      return [];
    }

    return existingSchedules
      .filter(existingSchedule => {
        const existingStart = new Date(existingSchedule.startTime).getTime();
        const existingEnd = new Date(existingSchedule.endTime).getTime();

        return proposedStart < existingEnd && existingStart < proposedEnd;
      })
      .map(existingSchedule => ({
        proposed: session,
        existing: existingSchedule,
      }));
  });
};

// Utility function to calculate occurrences
const calculateOccurrences = (
  startDate: string,
  endDate: string,
  repeatUnit: string,
  repeatInterval: number,
  selectedDays?: number[]
): number => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) return 0;

  let occurrences = 0;
  let current = new Date(start);

  switch (repeatUnit) {
    case 'day':
      while (current <= end) {
        occurrences++;
        current.setDate(current.getDate() + repeatInterval);
      }
      break;

    case 'week':
      if (!selectedDays || selectedDays.length === 0) {
        occurrences = 0;
        break;
      }

      // Start from the beginning of the first week
      const startOfWeek = new Date(start);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday

      let weekCursor = new Date(startOfWeek);

      while (weekCursor <= end) {
        for (const day of selectedDays) {
          const occurrence = new Date(weekCursor);
          occurrence.setDate(weekCursor.getDate() + day);

          if (occurrence >= start && occurrence <= end) {
            occurrences++;
          }
        }
        weekCursor.setDate(weekCursor.getDate() + repeatInterval * 7);
      }
      break;

    case 'month':
      while (current <= end) {
        occurrences++;
        current.setMonth(current.getMonth() + repeatInterval);
      }
      break;

    case 'year':
      while (current <= end) {
        occurrences++;
        current.setFullYear(current.getFullYear() + repeatInterval);
      }
      break;

    default:
      occurrences = 0;
  }

  return Math.max(0, occurrences);
};

type ClassBuilderPageProps = {
  embedded?: boolean;
  initialSlot?: {
    startTime: Date;
    endTime: Date;
  } | null;
  onCancel?: () => void;
  onSuccess?: () => void;
};

const ClassBuilderPage = ({
  embedded = false,
  initialSlot = null,
  onCancel,
  onSuccess,
}: ClassBuilderPageProps = {}) => {
  const searchParams = useSearchParams();
  const classId = searchParams.get('id');
  const qc = useQueryClient();
  const router = useRouter();
  const instructor = useInstructor();

  const [savedClassUuid, setSavedClassUuid] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('class');
  const [customSessions, setCustomSessions] = useState<ScheduledSessionInstance[]>([]);

  const resolveId = classId || savedClassUuid;
  const { data: combinedClass, isLoading } = useClassDetails(resolveId as string);

  const classData = combinedClass?.class;
  const courseDetail = combinedClass?.course;
  const courseLessons = combinedClass?.lessons;

  const createClassDefinition = useMutation(createClassDefinitionMutation());
  const updateClassDefinition = useMutation(updateClassDefinitionMutation());
  const { classes: instructorClasses = [] } = useInstructorClassesWithSchedules(instructor?.uuid);

  // Class Details State
  const [classDetails, setClassDetails] = useState<ClassDetails>({
    uuid: '',
    course_uuid: '',
    program_uuid: null,
    title: '',
    description: '',
    categories: [],
    class_type: '',
    rate_card: '',
    location_type: '',
    location_name: '',
    class_limit: 0,
    targetAudience: '',
    allDay: false,
    endDate: '',
    repeatUnit: '1',
    startDate: '',
    instructorName: instructor?.full_name,
    class_color: '',
    classroom: '',
    meeting_link: '',
    reminder: '',
  });

  // Schedule Settings State
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    academicPeriod: { start: '', end: '' },
    registrationPeriod: { start: '', end: '', continuous: false },
    startClass: { date: '', startTime: '', endTime: '' },
    allDay: false,
    repeat: {
      interval: 1,
      unit: 'week',
      days: [],
    },
    endRepeat: '',
    alertAttendee: false,
    timetable: {
      days: [],
      time: { duration: '' },
    },
    recurringOptions: '',
    timezone: '',
    classType: '',
    location: '',
    pin: '',
    classroom: '',
    totalSlots: 0,
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    reminder: '',
    classColour: '',
  });

  useEffect(() => {
    if (resolveId || !initialSlot) return;

    const nextDate = initialSlot.startTime.toISOString().slice(0, 10);
    const nextStart = initialSlot.startTime.toTimeString().slice(0, 5);
    const nextEnd = initialSlot.endTime.toTimeString().slice(0, 5);
    const slotWeekday = initialSlot.startTime.getDay();
    const normalizedWeekday = slotWeekday === 0 ? 6 : slotWeekday - 1;

    setScheduleSettings(prev => ({
      ...prev,
      startClass: {
        ...prev.startClass,
        date: nextDate,
        startTime: nextStart,
        endTime: nextEnd,
      },
      endRepeat: prev.endRepeat || nextDate,
      repeat: {
        ...prev.repeat,
        unit: 'week',
        days:
          prev.repeat.days && prev.repeat.days.length > 0 ? prev.repeat.days : [normalizedWeekday],
      },
      timetable: {
        ...prev.timetable,
        days:
          prev.timetable.days && prev.timetable.days.length > 0
            ? prev.timetable.days
            : [DAY_NAMES[normalizedWeekday]],
        time: {
          ...prev.timetable.time,
          duration:
            prev.timetable.time.duration ||
            `${Math.max(
              30,
              Math.round((initialSlot.endTime.getTime() - initialSlot.startTime.getTime()) / 60000)
            )}`,
        },
      },
    }));
  }, [initialSlot, resolveId]);


  useEffect(() => {
    if (resolveId || isDataInitialized || typeof window === 'undefined') return;

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
        scheduleMode?: ScheduleMode;
        customSessions?: ScheduledSessionInstance[];
        savedAt?: string;
      };

      if (parsed.classDetails) {
        setClassDetails(prev => ({ ...prev, ...parsed.classDetails }));
      }

      if (parsed.scheduleSettings) {
        setScheduleSettings(prev => ({
          ...prev,
          ...parsed.scheduleSettings,
          academicPeriod: {
            ...prev.academicPeriod,
            ...parsed.scheduleSettings?.academicPeriod,
          },
          registrationPeriod: {
            ...prev.registrationPeriod,
            ...parsed.scheduleSettings?.registrationPeriod,
          },
          startClass: {
            ...prev.startClass,
            ...parsed.scheduleSettings?.startClass,
          },
          repeat: {
            ...prev.repeat,
            ...parsed.scheduleSettings?.repeat,
          },
          timetable: {
            ...prev.timetable,
            ...parsed.scheduleSettings?.timetable,
            time: {
              ...prev.timetable.time,
              ...parsed.scheduleSettings?.timetable?.time,
            },
          },
        }));
      }

      if (parsed.notificationSettings) {
        setNotificationSettings(prev => ({ ...prev, ...parsed.notificationSettings }));
      }

      if (parsed.scheduleMode) {
        setScheduleMode(parsed.scheduleMode);
      }

      if (Array.isArray(parsed.customSessions)) {
        setCustomSessions(parsed.customSessions);
      }
    } catch {
      window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
    } finally {
      setIsDataInitialized(true);
    }
  }, [resolveId, isDataInitialized]);

  // Sync fetched data to state
  useEffect(() => {
    // Only initialize data if we're editing (have a resolveId) and data is loaded
    if (resolveId && classData && !isLoading && !isDataInitialized) {
      setClassDetails({
        uuid: classData?.uuid || '',
        course_uuid: classData?.course_uuid as string,
        program_uuid: classData?.program_uuid || null,
        title: classData?.title || '',
        description: classData?.description || '',
        categories: Array.isArray(classData?.categories)
          ? classData?.categories
          : classData?.categories
            ? [classData.categories]
            : [],
        class_type: classData.class_visibility || '',
        rate_card: classData.rate_card || classData?.training_fee,
        location_type: classData.location_type || classData?.session_format,
        location_name: classData.location_name || '',
        class_limit: classData.max_participants || 0,
        targetAudience: classData?.targetAudience || '',
        instructorName: instructor?.full_name,
        startDate: '',
        repeatUnit: '',
        endDate: '',
        allDay: false,
        class_color: '',
        classroom: '',
        meeting_link: classData?.meeting_link,
        reminder: '',
      });

      if (classData.default_start_time) {
        const startDate = new Date(classData.default_start_time);
        const endDate = new Date(classData.default_end_time);

        setScheduleSettings(prev => ({
          ...prev,
          startClass: {
            date: startDate.toISOString().split('T')[0],
            startTime: startDate.toTimeString().slice(0, 5),
            endTime: endDate.toTimeString().slice(0, 5),
          },
        }));
      }

      setIsDataInitialized(true);
    } else if (!resolveId && !isDataInitialized) {
      setIsDataInitialized(true);
    }
  }, [classData, isLoading, courseDetail, resolveId, isDataInitialized, instructor?.full_name]);


  useEffect(() => {
    if (resolveId || !isDataInitialized || typeof window === 'undefined') return;

    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(
        LOCAL_CLASS_DRAFT_KEY,
        JSON.stringify({
          classDetails,
          scheduleSettings,
          notificationSettings,
          scheduleMode,
          customSessions,
          savedAt: new Date().toISOString(),
        })
      );
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [
    classDetails,
    scheduleSettings,
    notificationSettings,
    scheduleMode,
    customSessions,
    resolveId,
    isDataInitialized,
  ]);

  // Calculate occurrence count
  const occurrenceCount = calculateOccurrences(
    scheduleSettings.startClass.date,
    scheduleSettings.endRepeat,
    scheduleSettings.repeat.unit,
    scheduleSettings.repeat.interval,
    scheduleSettings.repeat.unit === 'week' ? scheduleSettings.repeat.days : undefined
  );
  const classScheduleInstances = generateScheduleInstances(scheduleSettings);
  const sortedCustomSessions = customSessions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const classScheduleConflicts = useMemo(
    () => findScheduleConflicts(classScheduleInstances, instructorClasses, resolveId, instructor?.uuid),
    [classScheduleInstances, instructorClasses, instructor?.uuid, resolveId]
  );
  const customScheduleConflicts = useMemo(
    () => findScheduleConflicts(sortedCustomSessions, instructorClasses, resolveId, instructor?.uuid),
    [sortedCustomSessions, instructorClasses, instructor?.uuid, resolveId]
  );
  const activeScheduleConflicts =
    scheduleMode === 'custom' ? customScheduleConflicts : classScheduleConflicts;

  // Form Validation
  const isFormValid = (): boolean => {
    if (!classDetails?.program_uuid && !classDetails?.course_uuid) {
      toast.error('Please select either a Program or a Course');
      return false;
    }

    if (classDetails?.program_uuid && classDetails?.course_uuid) {
      toast.error('Please select only one: Program or Course');
      return false;
    }

    if (scheduleMode === 'custom') {
      if (sortedCustomSessions.length === 0) {
        toast.error('Please add at least one custom schedule session');
        return false;
      }

      if (customScheduleConflicts.length > 0) {
        toast.error('Selected custom schedule conflicts with an existing class');
        return false;
      }

      return true;
    }

    if (
      !scheduleSettings.startClass.date ||
      !scheduleSettings.startClass.startTime ||
      !scheduleSettings.startClass.endTime
    ) {
      toast.error('Please fill in all schedule fields');
      return false;
    }
    if (
      scheduleSettings.repeat.unit === 'week' &&
      (!scheduleSettings.repeat.days || scheduleSettings.repeat.days.length === 0)
    ) {
      toast.error('Please select at least one day of the week');
      return false;
    }
    if (!scheduleSettings.endRepeat) {
      toast.error('Please set an end date for the recurrence');
      return false;
    }
    if (occurrenceCount === 0) {
      toast.error('Invalid date range or recurrence settings');
      return false;
    }
    if (classScheduleInstances.length === 0) {
      toast.error('No class schedule instances could be generated');
      return false;
    }
    if (classScheduleConflicts.length > 0) {
      toast.error('Selected class schedule conflicts with an existing class');
      return false;
    }
    return true;
  };

  // Handle Form Submit
  const handleSubmit = (e: SubmitEventLike, isDraft: boolean = false) => {
    e.preventDefault();

    if (!isFormValid()) return;

    try {
      const sessionTemplates: CreateClassDefinitionData['body']['session_templates'] =
        scheduleMode === 'custom'
          ? sortedCustomSessions.map(session => ({
            start_time: new Date(buildUtcIsoDateTime(session.date, session.startTime)),
            end_time: new Date(buildUtcIsoDateTime(session.date, session.endTime)),
            conflict_resolution: 'FAIL',
          }))
          : (() => {
            const startTime = scheduleSettings.allDay
              ? '00:00'
              : (scheduleSettings.startClass.startTime as string);
            const endTime = scheduleSettings.allDay
              ? '23:59'
              : (scheduleSettings.startClass.endTime as string);
            const startTimeIso = buildUtcIsoDateTime(scheduleSettings.startClass.date, startTime);
            const endTimeIso = buildUtcIsoDateTime(scheduleSettings.startClass.date, endTime);
            const selectedDays = scheduleSettings.repeat.days || [];
            const days_of_week = selectedDays
              .sort()
              .map(dayIndex => DAY_NAMES[dayIndex])
              .join(',');

            return [
              {
                start_time: new Date(startTimeIso),
                end_time: new Date(endTimeIso),
                recurrence: {
                  recurrence_type: RECURRENCE_TYPE_MAP[scheduleSettings.repeat.unit],
                  interval_value: scheduleSettings.repeat.interval,
                  days_of_week: days_of_week || undefined,
                  occurrence_count: occurrenceCount,
                },
                conflict_resolution: 'FAIL',
              },
            ];
          })();

      const payload: CreateClassDefinitionData['body'] = {
        course_uuid: classDetails.course_uuid ?? undefined,
        program_uuid: classDetails.program_uuid ?? undefined,
        title: classDetails.title,
        description: classDetails.description,
        default_instructor_uuid: instructor?.uuid as string,
        class_visibility: 'PUBLIC',
        session_format: 'GROUP',
        location_type:
          classDetails.location_type as CreateClassDefinitionData['body']['location_type'],
        location_name: classDetails.location_name,
        location_latitude: -1.292066,
        location_longitude: 36.821945,
        max_participants: classDetails.class_limit,
        allow_waitlist: true,
        is_active: !isDraft,
        default_start_time:
          scheduleMode === 'custom'
            ? new Date(
              buildUtcIsoDateTime(sortedCustomSessions[0].date, sortedCustomSessions[0].startTime)
            )
            : new Date(
              buildUtcIsoDateTime(
                scheduleSettings.startClass.date,
                scheduleSettings.allDay
                  ? '00:00'
                  : (scheduleSettings.startClass.startTime as string)
              )
            ),
        default_end_time:
          scheduleMode === 'custom'
            ? new Date(
              buildUtcIsoDateTime(sortedCustomSessions[0].date, sortedCustomSessions[0].endTime)
            )
            : new Date(
              buildUtcIsoDateTime(
                scheduleSettings.startClass.date,
                scheduleSettings.allDay
                  ? '23:59'
                  : (scheduleSettings.startClass.endTime as string)
              )
            ),
        meeting_link: classDetails.meeting_link,
        session_templates: sessionTemplates,
      };

      if (resolveId) {
        updateClassDefinition.mutate(
          { path: { uuid: resolveId }, body: payload },
          {
            onSuccess: () => {
              qc.invalidateQueries({
                queryKey: getClassDefinitionsForInstructorQueryKey({
                  path: { instructorUuid: instructor?.uuid as string },
                }),
              });

              qc.invalidateQueries({
                queryKey: getAllClassDefinitionsQueryKey({ query: { pageable: {} } }),
              });

              qc.invalidateQueries({
                queryKey: getClassDefinitionQueryKey({
                  path: { uuid: resolveId },
                }),
              });

              toast.success(isDraft ? 'Class saved as draft' : 'Class updated successfully');

              if (embedded) {
                onSuccess?.();
              } else {
                router.push('/dashboard/trainings');
              }
            },
            onError: error => {
              toast.error(getMutationErrorMessage(error, 'Failed to update class'));
            },
          }
        );
      } else {
        createClassDefinition.mutate(
          { body: payload },
          {
            onSuccess: response => {
              const savedUuid = response?.data?.class_definition?.uuid;

              if (savedUuid) {
                setSavedClassUuid(savedUuid);
              }

              qc.invalidateQueries({
                queryKey: getClassDefinitionsForInstructorQueryKey({
                  path: { instructorUuid: instructor?.uuid as string },
                }),
              });

              qc.invalidateQueries({
                queryKey: getAllClassDefinitionsQueryKey({ query: { pageable: {} } }),
              });

              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(LOCAL_CLASS_DRAFT_KEY);
              }

              toast.success(isDraft ? 'Class saved as draft' : 'Class created successfully');
              if (embedded) {
                onSuccess?.();
              } else {
                router.push('/dashboard/trainings');
              }
            },
            onError: error => {
              toast.error(getMutationErrorMessage(error, 'Failed to create class'));
            },
          }
        );
      }
    } catch (_error) {
      toast.error('An error occurred while processing your request');
    }
  };

  const shouldShowSkeleton = isLoading || (resolveId && !isDataInitialized);

  return (
    <div className={embedded ? 'bg-background px-1 py-1' : 'bg-background min-h-screen px-4 py-8'}>
      <div className={embedded ? 'mx-auto max-w-5xl' : 'mx-auto max-w-5xl'}>
        {/* Header */}
        <div className={embedded ? 'mb-6' : 'mb-8'}>
          <h1 className={`text-foreground mb-2 font-bold ${embedded ? 'text-2xl' : 'text-3xl'}`}>
            Class Builder
          </h1>
          <p className='text-muted-foreground'>
            Create and customize your training class with all required details, schedule, and
            notifications.
          </p>
        </div>

        {shouldShowSkeleton ? (
          <ClassFormSkeleton />
        ) : (
          <>
            <form onSubmit={e => handleSubmit(e, false)} className='space-y-6'>
              <div className='flex-end flex items-center justify-between'>
                {embedded ? (
                  <Button type='button' variant='outline' onClick={onCancel}>
                    <ArrowLeft />
                    Close
                  </Button>
                ) : (
                  <Button variant={'outline'} onClick={() => router.push('/dashboard/classes')}>
                    <ArrowLeft />
                    Back
                  </Button>
                )}
                <Button
                  type='button'
                  variant='outline'
                  onClick={event => {
                    event.preventDefault();
                    handleSubmit(event, true);
                  }}
                  disabled={createClassDefinition.isPending || updateClassDefinition.isPending}
                >
                  <Save className='mr-2 h-4 w-4' />
                  Save as Draft
                </Button>
              </div>

              {/* Class Details Section */}
              <ClassDetailsSection
                data={classDetails}
                onChange={updates => setClassDetails(prev => ({ ...prev, ...updates }))}
              />

              {/* Schedule Section */}
              <ScheduleSection
                data={scheduleSettings}
                onChange={updates => setScheduleSettings(prev => ({ ...prev, ...updates }))}
                occurrenceCount={occurrenceCount}
                scheduleMode={scheduleMode}
                onScheduleModeChange={setScheduleMode}
                customSessions={customSessions}
                onCustomSessionsChange={setCustomSessions}
                classScheduleConflicts={classScheduleConflicts}
                customScheduleConflicts={customScheduleConflicts}
                activeScheduleConflicts={activeScheduleConflicts}
              />

              {/* Class Information Section */}
              <ClassInformationSection
                data={classDetails}
                onChange={updates => setClassDetails(prev => ({ ...prev, ...updates }))}
              />

              {/* Notification Section */}
              <NotificationSection
                data={notificationSettings}
                onChange={updates => setNotificationSettings(prev => ({ ...prev, ...updates }))}
              />

              {/* Preview Section */}
              {isPreviewMode && (
                <PreviewSection
                  classDetails={classDetails}
                  scheduleSettings={scheduleSettings}
                  scheduleMode={scheduleMode}
                  customSessions={customSessions}
                  courseData={courseDetail?.data}
                  courseLessons={courseLessons?.data?.content}
                  occurrenceCount={occurrenceCount}
                />
              )}

              {/* Action Buttons */}
              <Card className='flex items-end justify-between gap-4 border p-6 shadow-sm'>
                <div className='flex items-center gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                  >
                    {isPreviewMode ? 'Hide Preview' : 'Show Preview'}
                  </Button>

                  <Button
                    type='submit'
                    disabled={createClassDefinition.isPending || updateClassDefinition.isPending}
                    className='px-8'
                  >
                    {createClassDefinition.isPending || updateClassDefinition.isPending
                      ? 'Publishing...'
                      : 'Publish Class'}
                  </Button>
                </div>
              </Card>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ClassBuilderPage;

const ClassFormSkeleton = () => {
  return (
    <div className='animate-pulse space-y-6'>
      {/* Top Publish Button */}
      <div className='flex justify-end'>
        <div className='bg-muted h-10 w-40 rounded-md' />
      </div>

      {/* Class Details Section */}
      <Card className='space-y-4 p-6'>
        <div className='bg-muted h-5 w-1/3 rounded' />
        <div className='bg-muted h-10 w-full rounded' />
        <div className='bg-muted h-10 w-full rounded' />
      </Card>

      {/* Schedule Section */}
      <Card className='space-y-4 p-6'>
        <div className='bg-muted h-5 w-1/4 rounded' />
        <div className='bg-muted h-10 w-full rounded' />
        <div className='bg-muted h-10 w-1/2 rounded' />
      </Card>

      {/* Class Information Section */}
      <Card className='space-y-4 p-6'>
        <div className='bg-muted h-5 w-1/3 rounded' />
        <div className='bg-muted h-24 w-full rounded' />
      </Card>

      {/* Notification Section */}
      <Card className='space-y-4 p-6'>
        <div className='bg-muted h-5 w-1/4 rounded' />
        <div className='bg-muted h-10 w-full rounded' />
      </Card>

      {/* Action Buttons */}
      <Card className='flex justify-between p-6'>
        <div className='flex gap-3'>
          <div className='bg-muted h-10 w-36 rounded' />
          <div className='bg-muted h-10 w-36 rounded' />
        </div>
      </Card>
    </div>
  );
};
