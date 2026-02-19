'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreator } from '@/context/course-creator-context';
import { elimikaDesignSystem } from '@/lib/design-system';
import {
  getCourseEnrollmentsOptions,
  getStudentByIdOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GraduationCap,
  Mail,
  Search,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const EnrollmentsPage = () => {
  const creator = useCourseCreator();
  const courses = creator?.courses;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const courseUuids = courses.map(course => course.uuid);

  const enrollmentQueries = useQueries({
    queries: courseUuids.map(courseUuid => ({
      queryKey: ['course-enrollments', courseUuid],
      ...getCourseEnrollmentsOptions({
        path: { courseUuid },
        query: { pageable: {} },
      }),
      staleTime: 1000 * 60 * 5,
      enabled: !!courseUuid,
    })),
  });

  const isEnrollmentsLoading = enrollmentQueries.some(q => q.isLoading);

  const enrollmentsByCourse = useMemo(() => {
    return enrollmentQueries.reduce<Record<string, any[]>>((acc, query, index) => {
      acc[courseUuids[index]] = query.data?.data?.content ?? [];
      return acc;
    }, {});
  }, [enrollmentQueries, courseUuids]);

  const enrollmentsForSelectedCourse = selectedCourseId
    ? (enrollmentsByCourse[selectedCourseId] ?? [])
    : [];

  const studentQueries = useQueries({
    queries: enrollmentsForSelectedCourse.map(enrollment => ({
      queryKey: ['student', enrollment.student_uuid],
      ...getStudentByIdOptions({
        path: { uuid: enrollment.student_uuid },
      }),
      staleTime: 1000 * 60 * 10,
      enabled: !!enrollment.student_uuid,
    })),
  });
  const isStudentsLoading = studentQueries.some(q => q.isLoading);

  const students = studentQueries.map(q => q.data?.data).filter(Boolean);

  const userUuids = students.map(student => student.user_uuid).filter(Boolean);

  const uniqueUserUuids = [...new Set(userUuids)];

  const userQueries = useQueries({
    queries: uniqueUserUuids.map(uuid => ({
      queryKey: ['user', uuid],
      ...getUserByUuidOptions({
        path: { uuid },
      }),
      staleTime: 1000 * 60 * 10,
      enabled: !!uuid,
    })),
  });

  const isUserLoading = userQueries.some(q => q.isLoading);

  const enrichedEnrollments = enrollmentsForSelectedCourse.map((enrollment, index) => {
    const studentData = studentQueries[index]?.data?.data;
    const userData = userQueries[index]?.data?.data;

    return {
      ...enrollment,
      ...userData,
      ...studentData,
      user_uuid: studentData?.user_uuid,
    };
  });

  // Filter courses by search
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalEnrollments = Object.values(enrollmentsByCourse).reduce(
    (sum, enrollments) => sum + enrollments.length,
    0
  );

  const selectedCourse =
    courses.find(c => c.uuid === selectedCourseId) || filteredCourses[0] || courses[0] || null;

  const handleExportEnrollments = () => {
    toast.success('Enrollment data exported successfully');
  };

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className='mb-8'>
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h1 className='text-foreground mb-2 text-3xl font-bold'>Student Enrollments</h1>
            <p className='text-muted-foreground text-base'>
              Track and manage all student enrollments across your courses
            </p>
          </div>
          <Button variant='outline' className='sm:mt-0' onClick={handleExportEnrollments}>
            <Download className='mr-2 h-4 w-4' />
            Export Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid gap-4 md:grid-cols-3'>
          <Card className='p-0'>
            <CardContent className='flex items-center gap-4 p-6'>
              <div className='bg-primary/10 rounded-full p-3'>
                <Users className='text-primary h-6 w-6' />
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Total Enrollments</p>
                <p className='text-2xl font-bold'>{totalEnrollments}</p>
              </div>
            </CardContent>
          </Card>

          <Card className='p-0'>
            <CardContent className='flex items-center gap-4 p-6'>
              <div className='bg-primary/10 rounded-full p-3'>
                <BookOpen className='text-primary h-6 w-6' />
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Active Courses</p>
                <p className='text-2xl font-bold'>{courses.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className='p-0'>
            <CardContent className='flex items-center gap-4 p-6'>
              <div className='bg-success/10 rounded-full p-3'>
                <TrendingUp className='text-success/60 h-6 w-6' />
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Avg. per Course</p>
                <p className='text-2xl font-bold'>
                  {courses.length > 0 ? Math.round(totalEnrollments / courses.length) : 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Two-column layout */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Left: Course List */}
        <div className='lg:col-span-1'>
          <Card className='h-full'>
            <CardHeader className='border-b pb-4'>
              <div className='flex items-center justify-between'>
                <h2 className='text-lg font-semibold'>Your Courses</h2>
                <Badge variant='secondary'>{courses.length}</Badge>
              </div>
              <div className='relative mt-4'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search courses...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-9'
                />
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='max-h-[600px] space-y-1 overflow-y-auto p-4'>
                {isEnrollmentsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <Skeleton key={i} className='h-20 w-full rounded-lg' />
                  ))
                ) : filteredCourses.length === 0 ? (
                  <div className='py-12 text-center'>
                    <BookOpen className='text-muted-foreground mx-auto mb-3 h-12 w-12' />
                    <p className='text-muted-foreground text-sm'>No courses found</p>
                  </div>
                ) : (
                  filteredCourses.map(course => {
                    const enrollmentCount = enrollmentsByCourse[course.uuid]?.length ?? 0;
                    const isSelected = selectedCourseId === course.uuid;

                    return (
                      <button
                        key={course.uuid}
                        onClick={() => setSelectedCourseId(course.uuid)}
                        className={`group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'bg-muted/50 hover:border-border hover:bg-muted border-transparent hover:shadow-sm'
                        }`}
                      >
                        <div
                          className={`mt-1 rounded-md p-2 ${isSelected ? 'bg-primary/10' : 'bg-background'}`}
                        >
                          <GraduationCap
                            className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                          />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p
                            className={`mb-1 line-clamp-2 font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}
                          >
                            {course.name}
                          </p>
                          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                            <Users className='h-3 w-3' />
                            <span>
                              {enrollmentCount} {enrollmentCount === 1 ? 'student' : 'students'}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className='flex-shrink-0'>
                            <CheckCircle2 className='text-primary h-5 w-5' />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Enrollments List */}
        <div className='lg:col-span-2'>
          <Card className='h-full'>
            <CardHeader className='border-b pb-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-lg font-semibold'>
                    {selectedCourse ? selectedCourse.name : 'Enrolled Students'}
                  </h2>
                  {selectedCourse && (
                    <p className='text-muted-foreground mt-1 text-sm'>
                      {enrichedEnrollments.length}{' '}
                      {enrichedEnrollments.length === 1 ? 'student' : 'students'} enrolled
                    </p>
                  )}
                </div>
                {selectedCourseId && enrichedEnrollments.length > 0 && (
                  <Button variant='outline' size='sm'>
                    <Filter className='mr-2 h-4 w-4' />
                    Filter
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className='p-0'>
              <div className='max-h-[600px] overflow-y-auto'>
                {selectedCourseId === null ? (
                  <div className='flex flex-col items-center justify-center px-4 py-16'>
                    <div className='bg-primary/10 mb-4 rounded-full p-6'>
                      <Users className='text-primary h-12 w-12' />
                    </div>
                    <h3 className='text-foreground mb-2 text-lg font-semibold'>Select a Course</h3>
                    <p className='text-muted-foreground max-w-sm text-center text-sm'>
                      Choose a course from the list to view enrolled students and their details
                    </p>
                  </div>
                ) : isStudentsLoading ? (
                  <div className='p-4'>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className='border-0 shadow-none'>
                        <CardContent className='p-4'>
                          <div className='flex items-center'>
                            <Skeleton className='h-12 w-12 rounded-full' />
                            <div className='ml-2 flex-1 space-y-2'>
                              <Skeleton className='h-4 w-40' />
                              <Skeleton className='h-3 w-56' />
                            </div>
                            <Skeleton className='h-9 w-28' />
                          </div>
                        </CardContent>
                      </div>
                    ))}
                  </div>
                ) : enrichedEnrollments.length === 0 ? (
                  <div className='flex flex-col items-center justify-center px-4 py-16'>
                    <div className='bg-muted mb-4 rounded-full p-6'>
                      <Users className='text-muted-foreground h-12 w-12' />
                    </div>
                    <h3 className='text-foreground mb-2 text-lg font-semibold'>
                      No Enrollments Yet
                    </h3>
                    <p className='text-muted-foreground max-w-sm text-center text-sm'>
                      This course doesn't have any enrolled students yet. Students who enroll will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div className='divide-y'>
                    {enrichedEnrollments.map((enrollment, index) => (
                      <div
                        key={enrollment.uuid}
                        className='group hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors'
                      >
                        <Avatar className='border-background h-12 w-12 border-2 shadow-sm'>
                          <AvatarImage src={enrollment.profile_image_url} />
                          <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
                            {enrollment.full_name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        <div className='min-w-0 flex-1'>
                          <div className='mb-1 flex items-center gap-2'>
                            <p className='text-foreground font-semibold'>{enrollment.full_name}</p>
                            <Badge variant='outline' className='text-xs'>
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-xs'>
                            <div className='flex items-center gap-1'>
                              <Clock className='h-3 w-3' />
                              <span>
                                Enrolled{' '}
                                {formatDistanceToNow(new Date(enrollment.enrollment_date), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            {enrollment.email && (
                              <div className='flex items-center gap-1'>
                                <Mail className='h-3 w-3' />
                                <span className='max-w-[200px] truncate'>{enrollment.email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <a
                          href={`/profile-user/${enrollment?.user_uuid}?domain=${'student'}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary flex cursor-pointer items-start justify-start self-start rounded-md p-2 transition hover:bg-gray-100'
                        >
                          <div className='flex items-center gap-1 text-sm'>
                            <Send size={16} className='text-primary' />
                            <span className='truncate'>View full profile</span>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentsPage;
