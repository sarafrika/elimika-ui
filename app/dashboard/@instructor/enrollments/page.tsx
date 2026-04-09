'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructor } from '@/context/instructor-context';
import { elimikaDesignSystem } from '@/lib/design-system';
import type { ClassDefinition, Enrollment, Student } from '@/services/client';
import {
  getClassDefinitionsForInstructorOptions,
  getEnrollmentsForClassOptions,
  getStudentByIdOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { BookOpen, ExternalLink, GraduationCap, Search, TrendingUp, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type StudentCourseRecord = {
  courseId: string;
  courseName: string;
  enrollmentId: string;
  status: string;
  progressPercentage?: number;
};

type StudentEnrollmentOverview = {
  studentId: string;
  studentName: string;
  studentCode?: string;
  avatarUrl?: string;
  email?: string;
  userUuid?: string;
  courses: StudentCourseRecord[];
};

type InstructorClass = ClassDefinition;
type EnrollmentRecord = Enrollment;
type StudentRecord = Student;

const ALL_COURSES_VALUE = 'all-courses';

const getStatusBadgeVariant = (status?: string) => {
  switch (status) {
    case 'ENROLLED':
    case 'ACTIVE':
      return 'success' as const;
    case 'PENDING':
      return 'secondary' as const;
    case 'CANCELLED':
      return 'destructive' as const;
    case 'COMPLETED':
      return 'outline' as const;
    default:
      return 'outline' as const;
  }
};

const formatStatusLabel = (status?: string) => {
  if (!status) return 'Unknown';
  return status
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const EnrollmentsPage = () => {
  const router = useRouter();
  const instructor = useInstructor();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(ALL_COURSES_VALUE);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

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
    () =>
      classesData?.data
        ?.map(item => item.class_definition)
        .filter((item): item is InstructorClass => Boolean(item)) ?? [],
    [classesData]
  );

  const enrollmentQueries = useQueries({
    queries: instructorClasses.map(classItem => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.uuid },
      }),
      enabled: !!classItem.uuid,
    })),
  });

  const classEnrollmentRows = useMemo(
    () =>
      instructorClasses.map((classItem, index) => ({
        classItem,
        enrollments: enrollmentQueries[index]?.data?.data ?? [],
      })),
    [instructorClasses, enrollmentQueries]
  );

  const uniqueStudentIds = useMemo(() => {
    const ids = new Set<string>();

    classEnrollmentRows.forEach(({ enrollments }) => {
      enrollments.forEach(enrollment => {
        if (enrollment.student_uuid) {
          ids.add(enrollment.student_uuid);
        }
      });
    });

    return Array.from(ids);
  }, [classEnrollmentRows]);

  const studentQueries = useQueries({
    queries: uniqueStudentIds.map(studentUuid => ({
      ...getStudentByIdOptions({
        path: { uuid: studentUuid },
      }),
      enabled: !!studentUuid,
    })),
  });

  const studentMap = useMemo(() => {
    const map = new Map<string, StudentRecord>();

    uniqueStudentIds.forEach((studentUuid, index) => {
      const student = studentQueries[index]?.data;
      if (student) {
        map.set(studentUuid, student);
      }
    });

    return map;
  }, [studentQueries, uniqueStudentIds]);

  const normalizedStudents = useMemo<StudentEnrollmentOverview[]>(() => {
    const map = new Map<string, StudentEnrollmentOverview>();

    classEnrollmentRows.forEach(({ classItem, enrollments }) => {
      enrollments.forEach(enrollment => {
        const studentId = enrollment.student_uuid;
        if (!studentId) return;

        const student = studentMap.get(studentId);
        const existing = map.get(studentId);
        const nextCourse: StudentCourseRecord = {
          courseId: classItem.uuid,
          courseName: classItem.title || 'Untitled Course',
          enrollmentId: enrollment.uuid || `${classItem.uuid}-${studentId}`,
          status: enrollment.status || 'UNKNOWN',
          progressPercentage: enrollment.progress_percentage,
        };

        if (existing) {
          const hasCourse = existing.courses.some(
            course => course.courseId === nextCourse.courseId
          );

          if (!hasCourse) {
            existing.courses.push(nextCourse);
          }
          return;
        }

        map.set(studentId, {
          studentId,
          studentName: student?.full_name || 'Unknown Student',
          studentCode: student?.student_id,
          avatarUrl: student?.avatar_url,
          email: student?.email,
          userUuid: student?.user_uuid,
          courses: [nextCourse],
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [classEnrollmentRows, studentMap]);

  const courseOptions = useMemo(
    () =>
      instructorClasses
        .map(classItem => ({
          id: classItem.uuid as string,
          name: classItem.title || 'Untitled Course',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [instructorClasses]
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearchQuery.trim().toLowerCase();

    return normalizedStudents.filter(student => {
      const matchesCourse =
        selectedCourseId === ALL_COURSES_VALUE ||
        student.courses.some(course => course.courseId === selectedCourseId);

      if (!matchesCourse) return false;

      if (!query) return true;

      return (
        student.studentName.toLowerCase().includes(query) ||
        student.studentCode?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query)
      );
    });
  }, [normalizedStudents, selectedCourseId, studentSearchQuery]);

  const filteredEnrollmentsCount = useMemo(() => {
    if (selectedCourseId === ALL_COURSES_VALUE) {
      return normalizedStudents.reduce((count, student) => count + student.courses.length, 0);
    }

    return normalizedStudents.reduce(
      (count, student) =>
        count + student.courses.filter(course => course.courseId === selectedCourseId).length,
      0
    );
  }, [normalizedStudents, selectedCourseId]);

  const selectedCourseLabel = useMemo(() => {
    if (selectedCourseId === ALL_COURSES_VALUE) return 'All Courses';
    return courseOptions.find(course => course.id === selectedCourseId)?.name || 'Selected Course';
  }, [courseOptions, selectedCourseId]);

  const isLoadingEnrollments =
    isLoadingClasses || enrollmentQueries.some(query => query.isLoading || query.isFetching);
  const isLoadingStudents = studentQueries.some(query => query.isLoading || query.isFetching);
  const isLoading = isLoadingEnrollments || isLoadingStudents;

  // const hasError =
  //   isClassesError ||
  //   enrollmentQueries.some(query => query.isError) ||
  //   studentQueries.some(query => query.isError);
  const hasError = false;

  const handleViewEnrollment = (studentId: string) => {
    const params =
      selectedCourseId === ALL_COURSES_VALUE
        ? ''
        : `?courseId=${encodeURIComponent(selectedCourseId)}`;
    router.push(`/dashboard/enrollments/${studentId}${params}`);
  };

  return (
    <div className={`${elimikaDesignSystem.components.pageContainer} space-y-4 px-4 py-4 sm:px-6`}>
      <section>
        <div className='flex flex-col gap-2'>
          <div>
            <h1 className='text-foreground text-lg font-bold sm:text-xl'>Enrollments</h1>
            <p className='text-muted-foreground mt-0.5 text-xs sm:text-sm'>
              Review students enrolled across the courses you currently teach.
            </p>
          </div>
        </div>
      </section>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-border/50 from-primary/5 bg-gradient-to-br to-transparent p-0 transition-shadow hover:shadow-md dark:from-transparent'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <Users className='text-primary h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Total Students</p>
                <h3 className='text-foreground text-lg font-bold'>{normalizedStudents.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/50 from-chart-1/5 bg-gradient-to-br to-transparent p-0 transition-shadow hover:shadow-md dark:from-transparent'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-chart-1/10 rounded-lg p-2'>
                <BookOpen className='text-chart-1 h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Courses</p>
                <h3 className='text-foreground text-lg font-bold'>{courseOptions.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/50 from-chart-2/5 bg-gradient-to-br to-transparent p-0 transition-shadow hover:shadow-md dark:from-transparent'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-chart-2/10 rounded-lg p-2'>
                <TrendingUp className='text-chart-2 h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Visible Students</p>
                <h3 className='text-foreground text-lg font-bold'>{filteredStudents.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/50 from-chart-3/5 bg-gradient-to-br to-transparent p-0 transition-shadow hover:shadow-md dark:from-transparent'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-chart-3/10 rounded-lg p-2'>
                <GraduationCap className='text-chart-3 h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Visible Enrollments</p>
                <h3 className='text-foreground text-lg font-bold'>{filteredEnrollmentsCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='border-border/50 p-4'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='grid gap-3 sm:grid-cols-2 lg:w-[32rem]'>
            <div className='space-y-1'>
              <p className='text-muted-foreground text-xs font-medium'>Filter by Course</p>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='Select course' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COURSES_VALUE}>All Courses</SelectItem>
                  {courseOptions.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <p className='text-muted-foreground text-xs font-medium'>Search Students</p>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
                <Input
                  placeholder='Search by name or ID'
                  value={studentSearchQuery}
                  onChange={event => setStudentSearchQuery(event.target.value)}
                  className='h-9 pr-8 pl-8 text-sm'
                />
                {studentSearchQuery ? (
                  <button
                    type='button'
                    onClick={() => setStudentSearchQuery('')}
                    className='text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className='text-muted-foreground text-xs sm:text-sm'>
            Showing <span className='text-foreground font-medium'>{filteredStudents.length}</span>{' '}
            student{filteredStudents.length === 1 ? '' : 's'} in{' '}
            <span className='text-foreground font-medium'>{selectedCourseLabel}</span>
          </div>
        </div>
      </Card>

      {hasError ? (
        <Card className='border-border/50 p-8 text-center sm:p-10'>
          <div className='bg-destructive/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14'>
            <Users className='text-destructive h-6 w-6 sm:h-7 sm:w-7' />
          </div>
          <h3 className='text-foreground mb-1.5 text-base font-semibold'>
            Unable to load enrollments
          </h3>
          <p className='text-muted-foreground mx-auto max-w-md text-xs sm:text-sm'>
            There was a problem loading your students and enrollment records.
          </p>
        </Card>
      ) : isLoading ? (
        <Card className='border-border/50 overflow-hidden'>
          <ul className='divide-border/50 divide-y'>
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className='p-4'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-40' />
                    <Skeleton className='h-3 w-56' />
                  </div>
                  <Skeleton className='h-9 w-28' />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : courseOptions.length === 0 ? (
        <Card className='border-border/50 p-8 text-center sm:p-10'>
          <div className='bg-muted/50 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14'>
            <BookOpen className='text-muted-foreground h-6 w-6 sm:h-7 sm:w-7' />
          </div>
          <h3 className='text-foreground mb-1.5 text-base font-semibold'>No Courses Found</h3>
          <p className='text-muted-foreground mx-auto max-w-sm text-xs sm:text-sm'>
            You do not have any active instructor courses available yet.
          </p>
        </Card>
      ) : normalizedStudents.length === 0 ? (
        <Card className='border-border/50 p-8 text-center sm:p-10'>
          <div className='bg-muted/50 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14'>
            <Users className='text-muted-foreground h-6 w-6 sm:h-7 sm:w-7' />
          </div>
          <h3 className='text-foreground mb-1.5 text-base font-semibold'>No Students Yet</h3>
          <p className='text-muted-foreground mx-auto max-w-sm text-xs sm:text-sm'>
            Students will appear here once they enroll in one of your courses.
          </p>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card className='border-border/50 p-8 text-center sm:p-10'>
          <div className='bg-muted/50 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14'>
            <Search className='text-muted-foreground h-6 w-6 sm:h-7 sm:w-7' />
          </div>
          <h3 className='text-foreground mb-1.5 text-base font-semibold'>No Students Found</h3>
          <p className='text-muted-foreground mx-auto max-w-sm text-xs sm:text-sm'>
            Adjust the selected course or search term to find matching students.
          </p>
        </Card>
      ) : (
        <Card className='border-border/50 bg-card overflow-hidden py-0'>
          <ul className='divide-border/50 divide-y'>
            {filteredStudents.map(student => {
              const visibleCourses =
                selectedCourseId === ALL_COURSES_VALUE
                  ? student.courses
                  : student.courses.filter(course => course.courseId === selectedCourseId);

              return (
                <li key={student.studentId} className='group hover:bg-accent/5 transition-colors'>
                  <div className='flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='flex min-w-0 items-start gap-3'>
                      <Avatar className='border-border ring-background h-10 w-10 border ring-2'>
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                          {student.studentName
                            .split(' ')
                            .map(part => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className='min-w-0 flex-1 space-y-2'>
                        <div>
                          <h3 className='text-foreground truncate text-sm font-semibold sm:text-base'>
                            {student.studentName}
                          </h3>
                          <div className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                            <span>ID: {student.studentCode || student.studentId.slice(0, 8)}</span>
                            {student.email ? <span>{student.email}</span> : null}
                          </div>
                        </div>

                        <div className='flex flex-wrap gap-2'>
                          {visibleCourses.map(course => (
                            <div
                              key={course.courseId}
                              className='bg-muted/50 rounded-lg px-3 py-2 text-xs sm:text-sm'
                            >
                              <p className='text-foreground font-medium'>{course.courseName}</p>
                              <div className='mt-1 flex items-center gap-2'>
                                <Badge
                                  variant={getStatusBadgeVariant(course.status)}
                                  className='text-[11px]'
                                >
                                  {formatStatusLabel(course.status)}
                                </Badge>
                                {typeof course.progressPercentage === 'number' ? (
                                  <span className='text-muted-foreground'>
                                    {course.progressPercentage}% progress
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleViewEnrollment(student.studentId)}
                      >
                        View Enrollment
                      </Button>

                      {student.userUuid ? (
                        <a
                          href={`/profile-user/${student.userUuid}?domain=student`}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <Button variant='ghost' size='sm' className='text-primary'>
                            <ExternalLink className='mr-1.5 h-3 w-3' />
                            Profile
                          </Button>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default EnrollmentsPage;
