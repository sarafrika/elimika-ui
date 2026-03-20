'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInstructor } from '@/context/instructor-context';
import { elimikaDesignSystem } from '@/lib/design-system';
import {
  getClassDefinitionsForInstructorOptions,
  getClassScheduleOptions,
  getEnrollmentsForClassOptions,
  getStudentByIdOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  MoveLeft,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useBreadcrumb } from '../../../../../context/breadcrumb-provider';

type EnrollmentSession = {
  uuid?: string;
  scheduledInstanceUuid?: string;
  status?: string;
  isAttendanceMarked?: boolean;
  didAttend?: boolean;
  attendanceMarkedAt?: Date;
  createdDate?: Date;
  updatedDate?: Date;
  canBeCancelled?: boolean;
};

type StudentEnrollmentDetail = {
  courseId: string;
  courseName: string;
  enrollmentId: string;
  status: string;
  sessions: EnrollmentSession[];
  sessionCount: number;
  attendedSessions: number;
  markedSessions: number;
  pendingSessions: number;
};

const formatStatusLabel = (status?: string) => {
  if (!status) return 'Unknown';
  return status
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getEnrollmentBadge = (status?: string) => {
  switch (status) {
    case 'ENROLLED':
    case 'ACTIVE':
      return <Badge variant='success'>{formatStatusLabel(status)}</Badge>;
    case 'PENDING':
      return <Badge variant='secondary'>{formatStatusLabel(status)}</Badge>;
    case 'CANCELLED':
      return <Badge variant='destructive'>{formatStatusLabel(status)}</Badge>;
    case 'COMPLETED':
      return <Badge variant='outline'>{formatStatusLabel(status)}</Badge>;
    default:
      return <Badge variant='outline'>{formatStatusLabel(status)}</Badge>;
  }
};

const getAttendanceBadge = (session: EnrollmentSession) => {
  if (!session.isAttendanceMarked) {
    return (
      <Badge variant='outline' className='gap-1'>
        <Clock className='h-3 w-3' />
        Pending
      </Badge>
    );
  }

  if (session.didAttend) {
    return (
      <Badge variant='success' className='gap-1'>
        <CheckCircle2 className='h-3 w-3' />
        Present
      </Badge>
    );
  }

  return (
    <Badge variant='destructive' className='gap-1'>
      <XCircle className='h-3 w-3' />
      Absent
    </Badge>
  );
};

const EnrollmentDetails = () => {
  const instructor = useInstructor();
  const params = useParams();
  const searchParams = useSearchParams();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const studentId = params?.id as string;
  const initialCourseId = searchParams.get('courseId');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialCourseId);

  useEffect(() => {
    replaceBreadcrumbs([
      {
        id: 'Enrollments',
        title: 'Enrollments',
        url: '/dashboard/enrollments',
      },
      {
        id: 'Enrollment-details',
        title: 'Student Enrollment',
        url: `/dashboard/enrollments/${studentId}`,
      },
    ]);
  }, [replaceBreadcrumbs, studentId]);

  const { data: studentData, isLoading: isLoadingStudent } = useQuery({
    ...getStudentByIdOptions({
      path: { uuid: studentId },
    }),
    enabled: !!studentId,
  });

  const {
    data: classesData,
    isLoading: isLoadingClasses,
    isError: isClassesError,
  } = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { activeOnly: true },
    }),
    enabled: !!instructor?.uuid,
  });

  const instructorClasses = useMemo(
    () => classesData?.data?.map((item: any) => item.class_definition).filter(Boolean) ?? [],
    [classesData]
  );

  const enrollmentQueries = useQueries({
    queries: instructorClasses.map((classItem: any) => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.uuid },
      }),
      enabled: !!classItem.uuid,
    })),
  });

  const scheduleQueries = useQueries({
    queries: instructorClasses.map((classItem: any) => ({
      ...getClassScheduleOptions({
        path: { uuid: classItem.uuid },
        query: { pageable: {} },
      }),
      enabled: !!classItem.uuid,
    })),
  });

  const enrollmentDetails = useMemo<StudentEnrollmentDetail[]>(() => {
    return instructorClasses
      .map((classItem: any, index: number) => {
        const enrollments = (enrollmentQueries[index]?.data?.data ?? []).filter(
          (enrollment: any) => enrollment.student_uuid === studentId
        );

        if (enrollments.length === 0) {
          return null;
        }

        const uniqueSessions = Array.from(
          new Map(
            enrollments.map((enrollment: any) => [
              enrollment.scheduled_instance_uuid,
              {
                uuid: enrollment.uuid,
                scheduledInstanceUuid: enrollment.scheduled_instance_uuid,
                status: enrollment.status,
                isAttendanceMarked: enrollment.is_attendance_marked,
                didAttend: enrollment.did_attend,
                attendanceMarkedAt: enrollment.attendance_marked_at,
                createdDate: enrollment.created_date,
                updatedDate: enrollment.updated_date,
                canBeCancelled: enrollment.can_be_cancelled,
              } satisfies EnrollmentSession,
            ])
          ).values()
        ).sort((a, b) => {
          const left = a.attendanceMarkedAt ?? a.createdDate ?? a.updatedDate ?? new Date(0);
          const right = b.attendanceMarkedAt ?? b.createdDate ?? b.updatedDate ?? new Date(0);
          return right.getTime() - left.getTime();
        });

        const markedSessions = uniqueSessions.filter(session => session.isAttendanceMarked).length;
        const attendedSessions = uniqueSessions.filter(session => session.didAttend).length;
        const scheduleCount = scheduleQueries[index]?.data?.data?.content?.length;

        return {
          courseId: classItem.uuid,
          courseName: classItem.title || 'Untitled Course',
          enrollmentId: enrollments[0]?.uuid || `${classItem.uuid}-${studentId}`,
          status: enrollments[0]?.status || 'UNKNOWN',
          sessions: uniqueSessions,
          sessionCount: scheduleCount ?? uniqueSessions.length,
          attendedSessions,
          markedSessions,
          pendingSessions: Math.max((scheduleCount ?? uniqueSessions.length) - markedSessions, 0),
        } satisfies StudentEnrollmentDetail;
      })
      .filter(Boolean)
      .sort((a, b) => a.courseName.localeCompare(b.courseName)) as StudentEnrollmentDetail[];
  }, [enrollmentQueries, instructorClasses, scheduleQueries, studentId]);

  useEffect(() => {
    if (!selectedCourseId && enrollmentDetails.length > 0) {
      setSelectedCourseId(initialCourseId || enrollmentDetails[0].courseId);
    }
  }, [enrollmentDetails, initialCourseId, selectedCourseId]);

  const selectedEnrollment = useMemo(
    () =>
      enrollmentDetails.find(enrollment => enrollment.courseId === selectedCourseId) ||
      enrollmentDetails[0] ||
      null,
    [enrollmentDetails, selectedCourseId]
  );

  const totalSessions = enrollmentDetails.reduce(
    (total, enrollment) => total + enrollment.sessionCount,
    0
  );
  const attendedSessions = enrollmentDetails.reduce(
    (total, enrollment) => total + enrollment.attendedSessions,
    0
  );
  const markedSessions = enrollmentDetails.reduce(
    (total, enrollment) => total + enrollment.markedSessions,
    0
  );
  const pendingSessions = enrollmentDetails.reduce(
    (total, enrollment) => total + enrollment.pendingSessions,
    0
  );

  const isLoading =
    isLoadingStudent ||
    isLoadingClasses ||
    enrollmentQueries.some(query => query.isLoading || query.isFetching) ||
    scheduleQueries.some(query => query.isLoading || query.isFetching);

  const hasError =
    isClassesError ||
    enrollmentQueries.some(query => query.isError) ||
    scheduleQueries.some(query => query.isError);

  const student = studentData?.data;

  return (
    <div className={`${elimikaDesignSystem.components.pageContainer} space-y-6 px-4 sm:px-6`}>
      <Link
        className='text-muted-foreground hover:text-foreground flex max-w-fit items-center gap-2 py-1.5 text-sm'
        href='/dashboard/enrollments'
      >
        <MoveLeft className='h-4 w-4' /> Back
      </Link>

      <section>
        {isLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-80' />
          </div>
        ) : (
          <div className='space-y-1'>
            <h1 className='text-foreground text-xl font-bold sm:text-2xl'>
              {student?.full_name || 'Student Enrollment'}
            </h1>
            <p className='text-muted-foreground text-sm'>
              Courses this student is enrolled in under your instruction.
            </p>
          </div>
        )}
      </section>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 rounded-full p-3'>
              <BookOpen className='text-primary h-5 w-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Courses</p>
              <p className='text-foreground text-2xl font-bold'>{enrollmentDetails.length}</p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-chart-1/10 rounded-full p-3'>
              <Calendar className='text-chart-1 h-5 w-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Total Sessions</p>
              <p className='text-foreground text-2xl font-bold'>{totalSessions}</p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-success/10 rounded-full p-3'>
              <CheckCircle2 className='text-success h-5 w-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Attended</p>
              <p className='text-foreground text-2xl font-bold'>{attendedSessions}</p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-warning/10 rounded-full p-3'>
              <Clock className='text-warning h-5 w-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Pending</p>
              <p className='text-foreground text-2xl font-bold'>{pendingSessions}</p>
            </div>
          </div>
        </Card>
      </div>

      {hasError ? (
        <Card className='p-8 text-center'>
          <div className='bg-destructive/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
            <Users className='text-destructive h-6 w-6' />
          </div>
          <h3 className='text-foreground mb-1.5 text-base font-semibold'>
            Unable to load enrollment details
          </h3>
          <p className='text-muted-foreground text-sm'>
            There was a problem loading the student&apos;s instructor enrollment records.
          </p>
        </Card>
      ) : isLoading ? (
        <div className='grid gap-6 xl:grid-cols-[1.1fr_1.4fr]'>
          <Card className='p-4'>
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className='h-24 w-full' />
              ))}
            </div>
          </Card>
          <Card className='p-4'>
            <div className='space-y-3'>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          </Card>
        </div>
      ) : enrollmentDetails.length === 0 ? (
        <Card className='p-8 text-center'>
          <div className='bg-muted/50 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
            <BookOpen className='text-muted-foreground h-6 w-6' />
          </div>
          <h3 className='text-foreground mb-1.5 text-base font-semibold'>No Enrollments Found</h3>
          <p className='text-muted-foreground text-sm'>
            This student is not currently enrolled in any of your courses.
          </p>
        </Card>
      ) : (
        <div className='grid gap-6 xl:grid-cols-[1.1fr_1.4fr]'>
          <Card className='p-4'>
            <div className='mb-4'>
              <h2 className='text-foreground text-lg font-semibold'>Enrolled Courses</h2>
              <p className='text-muted-foreground text-sm'>
                Select a course to inspect its enrollment sessions and attendance.
              </p>
            </div>

            <div className='space-y-3'>
              {enrollmentDetails.map(enrollment => {
                const attendanceRate =
                  enrollment.markedSessions > 0
                    ? Math.round((enrollment.attendedSessions / enrollment.markedSessions) * 100)
                    : null;

                return (
                  <button
                    key={enrollment.courseId}
                    type='button'
                    onClick={() => setSelectedCourseId(enrollment.courseId)}
                    className={`border-border/50 w-full rounded-xl border p-4 text-left transition-colors ${selectedEnrollment?.courseId === enrollment.courseId
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent/5'
                      }`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0 space-y-2'>
                        <h3 className='text-foreground truncate font-semibold'>
                          {enrollment.courseName}
                        </h3>
                        <div>{getEnrollmentBadge(enrollment.status)}</div>
                      </div>
                      <span className='text-muted-foreground text-xs'>
                        {enrollment.sessionCount} session
                        {enrollment.sessionCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className='text-muted-foreground mt-3 grid gap-2 text-xs sm:grid-cols-3'>
                      <div className='bg-muted/50 rounded-lg px-3 py-2'>
                        <span className='block'>Attendance</span>
                        <span className='text-foreground font-medium'>
                          {enrollment.attendedSessions}/{enrollment.markedSessions || 0} marked
                        </span>
                      </div>
                      <div className='bg-muted/50 rounded-lg px-3 py-2'>
                        <span className='block'>Pending</span>
                        <span className='text-foreground font-medium'>
                          {enrollment.pendingSessions} session
                          {enrollment.pendingSessions === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className='bg-muted/50 rounded-lg px-3 py-2'>
                        <span className='block'>Rate</span>
                        <span className='text-foreground font-medium'>
                          {attendanceRate === null ? 'N/A' : `${attendanceRate}%`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className='p-4 sm:p-6'>
              <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h2 className='text-foreground text-lg font-semibold'>
                    {selectedEnrollment?.courseName || 'Course Details'}
                  </h2>
                  <p className='text-muted-foreground text-sm'>
                    Session-level attendance and enrollment history.
                  </p>
                </div>
                {selectedEnrollment ? getEnrollmentBadge(selectedEnrollment.status) : null}
              </div>

              {selectedEnrollment ? (
                <>
                  <div className='mb-4 grid gap-3 sm:grid-cols-3'>
                    <div className='bg-muted/50 rounded-xl p-3'>
                      <p className='text-muted-foreground text-xs'>Sessions</p>
                      <p className='text-foreground text-xl font-semibold'>
                        {selectedEnrollment.sessionCount}
                      </p>
                    </div>
                    <div className='bg-muted/50 rounded-xl p-3'>
                      <p className='text-muted-foreground text-xs'>Marked</p>
                      <p className='text-foreground text-xl font-semibold'>
                        {selectedEnrollment.markedSessions}
                      </p>
                    </div>
                    <div className='bg-muted/50 rounded-xl p-3'>
                      <p className='text-muted-foreground text-xs'>Attendance Rate</p>
                      <p className='text-foreground text-xl font-semibold'>
                        {selectedEnrollment.markedSessions > 0
                          ? `${Math.round(
                            (selectedEnrollment.attendedSessions /
                              selectedEnrollment.markedSessions) *
                            100
                          )}%`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedEnrollment.sessions.length === 0 ? (
                    <div className='py-10 text-center'>
                      <Calendar className='text-muted-foreground mx-auto mb-3 h-10 w-10' />
                      <p className='text-foreground text-lg font-medium'>No session records yet</p>
                      <p className='text-muted-foreground text-sm'>
                        Session details will appear here once attendance records are available.
                      </p>
                    </div>
                  ) : (
                    <div className='overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='w-[50px]'>#</TableHead>
                            <TableHead>Session ID</TableHead>
                            <TableHead>Enrollment</TableHead>
                            <TableHead>Attendance</TableHead>
                            <TableHead>Marked Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedEnrollment.sessions.map((session, index) => (
                            <TableRow key={session.uuid || session.scheduledInstanceUuid || index}>
                              <TableCell className='font-medium'>{index + 1}</TableCell>
                              <TableCell className='font-mono text-xs'>
                                {session.scheduledInstanceUuid
                                  ? `${session.scheduledInstanceUuid.slice(0, 8)}...`
                                  : 'Unavailable'}
                              </TableCell>
                              <TableCell>{getEnrollmentBadge(session.status)}</TableCell>
                              <TableCell>{getAttendanceBadge(session)}</TableCell>
                              <TableCell>
                                {session.attendanceMarkedAt ? (
                                  <span className='text-sm'>
                                    {format(session.attendanceMarkedAt, 'MMM dd, yyyy HH:mm')}
                                  </span>
                                ) : (
                                  <span className='text-muted-foreground text-sm'>Not marked</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <div className='py-10 text-center'>
                  <BookOpen className='text-muted-foreground mx-auto mb-3 h-10 w-10' />
                  <p className='text-foreground text-lg font-medium'>Select a course</p>
                  <p className='text-muted-foreground text-sm'>
                    Choose one of the enrolled courses to inspect session details.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {!isLoading && !hasError && enrollmentDetails.length > 0 ? (
        <Card className='p-4'>
          <h3 className='text-foreground mb-2 font-semibold'>Notes</h3>
          <ul className='text-muted-foreground space-y-1 text-sm'>
            <li>• Courses under this instructor: {enrollmentDetails.length}</li>
            <li>• Sessions with attendance marked: {markedSessions}</li>
            <li>• Sessions awaiting attendance: {pendingSessions}</li>
            <li>
              • Overall attendance rate:{' '}
              {markedSessions > 0 ? `${Math.round((attendedSessions / markedSessions) * 100)}%` : 'N/A'}
            </li>
          </ul>
        </Card>
      ) : null}
    </div>
  );
};

export default EnrollmentDetails;
