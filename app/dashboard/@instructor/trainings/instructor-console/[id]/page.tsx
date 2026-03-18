'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useClassRoster } from '@/hooks/use-class-roster';
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
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import moment from 'moment';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../../../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../../../components/ui/dialog';
import { Progress } from '../../../../../../components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../../../../components/ui/sheet';
import { Skeleton } from '../../../../../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../../components/ui/table';
import { useInstructor } from '../../../../../../context/instructor-context';
import { useClassDetails } from '../../../../../../hooks/use-class-details';
import { downloadFile } from '../../../../@student/assignment/page';
import { QuizzesSheet } from './quiz-sheet';

// ─── helpers ────────────────────────────────────────────────────────────────
function getFileIcon(filename: string) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return { icon: FileText, color: 'text-red-500' };
    case 'doc':
    case 'docx':
      return { icon: FileText, color: 'text-blue-500' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return { icon: File, color: 'text-green-500' };
    default:
      return { icon: File, color: 'text-muted-foreground' };
  }
}

export default function TrainingInterfacePage() {
  const qc = useQueryClient();
  const instructor = useInstructor();
  const params = useParams();
  const classId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (!classId) return;
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'trainings', title: 'Training Classes', url: '/dashboard/trainings' },
      {
        id: 'instructor-console',
        title: 'Training Dashboard',
        url: `/dashboard/trainings/instructor-console/${classId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, classId]);

  const { data: combinedClass, isLoading: classIsLoading } = useClassDetails(classId as string);
  const classData = combinedClass?.class;
  const course = combinedClass?.course;
  const schedules = combinedClass?.schedule;

  const { roster, rosterAllEnrollments, isLoading: rosterLoading } = useClassRoster(classId);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [isAttendanceDrawerOpen, setIsAttendanceDrawerOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [searchQuery, setSearchQuery] = useState('');

  /** Full-screen sheets for viewing class assignments / quizzes */
  const [isAssignmentsSheetOpen, setIsAssignmentsSheetOpen] = useState(false);
  const [isQuizzesSheetOpen, setIsQuizzesSheetOpen] = useState(false);
  /** Which assignment/quiz card has its detail panel expanded */
  const [expandedAssignmentUuid, setExpandedAssignmentUuid] = useState<string | null>(null);
  const [expandedQuizUuid, setExpandedQuizUuid] = useState<string | null>(null);

  // ── Assignment form state ───────────────────────────────────────────────────
  const [selectedAssignmentUuid, setSelectedAssignmentUuid] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [visibleAt, setVisibleAt] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [gradingDueAt, setGradingDueAt] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // ── Quiz form state ─────────────────────────────────────────────────────────
  const [selectedQuizUuid, setSelectedQuizUuid] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [quizVisibleAt, setQuizVisibleAt] = useState('');
  const [quizDueDate, setQuizDueDate] = useState('');
  const [timeLimitOverride, setTimeLimitOverride] = useState(selectedQuiz?.time_limit_minutes);
  const [attemptLimitOverride, setAttemptLimitOverride] = useState(selectedQuiz?.attempts_allowed);
  const [passingScoreOverride, setPassingScoreOverride] = useState(selectedQuiz?.passing_score);
  const [quizNotes, setQuizNotes] = useState('');

  // ── Week helpers ─────────────────────────────────────────────────────────────
  const getCurrentWeekBoundaries = () => {
    const now = moment();
    return { startOfWeek: now.clone().startOf('week'), endOfWeek: now.clone().endOf('week') };
  };
  const { startOfWeek, endOfWeek } = getCurrentWeekBoundaries();

  const groupedSchedules = useMemo(() => {
    const groups: Record<string, any[]> = {};
    schedules.forEach((schedule: any) => {
      const weekStart = moment(schedule.start_time).clone().startOf('week');
      const weekEnd = moment(schedule.start_time).clone().endOf('week');
      const weekKey = `${weekStart.format('MMM D')} - ${weekEnd.format('MMM D, YYYY')}`;
      if (!groups[weekKey]) groups[weekKey] = [];
      groups[weekKey].push(schedule);
    });
    Object.keys(groups).forEach(key =>
      groups[key].sort((a, b) => moment(a.start_time).diff(moment(b.start_time)))
    );
    return groups;
  }, [schedules]);

  const isScheduleEnabled = (_schedule: any) => true;
  const isSchedulePast = (schedule: any) => moment(schedule.start_time).isBefore(moment(), 'day');
  const calculateProgress = () => {
    const total = schedules.length;
    const completed = schedules.filter((s: any) => isSchedulePast(s)).length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };
  const progress = calculateProgress();

  // ── Roster maps ──────────────────────────────────────────────────────────────
  const studentsByScheduleInstance = useMemo(() => {
    const map: Record<string, any[]> = {};
    rosterAllEnrollments.forEach(({ enrollment, student, user }) => {
      const uuid = enrollment.scheduled_instance_uuid;
      if (!map[uuid]) map[uuid] = [];
      map[uuid].push({ enrollment, student, user });
    });
    return map;
  }, [rosterAllEnrollments]);

  const studentsForThisSchedule = selectedSchedule
    ? (studentsByScheduleInstance[selectedSchedule.uuid] ?? [])
    : [];

  const enrollmentsByStudent = useMemo(() => {
    const map: Record<string, any[]> = {};
    rosterAllEnrollments?.forEach((entry: any) => {
      const studentId = entry?.user?.uuid;
      const enrollment = entry?.enrollment;
      if (!map[studentId]) map[studentId] = [];
      if (enrollment?.scheduled_instance_uuid) map[studentId].push(enrollment);
    });
    return map;
  }, [roster]);

  const calculateStudentAttendance = (studentId: string) => {
    const enrs = enrollmentsByStudent[studentId] || [];
    const totalSessions = schedules.length;
    const markedSessions = enrs.filter(e => e.is_attendance_marked);
    const presentSessions = markedSessions.filter(e => e.did_attend === true);
    return {
      totalSessions,
      markedSessions: markedSessions.length,
      presentCount: presentSessions.length,
      percentage: totalSessions > 0 ? (presentSessions.length / totalSessions) * 100 : 0,
    };
  };

  // ── Attendance mutation ──────────────────────────────────────────────────────
  const markAttendanceMut = useMutation(markAttendanceMutation());
  const [loadingEnrollmentUuid, setLoadingEnrollmentUuid] = useState<string | null>(null);

  const handleMarkAttendance = async (
    studentId: string,
    enrollmentUuid: string,
    isPresent: boolean
  ) => {
    if (!selectedSchedule) return;
    setLoadingEnrollmentUuid(enrollmentUuid);
    markAttendanceMut.mutate(
      { path: { enrollmentUuid }, query: { attended: isPresent } },
      {
        onSuccess: () => {
          setAttendanceRecords(prev => ({
            ...prev,
            [selectedSchedule.uuid]: {
              ...prev[selectedSchedule.uuid],
              [enrollmentUuid]: isPresent,
            },
          }));
          toast.success(
            `Marked ${isPresent ? 'Present' : 'Absent'} for ${roster?.find((r: any) => r.user.uuid === studentId)?.user.full_name}`
          );
        },
        onSettled: () => setLoadingEnrollmentUuid(null),
      }
    );
  };

  const handleMarkAttendanceAction = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsAttendanceDrawerOpen(true);
  };
  const handleLaunchClass = (schedule: any) => {
    const link = schedule.meeting_url || 'https://meet.google.com/abc-defg-hij';
    window.open(link, '_blank');
    toast.success('Opening class meeting...');
  };

  // ── Assignments data ─────────────────────────────────────────────────────────
  const { data: allAssignments } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: {} } }),
  });
  const { data: allQuizzes } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: { size: 100 } } }),
  });

  const addAssignmentScheduleMut = useMutation(createAssignmentScheduleMutation());
  const deleteAssignmentScheduleMut = useMutation(deleteAssignmentScheduleMutation());

  const { data: assignmentSchedules, isLoading: isSchedulesLoading } = useQuery({
    ...getAssignmentSchedulesOptions({ path: { classUuid: classId as string } }),
  });

  const assignmentUuids = [
    ...new Set(assignmentSchedules?.data?.map((s: any) => s.assignment_uuid).filter(Boolean)),
  ] as string[];

  const assignmentDetailQueries = useQueries({
    queries: assignmentUuids.map((uuid: string) => ({
      ...getAssignmentByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const assignmentAttachmentQueries = useQueries({
    queries: assignmentUuids.map((uuid: string) => ({
      ...getAssignmentAttachmentsOptions({ path: { assignmentUuid: uuid } }),
      enabled: !!uuid,
    })),
  });

  const assignmentDetailsMap = useMemo(() => {
    const map: Record<string, any> = {};
    assignmentDetailQueries.forEach(q => {
      const d = q.data?.data;
      if (d?.uuid) map[d.uuid] = d;
    });
    return map;
  }, [assignmentDetailQueries]);

  const assignmentAttachmentsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    assignmentAttachmentQueries.forEach((q, i) => {
      const uuid = assignmentUuids[i];
      if (uuid) map[uuid] = q.data?.data ?? [];
    });
    return map;
  }, [assignmentAttachmentQueries, assignmentUuids]);

  const mergedAssignments = useMemo(() => {
    return (assignmentSchedules?.data ?? [])
      .map((schedule: any) => ({
        ...schedule,
        assignment: assignmentDetailsMap[schedule.assignment_uuid] ?? null,
        attachments: assignmentAttachmentsMap[schedule.assignment_uuid] ?? [],
      }))
      .filter((item: any) => !!item.assignment);
  }, [assignmentSchedules, assignmentDetailsMap, assignmentAttachmentsMap]);

  // ── Quizzes data ─────────────────────────────────────────────────────────────
  const addQuizScheduleMut = useMutation(createQuizScheduleMutation());
  const deleteQuizScheduleMut = useMutation(deleteQuizScheduleMutation());

  const { data: quizSchedules } = useQuery({
    ...getQuizSchedulesOptions({ path: { classUuid: classId as string } }),
  });

  const quizUuids = [
    ...new Set(quizSchedules?.data?.map((s: any) => s.quiz_uuid).filter(Boolean)),
  ] as string[];

  const quizDetailQueries = useQueries({
    queries: quizUuids.map((uuid: string) => ({
      ...getQuizByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const quizDetailsMap = useMemo(() => {
    const map: Record<string, any> = {};
    quizDetailQueries.forEach(q => {
      const d = q.data?.data;
      if (d?.uuid) map[d.uuid] = d;
    });
    return map;
  }, [quizDetailQueries]);

  const mergedQuizzes = useMemo(() => {
    return (quizSchedules?.data ?? [])
      .map((q: any) => ({ ...q, quiz: quizDetailsMap[q.quiz_uuid] ?? null }))
      .filter((item: any) => !!item.quiz);
  }, [quizSchedules, quizDetailsMap]);
  // ── Add / remove handlers ────────────────────────────────────────────────────
  const handleAddAssignment = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsAssignmentDialogOpen(true);
  };


  const handleAddQuiz = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsQuizDialogOpen(true);
  };

  const handleCreateAssignment = () => {
    const payload = {
      class_definition_uuid: classId as string,
      lesson_uuid: selectedAssignment?.lesson_uuid,
      assignment_uuid: selectedAssignmentUuid,
      class_lesson_plan_uuid: selectedSchedule?.uuid,
      visible_at: visibleAt,
      due_at: assignmentDueDate,
      grading_due_at: gradingDueAt,
      timezone: 'Africa/Nairobi',
      release_strategy: 'CUSTOM',
      max_attempts: Number(maxAttempts),
      instructor_uuid: instructor?.uuid as string,
      notes: assignmentNotes,
    };
    addAssignmentScheduleMut.mutate(
      { body: payload as any, path: { classUuid: classId as string } },
      {
        onSuccess: () => {
          toast.success('Assignment created successfully!');
          setIsAssignmentDialogOpen(false);
          qc.invalidateQueries({
            queryKey: getAssignmentSchedulesQueryKey({ path: { classUuid: classId } }),
          });
        },
      }
    );
  };

  const handleCreateQuiz = () => {
    const payload = {
      class_definition_uuid: classId as string,
      lesson_uuid: selectedQuiz?.lesson_uuid,
      quiz_uuid: selectedQuizUuid,
      class_lesson_plan_uuid: selectedSchedule?.uuid,
      visible_at: quizVisibleAt,
      due_at: quizDueDate,
      timezone: 'Africa/Nairobi',
      release_strategy: 'CUSTOM',
      time_limit_override: timeLimitOverride ? Number(timeLimitOverride) : undefined,
      attempt_limit_override: attemptLimitOverride ? Number(attemptLimitOverride) : undefined,
      passing_score_override: passingScoreOverride ? Number(passingScoreOverride) : undefined,
      instructor_uuid: instructor?.uuid as string,
      notes: quizNotes,
    };
    addQuizScheduleMut.mutate(
      { body: payload as any, path: { classUuid: classId as string } },
      {
        onSuccess: () => {
          toast.success('Quiz created successfully!');
          setIsQuizDialogOpen(false);
          qc.invalidateQueries({
            queryKey: getQuizSchedulesQueryKey({ path: { classUuid: classId } }),
          });
        },
      }
    );
  };

  const handleRemoveAssignment = (scheduleUuid: string) => {
    deleteAssignmentScheduleMut.mutate(
      { path: { classUuid: classId as string, scheduleUuid } },
      {
        onSuccess: () => {
          toast.success('Assignment removed from class.');
          qc.invalidateQueries({
            queryKey: getAssignmentSchedulesQueryKey({ path: { classUuid: classId } }),
          });
        },
      }
    );
  };

  const handleRemoveQuiz = (scheduleUuid: string) => {
    deleteQuizScheduleMut.mutate(
      { path: { classUuid: classId as string, scheduleUuid } },
      {
        onSuccess: () => {
          toast.success('Quiz removed from class.');
          qc.invalidateQueries({
            queryKey: getQuizSchedulesQueryKey({ path: { classUuid: classId } }),
          });
        },
      }
    );
  };

  // ── Roster filter ────────────────────────────────────────────────────────────
  const filteredRoster = useMemo(() => {
    if (!searchQuery) return roster || [];
    return roster?.filter((entry: any) =>
      entry.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roster, searchQuery]);

  if (classIsLoading || rosterLoading) {
    return (
      <div className='flex flex-col gap-6 space-y-2 p-6'>
        <Skeleton className='h-[150px] w-full' />
        <Skeleton className='h-[450px] w-full' />
      </div>
    );
  }

  return (
    <div className='bg-background min-h-screen p-0 sm:p-6'>
      {/* ── Top-right: Assignments & Quizzes buttons ── */}
      <div className='mb-4 flex justify-end gap-3'>
        <Button variant='outline' className='gap-2' onClick={() => setIsAssignmentsSheetOpen(true)}>
          <FileText className='h-4 w-4' />
          Class Assignments
          {mergedAssignments?.length > 0 && (
            <Badge variant='secondary' className='ml-1 h-5 px-1.5 text-xs'>
              {mergedAssignments.length}
            </Badge>
          )}
        </Button>

        <Button variant='outline' className='gap-2' onClick={() => setIsQuizzesSheetOpen(true)}>
          <ClipboardList className='h-4 w-4' />
          Class Quizzes
          {mergedQuizzes?.length > 0 && (
            <Badge variant='secondary' className='ml-1 h-5 px-1.5 text-xs'>
              {mergedQuizzes.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* ── Header Card ── */}
      <Card className='border-border mb-6'>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <h1 className='text-foreground text-3xl font-bold'>{classData?.title}</h1>
              <div className='flex flex-wrap gap-4 text-sm'>
                <div className='flex items-center gap-2'>
                  <MapPin className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground'>
                    {classData?.location_type} - {classData?.location_name}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Users className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground'>{roster?.length || 0} Students</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Users className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground'>
                    {classData?.max_participants - roster?.length} Seats available
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground'>
                    {schedules.length} Sessions Scheduled
                  </span>
                </div>
              </div>
            </div>

            <Card className='border-primary/20 bg-primary/5 w-64'>
              <CardContent className='space-y-2 pt-6'>
                <div className='flex items-center justify-between'>
                  <span className='text-foreground text-sm font-medium'>Class Progress</span>
                  <TrendingUp className='text-primary h-4 w-4' />
                </div>
                <Progress value={progress.percentage} className='h-2' />
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground'>
                    {progress.completed} of {progress.total} sessions
                  </span>
                  <span className='text-primary font-semibold'>
                    {progress.percentage.toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardHeader>
      </Card>

      {/* ── Schedule Tables by Week ── */}
      <div className='space-y-6'>
        {Object.entries(groupedSchedules).map(([weekLabel, weekSchedules]) => {
          const isCurrentWeek = weekSchedules.some((s: any) => isScheduleEnabled(s));

          return (
            <Card key={weekLabel} className='border-border overflow-hidden pt-0'>
              <CardHeader className='bg-accent/10 py-4'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-foreground flex items-center gap-2 text-lg font-semibold'>
                    <Calendar className='h-5 w-5' />
                    {weekLabel}
                  </h2>
                  {isCurrentWeek && (
                    <Badge variant='default' className='gap-1'>
                      <Clock className='h-3 w-3' />
                      Current Week
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[50px]'>#</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='w-[80px] text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekSchedules.map((schedule: any, index: number) => {
                      const isPast = isSchedulePast(schedule);
                      const isEnabled = isScheduleEnabled(schedule);
                      const isFuture = moment(schedule.start_time).isAfter(endOfWeek);

                      return (
                        <TableRow key={schedule.uuid} className={!isEnabled ? 'opacity-50' : ''}>
                          <TableCell className='font-medium'>{index + 1}</TableCell>
                          <TableCell>
                            <div className='space-y-1'>
                              <div className='text-foreground font-medium'>
                                {moment(schedule.start_time).format('dddd, MMM D, YYYY')}
                              </div>
                              <div className='text-muted-foreground text-xs'>
                                {moment(schedule.start_time).format('h:mm A')} -{' '}
                                {moment(schedule.end_time).format('h:mm A')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1.5'>
                              <Clock className='text-muted-foreground h-4 w-4' />
                              <span className='text-sm'>{schedule.duration_formatted}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isPast && (
                              <Badge variant='secondary' className='gap-1'>
                                <CheckCircle className='h-3 w-3' />
                                Completed
                              </Badge>
                            )}
                            {!isPast && isEnabled && (
                              <Badge variant='default' className='gap-1'>
                                <Clock className='h-3 w-3' />
                                Active
                              </Badge>
                            )}
                            {isFuture && (
                              <Badge variant='outline' className='gap-1'>
                                <Calendar className='h-3 w-3' />
                                Upcoming
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className='text-right'>
                            <DropdownMenu>
                              <div className='flex flex-row items-center gap-4'>
                                <div
                                  className='bg-primary/20 flex cursor-pointer flex-row items-center rounded-xl px-3 py-1'
                                  onClick={() => handleLaunchClass(schedule)}
                                >
                                  <Video className='mr-2 h-4 w-4' />
                                  Launch Class
                                  <ExternalLink className='ml-auto h-3 w-3' />
                                </div>
                                <div
                                  className='bg-primary/20 flex cursor-pointer flex-row items-center rounded-xl px-3 py-1'
                                  onClick={() => handleMarkAttendanceAction(schedule)}
                                >
                                  <UserCheck className='mr-2 h-4 w-4' />
                                  Mark Attendance
                                </div>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-8 w-8 p-0'
                                    disabled={!isEnabled}
                                  >
                                    <MoreVertical className='h-4 w-4' />
                                    <span className='sr-only'>Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                              </div>
                              <DropdownMenuContent align='end' className='w-48'>
                                <DropdownMenuItem onClick={() => handleAddAssignment(schedule)}>
                                  <FileText className='mr-2 h-4 w-4' />
                                  Add Assignment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAddQuiz(schedule)}>
                                  <ClipboardList className='mr-2 h-4 w-4' />
                                  Add Quiz
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CLASS ASSIGNMENTS SHEET
      ════════════════════════════════════════════════════════════════════════ */}
      <Sheet open={isAssignmentsSheetOpen} onOpenChange={setIsAssignmentsSheetOpen}>
        <SheetContent className='w-full p-0 sm:max-w-full lg:max-w-[80vw]'>
          <div className='flex h-full flex-col'>
            {/* Header */}
            <div className='border-b px-6 py-5'>
              <SheetHeader>
                <SheetTitle className='flex items-center gap-2 text-xl'>
                  <FileText className='text-primary h-5 w-5' />
                  Class Assignments
                </SheetTitle>
                <SheetDescription>
                  All assignments scheduled for this class — view details, attachments, and remove
                  as needed.
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* Body */}
            <div className='flex-1 overflow-auto px-6 py-5'>
              {!mergedAssignments?.length ? (
                <div className='flex h-full flex-col items-center justify-center py-20 text-center'>
                  <FileText className='text-muted-foreground mb-3 h-12 w-12 opacity-40' />
                  <h3 className='text-foreground mb-1 text-lg font-semibold'>No assignments yet</h3>
                  <p className='text-muted-foreground text-sm'>
                    Add assignments from a session's action menu.
                  </p>
                </div>
              ) : (
                <div className='scrollbar-hidden space-y-4'>
                  {mergedAssignments.map((item: any) => {
                    const {
                      assignment,
                      attachments,
                      due_at,
                      max_attempts,
                      uuid: scheduleUuid,
                    } = item;
                    const isExpanded = expandedAssignmentUuid === scheduleUuid;

                    return (
                      <Card
                        key={scheduleUuid}
                        className='border-border/50 scrollbar-hidden overflow-hidden'
                      >
                        <CardContent className='p-5'>
                          {/* ── Row: info + actions ── */}
                          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                            {/* Left */}
                            <div className='flex-1'>
                              <h3 className='text-foreground mb-1 text-base font-semibold'>
                                {assignment.title}
                              </h3>
                              <div
                                className='text-muted-foreground mb-3 line-clamp-2 text-sm'
                                dangerouslySetInnerHTML={{ __html: assignment.description || '' }}
                              />
                              <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
                                <div className='flex items-center gap-1.5'>
                                  <Calendar className='text-muted-foreground h-4 w-4' />
                                  <span className='text-muted-foreground'>
                                    Due:{' '}
                                    {new Date(due_at).toLocaleDateString(undefined, {
                                      dateStyle: 'medium',
                                    })}
                                  </span>
                                </div>
                                <div className='flex items-center gap-1.5'>
                                  <Award className='text-muted-foreground h-4 w-4' />
                                  <span className='text-muted-foreground'>
                                    {assignment.max_points} pts
                                  </span>
                                </div>
                                {max_attempts && (
                                  <div className='flex items-center gap-1.5'>
                                    <Clock className='text-muted-foreground h-4 w-4' />
                                    <span className='text-muted-foreground'>
                                      {max_attempts} attempt{max_attempts !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                                <Badge variant='outline' className='text-xs'>
                                  {assignment.assignment_category}
                                </Badge>
                                {assignment.submission_types?.map((t: string) => (
                                  <Badge key={t} variant='secondary' className='text-xs'>
                                    {t}
                                  </Badge>
                                ))}
                                {attachments.length > 0 && (
                                  <span className='text-muted-foreground flex items-center gap-1 text-xs'>
                                    <Paperclip className='h-3.5 w-3.5' />
                                    {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right: actions */}
                            <div className='flex shrink-0 items-center gap-2 sm:ml-4'>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-muted-foreground'
                                onClick={() =>
                                  setExpandedAssignmentUuid(prev =>
                                    prev === scheduleUuid ? null : scheduleUuid
                                  )
                                }
                              >
                                {isExpanded ? (
                                  <ChevronUp className='h-6 w-6' />
                                ) : (
                                  <ChevronDown className='h-6 w-6' />
                                )}
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                                disabled={deleteAssignmentScheduleMut.isPending}
                                onClick={() => handleRemoveAssignment(scheduleUuid)}
                              >
                                <Trash2 className='h-4 w-4' />
                                <span className='ml-1.5 hidden sm:inline'>Remove</span>
                              </Button>
                            </div>
                          </div>

                          {/* ── Collapsible detail panel ── */}
                          {isExpanded && (
                            <div className='border-border/50 mt-4 space-y-4 border-t pt-4'>
                              {assignment.instructions && (
                                <div>
                                  <h4 className='text-foreground mb-1.5 text-sm font-semibold'>
                                    Instructions
                                  </h4>
                                  <div
                                    className='text-muted-foreground bg-muted/30 rounded-lg p-3 text-sm leading-relaxed'
                                    dangerouslySetInnerHTML={{ __html: assignment.instructions }}
                                  />
                                </div>
                              )}

                              <div>
                                <h4 className='text-foreground mb-2 flex items-center gap-2 text-sm font-semibold'>
                                  <Paperclip className='h-4 w-4' />
                                  Attached Materials
                                  <Badge variant='secondary' className='text-xs'>
                                    {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                                  </Badge>
                                </h4>

                                {attachments.length === 0 ? (
                                  <p className='text-muted-foreground text-sm italic'>
                                    No attachments for this assignment.
                                  </p>
                                ) : (
                                  <div className='grid gap-2 sm:grid-cols-2'>
                                    {attachments.map((attachment: any) => {
                                      const { icon: FileIcon, color } = getFileIcon(
                                        attachment.original_filename
                                      );

                                      return (
                                        <div
                                          key={attachment.uuid}
                                          className='group/file border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-primary/40 flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm'
                                        >
                                          {/* File icon */}
                                          <div className='border-border/30 bg-background shrink-0 rounded-md border p-2 shadow-sm'>
                                            <FileIcon className={`h-5 w-5 ${color}`} />
                                          </div>

                                          {/* Filename */}
                                          <div className='min-w-0 flex-1'>
                                            <p className='text-foreground truncate text-sm font-medium'>
                                              {attachment.original_filename}
                                            </p>
                                            <p className='text-muted-foreground mt-0.5 text-xs'>
                                              Open or download
                                            </p>
                                          </div>

                                          {/* Actions */}
                                          <div className='flex items-center gap-4'>
                                            {/* Open in new tab */}
                                            <a
                                              href={attachment.file_url}
                                              target='_blank'
                                              rel='noopener noreferrer'
                                              className='hover:bg-muted rounded p-2'
                                              title='Open file'
                                            >
                                              <ExternalLink className='text-muted-foreground hover:text-primary h-5 w-5' />
                                            </a>

                                            {/* Download */}
                                            <button
                                              onClick={e => {
                                                e.stopPropagation();
                                                downloadFile(
                                                  attachment.file_url,
                                                  attachment.original_filename
                                                );
                                              }}
                                              className='hover:bg-muted rounded p-2'
                                              title='Download file'
                                            >
                                              <Download className='text-muted-foreground hover:text-primary h-5 w-5' />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='border-t px-6 py-4'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  {mergedAssignments?.length ?? 0} assignment
                  {mergedAssignments?.length !== 1 ? 's' : ''} scheduled
                </span>
                <Button onClick={() => setIsAssignmentsSheetOpen(false)}>Done</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════════════════
          CLASS QUIZZES SHEET
      ════════════════════════════════════════════════════════════════════════ */}
      <QuizzesSheet
        open={isQuizzesSheetOpen}
        onOpenChange={setIsQuizzesSheetOpen}
        mergedQuizzes={mergedQuizzes}
        deleteQuizScheduleMut={deleteQuizScheduleMut}
        onRemoveQuiz={handleRemoveQuiz}
      />

      {/* ── Attendance Drawer ── */}
      <Sheet open={isAttendanceDrawerOpen} onOpenChange={setIsAttendanceDrawerOpen}>
        <SheetContent className='w-full p-0 sm:max-w-full lg:max-w-[90vw] xl:max-w-[70vw]'>
          <div className='flex h-full flex-col'>
            <div className='border-b px-6 py-4'>
              <SheetHeader>
                <SheetTitle className='text-xl'>Mark Attendance</SheetTitle>
                <SheetDescription>
                  {selectedSchedule && (
                    <div className='mt-2 flex flex-wrap items-center gap-4 text-sm'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4' />
                        <span className='text-foreground font-medium'>
                          {moment(selectedSchedule.start_time).format('dddd, MMM D, YYYY')}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-4 w-4' />
                        <span>
                          {moment(selectedSchedule.start_time).format('h:mm A')} -{' '}
                          {moment(selectedSchedule.end_time).format('h:mm A')}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Users className='h-4 w-4' />
                        <span>{studentsForThisSchedule.length} Students</span>
                      </div>
                    </div>
                  )}
                </SheetDescription>
              </SheetHeader>
              <div className='relative mt-4'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  type='text'
                  placeholder='Search students by name...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='flex-1 overflow-auto px-6 py-4'>
              {studentsForThisSchedule.filter(entry =>
                entry.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center py-12 text-center'>
                  <Users className='text-muted-foreground mb-3 h-12 w-12 opacity-40' />
                  <h3 className='text-foreground mb-1 text-lg font-semibold'>No students found</h3>
                  <p className='text-muted-foreground text-sm'>
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : 'No students enrolled in this session'}
                  </p>
                </div>
              ) : (
                <div className='rounded-lg border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[50px]'>#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className='hidden md:table-cell'>Overall Attendance</TableHead>
                        <TableHead className='hidden lg:table-cell'>Progress</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsForThisSchedule
                        .filter(entry =>
                          entry.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((entry: any, index: number) => {
                          const studentId = entry.user.uuid;
                          const name = entry.user.full_name;
                          const attendance = calculateStudentAttendance(studentId);
                          const currentStatus = entry?.enrollment?.did_attend;
                          const enrollmentUuid = entry?.enrollment?.uuid;

                          return (
                            <TableRow key={studentId}>
                              <TableCell className='font-medium'>{index + 1}</TableCell>
                              <TableCell>
                                <div className='flex items-center gap-3'>
                                  <div className='bg-primary/15 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
                                    {name
                                      .split(' ')
                                      .map((n: string) => n?.[0])
                                      .slice(0, 2)
                                      .join('')}
                                  </div>
                                  <div className='min-w-0'>
                                    <div className='text-foreground truncate font-medium'>
                                      {name}
                                    </div>
                                    <div className='text-muted-foreground truncate text-xs'>
                                      {attendance.presentCount} / {attendance.totalSessions}{' '}
                                      sessions present
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className='hidden md:table-cell'>
                                <div className='flex items-center gap-2'>
                                  <div className='text-foreground text-sm font-semibold'>
                                    {attendance.percentage.toFixed(0)}%
                                  </div>
                                  <Badge
                                    variant={
                                      attendance.percentage >= 80
                                        ? 'default'
                                        : attendance.percentage >= 60
                                          ? 'secondary'
                                          : 'destructive'
                                    }
                                    className='text-xs'
                                  >
                                    {attendance.percentage >= 80
                                      ? 'Excellent'
                                      : attendance.percentage >= 60
                                        ? 'Good'
                                        : 'Poor'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className='hidden lg:table-cell'>
                                <div className='w-32'>
                                  <Progress value={attendance.percentage} className='h-2' />
                                </div>
                              </TableCell>
                              <TableCell className='text-right'>
                                <div className='flex justify-end gap-2'>
                                  <Button
                                    onClick={() =>
                                      handleMarkAttendance(studentId, enrollmentUuid, true)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className={`gap-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${currentStatus === true
                                      ? 'bg-success text-white hover:bg-success/90'
                                      : 'bg-white'
                                      }`}
                                    disabled={
                                      currentStatus === false ||
                                      (loadingEnrollmentUuid === enrollmentUuid &&
                                        markAttendanceMut.isPending)
                                    }
                                  >
                                    {loadingEnrollmentUuid === enrollmentUuid &&
                                      markAttendanceMut.isPending ? (
                                      <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                                    ) : (
                                      <CheckCircle className='h-4 w-4' />
                                    )}
                                    <span className='hidden sm:inline'>Present</span>
                                  </Button>

                                  <Button
                                    onClick={() =>
                                      handleMarkAttendance(studentId, enrollmentUuid, false)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className={`gap-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${currentStatus === false
                                      ? 'bg-destructive text-white hover:bg-destructive/90'
                                      : 'bg-white'
                                      }`}
                                    disabled={
                                      currentStatus === true ||
                                      (loadingEnrollmentUuid === enrollmentUuid &&
                                        markAttendanceMut.isPending)
                                    }
                                  >
                                    {loadingEnrollmentUuid === enrollmentUuid &&
                                      markAttendanceMut.isPending ? (
                                      <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                                    ) : (
                                      <XCircle className='h-4 w-4' />
                                    )}
                                    <span className='hidden sm:inline'>Absent</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className='border-t px-6 py-4'>
              <div className='flex items-center justify-between'>
                <div className='text-muted-foreground text-sm'>
                  {
                    studentsForThisSchedule.filter(e =>
                      e.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length
                  }{' '}
                  student
                  {studentsForThisSchedule.filter(e =>
                    e.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 1
                    ? ''
                    : 's'}
                  {searchQuery && ' matching search'}
                </div>
                <Button onClick={() => setIsAttendanceDrawerOpen(false)}>Done</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Add Assignment Dialog ── */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Add Assignment</DialogTitle>
            <DialogDescription>
              Create a new assignment for{' '}
              {selectedSchedule && moment(selectedSchedule.start_time).format('MMM D, YYYY')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Assignment</Label>
              <select
                className='w-full rounded-md border p-2'
                value={selectedAssignmentUuid}
                onChange={e => {
                  const uuid = e.target.value;
                  setSelectedAssignmentUuid(uuid);
                  setSelectedAssignment(
                    allAssignments?.data?.content?.find((item: any) => item.uuid === uuid) || null
                  );
                }}
              >
                <option value=''>Select assignment</option>
                {allAssignments?.data?.content?.map((a: any) => (
                  <option key={a.uuid} value={a.uuid}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Visible At</Label>
                <Input
                  type='datetime-local'
                  value={visibleAt}
                  onChange={e => setVisibleAt(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>Due Date</Label>
                <Input
                  type='datetime-local'
                  value={assignmentDueDate}
                  onChange={e => setAssignmentDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Grading Due At</Label>
              <Input
                type='datetime-local'
                value={gradingDueAt}
                onChange={e => setGradingDueAt(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Max Attempts</Label>
              <Input
                type='number'
                min='1'
                value={maxAttempts}
                onChange={e => setMaxAttempts(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={assignmentNotes}
                onChange={e => setAssignmentNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsAssignmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment} disabled={!selectedAssignmentUuid}>
              <Plus className='mr-2 h-4 w-4' />
              {addAssignmentScheduleMut.isPending ? 'Creating...' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Quiz Dialog ── */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Add Quiz</DialogTitle>
            <DialogDescription>
              Create a new quiz for{' '}
              {selectedSchedule && moment(selectedSchedule.start_time).format('MMM D, YYYY')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Quiz</Label>
              <select
                className='w-full rounded-md border p-2'
                value={selectedQuizUuid}
                onChange={e => {
                  const uuid = e.target.value;
                  setSelectedQuizUuid(uuid);
                  setSelectedQuiz(
                    allQuizzes?.data?.content?.find((item: any) => item.uuid === uuid) || null
                  );
                }}
              >
                <option value=''>Select quiz</option>
                {allQuizzes?.data?.content?.map((q: any) => (
                  <option key={q.uuid} value={q.uuid}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Visible At</Label>
                <Input
                  type='datetime-local'
                  value={quizVisibleAt}
                  onChange={e => setQuizVisibleAt(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>Due Date</Label>
                <Input
                  type='datetime-local'
                  value={quizDueDate}
                  onChange={e => setQuizDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label>Time Limit (min)</Label>
                <Input
                  type='number'
                  placeholder='Optional'
                  value={timeLimitOverride}
                  onChange={e => setTimeLimitOverride(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>Max Attempts</Label>
                <Input
                  type='number'
                  placeholder='Optional'
                  value={attemptLimitOverride}
                  onChange={e => setAttemptLimitOverride(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>Passing Score</Label>
                <Input
                  type='number'
                  step='0.1'
                  placeholder='Optional'
                  value={passingScoreOverride}
                  onChange={e => setPassingScoreOverride(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Notes</Label>
              <Textarea
                rows={2}
                placeholder='Optional notes...'
                value={quizNotes}
                onChange={e => setQuizNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsQuizDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuiz} disabled={!selectedQuizUuid}>
              <Plus className='mr-2 h-4 w-4' />
              {addQuizScheduleMut.isPending ? 'Creating...' : 'Create Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
