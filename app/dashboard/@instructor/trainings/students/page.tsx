'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getAllStudentsOptions,
  getStudentScheduleOptions,
  getUserByUuidOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';

const _sampleEnrollmentData = {
  success: true,
  data: {
    content: [
      {
        uuid: 'e1n2r3o4-5l6l-7m8e-9n10-abcdefghijkl',
        student_uuid: 's1t2u3d4-5e6n-7t8u-9u10-abcdefghijkl',
        course_uuid: 'c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl',
        enrollment_date: '2024-04-01T09:00:00',
        completion_date: '2024-04-30T16:45:00',
        status: 'COMPLETED',
        progress_percentage: 100,
        final_grade: 85.5,
        created_date: '2024-04-01T09:00:00',
        created_by: 'student@sarafrika.com',
        updated_date: '2024-04-30T16:45:00',
        updated_by: 'system@sarafrika.com',
        enrollment_category: 'Completed Enrollment',
        is_active: false,
        progress_display: '100.00% Complete',
        enrollment_duration: '29 days',
        status_summary: 'Successfully completed with final grade of 85.50',
      },
      {
        uuid: 'e1n2r3o4-5l6l-7m8e-9n10-abcdefghiuio',
        student_uuid: 's1t2u3d4-5e6n-7t8u-9u10-abcdefghijkl',
        course_uuid: 'c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl',
        enrollment_date: '2024-04-01T09:00:00',
        completion_date: '2024-04-30T16:45:00',
        status: 'IN_PROGRESS',
        progress_percentage: 45,
        final_grade: 85.5,
        created_date: '2024-04-01T09:00:00',
        created_by: 'student@sarafrika.com',
        updated_date: '2024-04-30T16:45:00',
        updated_by: 'system@sarafrika.com',
        enrollment_category: 'Completed Enrollment',
        is_active: false,
        progress_display: '45.00% Complete',
        enrollment_duration: '29 days',
        status_summary: 'Successfully completed with final grade of 85.50',
      },
    ],
    metadata: {
      pageNumber: 1073741824,
      pageSize: 1073741824,
      totalElements: 9007199254740991,
      totalPages: 1073741824,
      hasNext: true,
      hasPrevious: true,
      first: true,
      last: true,
    },
    links: {
      first: 'string',
      previous: 'string',
      self: 'string',
      next: 'string',
      last: 'string',
    },
  },
  message: 'string',
  error: {},
};

interface StudentsPageProps {
  classesWithCourseAndInstructor: any,
  loading: boolean
}

export default function StudentsPage({ classesWithCourseAndInstructor, loading }: StudentsPageProps) {
  const { data: sData } = useQuery(
    getAllStudentsOptions({
      query: { pageable: { page: 0, size: 50 } },
    })
  );
  const students = sData?.data?.content ?? [];

  // console.log(classesWithCourseAndInstructor, "CLAS")
  // console.log(students, "STU")

  const studentDetailQueries = useQueries({
    queries: students.map(student => ({
      ...getUserByUuidOptions({ path: { uuid: student.user_uuid as string } }),
      enabled: !!student.uuid,
    })),
  });
  const detailedStudents = studentDetailQueries.map(q => q.data?.data);
  const isLoading = studentDetailQueries.some(q => q.isLoading);
  const isFetching = studentDetailQueries.some(q => q.isFetching);

  const studentEnrollmentQueries = useQueries({
    queries: students.map(student => ({
      ...getStudentScheduleOptions({
        path: { studentUuid: student.uuid as string },
        query: { start: '2025-10-10' as any, end: '2026-12-19' as any },
      }),
      enabled: !!student.uuid,
    })),
  });
  const _detailedEnrollments = studentEnrollmentQueries.map(q => q.data?.data);

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold tracking-tight'>Your Students</h2>
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>A list of students currently enrolled in your courses.</CardDescription>
        </CardHeader>

        {isLoading || isFetching ? (
          <div className='mx-auto flex items-center justify-center'>
            <Spinner />
          </div>
        ) : (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Enrolled Courses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedStudents?.map((student: any) => (
                  <TableRow key={student?.uuid}>
                    <TableCell>
                      <div className='flex items-center gap-4'>
                        <Avatar>
                          <AvatarImage src={student?.avatarUrl ?? ''} />
                          <AvatarFallback>{student?.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{student?.display_name}</p>
                          <p className='text-muted-foreground text-sm'>{student?.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-2'>
                        {/* {student.enrolledCourses.map((course: any, index: any) => (
                        <div key={index}>
                          <div className='flex justify-between'>
                            <p className='font-medium'>{course.name}</p>
                            <p className='text-muted-foreground text-sm'>{course.progress}%</p>
                          </div>
                          <Progress value={course.progress} />
                        </div>
                      ))} */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              {/* <TableBody>
                {sampleEnrollmentData?.data?.content?.map(student => (
                  <TableRow key={student.uuid}>
                    <TableCell>
                      <div className='flex items-center gap-4'>
                        <Avatar>
                          <AvatarImage src={''} />
                          <AvatarFallback>{"Student name"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{'student name'}</p>
                          <p className='text-muted-foreground text-sm'>{student?.created_by}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-2'>
                        <div>
                          <div className='flex justify-between'>
                            <p className='font-medium'>{'course.name'}</p>
                            <p className='text-muted-foreground text-sm'>
                              {student.progress_display}
                            </p>
                          </div>
                          <Progress value={student.progress_percentage} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody> */}
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
