'use client';

import { BookOpen, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

import { useCoursesByIds } from '../../../../../hooks/use-batched-lookups';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import type {
  LearningHubCourseEnrollment,
  LearningHubData,
} from './useStudentLearningHubData';

type CourseFilter = 'all' | 'active' | 'completed' | 'not-started';

const COURSE_FILTERS: Array<{ id: CourseFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'not-started', label: 'Not started' },
];

interface LessonHubMyCoursesTabProps {
  learningHubData: LearningHubData;
}

const isCompleted = (course: LearningHubCourseEnrollment) => course?.progress_percentage! >= 100;

const isActive = (course: LearningHubCourseEnrollment) =>
  course?.progress_percentage! > 0 && course?.progress_percentage! < 100;

const isNotStarted = (course: LearningHubCourseEnrollment) => course.progress_percentage === 0;

const getStatusTone = (course: LearningHubCourseEnrollment) => {
  if (course.tone === 'green') return 'default';
  if (course.tone === 'slate') return 'secondary';
  return 'outline';
};

export function LessonHubMyCoursesTab({ learningHubData }: LessonHubMyCoursesTabProps) {
  const [filter, setFilter] = useState<CourseFilter>('all');

  const rows = learningHubData.courseEnrollments;
  const totals = {
    all: learningHubData.courseEnrollmentCount || rows.length,
    active: rows.filter(isActive).length,
    completed: rows.filter(isCompleted).length,
    'not-started': rows.filter(isNotStarted).length,
  };

  const filteredRows = useMemo(() => {
    switch (filter) {
      case 'active':
        return rows.filter(isActive);
      case 'completed':
        return rows.filter(isCompleted);
      case 'not-started':
        return rows.filter(isNotStarted);
      case 'all':
      default:
        return rows;
    }
  }, [filter, rows]);

  const truncated = learningHubData.courseEnrollmentCount > rows.length;

  if (learningHubData.loading) {
    return <CourseTabSkeleton />;
  }

  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-foreground text-lg font-semibold'>My Courses</h2>
          <p className='text-muted-foreground text-sm'>
            Track progress, resume lessons, and jump back into your enrolled courses.
          </p>
        </div>
        <div className='text-muted-foreground text-sm'>
          {truncated
            ? `Showing ${rows.length} of ${learningHubData.courseEnrollmentCount}`
            : `${rows.length} enrolled course${rows.length === 1 ? '' : 's'}`}
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        {COURSE_FILTERS.map(item => {
          const active = item.id === filter;

          return (
            <Button
              key={item.id}
              type='button'
              size='sm'
              variant={active ? 'default' : 'outline'}
              onClick={() => setFilter(item.id)}
              className={cn('rounded-full', active && 'shadow-sm')}
            >
              {item.label}
              <span className='text-muted-foreground ml-2 tabular-nums'>
                ({totals[item.id]})
              </span>
            </Button>
          );
        })}
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState
          variant='plain'
          icon={BookOpen}
          title='No courses in this view'
          description='Try a different filter or browse the course catalogue to add more learning paths.'
          action={
            <Button asChild>
              <Link href='/dashboard/student/courses'>
                Browse courses
              </Link>
            </Button>
          }
        />
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {filteredRows.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: LearningHubCourseEnrollment }) {
  const progress = Math.max(0, Math.min(100, course.progress_percentage ?? 0));
  const completed = progress >= 100;

  const { courseMap } = useCoursesByIds([course?.course_uuid])
  const courseObj = courseMap?.[course?.course_uuid];

  return (
    <Card className='pt-0 pb-4 border-border/70 bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md'>
      <div
        className="relative flex h-28 items-end justify-between overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-3"
        style={
          courseObj?.banner_url
            ? {
              backgroundImage: `url(${courseObj.banner_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
            : undefined
        }
      >
        {courseObj?.banner_url && (
          <div className="absolute inset-0 bg-black/20" />
        )}

        <div className="bg-background/90 border-border/70 relative z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur">
          <BookOpen className="text-primary h-5 w-5" />
        </div>

        <Badge
          variant={getStatusTone(course)}
          className="relative z-10 shadow-sm"
        >
          {course.statusLabel}
        </Badge>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {progress > 0 && progress < 100 && (
          <Badge variant='outline' className='rounded-full'>
            In progress
          </Badge>
        )}
        {completed && (
          <Badge variant='outline' className='rounded-full text-success'>
            <CheckCircle2 className='mr-1 h-3.5 w-3.5' />
            Completed
          </Badge>
        )}
      </div>

      <CardHeader className='space-y-1.5 px-4'>
        <CardTitle className='line-clamp-2 text-base'>{course.course_name ?? 'Untitled course'}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {stripHtml(courseObj?.description) ||
            (completed
              ? 'You have finished this course and can revisit materials anytime.'
              : 'Resume from where you left off or continue building momentum.')}
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4 px-4'>
        {courseObj?.category_names?.map((category) => (
          <Badge
            key={category}
            variant="secondary"
            className="shadow-sm"
          >
            {category}
          </Badge>
        ))}

        <div className='flex items-center justify-between gap-3 text-sm'>
          <span className='text-xs text-muted-foreground inline-flex items-center gap-1.5'>
            Starts {course.updatedLabel}
          </span>
        </div>

        <div className='flex flex-wrap gap-2 pt-1'>
          <Button asChild size={'sm'} variant={'success'} className='min-w-32 text-xs'>
            <Link href={`/dashboard/student/courses/available-classes/${course?.course_uuid}`}>
              Join Class
            </Link>
          </Button>
          <Button asChild size={'sm'} variant='outline' className='min-w-32 text-xs'>
            <Link href={`/dashboard/student/courses`}>
              View details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseTabSkeleton() {
  return (
    <div className='space-y-5'>
      <div className='space-y-2'>
        <Skeleton className='h-6 w-40' />
        <Skeleton className='h-4 w-full max-w-xl' />
      </div>

      <div className='flex flex-wrap gap-2'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-9 w-28 rounded-full' />
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className='border-border/70'>
            <Skeleton className='h-24 w-full rounded-b-none rounded-t-lg' />
            <CardHeader className='space-y-2'>
              <Skeleton className='h-5 w-3/4' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
            </CardHeader>
            <CardContent className='space-y-3'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-2 w-full' />
              <div className='flex gap-2'>
                <Skeleton className='h-9 w-32 rounded-md' />
                <Skeleton className='h-9 w-32 rounded-md' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
