'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useClassRoster, type RosterEntry } from '@/hooks/use-class-roster';
import { useInstructor } from '@/context/instructor-context';
import { cx, getCardClasses, getEmptyStateClasses } from '@/lib/design-system';
import {
  createAssignmentScheduleMutation,
  createQuizScheduleMutation,
  deleteAssignmentScheduleMutation,
  deleteQuizScheduleMutation,
  getAllAssignmentsOptions,
  getAllQuizzesOptions,
  getAssignmentAttachmentsOptions,
  getAssignmentByUuidOptions,
  getAssignmentSchedulesOptions,
  getAssignmentSchedulesQueryKey,
  getEnrollmentsForClassQueryKey,
  getQuizByUuidOptions,
  getQuizSchedulesOptions,
  getQuizSchedulesQueryKey,
  markAttendanceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  File,
  FileText,
  MapPin,
  MoreVertical,
  Paperclip,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import moment from 'moment';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { QuizzesSheet } from '@/app/dashboard/@instructor/trainings/instructor-console/[id]/quiz-sheet';
import type {
  Assignment,
  AssignmentAttachment,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  Enrollment,
  Quiz,
} from '@/services/client';

export type ManagedScheduleItem = {
  uuid: string;
  classId: string;
  classTitle: string;
  courseName?: string;
  start_time: string | Date;
  end_time: string | Date;
  duration_formatted?: string;
  location_name?: string;
  location_type?: string;
  session_format?: string;
  meeting_url?: string;
  status?: string;
};

type Props = {
  schedules: ManagedScheduleItem[];
  title?: string;
  description?: string;
  groupBy?: 'week' | 'day' | 'none';
  fixedClassId?: string;
  showCollectionActions?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

type ScheduleRosterMap = Record<string, RosterEntry[]>;
type EnrollmentMap = Record<string, Enrollment[]>;
type AssignmentDetailsMap = Record<string, Assignment>;
type AssignmentAttachmentsMap = Record<string, AssignmentAttachment[]>;
type QuizDetailsMap = Record<string, Quiz>;
type AssignmentScheduleWithDetails = ClassAssignmentSchedule & {
  assignment: Assignment | null;
  attachments: AssignmentAttachment[];
};
type QuizScheduleWithDetails = ClassQuizSchedule & {
  quiz: Quiz | null;
};

function getFileIcon(filename: string) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return { icon: FileText, color: 'text-destructive' };
    case 'doc':
    case 'docx':
      return { icon: FileText, color: 'text-primary' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return { icon: File, color: 'text-success' };
    default:
      return { icon: File, color: 'text-muted-foreground' };
  }
}

function downloadFile(url: string, filename?: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? 'download';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function humanizeEnum(value?: string) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function groupSchedules(schedules: ManagedScheduleItem[], groupBy: Props['groupBy']) {
  if (groupBy === 'none') {
    return [{ label: 'Sessions', items: schedules }];
  }

  const groups = new Map<string, ManagedScheduleItem[]>();

  schedules.forEach(schedule => {
    const start = moment(schedule.start_time);
    const label =
      groupBy === 'day'
        ? start.format('dddd, MMM D, YYYY')
        : `${start.clone().startOf('week').format('MMM D')} - ${start.clone().endOf('week').format('MMM D, YYYY')}`;

    if (!groups.has(label)) {
      groups.set(label, []);
    }

    groups.get(label)?.push(schedule);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items: items.sort((a, b) => moment(a.start_time).diff(moment(b.start_time))),
  }));
}

export function ClassScheduleManager({
  schedules,
  title = 'Class schedule',
  description,
  groupBy = 'week',
  fixedClassId,
  showCollectionActions = false,
  loading,
  emptyTitle = 'No schedules available',
  emptyDescription = 'There are no schedule instances to manage yet.',
}: Props) {
  const queryClient = useQueryClient();
  const instructor = useInstructor();
  const [selectedSchedule, setSelectedSchedule] = useState<ManagedScheduleItem | null>(null);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isAssignmentsSheetOpen, setIsAssignmentsSheetOpen] = useState(false);
  const [isQuizzesSheetOpen, setIsQuizzesSheetOpen] = useState(false);
  const [expandedAssignmentUuid, setExpandedAssignmentUuid] = useState<string | null>(null);

  const [selectedAssignmentUuid, setSelectedAssignmentUuid] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [visibleAt, setVisibleAt] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [gradingDueAt, setGradingDueAt] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const [selectedQuizUuid, setSelectedQuizUuid] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizVisibleAt, setQuizVisibleAt] = useState('');
  const [quizDueDate, setQuizDueDate] = useState('');
  const [timeLimitOverride, setTimeLimitOverride] = useState('');
  const [attemptLimitOverride, setAttemptLimitOverride] = useState('');
  const [passingScoreOverride, setPassingScoreOverride] = useState('');
  const [quizNotes, setQuizNotes] = useState('');
  const [loadingEnrollmentUuid, setLoadingEnrollmentUuid] = useState<string | null>(null);

  const activeClassId = fixedClassId ?? selectedSchedule?.classId;
  const { rosterAllEnrollments, isLoading: rosterLoading } = useClassRoster(activeClassId);

  const groupedSchedules = useMemo(
    () =>
      groupSchedules(
        [...schedules].sort((a, b) => moment(a.start_time).diff(moment(b.start_time))),
        groupBy
      ),
    [groupBy, schedules]
  );

  const studentsByScheduleInstance = useMemo<ScheduleRosterMap>(() => {
    const map: ScheduleRosterMap = {};
    rosterAllEnrollments.forEach(entry => {
      const uuid = entry.enrollment.scheduled_instance_uuid;
      if (!uuid) return;
      if (!map[uuid]) {
        map[uuid] = [];
      }
      map[uuid].push(entry);
    });
    return map;
  }, [rosterAllEnrollments]);

  const enrollmentsByStudent = useMemo<EnrollmentMap>(() => {
    const map: EnrollmentMap = {};
    rosterAllEnrollments.forEach(entry => {
      const studentId = entry.user?.uuid;
      if (!studentId) return;
      if (!map[studentId]) {
        map[studentId] = [];
      }
      if (entry.enrollment.scheduled_instance_uuid) {
        map[studentId].push(entry.enrollment);
      }
    });
    return map;
  }, [rosterAllEnrollments]);

  const selectedScheduleStudents = selectedSchedule
    ? (studentsByScheduleInstance[selectedSchedule.uuid] ?? [])
    : [];

  const filteredScheduleStudents = useMemo(
    () =>
      selectedScheduleStudents.filter(entry =>
        entry.user?.full_name?.toLowerCase().includes(attendanceSearch.toLowerCase())
      ),
    [attendanceSearch, selectedScheduleStudents]
  );

  const calculateStudentAttendance = (studentId: string) => {
    const enrollments = enrollmentsByStudent[studentId] ?? [];
    const totalSessions = schedules.filter(schedule => schedule.classId === activeClassId).length;
    const markedSessions = enrollments.filter(item => item.is_attendance_marked);
    const presentSessions = markedSessions.filter(item => item.did_attend === true);

    return {
      totalSessions,
      presentCount: presentSessions.length,
      percentage: totalSessions > 0 ? (presentSessions.length / totalSessions) * 100 : 0,
    };
  };

  const { data: allAssignments } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: { size: 100 } } }),
    enabled: !!activeClassId,
  });
  const { data: allQuizzes } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: { size: 100 } } }),
    enabled: !!activeClassId,
  });

  const { data: assignmentSchedules } = useQuery({
    ...getAssignmentSchedulesOptions({ path: { classUuid: activeClassId as string } }),
    enabled: !!activeClassId,
  });
  const { data: quizSchedules } = useQuery({
    ...getQuizSchedulesOptions({ path: { classUuid: activeClassId as string } }),
    enabled: !!activeClassId,
  });

  const assignmentUuids = useMemo(
    () =>
      [
        ...new Set(
          (assignmentSchedules?.data ?? [])
            .map(item => item.assignment_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        ),
      ],
    [assignmentSchedules]
  );

  const quizUuids = useMemo(
    () =>
      [
        ...new Set(
          (quizSchedules?.data ?? [])
            .map(item => item.quiz_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        ),
      ],
    [quizSchedules]
  );

  const assignmentDetailQueries = useQueries({
    queries: assignmentUuids.map(uuid => ({
      ...getAssignmentByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const assignmentAttachmentQueries = useQueries({
    queries: assignmentUuids.map(uuid => ({
      ...getAssignmentAttachmentsOptions({ path: { assignmentUuid: uuid } }),
      enabled: !!uuid,
    })),
  });

  const quizDetailQueries = useQueries({
    queries: quizUuids.map(uuid => ({
      ...getQuizByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const assignmentDetailsMap = useMemo<AssignmentDetailsMap>(() => {
    const map: AssignmentDetailsMap = {};
    assignmentDetailQueries.forEach(query => {
      const data = query.data?.data;
      if (data?.uuid) {
        map[data.uuid] = data;
      }
    });
    return map;
  }, [assignmentDetailQueries]);

  const assignmentAttachmentsMap = useMemo<AssignmentAttachmentsMap>(() => {
    const map: AssignmentAttachmentsMap = {};
    assignmentAttachmentQueries.forEach((query, index) => {
      const uuid = assignmentUuids[index];
      if (uuid) {
        map[uuid] = query.data?.data ?? [];
      }
    });
    return map;
  }, [assignmentAttachmentQueries, assignmentUuids]);

  const quizDetailsMap = useMemo<QuizDetailsMap>(() => {
    const map: QuizDetailsMap = {};
    quizDetailQueries.forEach(query => {
      const data = query.data?.data;
      if (data?.uuid) {
        map[data.uuid] = data;
      }
    });
    return map;
  }, [quizDetailQueries]);

  const mergedAssignments = useMemo<AssignmentScheduleWithDetails[]>(
    () =>
      (assignmentSchedules?.data ?? [])
        .map(item => ({
          ...item,
          assignment: assignmentDetailsMap[item.assignment_uuid] ?? null,
          attachments: assignmentAttachmentsMap[item.assignment_uuid] ?? [],
        }))
        .filter(
          (item): item is AssignmentScheduleWithDetails =>
            item.assignment !== null && item.assignment !== undefined
        ),
    [assignmentAttachmentsMap, assignmentDetailsMap, assignmentSchedules]
  );

  const mergedQuizzes = useMemo<QuizScheduleWithDetails[]>(
    () =>
      (quizSchedules?.data ?? [])
        .map(item => ({
          ...item,
          quiz: quizDetailsMap[item.quiz_uuid] ?? null,
        }))
        .filter(
          (item): item is QuizScheduleWithDetails =>
            item.quiz !== null && item.quiz !== undefined
        ),
    [quizDetailsMap, quizSchedules]
  );

  const markAttendanceMut = useMutation(markAttendanceMutation());
  const addAssignmentScheduleMut = useMutation(createAssignmentScheduleMutation());
  const addQuizScheduleMut = useMutation(createQuizScheduleMutation());
  const deleteAssignmentScheduleMut = useMutation(deleteAssignmentScheduleMutation());
  const deleteQuizScheduleMut = useMutation(deleteQuizScheduleMutation());

  const launchClass = (schedule: ManagedScheduleItem) => {
    const meetingLink = schedule.meeting_url || 'https://meet.google.com/abc-defg-hij';
    window.open(meetingLink, '_blank', 'noopener,noreferrer');
    toast.success('Opening class meeting');
  };

  const markAttendance = (studentId: string, enrollmentUuid: string, isPresent: boolean) => {
    setLoadingEnrollmentUuid(enrollmentUuid);
    markAttendanceMut.mutate(
      { path: { enrollmentUuid }, query: { attended: isPresent } },
      {
        onSuccess: () => {
          const name = selectedScheduleStudents.find(
            entry => entry.user?.uuid === studentId
          )?.user?.full_name;
          toast.success(`Marked ${isPresent ? 'present' : 'absent'}${name ? ` for ${name}` : ''}.`);
        },
        onSettled: () => {
          setLoadingEnrollmentUuid(null);
          if (activeClassId) {
            queryClient.invalidateQueries({
              queryKey: getEnrollmentsForClassQueryKey({
                path: { uuid: activeClassId },
              }),
            });
          }
        },
      }
    );
  };

  const openAttendance = (schedule: ManagedScheduleItem) => {
    setSelectedSchedule(schedule);
    setAttendanceSearch('');
    setIsAttendanceOpen(true);
  };

  const openAssignmentDialog = (schedule: ManagedScheduleItem) => {
    setSelectedSchedule(schedule);
    setSelectedAssignmentUuid('');
    setSelectedAssignment(null);
    setVisibleAt('');
    setAssignmentDueDate('');
    setGradingDueAt('');
    setMaxAttempts('1');
    setAssignmentNotes('');
    setIsAssignmentDialogOpen(true);
  };

  const openQuizDialog = (schedule: ManagedScheduleItem) => {
    setSelectedSchedule(schedule);
    setSelectedQuizUuid('');
    setSelectedQuiz(null);
    setQuizVisibleAt('');
    setQuizDueDate('');
    setTimeLimitOverride('');
    setAttemptLimitOverride('');
    setPassingScoreOverride('');
    setQuizNotes('');
    setIsQuizDialogOpen(true);
  };

  const createAssignment = () => {
    if (!selectedSchedule || !selectedAssignmentUuid) return;

    const visibleAtDate = visibleAt ? new Date(visibleAt) : undefined;
    const assignmentDueDateValue = assignmentDueDate ? new Date(assignmentDueDate) : undefined;
    const gradingDueAtDate = gradingDueAt ? new Date(gradingDueAt) : undefined;

    addAssignmentScheduleMut.mutate(
      {
        path: { classUuid: selectedSchedule.classId },
        body: {
          class_definition_uuid: selectedSchedule.classId,
          lesson_uuid: selectedAssignment?.lesson_uuid,
          assignment_uuid: selectedAssignmentUuid,
          class_lesson_plan_uuid: selectedSchedule.uuid,
          visible_at: visibleAtDate,
          due_at: assignmentDueDateValue,
          grading_due_at: gradingDueAtDate,
          timezone: 'Africa/Lagos',
          release_strategy: 'CUSTOM',
          max_attempts: Number(maxAttempts),
          instructor_uuid: instructor?.uuid,
          notes: assignmentNotes,
        },
      },
      {
        onSuccess: () => {
          toast.success('Assignment added to class session.');
          setIsAssignmentDialogOpen(false);
          queryClient.invalidateQueries({
            queryKey: getAssignmentSchedulesQueryKey({
              path: { classUuid: selectedSchedule.classId },
            }),
          });
        },
      }
    );
  };

  const createQuiz = () => {
    if (!selectedSchedule || !selectedQuizUuid) return;

    const quizVisibleAtDate = quizVisibleAt ? new Date(quizVisibleAt) : undefined;
    const quizDueDateValue = quizDueDate ? new Date(quizDueDate) : undefined;

    addQuizScheduleMut.mutate(
      {
        path: { classUuid: selectedSchedule.classId },
        body: {
          class_definition_uuid: selectedSchedule.classId,
          lesson_uuid: selectedQuiz?.lesson_uuid,
          quiz_uuid: selectedQuizUuid,
          class_lesson_plan_uuid: selectedSchedule.uuid,
          visible_at: quizVisibleAtDate,
          due_at: quizDueDateValue,
          timezone: 'Africa/Lagos',
          release_strategy: 'CUSTOM',
          time_limit_override: timeLimitOverride ? Number(timeLimitOverride) : undefined,
          attempt_limit_override: attemptLimitOverride ? Number(attemptLimitOverride) : undefined,
          passing_score_override: passingScoreOverride ? Number(passingScoreOverride) : undefined,
          instructor_uuid: instructor?.uuid,
          notes: quizNotes,
        },
      },
      {
        onSuccess: () => {
          toast.success('Quiz added to class session.');
          setIsQuizDialogOpen(false);
          queryClient.invalidateQueries({
            queryKey: getQuizSchedulesQueryKey({
              path: { classUuid: selectedSchedule.classId },
            }),
          });
        },
      }
    );
  };

  const removeAssignment = (classId: string, scheduleUuid: string) => {
    deleteAssignmentScheduleMut.mutate(
      { path: { classUuid: classId, scheduleUuid } },
      {
        onSuccess: () => {
          toast.success('Assignment removed from class.');
          queryClient.invalidateQueries({
            queryKey: getAssignmentSchedulesQueryKey({ path: { classUuid: classId } }),
          });
        },
      }
    );
  };

  const removeQuiz = (classId: string, scheduleUuid: string) => {
    deleteQuizScheduleMut.mutate(
      { path: { classUuid: classId, scheduleUuid } },
      {
        onSuccess: () => {
          toast.success('Quiz removed from class.');
          queryClient.invalidateQueries({
            queryKey: getQuizSchedulesQueryKey({ path: { classUuid: classId } }),
          });
        },
      }
    );
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-28 w-full rounded-[28px]' />
        <Skeleton className='h-28 w-full rounded-[28px]' />
        <Skeleton className='h-28 w-full rounded-[28px]' />
      </div>
    );
  }

  if (!schedules.length) {
    return (
      <div className={getEmptyStateClasses()}>
        <Calendar className='text-primary/70 h-10 w-10' />
        <div className='space-y-1'>
          <h3 className='text-lg font-semibold'>{emptyTitle}</h3>
          <p className='text-muted-foreground max-w-lg text-sm'>{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      <div className='border-border/60 bg-card/90 flex flex-col gap-4 rounded-[28px] border p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <h2 className='text-foreground text-xl font-semibold'>{title}</h2>
          {description ? <p className='text-muted-foreground text-sm'>{description}</p> : null}
        </div>

        {showCollectionActions && activeClassId ? (
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Button
              variant='outline'
              className='justify-between gap-2'
              onClick={() => setIsAssignmentsSheetOpen(true)}
            >
              <FileText className='h-4 w-4' />
              Assignments
              <Badge variant='secondary'>{mergedAssignments.length}</Badge>
            </Button>
            <Button
              variant='outline'
              className='justify-between gap-2'
              onClick={() => setIsQuizzesSheetOpen(true)}
            >
              <ClipboardList className='h-4 w-4' />
              Quizzes
              <Badge variant='secondary'>{mergedQuizzes.length}</Badge>
            </Button>
          </div>
        ) : null}
      </div>

      <div className='space-y-6'>
        {groupedSchedules.map(group => (
          <section key={group.label} className='space-y-3'>
            {groupBy !== 'none' ? (
              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl'>
                  <Calendar className='h-4 w-4' />
                </div>
                <div>
                  <h3 className='text-foreground text-base font-semibold'>{group.label}</h3>
                  <p className='text-muted-foreground text-xs'>
                    {group.items.length} session{group.items.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            ) : null}

            <div className='grid gap-4 2xl:grid-cols-2'>
              {group.items.map(schedule => {
                const isPast = moment(schedule.end_time).isBefore(moment());
                const isLive =
                  moment(schedule.start_time).isBefore(moment()) &&
                  moment(schedule.end_time).isAfter(moment());
                const students = studentsByScheduleInstance[schedule.uuid] ?? [];
                const rosterPreviewAvailable =
                  !!fixedClassId || selectedSchedule?.classId === schedule.classId;

                return (
                  <Card
                    key={schedule.uuid}
                    className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}
                  >
                    <CardHeader className='space-y-4 p-5 pb-3 sm:p-6'>
                      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                        <div className='space-y-3'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <Badge variant={isLive ? 'success' : isPast ? 'secondary' : 'outline'}>
                              {isLive ? 'Live now' : isPast ? 'Completed' : 'Upcoming'}
                            </Badge>
                            {schedule.courseName ? (
                              <Badge variant='secondary'>{schedule.courseName}</Badge>
                            ) : null}
                            <Badge variant='outline'>{humanizeEnum(schedule.session_format)}</Badge>
                          </div>

                          <div className='space-y-1'>
                            <h3 className='text-foreground text-lg font-semibold'>
                              {schedule.classTitle}
                            </h3>
                            <p className='text-muted-foreground text-sm'>
                              {moment(schedule.start_time).format('dddd, MMM D')} ·{' '}
                              {moment(schedule.start_time).format('h:mm A')} -{' '}
                              {moment(schedule.end_time).format('h:mm A')}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center gap-2 self-start'>
                          <Button size='sm' className='gap-2' onClick={() => launchClass(schedule)}>
                            <Video className='h-4 w-4' />
                            Launch
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='outline' size='icon'>
                                <MoreVertical className='h-4 w-4' />
                                <span className='sr-only'>Open actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-48'>
                              <DropdownMenuItem onClick={() => openAttendance(schedule)}>
                                <UserCheck className='mr-2 h-4 w-4' />
                                Mark attendance
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAssignmentDialog(schedule)}>
                                <FileText className='mr-2 h-4 w-4' />
                                Add assignment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openQuizDialog(schedule)}>
                                <ClipboardList className='mr-2 h-4 w-4' />
                                Add quiz
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className='space-y-5 p-5 pt-0 sm:p-6 sm:pt-0'>
                      <div className='grid gap-3 md:grid-cols-2 2xl:grid-cols-3'>
                        <div className='border-border/60 bg-background/70 min-w-0 rounded-2xl border p-3'>
                          <div className='text-muted-foreground mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                            <Clock className='h-3.5 w-3.5' />
                            Duration
                          </div>
                          <div className='text-foreground text-sm font-medium break-words'>
                            {schedule.duration_formatted ?? 'Not available'}
                          </div>
                        </div>
                        <div className='border-border/60 bg-background/70 min-w-0 rounded-2xl border p-3'>
                          <div className='text-muted-foreground mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                            <MapPin className='h-3.5 w-3.5' />
                            Location
                          </div>
                          <div className='text-foreground text-sm font-medium break-words'>
                            {schedule.location_name || humanizeEnum(schedule.location_type)}
                          </div>
                        </div>
                        <div className='border-border/60 bg-background/70 min-w-0 rounded-2xl border p-3 md:col-span-2 2xl:col-span-1'>
                          <div className='text-muted-foreground mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                            <Users className='h-3.5 w-3.5' />
                            Session roster
                          </div>
                          <div className='text-foreground text-sm font-medium break-words'>
                            {rosterPreviewAvailable
                              ? `${students.length} student${students.length === 1 ? '' : 's'}`
                              : 'Load in attendance'}
                          </div>
                        </div>
                      </div>

                      <div className='flex flex-col gap-3 xl:flex-row xl:flex-wrap'>
                        <Button
                          variant='outline'
                          className='gap-2 xl:flex-1'
                          onClick={() => openAttendance(schedule)}
                        >
                          <UserCheck className='h-4 w-4' />
                          Manage attendance
                        </Button>
                        <Button
                          variant='outline'
                          className='gap-2 xl:flex-1'
                          onClick={() => openAssignmentDialog(schedule)}
                        >
                          <Plus className='h-4 w-4' />
                          Add assignment
                        </Button>
                        <Button
                          variant='outline'
                          className='gap-2 xl:flex-1'
                          onClick={() => openQuizDialog(schedule)}
                        >
                          <PlayCircle className='h-4 w-4' />
                          Add quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Sheet open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
        <SheetContent className='w-full overflow-hidden p-0 sm:max-w-full lg:max-w-[920px]'>
          <div className='flex h-full flex-col'>
            <div className='border-b px-5 py-4 sm:px-6'>
              <SheetHeader>
                <SheetTitle>Attendance management</SheetTitle>
                <SheetDescription>
                  {selectedSchedule
                    ? `${selectedSchedule.classTitle} · ${moment(selectedSchedule.start_time).format('dddd, MMM D, h:mm A')}`
                    : 'Select attendance for this class session.'}
                </SheetDescription>
              </SheetHeader>

              <div className='relative mt-4'>
                <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  value={attendanceSearch}
                  onChange={event => setAttendanceSearch(event.target.value)}
                  placeholder='Search students'
                  className='pl-9'
                />
              </div>
            </div>

            <div className='flex-1 overflow-y-auto px-5 py-5 sm:px-6'>
              {rosterLoading ? (
                <div className='space-y-3'>
                  <Skeleton className='h-20 w-full rounded-2xl' />
                  <Skeleton className='h-20 w-full rounded-2xl' />
                  <Skeleton className='h-20 w-full rounded-2xl' />
                </div>
              ) : filteredScheduleStudents.length === 0 ? (
                <div className={cx(getEmptyStateClasses(), 'min-h-[240px]')}>
                  <Users className='text-primary/70 h-10 w-10' />
                  <div className='space-y-1'>
                    <h3 className='text-lg font-semibold'>No students found</h3>
                    <p className='text-muted-foreground text-sm'>
                      {attendanceSearch
                        ? 'Adjust the search query to find enrolled students.'
                        : 'This session does not have any enrolled students yet.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className='border-border/60 bg-card/80 overflow-hidden rounded-[24px] border'>
                  <div className='max-h-full overflow-auto'>
                    <Table>
                      <TableHeader className='bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 backdrop-blur'>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredScheduleStudents.map(entry => {
                          const name = entry?.user?.full_name ?? 'Unknown student';
                          const enrollmentUuid = entry?.enrollment?.uuid;
                          const studentId = entry?.user?.uuid;
                          const currentStatus = entry?.enrollment?.did_attend;
                          const stats = studentId ? calculateStudentAttendance(studentId) : null;
                          const initials = name
                            .split(' ')
                            .map((part: string) => part[0])
                            .slice(0, 2)
                            .join('');
                          const isLoadingRow =
                            loadingEnrollmentUuid === enrollmentUuid && markAttendanceMut.isPending;

                          return (
                            <TableRow key={enrollmentUuid}>
                              <TableCell>
                                <div className='flex items-center gap-3'>
                                  <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold'>
                                    {initials}
                                  </div>
                                  <div className='min-w-0'>
                                    <p className='text-foreground truncate font-medium'>{name}</p>
                                    <p className='text-muted-foreground text-xs'>
                                      {stats?.presentCount ?? 0} of {stats?.totalSessions ?? 0}{' '}
                                      attended
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    currentStatus === true
                                      ? 'success'
                                      : currentStatus === false
                                        ? 'destructive'
                                        : 'secondary'
                                  }
                                >
                                  {currentStatus === true
                                    ? 'Present'
                                    : currentStatus === false
                                      ? 'Absent'
                                      : 'Pending'}
                                </Badge>
                              </TableCell>
                              <TableCell className='min-w-[180px]'>
                                <div className='space-y-2'>
                                  <div className='text-muted-foreground flex items-center justify-between text-xs'>
                                    <span>Overall attendance</span>
                                    <span>{Math.round(stats?.percentage ?? 0)}%</span>
                                  </div>
                                  <Progress value={stats?.percentage ?? 0} className='h-2' />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className='flex justify-end gap-2'>
                                  <Button
                                    variant={currentStatus === true ? 'default' : 'outline'}
                                    className='gap-2'
                                    disabled={
                                      !studentId ||
                                      !enrollmentUuid ||
                                      currentStatus === true ||
                                      isLoadingRow
                                    }
                                    onClick={() => markAttendance(studentId, enrollmentUuid, true)}
                                  >
                                    {isLoadingRow ? (
                                      <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                                    ) : (
                                      <CheckCircle className='h-4 w-4' />
                                    )}
                                    Present
                                  </Button>
                                  <Button
                                    variant={currentStatus === false ? 'destructive' : 'outline'}
                                    className='gap-2'
                                    disabled={
                                      !studentId ||
                                      !enrollmentUuid ||
                                      currentStatus === false ||
                                      isLoadingRow
                                    }
                                    onClick={() => markAttendance(studentId, enrollmentUuid, false)}
                                  >
                                    {isLoadingRow ? (
                                      <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                                    ) : (
                                      <XCircle className='h-4 w-4' />
                                    )}
                                    Absent
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <SheetContent className='w-full overflow-y-auto p-0 sm:max-w-[560px]'>
          <div className='flex h-full flex-col gap-6 p-6'>
            <SheetHeader>
              <SheetTitle>Add assignment</SheetTitle>
              <SheetDescription>
                {selectedSchedule
                  ? `Schedule work for ${selectedSchedule.classTitle} on ${moment(selectedSchedule.start_time).format('MMM D, YYYY')}.`
                  : 'Choose an assignment to attach to this session.'}
              </SheetDescription>
            </SheetHeader>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='assignment-select'>Assignment</Label>
                <select
                  id='assignment-select'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={selectedAssignmentUuid}
                  onChange={event => {
                    const uuid = event.target.value;
                    setSelectedAssignmentUuid(uuid);
                    setSelectedAssignment(
                      allAssignments?.data?.content?.find(item => item.uuid === uuid) ?? null
                    );
                  }}
                >
                  <option value=''>Select assignment</option>
                  {allAssignments?.data?.content?.map(assignment => (
                    <option key={assignment.uuid} value={assignment.uuid}>
                      {assignment.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Visible at</Label>
                  <Input
                    type='datetime-local'
                    value={visibleAt}
                    onChange={event => setVisibleAt(event.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Due at</Label>
                  <Input
                    type='datetime-local'
                    value={assignmentDueDate}
                    onChange={event => setAssignmentDueDate(event.target.value)}
                  />
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Grading due at</Label>
                  <Input
                    type='datetime-local'
                    value={gradingDueAt}
                    onChange={event => setGradingDueAt(event.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Max attempts</Label>
                  <Input
                    type='number'
                    min='1'
                    value={maxAttempts}
                    onChange={event => setMaxAttempts(event.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={assignmentNotes}
                  onChange={event => setAssignmentNotes(event.target.value)}
                />
              </div>
            </div>

            <div className='mt-auto flex justify-end gap-2 border-t pt-4'>
              <Button variant='outline' onClick={() => setIsAssignmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={createAssignment}
                disabled={!selectedAssignmentUuid || addAssignmentScheduleMut.isPending}
              >
                <Plus className='mr-2 h-4 w-4' />
                {addAssignmentScheduleMut.isPending ? 'Saving...' : 'Add assignment'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <SheetContent className='w-full overflow-y-auto p-0 sm:max-w-[560px]'>
          <div className='flex h-full flex-col gap-6 p-6'>
            <SheetHeader>
              <SheetTitle>Add quiz</SheetTitle>
              <SheetDescription>
                {selectedSchedule
                  ? `Schedule a quiz for ${selectedSchedule.classTitle} on ${moment(selectedSchedule.start_time).format('MMM D, YYYY')}.`
                  : 'Choose a quiz to attach to this session.'}
              </SheetDescription>
            </SheetHeader>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='quiz-select'>Quiz</Label>
                <select
                  id='quiz-select'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={selectedQuizUuid}
                  onChange={event => {
                    const uuid = event.target.value;
                    const quiz = allQuizzes?.data?.content?.find(item => item.uuid === uuid);
                    setSelectedQuizUuid(uuid);
                    setSelectedQuiz(quiz ?? null);
                    setTimeLimitOverride(
                      quiz?.time_limit_minutes ? String(quiz.time_limit_minutes) : ''
                    );
                    setAttemptLimitOverride(
                      quiz?.attempts_allowed ? String(quiz.attempts_allowed) : ''
                    );
                    setPassingScoreOverride(quiz?.passing_score ? String(quiz.passing_score) : '');
                  }}
                >
                  <option value=''>Select quiz</option>
                  {allQuizzes?.data?.content?.map(quiz => (
                    <option key={quiz.uuid} value={quiz.uuid}>
                      {quiz.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Visible at</Label>
                  <Input
                    type='datetime-local'
                    value={quizVisibleAt}
                    onChange={event => setQuizVisibleAt(event.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Due at</Label>
                  <Input
                    type='datetime-local'
                    value={quizDueDate}
                    onChange={event => setQuizDueDate(event.target.value)}
                  />
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='space-y-2'>
                  <Label>Time limit</Label>
                  <Input
                    type='number'
                    value={timeLimitOverride}
                    onChange={event => setTimeLimitOverride(event.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Attempts</Label>
                  <Input
                    type='number'
                    value={attemptLimitOverride}
                    onChange={event => setAttemptLimitOverride(event.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Passing score</Label>
                  <Input
                    type='number'
                    value={passingScoreOverride}
                    onChange={event => setPassingScoreOverride(event.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={quizNotes}
                  onChange={event => setQuizNotes(event.target.value)}
                />
              </div>
            </div>

            <div className='mt-auto flex justify-end gap-2 border-t pt-4'>
              <Button variant='outline' onClick={() => setIsQuizDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={createQuiz}
                disabled={!selectedQuizUuid || addQuizScheduleMut.isPending}
              >
                <Plus className='mr-2 h-4 w-4' />
                {addQuizScheduleMut.isPending ? 'Saving...' : 'Add quiz'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isAssignmentsSheetOpen} onOpenChange={setIsAssignmentsSheetOpen}>
        <SheetContent className='w-full p-0 sm:max-w-full lg:max-w-[80vw]'>
          <div className='flex h-full flex-col'>
            <div className='border-b px-6 py-5'>
              <SheetHeader>
                <SheetTitle className='flex items-center gap-2 text-xl'>
                  <FileText className='text-primary h-5 w-5' />
                  Class assignments
                </SheetTitle>
                <SheetDescription>
                  Review all assignments already attached to this class.
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className='flex-1 overflow-auto px-6 py-5'>
              {!mergedAssignments.length ? (
                <div className={cx(getEmptyStateClasses(), 'min-h-[260px]')}>
                  <FileText className='text-primary/70 h-10 w-10' />
                  <div className='space-y-1'>
                    <h3 className='text-lg font-semibold'>No assignments scheduled</h3>
                    <p className='text-muted-foreground text-sm'>
                      Use any session card to attach assignments.
                    </p>
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  {mergedAssignments.map(item => {
                    const isExpanded = expandedAssignmentUuid === item.uuid;

                    return (
                      <Card key={item.uuid} className='border-border/60 overflow-hidden'>
                        <CardContent className='p-5'>
                          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                            <div className='space-y-2'>
                              <h3 className='text-foreground text-base font-semibold'>
                                {item.assignment.title}
                              </h3>
                              <div
                                className='text-muted-foreground line-clamp-2 text-sm'
                                dangerouslySetInnerHTML={{
                                  __html: item.assignment.description || '',
                                }}
                              />
                              <div className='text-muted-foreground flex flex-wrap gap-2 text-xs'>
                                <span className='inline-flex items-center gap-1'>
                                  <Calendar className='h-3.5 w-3.5' />
                                  Due {moment(item.due_at).format('MMM D, YYYY')}
                                </span>
                                <span className='inline-flex items-center gap-1'>
                                  <Award className='h-3.5 w-3.5' />
                                  {item.assignment.max_points ?? 0} pts
                                </span>
                                <span className='inline-flex items-center gap-1'>
                                  <Paperclip className='h-3.5 w-3.5' />
                                  {item.attachments.length} file
                                  {item.attachments.length === 1 ? '' : 's'}
                                </span>
                              </div>
                            </div>

                            <div className='flex items-center gap-2'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() =>
                                  setExpandedAssignmentUuid(prev =>
                                    prev === item.uuid ? null : item.uuid
                                  )
                                }
                              >
                                {isExpanded ? (
                                  <ChevronUp className='h-4 w-4' />
                                ) : (
                                  <ChevronDown className='h-4 w-4' />
                                )}
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-destructive'
                                disabled={deleteAssignmentScheduleMut.isPending || !activeClassId}
                                onClick={() =>
                                  activeClassId && removeAssignment(activeClassId, item.uuid)
                                }
                              >
                                <Trash2 className='mr-2 h-4 w-4' />
                                Remove
                              </Button>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className='border-border/60 mt-4 space-y-4 border-t pt-4'>
                              {item.assignment.instructions ? (
                                <div
                                  className='bg-muted/40 text-muted-foreground rounded-2xl p-4 text-sm'
                                  dangerouslySetInnerHTML={{
                                    __html: item.assignment.instructions,
                                  }}
                                />
                              ) : null}

                              <div className='grid gap-3 sm:grid-cols-2'>
                                {item.attachments.map(attachment => {
                                  const { icon: FileIcon, color } = getFileIcon(
                                    attachment.original_filename
                                  );

                                  return (
                                    <div
                                      key={attachment.uuid}
                                      className='border-border/60 bg-background/70 flex items-center gap-3 rounded-2xl border p-3'
                                    >
                                      <div className='border-border/60 bg-background rounded-xl border p-2'>
                                        <FileIcon className={cx('h-5 w-5', color)} />
                                      </div>
                                      <div className='min-w-0 flex-1'>
                                        <p className='text-foreground truncate text-sm font-medium'>
                                          {attachment.original_filename}
                                        </p>
                                        <p className='text-muted-foreground text-xs'>Attachment</p>
                                      </div>
                                      <a
                                        href={attachment.file_url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='hover:bg-muted rounded-lg p-2'
                                      >
                                        <ExternalLink className='text-muted-foreground h-4 w-4' />
                                      </a>
                                      <button
                                        type='button'
                                        className='hover:bg-muted rounded-lg p-2'
                                        onClick={() =>
                                          downloadFile(
                                            attachment.file_url,
                                            attachment.original_filename
                                          )
                                        }
                                      >
                                        <Download className='text-muted-foreground h-4 w-4' />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <QuizzesSheet
        open={isQuizzesSheetOpen}
        onOpenChange={setIsQuizzesSheetOpen}
        mergedQuizzes={mergedQuizzes}
        deleteQuizScheduleMut={deleteQuizScheduleMut}
        onRemoveQuiz={(scheduleUuid: string) =>
          activeClassId && removeQuiz(activeClassId, scheduleUuid)
        }
      />
    </div>
  );
}
