'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useClassRoster } from '@/hooks/use-class-roster';
import { createAssignmentScheduleMutation, createQuizScheduleMutation, getAllAssignmentsOptions, getAllQuizzesOptions, getAssignmentSchedulesOptions, getQuizSchedulesOptions, markAttendanceMutation } from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  XCircle
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

export default function TrainingInterfacePage() {
  const qc = useQueryClient();
  const instructor = useInstructor()
  const params = useParams();
  const classId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'trainings',
        title: 'Training Classes',
        url: '/dashboard/trainings',
      },
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

  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [isAttendanceDrawerOpen, setIsAttendanceDrawerOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [searchQuery, setSearchQuery] = useState('');

  // Assignment form state
  const [selectedAssignmentUuid, setSelectedAssignmentUuid] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [visibleAt, setVisibleAt] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [gradingDueAt, setGradingDueAt] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Quiz form state
  const [selectedQuizUuid, setSelectedQuizUuid] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [quizVisibleAt, setQuizVisibleAt] = useState('');
  const [quizDueDate, setQuizDueDate] = useState('');
  const [timeLimitOverride, setTimeLimitOverride] = useState(selectedQuiz?.time_limit_minutes);
  const [attemptLimitOverride, setAttemptLimitOverride] = useState(selectedQuiz?.attempts_allowed);
  const [passingScoreOverride, setPassingScoreOverride] = useState(selectedQuiz?.passing_score);
  const [quizNotes, setQuizNotes] = useState('');

  // Get current week boundaries (Sunday to Saturday)
  const getCurrentWeekBoundaries = () => {
    const now = moment();
    const startOfWeek = now.clone().startOf('week');
    const endOfWeek = now.clone().endOf('week');
    return { startOfWeek, endOfWeek };
  };

  const { startOfWeek, endOfWeek } = getCurrentWeekBoundaries();

  // Group schedules by week
  const groupedSchedules = useMemo(() => {
    const groups: Record<string, any[]> = {};

    schedules.forEach((schedule: any) => {
      const scheduleDate = moment(schedule.start_time);
      const weekStart = scheduleDate.clone().startOf('week');
      const weekEnd = scheduleDate.clone().endOf('week');
      const weekKey = `${weekStart.format('MMM D')} - ${weekEnd.format('MMM D, YYYY')}`;

      if (!groups[weekKey]) {
        groups[weekKey] = [];
      }
      groups[weekKey].push(schedule);
    });

    // Sort schedules within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => moment(a.start_time).diff(moment(b.start_time)));
    });

    return groups;
  }, [schedules]);

  const isScheduleEnabled = (schedule: any) => {
    return true;
    // const scheduleDate = moment(schedule.start_time);
    // return scheduleDate.isBetween(startOfWeek, endOfWeek, null, '[]');
  };

  const isSchedulePast = (schedule: any) => {
    return moment(schedule.start_time).isBefore(moment(), 'day');
  };

  const calculateProgress = () => {
    const total = schedules.length;
    const completed = schedules.filter((s: any) => isSchedulePast(s)).length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };
  const progress = calculateProgress();

  // Map of schedule instance UUID → students
  const studentsByScheduleInstance = useMemo(() => {
    const map: Record<string, any[]> = {};

    rosterAllEnrollments.forEach(({ enrollment, student, user }) => {
      const scheduleUuid = enrollment.scheduled_instance_uuid;
      if (!map[scheduleUuid]) map[scheduleUuid] = [];
      map[scheduleUuid].push({ enrollment, student, user });
    });

    return map;
  }, [rosterAllEnrollments]);

  // Get the list of students for the currently selected schedule
  const studentsForThisSchedule = selectedSchedule
    ? (studentsByScheduleInstance[selectedSchedule.uuid] ?? [])
    : [];

  // group enrollments per student:
  const enrollmentsByStudent = useMemo(() => {
    const map: Record<string, any[]> = {};

    rosterAllEnrollments?.forEach((entry: any) => {
      const studentId = entry?.user?.uuid;
      const enrollment = entry?.enrollment;

      if (!map[studentId]) {
        map[studentId] = [];
      }

      if (enrollment?.scheduled_instance_uuid) {
        map[studentId].push(enrollment);
      }
    });

    return map;
  }, [roster]);

  // Calculate student attendance
  const calculateStudentAttendance = (studentId: string) => {
    const studentEnrollments = enrollmentsByStudent[studentId] || [];
    const totalSessions = schedules.length;
    const markedSessions = studentEnrollments.filter(e => e.is_attendance_marked);
    const presentSessions = markedSessions.filter(e => e.did_attend === true);

    return {
      totalSessions,
      markedSessions: markedSessions.length,
      presentCount: presentSessions.length,
      percentage: totalSessions > 0 ? (presentSessions.length / totalSessions) * 100 : 0,
    };
  };

  // Handle attendance marking
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
      {
        path: { enrollmentUuid },
        query: { attended: isPresent },
      },
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
            `Marked ${isPresent ? 'Present' : 'Absent'} for ${roster?.find((r: any) => r.user.uuid === studentId)?.user.full_name
            }`
          );
        },
        onSettled: () => {
          setLoadingEnrollmentUuid(null);
        },
      }
    );
  };

  // Handle actions
  const handleMarkAttendanceAction = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsAttendanceDrawerOpen(true);
  };

  const handleLaunchClass = (schedule: any) => {
    // Mock meeting link - replace with actual meeting URL from schedule data
    const meetingLink = schedule.meeting_url || 'https://meet.google.com/abc-defg-hij';
    window.open(meetingLink, '_blank');
    toast.success('Opening class meeting...');
  };


  ///////// ADD ASSIGNMENT FOR CLASS SCHEDULES //////////
  const { data: allAssignments } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: {} } })
  })

  const { data: allQuizzes } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: {} } })
  })

  const addAssignmentScheduleMut = useMutation(createAssignmentScheduleMutation())
  const { data: assignmentSchedule } = useQuery({
    ...getAssignmentSchedulesOptions({ path: { classUuid: classId as string } })
  })

  const addQuizScheduleMut = useMutation(createQuizScheduleMutation())
  const { data: quizSchedule } = useQuery({
    ...getQuizSchedulesOptions({ path: { classUuid: classId as string } })
  })
  ///////// ADD ASSIGNMENT FOR CLASS SCHEDULES //////////

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
      timezone: "Africa/Nairobi",
      release_strategy: "CUSTOM",
      max_attempts: Number(maxAttempts),
      instructor_uuid: instructor?.uuid as string,
      notes: assignmentNotes,
    };

    addAssignmentScheduleMut.mutate({ body: payload as any, path: { classUuid: classId as string } }, {
      onSuccess: () => {
        toast.success('Assignment created successfully!');
        setIsAssignmentDialogOpen(false);
        // setSelectedAssignmentUuid('');
        // setVisibleAt('');
        // setAssignmentDueDate('');
        // setGradingDueAt('');
        // setMaxAttempts('1');
        // setAssignmentNotes('');
      }
    })
  };

  const handleCreateQuiz = () => {
    const payload = {
      class_definition_uuid: classId as string,
      lesson_uuid: selectedQuiz?.lesson_uuid,
      quiz_uuid: selectedQuizUuid,
      class_lesson_plan_uuid: selectedSchedule?.uuid,
      visible_at: quizVisibleAt,
      due_at: quizDueDate,
      timezone: "Africa/Nairobi",
      release_strategy: "CUSTOM",
      time_limit_override: timeLimitOverride ? Number(timeLimitOverride) : undefined,
      attempt_limit_override: attemptLimitOverride ? Number(attemptLimitOverride) : undefined,
      passing_score_override: passingScoreOverride ? Number(passingScoreOverride) : undefined,
      instructor_uuid: instructor?.uuid as string,
      notes: quizNotes,
    };

    addQuizScheduleMut.mutate({ body: payload as any, path: { classUuid: classId as string } }, {
      onSuccess: () => {
        toast.success('Quiz created successfully!');
        setIsQuizDialogOpen(false);
        // setSelectedQuizUuid('');
        // setQuizVisibleAt('');
        // setQuizDueDate('');
        // setTimeLimitOverride('');
        // setAttemptLimitOverride('');
        // setPassingScoreOverride('');
        // setQuizNotes('');
      }
    });

  };

  // Filter students
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
      {/* Header Card */}
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

            {/* Progress Card */}
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

      {/* Schedule Tables by Week */}
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
                                <div className='flex flex-row items-center cursor-pointer bg-primary/20 px-3 py-1 rounded-xl'
                                  onClick={() => handleLaunchClass(schedule)}>
                                  <Video className='mr-2 h-4 w-4' />
                                  Launch Class
                                  <ExternalLink className='ml-auto h-3 w-3' />
                                </div>

                                <div className='flex flex-row items-center cursor-pointer bg-primary/20 px-3 py-1 rounded-xl' onClick={() => handleMarkAttendanceAction(schedule)}>
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

      {/* Attendance Drawer - Table Layout */}
      <Sheet open={isAttendanceDrawerOpen} onOpenChange={setIsAttendanceDrawerOpen}>
        <SheetContent className='w-full p-0 sm:max-w-full lg:max-w-[90vw] xl:max-w-[70vw]'>
          <div className='flex h-full flex-col'>
            {/* Header */}
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

              {/* Search */}
              <div className='relative mt-4'>
                <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
                <Input
                  type='text'
                  placeholder='Search students by name...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            {/* Table */}
            <div className='flex-1 overflow-auto px-6 py-4'>
              {studentsForThisSchedule.filter(entry =>
                entry.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center py-12 text-center'>
                  <Users className='text-muted-foreground mb-3 h-12 w-12 opacity-40' />
                  <h3 className='text-foreground mb-1 text-lg font-semibold'>No students found</h3>
                  <p className='text-muted-foreground text-sm'>
                    {searchQuery ? 'Try adjusting your search query' : 'No students enrolled in this session'}
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
                              {/* Index */}
                              <TableCell className='font-medium'>{index + 1}</TableCell>

                              {/* Student Info */}
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
                                    <div className='text-foreground truncate font-medium'>{name}</div>
                                    <div className='text-muted-foreground truncate text-xs'>
                                      {attendance.presentCount} / {attendance.totalSessions} sessions present
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Overall Attendance Percentage */}
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

                              {/* Progress Bar */}
                              <TableCell className='hidden lg:table-cell'>
                                <div className='w-32'>
                                  <Progress value={attendance.percentage} className='h-2' />
                                </div>
                              </TableCell>

                              {/* Action Buttons */}
                              <TableCell className='text-right'>
                                <div className='flex justify-end gap-2'>
                                  <Button
                                    onClick={() =>
                                      handleMarkAttendance(studentId, enrollmentUuid, true)
                                    }
                                    variant={currentStatus === true ? 'default' : 'outline'}
                                    size='sm'
                                    className='gap-1.5'
                                    disabled={
                                      loadingEnrollmentUuid === enrollmentUuid &&
                                      markAttendanceMut.isPending
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
                                    variant={currentStatus === false ? 'destructive' : 'outline'}
                                    size='sm'
                                    className='gap-1.5'
                                    disabled={
                                      loadingEnrollmentUuid === enrollmentUuid &&
                                      markAttendanceMut.isPending
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

            {/* Footer */}
            <div className='border-t px-6 py-4'>
              <div className='flex items-center justify-between'>
                <div className='text-muted-foreground text-sm'>
                  {studentsForThisSchedule.filter(entry =>
                    entry.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length}{' '}
                  {studentsForThisSchedule.filter(entry =>
                    entry.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 1
                    ? 'student'
                    : 'students'}{' '}
                  {searchQuery && 'matching search'}
                </div>
                <Button onClick={() => setIsAttendanceDrawerOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Assignment Dialog - keeping original */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Add Assignment</DialogTitle>
            <DialogDescription>
              Create a new assignment for {selectedSchedule && moment(selectedSchedule.start_time).format('MMM D, YYYY')}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Assignment</Label>
              <select
                className='w-full border rounded-md p-2'
                value={selectedAssignmentUuid}
                onChange={(e) => {
                  const uuid = e.target.value;
                  setSelectedAssignmentUuid(uuid);

                  const assignment = allAssignments?.data?.content?.find(
                    (item: any) => item.uuid === uuid
                  );

                  setSelectedAssignment(assignment || null);
                }}
              >
                <option value=''>Select assignment</option>
                {allAssignments?.data?.content?.map((assignment: any) => (
                  <option key={assignment.uuid} value={assignment.uuid}>
                    {assignment.title}
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
                  onChange={(e) => setVisibleAt(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label>Due Date</Label>
                <Input
                  type='datetime-local'
                  value={assignmentDueDate}
                  onChange={(e) => setAssignmentDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Grading Due At</Label>
              <Input
                type='datetime-local'
                value={gradingDueAt}
                onChange={(e) => setGradingDueAt(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Max Attempts</Label>
              <Input
                type='number'
                min='1'
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsAssignmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment} disabled={!selectedAssignmentUuid}>
              <Plus className='mr-2 h-4 w-4' />
              Create Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Quiz Dialog - UPDATED */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Add Quiz</DialogTitle>
            <DialogDescription>
              Create a new quiz for {selectedSchedule && moment(selectedSchedule.start_time).format('MMM D, YYYY')}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* Quiz Select */}
            <div className='space-y-2'>
              <Label>Quiz</Label>
              <select
                className='w-full border rounded-md p-2'
                value={selectedQuizUuid}
                onChange={(e) => {
                  const uuid = e.target.value;
                  setSelectedQuizUuid(uuid);

                  const quiz = allQuizzes?.data?.content?.find(
                    (item: any) => item.uuid === uuid
                  );

                  setSelectedQuiz(quiz || null);
                }}
              >
                <option value=''>Select quiz</option>
                {allQuizzes?.data?.content?.map((quiz: any) => (
                  <option key={quiz.uuid} value={quiz.uuid}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Visible At</Label>
                <Input
                  type='datetime-local'
                  value={quizVisibleAt}
                  onChange={(e) => setQuizVisibleAt(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label>Due Date</Label>
                <Input
                  type='datetime-local'
                  value={quizDueDate}
                  onChange={(e) => setQuizDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Override Settings */}
            <div className='grid grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label>Time Limit (min)</Label>
                <Input
                  type='number'
                  placeholder='Optional'
                  value={timeLimitOverride}
                  onChange={(e) => setTimeLimitOverride(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label>Max Attempts</Label>
                <Input
                  type='number'
                  placeholder='Optional'
                  value={attemptLimitOverride}
                  onChange={(e) => setAttemptLimitOverride(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label>Passing Score</Label>
                <Input
                  type='number'
                  step='0.1'
                  placeholder='Optional'
                  value={passingScoreOverride}
                  onChange={(e) => setPassingScoreOverride(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Notes</Label>
              <Textarea
                rows={2}
                placeholder='Optional notes or instructions...'
                value={quizNotes}
                onChange={(e) => setQuizNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsQuizDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuiz} disabled={!selectedQuizUuid}>
              <Plus className='mr-2 h-4 w-4' />
              Create Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}