'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { elimikaDesignSystem } from '@/lib/design-system';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCourseCreator } from '../../../../context/course-creator-context';
import {
  getCourseEnrollmentsOptions,
  getStudentByIdOptions,
} from '../../../../services/client/@tanstack/react-query.gen';

const EnrollmentsPage = () => {
  const creator = useCourseCreator();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Fetch enrollments for selected course
  const { data: enrollmentsResponse, isLoading: isLoadingEnrollments } = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: selectedCourseId as string },
      query: { pageable: {} },
    }),
    enabled: !!selectedCourseId,
  });

  const enrollmentsForSelectedCourse = enrollmentsResponse?.data?.content || [];

  // Fetch student data for each enrollment
  const studentQueries = enrollmentsForSelectedCourse.map(enrollment =>
    useQuery({
      ...getStudentByIdOptions({ path: { uuid: enrollment.student_uuid } }),
      enabled: !!enrollment.student_uuid,
    })
  );

  // Map student data with enrollment data
  const enrichedEnrollments = enrollmentsForSelectedCourse.map((enrollment, index) => {
    const studentData = studentQueries[index]?.data?.data;
    return {
      ...enrollment,
      studentName:
        studentData?.first_name && studentData?.last_name
          ? `${studentData.first_name} ${studentData.last_name}`
          : studentData?.email || 'Unknown Student',
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

      {/* Construction Banner */}
      <Card className='mb-6 border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950/20'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <p className='font-medium text-yellow-800 dark:text-yellow-200'>
              🚧 Under Construction
            </p>
            <p className='text-sm text-yellow-700 dark:text-yellow-300'>
              Student data is being fetched and displayed dynamically.
            </p>
          </div>
        </div>
      </Card>

      {/* Two-column layout */}
      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Left: Course List */}
        <div className='space-y-2 overflow-y-auto lg:max-h-[calc(100vh-250px)] lg:w-1/3'>
          {creator?.courses?.map(course => {
            const enrollmentCount = enrollmentsForSelectedCourse.filter(
              e => e.course_uuid === course.uuid
            ).length;
            const isSelected = selectedCourseId === course.uuid;

            return (
              <button
                key={course.uuid}
                onClick={() => setSelectedCourseId(course.uuid)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm transition-all duration-150 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                <span className='text-foreground font-medium'>{course.name}</span>
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
              <p className='text-foreground text-lg font-medium'>Select a course</p>
              <p className='text-muted-foreground text-sm'>
                Choose a course on the left to view enrollments.
              </p>
            </Card>
          ) : isLoadingEnrollments ? (
            // Loading state with skeletons
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
              <p className='text-foreground text-lg font-medium'>No enrollments</p>
              <p className='text-muted-foreground text-sm'>
                No students have enrolled in this course yet.
              </p>
            </Card>
          ) : (
            enrichedEnrollments.map(enrollment => (
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
                  <p className='text-foreground font-semibold'>{enrollment.studentName}</p>
                  <p className='text-muted-foreground flex items-center gap-1 text-xs'>
                    <Clock className='h-3 w-3' />
                    Enrolled{' '}
                    {formatDistanceToNow(new Date(enrollment.enrollment_date), { addSuffix: true })}
                  </p>
                </div>

                <Button size='sm' onClick={() => handleViewProfile(enrollment.studentName)}>
                  View Profile
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollmentsPage;
