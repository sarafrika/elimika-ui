'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useClassRoster } from '@/hooks/use-class-roster';
import {
  markAttendanceMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react';
import moment from 'moment';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../../../../../components/ui/card';
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
import { useClassDetails } from '../../../../../../hooks/use-class-details';

export default function TrainingInterfacePage() {
  const qc = useQueryClient()
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
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, boolean>>>({});
  const [searchQuery, setSearchQuery] = useState('');

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
    const scheduleDate = moment(schedule.start_time);
    return scheduleDate.isBetween(startOfWeek, endOfWeek, null, '[]');
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
    ? studentsByScheduleInstance[selectedSchedule.uuid] ?? []
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
      percentage:
        totalSessions > 0
          ? (presentSessions.length / totalSessions) * 100
          : 0,
    };
  };

  // Handle attendance marking
  const markAttendanceMut = useMutation(markAttendanceMutation())
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
        query: { attended: isPresent }
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


  // Handle start class
  const handleStartClass = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsAttendanceDrawerOpen(true);
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
    <div className='bg-background min-h-screen p-6'>
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
                      <TableHead className='text-right'>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekSchedules.map((schedule: any, index: number) => {
                      const isPast = isSchedulePast(schedule);
                      const isEnabled = isScheduleEnabled(schedule);
                      const isFuture = moment(schedule.start_time).isAfter(endOfWeek);

                      return (
                        <TableRow
                          key={schedule.uuid}
                          className={!isEnabled ? 'opacity-50' : ''}
                        >
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
                          <TableCell className='flex flex-row self-end justify-end text-right gap-2'>
                            <Button
                              onClick={() => handleStartClass(schedule)}
                              disabled={!isEnabled}
                              size='sm'
                              variant={isEnabled ? 'default' : 'outline'}
                              className='gap-2'
                            >
                              {isEnabled ? (
                                <>
                                  Mark Attendance
                                  <ChevronRight className='h-4 w-4' />
                                </>
                              ) : (
                                'Attendance'
                              )}
                            </Button>

                            <Button
                              onClick={() => handleStartClass(schedule)}
                              disabled={!isEnabled}
                              size='sm'
                              variant={isEnabled ? 'default' : 'outline'}
                              className='gap-2'
                            >
                              {isEnabled ? (
                                <>
                                  Start Class
                                  <ChevronRight className='h-4 w-4' />
                                </>
                              ) : (
                                'Start Class'
                              )}
                            </Button>
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

      {/* Attendance Drawer */}
      <Sheet open={isAttendanceDrawerOpen} onOpenChange={setIsAttendanceDrawerOpen}>
        <SheetContent className='w-[500px] sm:max-w-[500px] px-6'>
          <SheetHeader>
            <SheetTitle>Mark Attendance</SheetTitle>
            <SheetDescription>
              {selectedSchedule && (
                <div className='space-y-1 pt-2'>
                  <div className='text-foreground font-medium'>
                    {moment(selectedSchedule.start_time).format('dddd, MMM D, YYYY')}
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    {moment(selectedSchedule.start_time).format('h:mm A')} -{' '}
                    {moment(selectedSchedule.end_time).format('h:mm A')}
                  </div>
                </div>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className='space-y-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                type='text'
                placeholder='Search students...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            <Separator />

            {/* Students List */}
            <ScrollArea className='h-[calc(100vh-280px)]'>
              <div className='space-y-2'>
                {studentsForThisSchedule
                  .filter((entry) =>
                    entry.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((entry: any) => {
                    const studentId = entry.user.uuid;
                    const name = entry.user.full_name;
                    const attendance = calculateStudentAttendance(studentId);
                    const currentEnrollment = enrollmentsByStudent[studentId]?.find(
                      e => e.scheduled_instance_uuid === selectedSchedule?.uuid
                    );
                    const currentStatus = entry?.enrollment?.did_attend;
                    const isMarked = entry?.enrollment?.is_attendance_marked;
                    const enrollmentUuid = entry?.enrollment?.uuid

                    return (
                      <Card key={studentId} className='border-border overflow-hidden'>
                        <CardContent className='p-4'>
                          <div className='space-y-3'>
                            {/* Student Info */}
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-3'>
                                <div className='bg-primary/15 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold'>
                                  {name
                                    .split(' ')
                                    .map((n: string) => n?.[0])
                                    .slice(0, 2)
                                    .join('')}
                                </div>
                                <div>
                                  <div className='text-foreground font-medium'>{name}</div>
                                  <div className='text-muted-foreground text-xs'>
                                    {attendance.presentCount} / {attendance.totalSessions} sessions marked
                                  </div>
                                </div>
                              </div>
                              <div className='text-right'>
                                <div className='text-foreground text-sm font-semibold'>
                                  {attendance.percentage.toFixed(0)}%
                                </div>
                                <div className='text-muted-foreground text-xs'>Attendance</div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <Progress value={attendance.percentage} className='h-1.5' />


                            {/* Action Buttons */}
                            <div className='flex gap-2'>
                              <Button
                                onClick={() => handleMarkAttendance(studentId, enrollmentUuid, true)}
                                variant={currentStatus === true ? 'success' : 'outline'}
                                size='sm'
                                className='flex-1 gap-1.5'
                                disabled={loadingEnrollmentUuid === enrollmentUuid && markAttendanceMut.isPending}
                              >
                                {loadingEnrollmentUuid === enrollmentUuid && markAttendanceMut.isPending ? (
                                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                ) : (
                                  <CheckCircle className='h-4 w-4 mr-1' />
                                )}
                                Present
                              </Button>

                              <Button
                                onClick={() => handleMarkAttendance(studentId, enrollmentUuid, false)}
                                variant={currentStatus === false ? 'destructive' : 'outline'}
                                size='sm'
                                className='flex-1 gap-1.5'
                                disabled={loadingEnrollmentUuid === enrollmentUuid && markAttendanceMut.isPending}
                              >
                                {loadingEnrollmentUuid === enrollmentUuid && markAttendanceMut.isPending ? (
                                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                ) : (
                                  <XCircle className='h-4 w-4 mr-1' />
                                )}
                                Absent
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                {filteredRoster?.length === 0 && (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Users className='text-muted-foreground mb-3 h-12 w-12 opacity-40' />
                    <p className='text-muted-foreground text-sm'>No students found</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className='border-t pt-4'>
              <Button onClick={() => setIsAttendanceDrawerOpen(false)} className='w-full'>
                Done
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}