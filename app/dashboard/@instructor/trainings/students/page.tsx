'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Menu, Search, Upload, X } from 'lucide-react';
import { useState } from 'react';

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
  classesWithCourseAndInstructor: any;
  loading: boolean;
}

type Status = 'Submit' | 'Excused' | 'Missing';

export default function StudentsPage({
  classesWithCourseAndInstructor,
  loading,
}: StudentsPageProps) {
  const { data: sData } = useQuery(
    getAllStudentsOptions({
      query: { pageable: { page: 0, size: 50 } },
    })
  );
  const students = sData?.data?.content ?? [];

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

  const [selectedStudent, setSelectedStudent] = useState('Dianne Russel');
  const [grade, setGrade] = useState<number>(80);
  const [status, setStatus] = useState<Status>('Submit');

  const sampleStudents = [
    { name: 'Dianne Russel', section: 'A' },
    { name: 'Eleanor Pena', section: 'A' },
    { name: 'Jacob Jones', section: 'B' },
    { name: 'Brooklyn Simmons', section: 'C' },
    { name: 'Leslie Alexander', section: 'C' },
    { name: 'Floyd Miles', section: 'B' },
    { name: 'Theresa Webb', section: 'A' },
  ];

  const files = [
    { name: 'Mockrocket-Capture.png' },
    { name: 'Products-v3_black_card.svg' },
    { name: 'Desktop-245.pdf' },
    { name: 'Screencapture-Hexamoon-Admin.png' },
  ];

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className='space-y-4 p-4 sm:space-y-6 sm:p-0'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-bold tracking-tight sm:text-2xl'>Your Students</h2>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className='hover:bg-muted rounded-md p-2 lg:hidden'
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <Card className='flex h-auto flex-col pb-8 sm:pb-20 lg:flex-row'>
        {/* Sidebar - Mobile drawer / Desktop sidebar */}
        <aside
          className={` ${sidebarOpen ? 'bg-background fixed inset-0 z-50' : 'hidden'} border-border w-full flex-col border-b p-4 lg:static lg:z-auto lg:flex lg:w-64 lg:border-r lg:border-b-0`}
        >
          <div className='mb-4 flex items-center justify-between lg:mb-4'>
            <h2 className='text-base font-semibold sm:text-lg'>All Students</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className='hover:bg-muted rounded-md p-2 lg:hidden'
            >
              <X size={20} />
            </button>
          </div>

          <div className='relative mb-3 flex flex-row items-center'>
            <Search size={16} className='text-muted-foreground absolute left-3' />
            <Input
              type='text'
              placeholder='Search Student'
              className='border-border w-full rounded-lg border py-2 pr-3 pl-10 text-sm'
            />
          </div>

          <ul className='flex-1 space-y-2 overflow-y-auto'>
            {sampleStudents.map(student => (
              <li
                key={student.name}
                onClick={() => {
                  setSelectedStudent(student.name);
                  setSidebarOpen(false);
                }}
                className={`flex cursor-pointer flex-col items-start rounded-sm p-2 sm:p-3 ${
                  selectedStudent === student.name
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'hover:bg-muted/60'
                }`}
              >
                <span className='text-sm sm:text-base'>{student.name}</span>
                <span className='text-muted-foreground text-xs'>Section {student.section}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className='flex-1 overflow-y-auto p-4 sm:p-6'>
          <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h1 className='text-lg font-bold sm:text-xl'>Final Exam</h1>
            <span className='text-muted-foreground text-xs font-medium sm:text-sm'>
              Speed Grade
            </span>
          </div>

          <div className='grid gap-4 sm:gap-6 lg:grid-cols-3'>
            {/* Assignment Card */}
            <div className='border-border rounded-xl border p-4 shadow-sm sm:p-5 lg:col-span-2'>
              <CardDescription className='mb-3 flex flex-col gap-2 text-xs sm:mb-4 sm:flex-row sm:justify-between sm:text-sm'>
                <p>
                  Submission Date:{' '}
                  <span className='text-muted-foreground font-medium'>10/02/2024</span>
                </p>
                <p>
                  Assignment Point:{' '}
                  <span className='text-muted-foreground font-semibold'>80/100 (80%)</span>
                </p>
              </CardDescription>

              <img
                src='https://cdn.dribbble.com/userupload/9452662/file/original-12d4e45f5c3d41b9d6b18e0d5c09c785.png?resize=752x'
                alt='Assignment Preview'
                className='mb-4 w-full rounded-lg object-cover sm:rounded-xl'
              />

              <p className='text-muted-foreground mb-4 text-xs leading-relaxed sm:text-sm'>
                Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem
                Ipsum has been the industry&apos;s standard dummy text ever since the 1500s, when an
                unknown printer took a galley of type and scrambled it to make a type specimen book.
                It has survived not only five centuries, but also the leap into electronic
                typesetting, remaining essentially unchanged.
              </p>

              <div className='bg-muted/30 flex aspect-video items-center justify-center rounded-lg'>
                <button className='bg-primary hover:bg-primary/80 rounded-full p-3 text-white shadow-lg transition-all sm:p-4'>
                  <span className='text-lg sm:text-xl'>▶</span>
                </button>
              </div>
            </div>

            {/* Submission Panel */}
            <Card className='space-y-3 rounded-xl p-4 text-xs shadow-sm sm:space-y-4 sm:p-5 sm:text-sm'>
              <h2 className='text-base font-semibold sm:text-lg'>Submission</h2>

              <div className='flex items-center justify-between'>
                <span>Due Date:</span>
                <span className='font-medium text-green-600'>02/10/2024</span>
              </div>

              <div>
                <label className='text-xs font-medium sm:text-sm'>Grade</label>
                <input
                  type='number'
                  value={grade}
                  onChange={e => setGrade(Number(e.target.value))}
                  className='border-border mt-1 w-full rounded-lg border p-2 text-sm'
                />
              </div>

              <div>
                <label className='text-xs font-medium sm:text-sm'>Status</label>
                <Select value={status} onValueChange={(value: Status) => setStatus(value)}>
                  <SelectTrigger className='mt-1 w-full'>
                    <SelectValue placeholder={status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Submit'>Submit</SelectItem>
                    <SelectItem value='Excused'>Excused</SelectItem>
                    <SelectItem value='Missing'>Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='text-xs font-medium sm:text-sm'>Submission Details</label>
                <div className='mt-2 space-y-2 text-xs sm:text-sm'>
                  <p>
                    Word Count: <span className='font-medium'>500</span>
                  </p>
                  <p className='mt-3 font-semibold'>Files Uploaded:</p>
                  <ul className='space-y-2 sm:space-y-3'>
                    {files.map(file => (
                      <li
                        key={file.name}
                        className='text-muted-foreground/80 hover:text-muted-foreground flex cursor-pointer items-center gap-2 truncate text-xs sm:text-sm'
                      >
                        <Upload size={16} className='text-muted-foreground flex-shrink-0' />
                        <span className='truncate'>{file.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className='flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between'>
                <button className='bg-primary/80 hover:bg-primary text-primary-foreground rounded-sm px-4 py-2 text-xs font-medium transition-colors sm:text-sm'>
                  Save Grade
                </button>
                <span className='text-muted-foreground text-center text-xs sm:text-left'>
                  Graded {new Date().toLocaleDateString()}
                </span>
              </div>
            </Card>
          </div>
        </main>
      </Card>

      {/* Enrolled Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>A list of students currently enrolled in your courses.</CardDescription>
        </CardHeader>

        {isLoading ? (
          <div className='mx-auto flex items-center justify-center p-8'>
            <Spinner />
          </div>
        ) : (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className='hidden sm:table-cell'>Enrolled Courses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedStudents?.map((student: any) => (
                  <TableRow key={student?.uuid}>
                    <TableCell>
                      <div className='flex items-center gap-2 sm:gap-4'>
                        <Avatar className='h-8 w-8 sm:h-10 sm:w-10'>
                          <AvatarImage src={student?.avatarUrl ?? ''} />
                          <AvatarFallback>{student?.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='text-sm font-medium sm:text-base'>
                            {student?.display_name}
                          </p>
                          <p className='text-muted-foreground text-xs sm:text-sm'>
                            {student?.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='hidden sm:table-cell'>
                      <div className='space-y-2'>{/* Enrollment data would go here */}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
