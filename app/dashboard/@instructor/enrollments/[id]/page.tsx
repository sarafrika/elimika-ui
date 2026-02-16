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
import { elimikaDesignSystem } from '@/lib/design-system';
import {
  getClassDefinitionOptions,
  getStudentByIdOptions,
  searchEnrollmentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useBreadcrumb } from '../../../../../context/breadcrumb-provider';

const EnrollmentDetails = () => {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('id');

  const params = useParams();
  const classId = params?.id as string;

  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      {
        id: 'Enrollments',
        title: 'Enrollments',
        url: `/dashboard/enrollments`,
      },
      {
        id: 'Enrollment-details',
        title: `Student Enrollment`,
        url: `/dashboard/enrollments/${classId}?id=${studentId}`,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    ...searchEnrollmentsOptions({
      query: {
        pageable: {},
        searchParams: {
          student_uuid_eq: studentId as string,
          class_definition_uuid_eq: classId as string,
        },
      },
    }),
    enabled: !!classId && !!studentId,
  });

  const { data: studentData, isLoading: isLoadingStudent } = useQuery({
    ...getStudentByIdOptions({
      path: { uuid: studentId as string },
    }),
    enabled: !!studentId,
  });

  const { data: classData, isLoading: isLoadingClass } = useQuery({
    ...getClassDefinitionOptions({
      path: { uuid: classId as string },
    }),
    enabled: !!classId,
  });

  const enrollments = enrollmentsData?.data?.content || [];
  const student = studentData?.data;
  const classInfo = classData?.data?.class_definition;

  const isLoading = isLoadingEnrollments || isLoadingStudent || isLoadingClass;

  const totalSessions = enrollments.length;
  const attendedSessions = enrollments.filter(e => e.did_attend).length;
  const markedSessions = enrollments.filter(e => e.is_attendance_marked).length;
  const pendingSessions = totalSessions - markedSessions;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return <Badge variant='default'>Enrolled</Badge>;
      case 'CANCELLED':
        return <Badge variant='destructive'>Cancelled</Badge>;
      case 'COMPLETED':
        return <Badge variant='secondary'>Completed</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const getAttendanceBadge = (enrollment: any) => {
    if (!enrollment.is_attendance_marked) {
      return (
        <Badge variant='outline' className='gap-1'>
          <Clock className='h-3 w-3' />
          Pending
        </Badge>
      );
    }
    if (enrollment.did_attend) {
      return (
        <Badge variant='default' className='bg-success text-success-foreground gap-1'>
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

  return (
    <div className={`${elimikaDesignSystem.components.pageContainer} px-4 sm:px-6`}>
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-xl font-bold sm:text-2xl'>
              Student Enrollment Information
            </h1>
            <p className='text-muted-foreground text-sm'></p>
          </div>
        </div>
      </section>

      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4'>
          {isLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-8 w-64' />
              <Skeleton className='h-4 w-96' />
            </div>
          ) : (
            <>
              <h1 className='text-foreground text-xl font-bold sm:text-2xl'>
                {student?.full_name}
              </h1>
              <p className='text-muted-foreground text-sm'>{classInfo?.title}</p>
            </>
          )}
        </div>
      </section>

      {/* Statistics Cards */}
      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 rounded-full p-3'>
              <Calendar className='text-primary h-5 w-5' />
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

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-accent rounded-full p-3'>
              <CheckCircle2 className='text-accent-foreground h-5 w-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Attendance Rate</p>
              <p className='text-foreground text-2xl font-bold'>
                {markedSessions > 0
                  ? `${Math.round((attendedSessions / markedSessions) * 100)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Enrollments Table */}
      <Card>
        <div className='p-4 sm:p-6'>
          <h2 className='text-foreground mb-4 text-lg font-semibold'>Session Details</h2>

          {isLoading ? (
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className='py-12 text-center'>
              <CheckCircle2 className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <p className='text-foreground text-lg font-medium'>No enrollments found</p>
              <p className='text-muted-foreground text-sm'>
                This student has no enrollment records for this class.
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[50px]'>#</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Marked At</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment: any, index: number) => (
                    <TableRow key={enrollment.uuid}>
                      <TableCell className='font-medium'>{index + 1}</TableCell>
                      <TableCell className='font-mono text-xs'>
                        {enrollment.scheduled_instance_uuid.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      <TableCell>{getAttendanceBadge(enrollment)}</TableCell>
                      <TableCell>
                        {enrollment.attendance_marked_at ? (
                          <span className='text-sm'>
                            {format(
                              new Date(enrollment.attendance_marked_at),
                              'MMM dd, yyyy HH:mm'
                            )}
                          </span>
                        ) : (
                          <span className='text-muted-foreground text-sm'>Not marked</span>
                        )}
                      </TableCell>
                      {/* <TableCell>
                                                <span className="text-sm">
                                                    {format(new Date(enrollment.created_date), 'MMM dd, yyyy')}
                                                </span>
                                            </TableCell> */}
                      <TableCell className='text-right'>
                        {enrollment.can_be_cancelled && (
                          <Badge
                            variant='outline'
                            className='hover:bg-destructive hover:text-destructive-foreground cursor-pointer'
                          >
                            Cancel
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      {/* Additional Info */}
      {!isLoading && enrollments.length > 0 && (
        <Card className='mt-6 p-4'>
          <h3 className='text-foreground mb-2 font-semibold'>Notes</h3>
          <ul className='text-muted-foreground space-y-1 text-sm'>
            <li>• Total enrollment instances: {totalSessions}</li>
            <li>• Sessions with marked attendance: {markedSessions}</li>
            <li>• Sessions pending attendance: {pendingSessions}</li>
            <li>
              • Last updated:{' '}
              {format(new Date(enrollments[0]?.updated_date || new Date()), 'MMM dd, yyyy HH:mm')}
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
};

export default EnrollmentDetails;
