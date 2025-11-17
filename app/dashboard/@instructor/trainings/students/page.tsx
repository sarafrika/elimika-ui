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
import { format } from "date-fns";
import { Search, Upload } from "lucide-react";
import { useState } from "react";
import { Input } from '../../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';

const sampleEnrollmentData = {
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

type Status = "Submit" | "Excused" | "Missing";

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
  const detailedEnrollments = studentEnrollmentQueries.map(q => q.data?.data);

  const [selectedStudent, setSelectedStudent] = useState("Dianne Russel");
  const [grade, setGrade] = useState<number>(80);
  const [status, setStatus] = useState<Status>("Submit");

  const sampleStudents = [
    { name: "Dianne Russel", section: "A" },
    { name: "Eleanor Pena", section: "A" },
    { name: "Jacob Jones", section: "B" },
    { name: "Brooklyn Simmons", section: "C" },
    { name: "Leslie Alexander", section: "C" },
    { name: "Floyd Miles", section: "B" },
    { name: "Theresa Webb", section: "A" },
  ];

  const files = [
    { name: "Mockrocket-Capture.png" },
    { name: "Products-v3_black_card.svg" },
    { name: "Desktop-245.pdf" },
    { name: "Screencapture-Hexamoon-Admin.png" },
  ];

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold tracking-tight'>Your Students</h2>
      <Card className="flex flex-row h-auto pb-20">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border/100 p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">All Students</h2>
          <div className="relative flex flex-row items-center mb-3">
            <Search size={16} className="absolute left-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search Student"
              className="pl-10 pr-3 py-2 border border-border/100 rounded-lg w-full text-sm"
            />
          </div>
          <ul className="overflow-y-auto space-y-2 flex-1">
            {sampleStudents.map((student) => (
              <li
                key={student.name}
                onClick={() => setSelectedStudent(student.name)}
                className={`p-2 rounded-sm cursor-pointer flex flex-col items-start ${selectedStudent === student.name ? "bg-purple-100 text-purple-700 font-medium" : "hover:bg-gray-100"
                  }`}
              >
                {student.name}
                <span className="text-xs ml-1">Section {student.section}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Final Exam</h1>
            <span className="text-sm text-muted-foreground font-medium">Speed Grade</span>
          </div>

          <Card className="grid lg:grid-cols-3 gap-6 p-0">
            {/* Middle: Assignment */}
            <div className="lg:col-span-2 p-5 rounded-xl shadow-sm border border-border/100">
              <CardDescription className="flex justify-between mb-2 text-sm">
                <p>
                  Submission Date: <span className="text-muted-foreground font-medium">10/02/2024</span>
                </p>
                <p>
                  Assignment Point: <span className="font-semibold text-muted-foreground">80/100 (80%)</span>
                </p>
              </CardDescription>

              <img
                src="https://cdn.dribbble.com/userupload/9452662/file/original-12d4e45f5c3d41b9d6b18e0d5c09c785.png?resize=752x"
                alt="Assignment Preview"
                className="rounded-xl w-full object-cover mb-4"
              />

              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
                industry&apos;s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
                scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap
                into electronic typesetting, remaining essentially unchanged.
              </p>

              <div className="aspect-video rounded-lg flex items-center justify-center">
                <button className="text-white bg-primary hover:bg-primary/80 p-3 rounded-full shadow">
                  ▶
                </button>
              </div>
            </div>

            {/* Right: Submission Panel */}
            <Card className="rounded-xl p-5 shadow-sm border border-border/100 space-y-4 text-sm">
              <h2 className="text-lg font-semibold">Submission</h2>

              <div className="flex items-center justify-between">
                <span className="">Due Date:</span>
                <span className="font-medium text-green-600">02/10/2024</span>
              </div>

              <div>
                <label>Grade</label>
                <input
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="border rounded-lg w-full p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>

                <Select
                  value={status}
                  onValueChange={(value: Status) => setStatus(value)}
                >
                  <SelectTrigger className="border rounded-lg w-full p-2 mt-1 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Submit">Submit</SelectItem>
                    <SelectItem value="Excused">Excused</SelectItem>
                    <SelectItem value="Missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div>
                <label>Submission Details</label>
                <div className="mt-2 space-y-2 text-sm">
                  <p>Word Count: <span className="font-medium">500</span></p>
                  <p className="font-semibold mt-3">Files Uploaded:</p>
                  <ul className="space-y-3">
                    {files.map((file) => (
                      <li key={file.name} className="flex items-center gap-2 text-muted-foreground/80 hover:text-muted-foreground/100 cursor-pointer">
                        <Upload size={18} className="text-muted-foreground" /> {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button className="bg-primary/80 px-4 py-2 rounded-sm text-sm hover:bg-primary/100">
                  Save Grade
                </button>
                <span className="text-xs text-muted-foreground">Graded {format(new Date(), "dd/MM/yyyy")}</span>
              </div>
            </Card>
          </Card>
        </main>
      </Card>

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
