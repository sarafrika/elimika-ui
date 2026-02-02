'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreator } from '@/context/course-creator-context';
import { elimikaDesignSystem } from '@/lib/design-system';
import {
  getCourseEnrollmentsOptions,
  getStudentByIdOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const EnrollmentsPage = () => {
  const creator = useCourseCreator();
  const courses = creator?.courses ?? [];
  const courseUuids = courses.map(course => course.uuid);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);


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
    ? enrollmentsByCourse[selectedCourseId] ?? []
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


  const enrichedEnrollments = enrollmentsForSelectedCourse.map((enrollment, index) => {
    const studentData = studentQueries[index]?.data?.data;

    return {
      ...enrollment,
      studentName: studentData?.full_name || 'Unknown Student',
      studentAvatar: studentData?.profile_image_url,
    };
  });

  const handleViewProfile = (studentName: string) => {
    toast.message(`Viewing profile of ${studentName}`);
  };

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>Enrollments</h1>
            <p className='text-muted-foreground text-sm'>
              Review all students enrolled in each course
            </p>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Left: Course List */}
        <div className='space-y-2 overflow-y-auto lg:max-h-[calc(100vh-250px)] lg:w-1/3'>
          {isEnrollmentsLoading
            ? [...Array(3)].map((_, i) => (
              <Skeleton key={i} className='h-16 w-full rounded-xl' />
            ))
            : courses.map(course => {
              const enrollmentCount =
                enrollmentsByCourse[course.uuid]?.length ?? 0;
              const isSelected = selectedCourseId === course.uuid;

              return (
                <button
                  key={course.uuid}
                  onClick={() => setSelectedCourseId(course.uuid)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm transition-all duration-150 ${isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-background hover:bg-muted'
                    }`}
                >
                  <span className='text-foreground font-medium'>
                    {course.name}
                  </span>
                  <Badge variant='secondary'>{enrollmentCount}</Badge>
                </button>
              );
            })}
        </div>

        {/* Right: Enrollments List */}
        <div className='space-y-4 overflow-y-auto lg:max-h-[calc(100vh-250px)] lg:w-2/3'>
          {selectedCourseId === null ? (
            <Card className='p-12 text-center'>
              <CheckCircle2 className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <p className='text-foreground text-lg font-medium'>
                Select a course
              </p>
              <p className='text-muted-foreground text-sm'>
                Choose a course on the left to view enrollments.
              </p>
            </Card>
          ) : isStudentsLoading ? (
            <div className='space-y-4'>
              {[...Array(3)].map((_, i) => (
                <Card key={i} className='p-4'>
                  <div className='flex items-center gap-4'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-40' />
                    </div>
                    <Skeleton className='h-9 w-24' />
                  </div>
                </Card>
              ))}
            </div>
          ) : enrichedEnrollments.length === 0 ? (
            <Card className='p-12 text-center'>
              <CheckCircle2 className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <p className='text-foreground text-lg font-medium'>
                No enrollments
              </p>
              <p className='text-muted-foreground text-sm'>
                No students have enrolled in this course yet.
              </p>
            </Card>
          ) : (
            <>
              {enrichedEnrollments.map(enrollment => (
                <Card key={enrollment.uuid} className='flex items-center gap-4 p-4'>
                  <Avatar>
                    <AvatarImage src={enrollment.studentAvatar} />
                    <AvatarFallback>
                      {enrollment.studentName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className='min-w-0 flex-1'>
                    <p className='text-foreground font-semibold'>
                      {enrollment.studentName}
                    </p>
                    <p className='text-muted-foreground flex items-center gap-1 text-xs'>
                      <Clock className='h-3 w-3' />
                      Enrolled{' '}
                      {formatDistanceToNow(
                        new Date(enrollment.enrollment_date),
                        { addSuffix: true }
                      )}
                    </p>
                  </div>

                  <Button
                    size='sm'
                    onClick={() =>
                      handleViewProfile(enrollment.studentName)
                    }
                  >
                    View Profile
                  </Button>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollmentsPage;
