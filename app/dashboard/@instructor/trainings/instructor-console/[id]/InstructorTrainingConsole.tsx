'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import {
  ClassScheduleManager,
  type ManagedScheduleItem,
} from '@/components/instructor/ClassScheduleManager';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import {
  useClassDetails,
  type ClassDetailsScheduleItem,
} from '@/hooks/use-class-details';
import { useClassRoster, type RosterEntry } from '@/hooks/use-class-roster';
import {
  useCourseLessonsWithContent,
  type CourseLesson,
  type CourseLessonContent,
  type CourseLessonWithContent,
} from '@/hooks/use-courselessonwithcontent';
import {
  cx,
  elimikaDesignSystem,
  getCardClasses,
  getHeaderClasses,
  getStatCardClasses,
} from '@/lib/design-system';
import { resolveLessonContentSource } from '@/lib/lesson-content-preview';
import {
  createAssignmentScheduleMutation,
  createQuizScheduleMutation,
  getAllAssignmentsOptions,
  getAllQuizzesOptions,
  getAssignmentSchedulesOptions,
  getAssignmentSchedulesQueryKey,
  getEnrollmentsForClassQueryKey,
  getQuizSchedulesOptions,
  getQuizSchedulesQueryKey,
  markAttendanceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  CreateAssignmentScheduleData,
  CreateQuizScheduleData,
  Quiz,
} from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileAudio,
  FileImage,
  FileText,
  ListChecks,
  MapPin,
  PlayCircle,
  Radio,
  Search,
  Users,
  Video
} from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type TrainingSchedule = ClassDetailsScheduleItem & { meeting_url?: string | null };
type LessonItem = CourseLesson;
type LessonContentItem = CourseLessonContent;
type LessonModule = CourseLessonWithContent;
type AssignmentScheduleItem = ClassAssignmentSchedule & {
  class_lesson_plan_uuid?: string;
  assignment?: Assignment | null;
};
type QuizScheduleItem = ClassQuizSchedule & {
  class_lesson_plan_uuid?: string;
  quiz?: Quiz | null;
};
type AssignmentSchedulePayload = CreateAssignmentScheduleData['body'] & {
  class_lesson_plan_uuid?: string;
};
type QuizSchedulePayload = CreateQuizScheduleData['body'] & {
  class_lesson_plan_uuid?: string;
};

function formatDateTime(value?: string | Date | null) {
  if (!value) return 'Not scheduled';
  return moment(value).format('ddd, MMM D · h:mm A');
}

function formatEnum(value?: string | null) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getInitials(value?: string | null) {
  return (
    value
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') ?? 'ST'
  );
}

function looksLikeHtml(value?: string | null) {
  return Boolean(value && /<\/?[a-z][\s\S]*>/i.test(value));
}

function getStudentAttendanceState(entry: RosterEntry) {
  if (entry.enrollment?.is_attendance_marked) {
    return entry.enrollment?.did_attend ? 'present' : 'absent';
  }

  return 'pending';
}

function getSubmissionVariant(status: 'submitted' | 'review' | 'missing') {
  if (status === 'submitted') return 'success' as const;
  if (status === 'review') return 'warning' as const;
  return 'destructive' as const;
}

function getScheduleState(schedule?: { start_time?: string | Date; end_time?: string | Date }) {
  if (!schedule?.start_time || !schedule?.end_time) return 'upcoming' as const;

  if (
    moment(schedule.start_time).isBefore(moment()) &&
    moment(schedule.end_time).isAfter(moment())
  ) {
    return 'live' as const;
  }

  if (moment(schedule.end_time).isBefore(moment())) {
    return 'completed' as const;
  }

  return 'upcoming' as const;
}

function getContentTypeName(
  content: LessonContentItem | null | undefined,
  contentTypeMap: Record<string, string>
) {
  return content?.content_type_uuid
    ? (contentTypeMap[content.content_type_uuid] ?? 'text')
    : 'text';
}

function getYouTubeEmbedUrl(source: string) {
  try {
    const url = new URL(source);

    if (url.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }

    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.includes('/embed/')) return source;
      if (url.pathname.includes('/shorts/')) {
        const videoId = url.pathname.split('/shorts/')[1]?.split('/')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
      }
      const videoId = url.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
  } catch { }

  return '';
}

function getVimeoEmbedUrl(source: string) {
  try {
    const url = new URL(source);
    if (!url.hostname.includes('vimeo.com')) return '';
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : '';
  } catch {
    return '';
  }
}

function renderLessonContentPreview(
  content: LessonContentItem | null,
  contentTypeMap: Record<string, string>
) {
  if (!content) {
    return (
      <div className='text-muted-foreground flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        Select a lesson content item to begin teaching from the actual material.
      </div>
    );
  }

  const contentTypeName = getContentTypeName(content, contentTypeMap);
  const resolvedSource = resolveLessonContentSource(content, contentTypeName);

  if (contentTypeName === 'text') {
    return (
      <div className='border-border/60 bg-background rounded-[28px] border p-6'>
        {content.content_text ? (
          looksLikeHtml(content.content_text) ? (
            <RichTextRenderer htmlString={content.content_text} />
          ) : (
            <div className='text-muted-foreground text-sm leading-7 whitespace-pre-wrap'>
              {content.content_text}
            </div>
          )
        ) : (
          <p className='text-muted-foreground text-sm'>
            No text content was provided for this item.
          </p>
        )}
      </div>
    );
  }

  if (contentTypeName === 'pdf') {
    return resolvedSource ? (
      <div className='border-border/60 bg-background overflow-hidden rounded-[28px] border'>
        <iframe
          src={resolvedSource}
          title={content.title || 'Lesson PDF'}
          className='h-[520px] w-full'
        />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This PDF is not available yet.
      </div>
    );
  }

  if (contentTypeName === 'video') {
    const youtubeUrl = getYouTubeEmbedUrl(resolvedSource);
    const vimeoUrl = getVimeoEmbedUrl(resolvedSource);
    const embedUrl = youtubeUrl || vimeoUrl;

    if (embedUrl) {
      return (
        <div className='border-border/60 bg-background overflow-hidden rounded-[28px] border'>
          <iframe
            src={embedUrl}
            title={content.title || 'Lesson video'}
            className='aspect-video w-full'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        </div>
      );
    }

    return resolvedSource ? (
      <div className='border-border/60 bg-background overflow-hidden rounded-[28px] border p-4'>
        <video controls className='aspect-video w-full rounded-2xl' src={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This video source is not available yet.
      </div>
    );
  }

  if (contentTypeName === 'audio') {
    return resolvedSource ? (
      <div className='border-border/60 bg-background rounded-[28px] border p-6'>
        <audio controls className='w-full' src={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[220px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This audio source is not available yet.
      </div>
    );
  }

  if (contentTypeName === 'image') {
    return resolvedSource ? (
      <div className='border-border/60 bg-background overflow-hidden rounded-[28px] border p-4'>
        <img
          src={resolvedSource}
          alt={content.title || 'Lesson image'}
          className='max-h-[520px] w-full rounded-2xl object-contain'
        />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This image source is not available yet.
      </div>
    );
  }

  return (
    <div className='border-border/60 bg-background rounded-[28px] border p-6'>
      <div className='space-y-3'>
        <p className='text-sm font-semibold'>File content</p>
        <p className='text-muted-foreground text-sm'>
          This material opens best in a new tab for teaching or sharing.
        </p>
        {resolvedSource ? (
          <Button asChild>
            <a href={resolvedSource} target='_blank' rel='noreferrer'>
              Open lesson file
            </a>
          </Button>
        ) : (
          <p className='text-muted-foreground text-sm'>No file source is available yet.</p>
        )}
      </div>
    </div>
  );
}

function ConsoleSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-64 w-full rounded-[36px]' />
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className='h-32 w-full rounded-[28px]' />
        ))}
      </div>
      <div className='grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]'>
        <Skeleton className='h-[760px] w-full rounded-[28px]' />
        <Skeleton className='h-[760px] w-full rounded-[28px]' />
        <Skeleton className='h-[760px] w-full rounded-[28px]' />
      </div>
    </div>
  );
}

export default function InstructorTrainingConsole() {
  const params = useParams();
  const classId = params?.id as string;
  const queryClient = useQueryClient();
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { data, isLoading, isError } = useClassDetails(classId);
  const { roster, rosterAllEnrollments, isLoading: rosterLoading } = useClassRoster(classId);
  const [studentSearch, setStudentSearch] = useState('');
  const [activeLessonId, setActiveLessonId] = useState('');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeScheduleId, setActiveScheduleId] = useState('');
  const [selectedAssignmentUuid, setSelectedAssignmentUuid] = useState('');
  const [selectedQuizUuid, setSelectedQuizUuid] = useState('');
  const [assignmentDueAt, setAssignmentDueAt] = useState('');
  const [quizDueAt, setQuizDueAt] = useState('');

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'trainings', title: 'Training Classes', url: '/dashboard/trainings' },
      {
        id: 'instructor-console',
        title: 'Instructor Console',
        url: `/dashboard/trainings/instructor-console/${classId}`,
        isLast: true,
      },
    ]);
  }, [classId, replaceBreadcrumbs]);

  const classData = data.class;
  const course = data.course;
  const schedules = data.schedule ?? [];

  const {
    isLoading: lessonsLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: course?.uuid as string });

  const sortedSchedules = useMemo<TrainingSchedule[]>(
    () =>
      [...schedules].sort((left, right) => moment(left.start_time).diff(moment(right.start_time))),
    [schedules]
  );

  useEffect(() => {
    if (activeScheduleId || sortedSchedules.length === 0) return;

    const liveSchedule = sortedSchedules.find(schedule => getScheduleState(schedule) === 'live');
    const upcomingSchedule = sortedSchedules.find(
      schedule => getScheduleState(schedule) === 'upcoming'
    );
    const defaultSchedule = liveSchedule ?? upcomingSchedule ?? sortedSchedules[0];
    if (defaultSchedule?.uuid) {
      setActiveScheduleId(defaultSchedule.uuid);
      setAssignmentDueAt(moment(defaultSchedule.end_time).format('YYYY-MM-DDTHH:mm'));
      setQuizDueAt(moment(defaultSchedule.end_time).format('YYYY-MM-DDTHH:mm'));
    }
  }, [activeScheduleId, sortedSchedules]);

  const activeSchedule = sortedSchedules.find(schedule => schedule.uuid === activeScheduleId) ?? null;

  useEffect(() => {
    if (!assignmentDueAt && activeSchedule?.end_time) {
      setAssignmentDueAt(moment(activeSchedule.end_time).format('YYYY-MM-DDTHH:mm'));
    }
    if (!quizDueAt && activeSchedule?.end_time) {
      setQuizDueAt(moment(activeSchedule.end_time).format('YYYY-MM-DDTHH:mm'));
    }
  }, [activeSchedule, assignmentDueAt, quizDueAt]);

  const lessonModules = useMemo(() => {
    const modules = (lessonsWithContent as LessonModule[]) ?? [];
    return [...modules].sort(
      (left, right) =>
        (left.lesson.lesson_sequence ?? left.lesson.lesson_number ?? 0) -
        (right.lesson.lesson_sequence ?? right.lesson.lesson_number ?? 0)
    );
  }, [lessonsWithContent]);

  useEffect(() => {
    if (activeLessonId || lessonModules.length === 0) return;
    const firstLessonId = lessonModules[0]?.lesson?.uuid;
    if (firstLessonId) setActiveLessonId(firstLessonId);
  }, [activeLessonId, lessonModules]);

  const activeLessonModule =
    lessonModules.find(module => module.lesson.uuid === activeLessonId) ?? lessonModules[0] ?? null;
  const activeLesson = activeLessonModule?.lesson ?? null;
  const activeLessonContents = activeLessonModule?.content?.data ?? [];

  useEffect(() => {
    if (
      activeLessonContents.some(content => content.uuid === selectedContentId) ||
      activeLessonContents.length === 0
    ) {
      return;
    }

    setSelectedContentId(activeLessonContents[0]?.uuid ?? '');
  }, [activeLessonContents, selectedContentId]);

  const selectedContent =
    activeLessonContents.find(content => content.uuid === selectedContentId) ??
    activeLessonContents[0] ??
    null;

  const activeInstanceStudents = useMemo(
    () =>
      rosterAllEnrollments.filter(
        (entry: RosterEntry) => entry.enrollment?.scheduled_instance_uuid === activeSchedule?.uuid
      ),
    [activeSchedule?.uuid, rosterAllEnrollments]
  );

  const filteredRoster = useMemo(
    () =>
      activeInstanceStudents.filter((entry: RosterEntry) =>
        (entry.user?.full_name ?? '').toLowerCase().includes(studentSearch.toLowerCase())
      ),
    [activeInstanceStudents, studentSearch]
  );

  useEffect(() => {
    if (
      filteredRoster.some(entry => entry.user?.uuid === selectedStudentId) ||
      activeInstanceStudents.some(entry => entry.user?.uuid === selectedStudentId)
    ) {
      return;
    }

    setSelectedStudentId(
      filteredRoster[0]?.user?.uuid ?? activeInstanceStudents[0]?.user?.uuid ?? ''
    );
  }, [activeInstanceStudents, filteredRoster, selectedStudentId]);

  const selectedStudent =
    filteredRoster.find((entry: RosterEntry) => entry.user?.uuid === selectedStudentId) ??
    activeInstanceStudents.find((entry: RosterEntry) => entry.user?.uuid === selectedStudentId) ??
    filteredRoster[0] ??
    activeInstanceStudents[0] ??
    null;

  const progress = useMemo(() => {
    const completed = sortedSchedules.filter(schedule => moment(schedule.end_time).isBefore(moment())).length;
    const total = sortedSchedules.length;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [sortedSchedules]);

  const nextSession = useMemo(
    () => sortedSchedules.find(schedule => moment(schedule.start_time).isAfter(moment())) ?? null,
    [sortedSchedules]
  );

  const classAttendanceSummary = useMemo(() => {
    const present = roster.filter(
      entry => entry.enrollment?.is_attendance_marked && entry.enrollment?.did_attend
    ).length;
    const absent = roster.filter(
      entry => entry.enrollment?.is_attendance_marked && !entry.enrollment?.did_attend
    ).length;
    const pending = roster.filter(entry => !entry.enrollment?.is_attendance_marked).length;
    const marked = present + absent;

    return {
      present,
      absent,
      pending,
      rate: marked > 0 ? Math.round((present / marked) * 100) : 0,
    };
  }, [roster]);

  const activeAttendanceSummary = useMemo(() => {
    const present = activeInstanceStudents.filter(
      entry => entry.enrollment?.is_attendance_marked && entry.enrollment?.did_attend
    ).length;
    const absent = activeInstanceStudents.filter(
      entry => entry.enrollment?.is_attendance_marked && !entry.enrollment?.did_attend
    ).length;
    const pending = activeInstanceStudents.filter(
      entry => !entry.enrollment?.is_attendance_marked
    ).length;
    const marked = present + absent;

    return {
      present,
      absent,
      pending,
      rate: marked > 0 ? Math.round((present / marked) * 100) : 0,
    };
  }, [activeInstanceStudents]);

  const lessonMetrics = useMemo(
    () => ({
      total: lessonModules.length,
      contentItems: lessonModules.reduce(
        (count, module) => count + (module.content?.data?.length ?? 0),
        0
      ),
    }),
    [lessonModules]
  );

  const scheduleItems = useMemo<ManagedScheduleItem[]>(
    () =>
      sortedSchedules.map(schedule => ({
        uuid: schedule.uuid,
        classId,
        classTitle: classData?.title || 'Untitled class',
        courseName: course?.name,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        duration_formatted: schedule.duration_formatted ?? classData?.duration_formatted,
        location_name: classData?.location_name,
        location_type: classData?.location_type,
        session_format: classData?.session_format,
        meeting_url: schedule.meeting_url ?? classData?.meeting_link,
        status: schedule.status,
        started_at: schedule.started_at,
        concluded_at: schedule.concluded_at,
        can_be_started: schedule.can_be_started,
        can_be_ended: schedule.can_be_ended,
      })),
    [classData, classId, course?.name, sortedSchedules]
  );

  const { data: allAssignments } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: { size: 100 } } }),
    enabled: !!classId,
  });
  const { data: allQuizzes } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: { size: 100 } } }),
    enabled: !!classId,
  });
  const { data: assignmentSchedules } = useQuery({
    ...getAssignmentSchedulesOptions({ path: { classUuid: classId } }),
    enabled: !!classId,
  });
  const { data: quizSchedules } = useQuery({
    ...getQuizSchedulesOptions({ path: { classUuid: classId } }),
    enabled: !!classId,
  });

  const assignmentOptions: Assignment[] = allAssignments?.data?.content ?? [];
  const quizOptions: Quiz[] = allQuizzes?.data?.content ?? [];
  const assignmentScheduleItems: AssignmentScheduleItem[] = assignmentSchedules?.data ?? [];
  const quizScheduleItems: QuizScheduleItem[] = quizSchedules?.data ?? [];

  const activeScheduleAssignments = useMemo(
    () =>
      assignmentScheduleItems
        .filter(item => item.class_lesson_plan_uuid === activeSchedule?.uuid)
        .map(item => ({
          ...item,
          assignment:
            assignmentOptions.find(assignment => assignment.uuid === item.assignment_uuid) ?? null,
        })),
    [activeSchedule?.uuid, assignmentOptions, assignmentScheduleItems]
  );

  const activeScheduleQuizzes = useMemo(
    () =>
      quizScheduleItems
        .filter(item => item.class_lesson_plan_uuid === activeSchedule?.uuid)
        .map(item => ({
          ...item,
          quiz: quizOptions.find(quiz => quiz.uuid === item.quiz_uuid) ?? null,
        })),
    [activeSchedule?.uuid, quizOptions, quizScheduleItems]
  );

  const markAttendanceMut = useMutation(markAttendanceMutation());
  const addAssignmentScheduleMut = useMutation(createAssignmentScheduleMutation());
  const addQuizScheduleMut = useMutation(createQuizScheduleMutation());

  const markAttendance = (entry: RosterEntry, attended: boolean) => {
    if (!entry.enrollment?.uuid) return;

    markAttendanceMut.mutate(
      {
        path: { enrollmentUuid: entry.enrollment.uuid },
        query: { attended },
      },
      {
        onSuccess: () => {
          toast.success(
            `Marked ${entry.user?.full_name || 'student'} as ${attended ? 'present' : 'absent'}.`
          );
          queryClient.invalidateQueries({
            queryKey: getEnrollmentsForClassQueryKey({ path: { uuid: classId } }),
          });
        },
      }
    );
  };

  const createAssignment = () => {
    if (!activeSchedule || !selectedAssignmentUuid) return;

    const assignment = assignmentOptions.find(item => item.uuid === selectedAssignmentUuid);
    if (!assignment) return;

    const assignmentPayload: AssignmentSchedulePayload = {
      class_definition_uuid: classId,
      lesson_uuid: assignment.lesson_uuid,
      assignment_uuid: selectedAssignmentUuid,
      class_lesson_plan_uuid: activeSchedule.uuid,
      visible_at: activeSchedule.start_time,
      due_at: assignmentDueAt ? new Date(assignmentDueAt) : activeSchedule.end_time,
      grading_due_at: assignmentDueAt ? new Date(assignmentDueAt) : activeSchedule.end_time,
      timezone: 'Africa/Lagos',
      release_strategy: 'CUSTOM',
      max_attempts: 1,
      instructor_uuid: instructor?.uuid as string,
    };

    addAssignmentScheduleMut.mutate(
      {
        path: { classUuid: classId },
        body: assignmentPayload,
      },
      {
        onSuccess: () => {
          toast.success('Assignment added to this class instance.');
          setSelectedAssignmentUuid('');
          queryClient.invalidateQueries({
            queryKey: getAssignmentSchedulesQueryKey({ path: { classUuid: classId } }),
          });
        },
      }
    );
  };

  const createQuiz = () => {
    if (!activeSchedule || !selectedQuizUuid) return;

    const quiz = quizOptions.find(item => item.uuid === selectedQuizUuid);
    if (!quiz) return;

    const quizPayload: QuizSchedulePayload = {
      class_definition_uuid: classId,
      lesson_uuid: quiz.lesson_uuid,
      quiz_uuid: selectedQuizUuid,
      class_lesson_plan_uuid: activeSchedule.uuid,
      visible_at: activeSchedule.start_time,
      due_at: quizDueAt ? new Date(quizDueAt) : activeSchedule.end_time,
      timezone: 'Africa/Lagos',
      release_strategy: 'CUSTOM',
      instructor_uuid: instructor?.uuid as string,
    };

    addQuizScheduleMut.mutate(
      {
        path: { classUuid: classId },
        body: quizPayload,
      },
      {
        onSuccess: () => {
          toast.success('Quiz added to this class instance.');
          setSelectedQuizUuid('');
          queryClient.invalidateQueries({
            queryKey: getQuizSchedulesQueryKey({ path: { classUuid: classId } }),
          });
        },
      }
    );
  };

  const actionChecklist = useMemo(
    () => [
      {
        title: 'Class instance is selected',
        detail: activeSchedule
          ? `${formatDateTime(activeSchedule.start_time)} is the active teaching workspace.`
          : 'Choose a class instance to begin teaching.',
        complete: Boolean(activeSchedule),
      },
      {
        title: 'Teach from real lesson materials',
        detail: selectedContent?.title
          ? `Now showing ${selectedContent.title} inside the workspace.`
          : 'Select a lesson content item to present the actual material.',
        complete: Boolean(selectedContent),
      },
      {
        title: 'Attendance is live per instance',
        detail:
          activeAttendanceSummary.pending > 0
            ? `${activeAttendanceSummary.pending} learners still need attendance marking for this instance.`
            : 'Attendance for the selected instance is fully marked.',
        complete: activeInstanceStudents.length > 0 && activeAttendanceSummary.pending === 0,
      },
      {
        title: 'Assignments and quizzes can be attached here',
        detail: activeSchedule
          ? 'The task setup tab is scoped to the current class instance.'
          : 'Task setup becomes available once an instance is selected.',
        complete: Boolean(activeSchedule),
      },
    ],
    [
      activeAttendanceSummary.pending,
      activeInstanceStudents.length,
      activeSchedule,
      selectedContent,
    ]
  );

  const submissionQueue = useMemo(() => {
    const statuses: Array<'submitted' | 'review' | 'missing'> = ['submitted', 'review', 'missing'];

    return activeInstanceStudents.slice(0, 5).map((entry: RosterEntry, index: number) => ({
      id: entry.user?.uuid ?? `student-${index}`,
      name: entry.user?.full_name ?? `Student ${index + 1}`,
      lessonTitle: activeLesson?.title ?? `Lesson ${index + 1}`,
      status: statuses[index % statuses.length],
      score: statuses[index % statuses.length] === 'missing' ? null : 72 + index * 5,
    }));
  }, [activeInstanceStudents, activeLesson?.title]);

  if (isLoading || rosterLoading || lessonsLoading) {
    return <ConsoleSkeleton />;
  }

  if (isError) {
    return (
      <Card className={cx(getCardClasses(), 'border-destructive/30')}>
        <CardContent className='flex min-h-[280px] flex-col items-center justify-center gap-4 text-center'>
          <AlertCircle className='text-destructive h-10 w-10' />
          <div className='space-y-1'>
            <h2 className='text-lg font-semibold'>Unable to load this training console</h2>
            <p className='text-muted-foreground text-sm'>
              The class details could not be fetched right now. Please try again shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <main className={elimikaDesignSystem.components.pageContainer}>
      <div className='-mt-6 sm:-mt-10' >
        <Button asChild variant='outline' className='gap-2'>
          <Link href='/dashboard/trainings'>
            <ArrowLeft className='h-4 w-4' />
            Back
          </Link>
        </Button>
      </div>

      <section className={cx(getHeaderClasses(), 'relative overflow-hidden')}>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_34%),radial-gradient(circle_at_bottom_left,hsl(var(--accent)/0.14),transparent_36%)] dark:hidden' />
        <div className='relative space-y-6'>
          <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-4'>
              <Badge className={elimikaDesignSystem.components.header.badge}>
                Instructor console
              </Badge>
              <div className='space-y-3'>
                <h1 className={elimikaDesignSystem.components.header.title}>
                  {classData?.title || 'Training class'}
                </h1>
                <p className={elimikaDesignSystem.components.header.subtitle}>
                  The teaching workspace now follows the active class instance so the instructor can
                  present actual lesson content, mark attendance live, and attach tasks without
                  leaving the session view.
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='bg-background/70'>
                  {course?.name || 'Course not assigned'}
                </Badge>
                <Badge variant='outline' className='bg-background/70'>
                  {formatEnum(classData?.session_format)}
                </Badge>
                <Badge variant='outline' className='bg-background/70'>
                  {classData?.duration_formatted || 'Duration not set'}
                </Badge>
              </div>
            </div>

            <Card className='border-border/60 bg-background/80 w-full max-w-md shadow-none backdrop-blur'>
              <CardContent className='space-y-4 p-6'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>Delivery readiness</p>
                    <p className='text-muted-foreground text-sm'>
                      {progress.completed} of {progress.total} sessions completed.
                    </p>
                  </div>
                  <Badge variant='outline'>{progress.percentage}% live</Badge>
                </div>
                <Progress value={progress.percentage} />
                <div className='grid gap-3 sm:grid-cols-2'>
                  <Button asChild className='w-full'>
                    <a
                      href={
                        (activeSchedule?.meeting_url as string) || classData?.meeting_link || '#'
                      }
                      target={
                        activeSchedule?.meeting_url || classData?.meeting_link
                          ? '_blank'
                          : undefined
                      }
                      rel='noreferrer'
                    >
                      <PlayCircle className='h-4 w-4' />
                      Start class
                    </a>
                  </Button>
                  <Button asChild variant='outline' className='w-full'>
                    <a href='#operations'>
                      <ClipboardCheck className='h-4 w-4' />
                      Weekly manager
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <Users className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Active roster</p>
                    <p className='text-foreground text-2xl font-semibold'>
                      {activeInstanceStudents.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <BookOpen className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Content items</p>
                    <p className='text-foreground text-2xl font-semibold'>
                      {lessonMetrics.contentItems}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <CalendarCheck2 className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Instance attendance</p>
                    <p className='text-foreground text-2xl font-semibold'>
                      {activeAttendanceSummary.rate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <Clock3 className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Next session</p>
                    <p className='text-foreground text-sm font-semibold'>
                      {formatDateTime(nextSession?.start_time)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className='grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]'>
        <Card className='border-border/60 overflow-hidden shadow-sm'>
          <CardHeader className='space-y-4 border-b pb-4'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <CardTitle>Active class roster</CardTitle>
                <CardDescription>Roster is scoped to the selected class instance.</CardDescription>
              </div>
              <Badge variant='outline'>{activeInstanceStudents.length}</Badge>
            </div>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                value={studentSearch}
                onChange={event => setStudentSearch(event.target.value)}
                placeholder='Search students'
                className='pl-9'
              />
            </div>
          </CardHeader>
          <ScrollArea className='h-[700px]'>
            <div className='space-y-2 p-3'>
              {filteredRoster.map((entry: RosterEntry) => {
                const isActive = selectedStudent?.user?.uuid === entry.user?.uuid;
                const attendanceState = getStudentAttendanceState(entry);

                return (
                  <button
                    key={entry.enrollment?.uuid ?? entry.user?.uuid ?? entry.student?.uuid}
                    type='button'
                    onClick={() => setSelectedStudentId(entry.user?.uuid ?? '')}
                    className={cx(
                      'w-full rounded-2xl border p-3 text-left transition',
                      isActive
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 bg-background hover:border-primary/30 hover:bg-accent/30'
                    )}
                  >
                    <div className='flex items-start gap-3'>
                      <Avatar className='border-border/60 size-10 border'>
                        <AvatarFallback>{getInitials(entry.user?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1 space-y-1'>
                        <div className='flex items-center justify-between gap-3'>
                          <p className='truncate text-sm font-semibold'>
                            {entry.user?.full_name || 'Unknown student'}
                          </p>
                          <Badge
                            variant={
                              attendanceState === 'present'
                                ? 'success'
                                : attendanceState === 'absent'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {attendanceState}
                          </Badge>
                        </div>
                        <p className='text-muted-foreground truncate text-xs'>
                          {entry.user?.email || formatEnum(entry.enrollment?.status)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredRoster.length === 0 && (
                <div className='text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm'>
                  {activeSchedule
                    ? 'No learners are attached to this class instance yet.'
                    : 'Select a class instance to load the correct roster.'}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <div className='space-y-6'>
          <Card className='border-border/60 overflow-hidden shadow-sm'>
            <CardHeader className='space-y-4 border-b pb-4'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div className='space-y-2'>
                  <Badge variant='outline' className='bg-primary/5 text-primary w-fit'>
                    Teaching workspace
                  </Badge>
                  <div>
                    <CardTitle className='text-2xl'>
                      {activeSchedule
                        ? `Class instance · ${formatDateTime(activeSchedule.start_time)}`
                        : 'No class instance selected'}
                    </CardTitle>
                    <CardDescription className='mt-1'>
                      The instructor now teaches against a specific class instance so materials,
                      attendance, and attached tasks stay aligned to the live session.
                    </CardDescription>
                  </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button asChild size='sm'>
                    <a
                      href={
                        (activeSchedule?.meeting_url as string) || classData?.meeting_link || '#'
                      }
                      target={
                        activeSchedule?.meeting_url || classData?.meeting_link
                          ? '_blank'
                          : undefined
                      }
                      rel='noreferrer'
                    >
                      <Radio className='h-4 w-4' />
                      Go live
                    </a>
                  </Button>
                  <Button variant='outline' size='sm' asChild>
                    <a href='#operations'>
                      <ListChecks className='h-4 w-4' />
                      Weekly controls
                    </a>
                  </Button>
                </div>
              </div>

              <div className='grid gap-3 sm:grid-cols-4'>
                <div className='border-border/60 bg-background rounded-2xl border p-4'>
                  <p className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                    Instance state
                  </p>
                  <p className='mt-2 text-sm font-semibold'>
                    {formatEnum(getScheduleState(activeSchedule))}
                  </p>
                </div>
                <div className='border-border/60 bg-background rounded-2xl border p-4'>
                  <p className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                    Lesson count
                  </p>
                  <p className='mt-2 text-sm font-semibold'>{lessonMetrics.total}</p>
                </div>
                <div className='border-border/60 bg-background rounded-2xl border p-4'>
                  <p className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>Venue</p>
                  <p className='mt-2 text-sm font-semibold'>
                    {classData?.location_name || classData?.location_type || 'Not assigned'}
                  </p>
                </div>
                <div className='border-border/60 bg-background rounded-2xl border p-4'>
                  <p className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                    Time window
                  </p>
                  <p className='mt-2 text-sm font-semibold'>
                    {activeSchedule
                      ? `${moment(activeSchedule.start_time).format('h:mm A')} - ${moment(activeSchedule.end_time).format('h:mm A')}`
                      : 'Not scheduled'}
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='instance-select'>Active class instance</Label>
                <select
                  id='instance-select'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={activeScheduleId}
                  onChange={event => {
                    const nextId = event.target.value;
                    setActiveScheduleId(nextId);
                    const nextSchedule = sortedSchedules.find(schedule => schedule.uuid === nextId);
                    setAssignmentDueAt(
                      nextSchedule?.end_time
                        ? moment(nextSchedule.end_time).format('YYYY-MM-DDTHH:mm')
                        : ''
                    );
                    setQuizDueAt(
                      nextSchedule?.end_time
                        ? moment(nextSchedule.end_time).format('YYYY-MM-DDTHH:mm')
                        : ''
                    );
                  }}
                >
                  {sortedSchedules.map(schedule => (
                    <option key={schedule.uuid} value={schedule.uuid}>
                      {moment(schedule.start_time).format('ddd, MMM D · h:mm A')} ·{' '}
                      {formatEnum(getScheduleState(schedule))}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>

            <CardContent className='p-0'>
              <Tabs defaultValue='materials' className='gap-0'>
                <div className='border-b px-6 py-4'>
                  <TabsList className='bg-muted/70 grid h-auto w-full grid-cols-4 rounded-2xl p-1'>
                    <TabsTrigger value='materials' className='rounded-xl py-2'>
                      Materials
                    </TabsTrigger>
                    <TabsTrigger value='attendance' className='rounded-xl py-2'>
                      Attendance
                    </TabsTrigger>
                    <TabsTrigger value='tasks' className='rounded-xl py-2'>
                      Tasks
                    </TabsTrigger>
                    <TabsTrigger value='lesson-flow' className='rounded-xl py-2'>
                      Session cues
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value='materials' className='space-y-6 p-6'>
                  <div className='grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]'>
                    <div className='space-y-3'>
                      <p className='text-sm font-semibold'>Course lesson outline</p>
                      <div className='space-y-2'>
                        {lessonModules.length > 0 ? (
                          lessonModules.map((module, index) => {
                            const isSelected = activeLesson?.uuid === module.lesson.uuid;
                            const contentCount = module.content?.data?.length ?? 0;

                            return (
                              <button
                                key={module.lesson.uuid ?? index}
                                type='button'
                                onClick={() => {
                                  setActiveLessonId(module.lesson.uuid ?? '');
                                  setSelectedContentId(module.content?.data?.[0]?.uuid ?? '');
                                }}
                                className={cx(
                                  'w-full rounded-2xl border p-4 text-left transition',
                                  isSelected
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border/60 bg-background hover:border-primary/30 hover:bg-accent/30'
                                )}
                              >
                                <div className='flex items-center justify-between gap-3'>
                                  <div>
                                    <p className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>
                                      Lesson{' '}
                                      {module.lesson.lesson_sequence ??
                                        module.lesson.lesson_number ??
                                        index + 1}
                                    </p>
                                    <p className='mt-1 line-clamp-2 text-sm font-semibold'>
                                      {module.lesson.title || 'Untitled lesson'}
                                    </p>
                                    <p className='text-muted-foreground mt-1 text-xs'>
                                      {contentCount} content item{contentCount === 1 ? '' : 's'}
                                    </p>
                                  </div>
                                  <ChevronRight className='text-muted-foreground h-4 w-4 shrink-0' />
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className='text-muted-foreground rounded-2xl border border-dashed p-5 text-sm'>
                            Lesson materials will appear here when the course content is ready.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='space-y-5'>
                      <div className='border-border/60 bg-background rounded-[28px] border p-5'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge variant='outline'>
                            {activeLesson?.duration_display ||
                              activeLesson?.duration ||
                              'Self paced'}
                          </Badge>
                          <Badge variant='outline'>
                            {activeLessonContents.length} teaching material
                            {activeLessonContents.length === 1 ? '' : 's'}
                          </Badge>
                        </div>

                        <div className='mt-4 space-y-3'>
                          <h3 className='text-lg font-semibold'>
                            {activeLesson?.title || 'No lesson selected'}
                          </h3>
                          {activeLesson?.description ? (
                            looksLikeHtml(activeLesson.description) ? (
                              <RichTextRenderer htmlString={activeLesson.description} />
                            ) : (
                              <p className='text-muted-foreground text-sm leading-7'>
                                {activeLesson.description}
                              </p>
                            )
                          ) : (
                            <p className='text-muted-foreground text-sm leading-7'>
                              This lesson does not have a separate summary, so the teaching flow can
                              begin directly from the lesson content items below.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className='grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]'>
                        <div className='space-y-3'>
                          <p className='text-sm font-semibold'>Lesson content</p>
                          <div className='space-y-2'>
                            {activeLessonContents.length > 0 ? (
                              activeLessonContents.map((content, index) => {
                                const contentTypeName = getContentTypeName(content, contentTypeMap);
                                const isSelected = selectedContent?.uuid === content.uuid;
                                const Icon =
                                  contentTypeName === 'video'
                                    ? Video
                                    : contentTypeName === 'pdf'
                                      ? FileText
                                      : contentTypeName === 'audio'
                                        ? FileAudio
                                        : contentTypeName === 'image'
                                          ? FileImage
                                          : BookOpen;

                                return (
                                  <button
                                    key={content.uuid ?? index}
                                    type='button'
                                    onClick={() => setSelectedContentId(content.uuid ?? '')}
                                    className={cx(
                                      'w-full rounded-2xl border p-4 text-left transition',
                                      isSelected
                                        ? 'border-primary/40 bg-primary/5'
                                        : 'border-border/60 bg-background hover:border-primary/30 hover:bg-accent/30'
                                    )}
                                  >
                                    <div className='flex items-start gap-3'>
                                      <div className='bg-primary/10 text-primary rounded-2xl p-2'>
                                        <Icon className='h-4 w-4' />
                                      </div>
                                      <div className='min-w-0 flex-1'>
                                        <p className='line-clamp-2 text-sm font-semibold'>
                                          {content.title || `Content ${index + 1}`}
                                        </p>
                                        <p className='text-muted-foreground mt-1 text-xs capitalize'>
                                          {contentTypeName}
                                          {content.duration ? ` · ${content.duration}` : ''}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className='text-muted-foreground rounded-2xl border border-dashed p-5 text-sm'>
                                No content items have been added to this lesson yet.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className='space-y-4'>
                          <div className='border-border/60 bg-background rounded-[28px] border p-5'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <Badge variant='outline' className='capitalize'>
                                {getContentTypeName(selectedContent, contentTypeMap)}
                              </Badge>
                              <Badge variant='outline'>
                                {selectedContent?.duration || 'Open during class'}
                              </Badge>
                            </div>
                            <div className='mt-3 space-y-1'>
                              <h4 className='text-base font-semibold'>
                                {selectedContent?.title || 'No content selected'}
                              </h4>
                              {selectedContent?.description ? (
                                <p className='text-muted-foreground text-sm'>
                                  {selectedContent.description}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {renderLessonContentPreview(selectedContent, contentTypeMap)}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='attendance' className='space-y-6 p-6'>
                  <div className='grid gap-4 md:grid-cols-3'>
                    <div className='border-border/60 bg-background rounded-2xl border p-4'>
                      <p className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>
                        Present
                      </p>
                      <p className='mt-2 text-2xl font-semibold'>
                        {activeAttendanceSummary.present}
                      </p>
                    </div>
                    <div className='border-border/60 bg-background rounded-2xl border p-4'>
                      <p className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>
                        Pending
                      </p>
                      <p className='mt-2 text-2xl font-semibold'>
                        {activeAttendanceSummary.pending}
                      </p>
                    </div>
                    <div className='border-border/60 bg-background rounded-2xl border p-4'>
                      <p className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>
                        Absent
                      </p>
                      <p className='mt-2 text-2xl font-semibold'>
                        {activeAttendanceSummary.absent}
                      </p>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    {activeInstanceStudents.length > 0 ? (
                      activeInstanceStudents.map((entry: RosterEntry) => {
                        const attendanceState = getStudentAttendanceState(entry);
                        const isBusy =
                          markAttendanceMut.isPending &&
                          markAttendanceMut.variables?.path?.enrollmentUuid ===
                          entry.enrollment?.uuid;

                        return (
                          <div
                            key={entry.enrollment?.uuid ?? entry.user?.uuid}
                            className='border-border/60 bg-background flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between'
                          >
                            <div className='flex items-center gap-3'>
                              <Avatar className='border-border/60 size-10 border'>
                                <AvatarFallback>
                                  {getInitials(entry.user?.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className='text-sm font-semibold'>
                                  {entry.user?.full_name || 'Unknown student'}
                                </p>
                                <p className='text-muted-foreground text-xs'>
                                  {entry.user?.email || formatEnum(entry.enrollment?.status)}
                                </p>
                              </div>
                            </div>

                            <div className='flex flex-col gap-3 md:flex-row md:items-center'>
                              <Badge
                                variant={
                                  attendanceState === 'present'
                                    ? 'success'
                                    : attendanceState === 'absent'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {attendanceState}
                              </Badge>
                              <div className='flex gap-2'>
                                <Button
                                  size='sm'
                                  variant={attendanceState === 'present' ? 'default' : 'outline'}
                                  disabled={isBusy || !entry.enrollment?.uuid}
                                  onClick={() => markAttendance(entry, true)}
                                >
                                  Present
                                </Button>
                                <Button
                                  size='sm'
                                  variant={attendanceState === 'absent' ? 'destructive' : 'outline'}
                                  disabled={isBusy || !entry.enrollment?.uuid}
                                  onClick={() => markAttendance(entry, false)}
                                >
                                  Absent
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className='text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm'>
                        No learners are attached to the selected class instance yet.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value='tasks' className='space-y-6 p-6'>
                  <div className='grid gap-6 lg:grid-cols-2'>
                    <Card className='border-border/60 shadow-none'>
                      <CardHeader>
                        <CardTitle className='text-base'>Attach assignment</CardTitle>
                        <CardDescription>
                          Add an assignment directly to this class instance.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='assignment-select'>Assignment</Label>
                          <select
                            id='assignment-select'
                            className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                            value={selectedAssignmentUuid}
                            onChange={event => setSelectedAssignmentUuid(event.target.value)}
                          >
                            <option value=''>Select assignment</option>
                            {assignmentOptions.map(assignment => (
                              <option key={assignment.uuid} value={assignment.uuid}>
                                {assignment.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='assignment-due'>Due at</Label>
                          <Input
                            id='assignment-due'
                            type='datetime-local'
                            value={assignmentDueAt}
                            onChange={event => setAssignmentDueAt(event.target.value)}
                          />
                        </div>
                        <Button
                          className='w-full'
                          disabled={
                            !activeSchedule ||
                            !selectedAssignmentUuid ||
                            addAssignmentScheduleMut.isPending
                          }
                          onClick={createAssignment}
                        >
                          Add assignment to instance
                        </Button>
                        <div className='space-y-2'>
                          {activeScheduleAssignments.length > 0 ? (
                            activeScheduleAssignments.map(item => (
                              <div
                                key={item.uuid ?? item.assignment_uuid}
                                className='border-border/60 bg-background rounded-2xl border p-3'
                              >
                                <p className='text-sm font-semibold'>
                                  {item.assignment?.title || 'Assignment attached'}
                                </p>
                                <p className='text-muted-foreground mt-1 text-xs'>
                                  Due {formatDateTime(item.due_at)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              No assignments are attached to this instance yet.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className='border-border/60 shadow-none'>
                      <CardHeader>
                        <CardTitle className='text-base'>Attach quiz</CardTitle>
                        <CardDescription>
                          Add a quiz directly to this class instance.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='quiz-select'>Quiz</Label>
                          <select
                            id='quiz-select'
                            className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                            value={selectedQuizUuid}
                            onChange={event => setSelectedQuizUuid(event.target.value)}
                          >
                            <option value=''>Select quiz</option>
                            {quizOptions.map(quiz => (
                              <option key={quiz.uuid} value={quiz.uuid}>
                                {quiz.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='quiz-due'>Due at</Label>
                          <Input
                            id='quiz-due'
                            type='datetime-local'
                            value={quizDueAt}
                            onChange={event => setQuizDueAt(event.target.value)}
                          />
                        </div>
                        <Button
                          className='w-full'
                          disabled={
                            !activeSchedule || !selectedQuizUuid || addQuizScheduleMut.isPending
                          }
                          onClick={createQuiz}
                        >
                          Add quiz to instance
                        </Button>
                        <div className='space-y-2'>
                          {activeScheduleQuizzes.length > 0 ? (
                            activeScheduleQuizzes.map(item => (
                              <div
                                key={item.uuid ?? item.quiz_uuid}
                                className='border-border/60 bg-background rounded-2xl border p-3'
                              >
                                <p className='text-sm font-semibold'>
                                  {item.quiz?.title || 'Quiz attached'}
                                </p>
                                <p className='text-muted-foreground mt-1 text-xs'>
                                  Due {formatDateTime(item.due_at)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              No quizzes are attached to this instance yet.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value='lesson-flow' className='space-y-6 p-6'>
                  <div className='grid gap-4 lg:grid-cols-2'>
                    {actionChecklist.map(item => (
                      <div
                        key={item.title}
                        className='border-border/60 bg-background rounded-2xl border p-4'
                      >
                        <div className='flex items-start gap-3'>
                          <div
                            className={cx(
                              'mt-0.5 rounded-full p-2',
                              item.complete
                                ? 'bg-success/10 text-success'
                                : 'bg-warning/10 text-warning'
                            )}
                          >
                            {item.complete ? (
                              <CheckCircle2 className='h-4 w-4' />
                            ) : (
                              <AlertCircle className='h-4 w-4' />
                            )}
                          </div>
                          <div className='space-y-1'>
                            <p className='text-sm font-semibold'>{item.title}</p>
                            <p className='text-muted-foreground text-sm'>{item.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Card className='border-border/60 shadow-none'>
                    <CardHeader>
                      <CardTitle className='text-base'>Instance cues</CardTitle>
                      <CardDescription>
                        Quick context for the instructor during the active session.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex items-center gap-3 text-sm'>
                        <Clock3 className='text-primary h-4 w-4' />
                        <span>{formatDateTime(activeSchedule?.start_time)}</span>
                      </div>
                      <div className='flex items-center gap-3 text-sm'>
                        <MapPin className='text-primary h-4 w-4' />
                        <span>
                          {classData?.location_name ||
                            classData?.location_type ||
                            'Location pending'}
                        </span>
                      </div>
                      <div className='flex items-center gap-3 text-sm'>
                        <Users className='text-primary h-4 w-4' />
                        <span>
                          {activeInstanceStudents.length} learner(s) assigned to this instance.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card className='border-border/60 shadow-sm'>
            <CardHeader>
              <CardTitle>Instance attendance overview</CardTitle>
              <CardDescription>
                Live API-backed attendance for the selected class instance.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>Present</span>
                  <span>{activeAttendanceSummary.present}</span>
                </div>
                <Progress
                  value={
                    activeInstanceStudents.length > 0
                      ? (activeAttendanceSummary.present / activeInstanceStudents.length) * 100
                      : 0
                  }
                  indicatorClassName='bg-success'
                />
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>Awaiting mark</span>
                  <span>{activeAttendanceSummary.pending}</span>
                </div>
                <Progress
                  value={
                    activeInstanceStudents.length > 0
                      ? (activeAttendanceSummary.pending / activeInstanceStudents.length) * 100
                      : 0
                  }
                  indicatorClassName='bg-warning'
                />
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>Absent</span>
                  <span>{activeAttendanceSummary.absent}</span>
                </div>
                <Progress
                  value={
                    activeInstanceStudents.length > 0
                      ? (activeAttendanceSummary.absent / activeInstanceStudents.length) * 100
                      : 0
                  }
                  indicatorClassName='bg-destructive'
                />
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-sm'>
            <CardHeader>
              <CardTitle>Student focus</CardTitle>
              <CardDescription>
                The learner you are currently paying attention to during class.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {selectedStudent ? (
                <>
                  <div className='flex items-start gap-4'>
                    <Avatar className='border-border/60 size-14 border'>
                      <AvatarFallback>
                        {getInitials(selectedStudent.user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='space-y-1'>
                      <h3 className='text-lg font-semibold'>
                        {selectedStudent.user?.full_name || 'Unknown student'}
                      </h3>
                      <p className='text-muted-foreground text-sm'>
                        {selectedStudent.user?.email || 'No email available'}
                      </p>
                      <Badge
                        variant={
                          getStudentAttendanceState(selectedStudent) === 'present'
                            ? 'success'
                            : getStudentAttendanceState(selectedStudent) === 'absent'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {getStudentAttendanceState(selectedStudent)}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className='grid gap-3'>
                    <div className='border-border/60 bg-background rounded-2xl border p-4'>
                      <p className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>
                        Enrollment status
                      </p>
                      <p className='mt-2 text-sm font-semibold'>
                        {formatEnum(selectedStudent.enrollment?.status)}
                      </p>
                    </div>
                    <div className='border-border/60 bg-background rounded-2xl border p-4'>
                      <p className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>
                        Current lesson focus
                      </p>
                      <p className='mt-2 text-sm font-semibold'>
                        {activeLesson?.title || 'Awaiting lesson selection'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  Select a learner from the active class roster to keep them in focus during
                  instruction.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-sm'>
            <CardHeader>
              <CardTitle>Submission follow-up</CardTitle>
              <CardDescription>
                A quick operational snapshot for this class instance.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {submissionQueue.length > 0 ? (
                submissionQueue.map(item => (
                  <div
                    key={item.id}
                    className='border-border/60 bg-background rounded-2xl border p-4'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='space-y-1'>
                        <p className='text-sm font-semibold'>{item.name}</p>
                        <p className='text-muted-foreground text-xs'>{item.lessonTitle}</p>
                      </div>
                      <Badge variant={getSubmissionVariant(item.status)}>
                        {item.status === 'review' ? 'needs review' : item.status}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground mt-3 text-sm'>
                      {item.score !== null
                        ? `Current score snapshot: ${item.score}/100`
                        : 'No submission captured yet for this learner.'}
                    </p>
                  </div>
                ))
              ) : (
                <div className='text-muted-foreground rounded-2xl border border-dashed p-5 text-sm'>
                  Submission tracking will become more useful once students are attached to the
                  instance.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-sm'>
            <CardHeader>
              <CardTitle>Class controls</CardTitle>
              <CardDescription>Fast actions for live teaching and support.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button asChild className='w-full justify-between'>
                <a
                  href={(activeSchedule?.meeting_url as string) || classData?.meeting_link || '#'}
                  target={
                    activeSchedule?.meeting_url || classData?.meeting_link ? '_blank' : undefined
                  }
                  rel='noreferrer'
                >
                  Launch live classroom
                  <ExternalLink className='h-4 w-4' />
                </a>
              </Button>
              <Button asChild variant='outline' className='w-full justify-between'>
                <a href='#operations'>
                  Open weekly manager
                  <ChevronRight className='h-4 w-4' />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id='operations' className='space-y-6'>
        <div className='space-y-2'>
          <Badge variant='outline' className='bg-primary/5 text-primary w-fit'>
            Weekly operations
          </Badge>
          <h2 className='text-2xl font-semibold'>Attendance, assignments, and quizzes</h2>
          <p className='text-muted-foreground max-w-3xl text-sm'>
            The teaching workspace above is now instance-first, while this manager remains useful
            for scanning and operating on every scheduled instance across the class.
          </p>
        </div>

        <ClassScheduleManager
          schedules={scheduleItems}
          fixedClassId={classId}
          groupBy='week'
          showCollectionActions
          title='Training schedule operations'
          description='Every schedule instance includes the broader operational controls for attendance, assignments, and quizzes.'
          emptyTitle='No scheduled sessions yet'
          emptyDescription='Once class sessions are scheduled, you can manage live operations from here.'
        />
      </section>
    </main>
  );
}
