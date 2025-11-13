'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { GuardianCourseProgress } from '@/services/guardian';
import { formatDistanceToNow } from 'date-fns';
import { BookOpenCheck } from 'lucide-react';
import { useMemo } from 'react';

export type CourseProgressFilter = 'all' | 'ACTIVE' | 'COMPLETED';

interface GuardianCourseProgressGridProps {
  courses: GuardianCourseProgress[];
  filter: CourseProgressFilter;
  onFilterChange: (filter: CourseProgressFilter) => void;
}

const filterOptions: { label: string; value: CourseProgressFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
];

export function GuardianCourseProgressGrid({
  courses,
  filter,
  onFilterChange,
}: GuardianCourseProgressGridProps) {
  const filteredCourses = useMemo(() => {
    if (filter === 'all') {
      return courses;
    }
    return courses.filter(course => course.status === filter);
  }, [courses, filter]);

  if (!courses.length) {
    return (
      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            <BookOpenCheck className='size-4' />
            Course progress
          </CardTitle>
        </CardHeader>
        <CardContent className='rounded-2xl border border-dashed border-border/70 p-6 text-sm'>
          <p className='font-medium'>No active coursework yet.</p>
          <p className='text-muted-foreground'>
            Once the learner enrolls, lessons and progress updates will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/70'>
      <CardHeader className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <BookOpenCheck className='size-4' />
          Course progress
        </CardTitle>
        <div className='flex gap-2'>
          {filterOptions.map(option => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className='grid gap-4 md:grid-cols-2'>
        {filteredCourses.map(course => {
          const updatedLabel =
            course.updated_date && !Number.isNaN(Date.parse(course.updated_date))
              ? formatDistanceToNow(new Date(course.updated_date), { addSuffix: true })
              : 'Recently updated';

          const progressValue =
            typeof course.progress_percentage === 'number'
              ? Math.min(Math.max(course.progress_percentage, 0), 100)
              : 0;

          return (
            <div
              key={course.enrollment_uuid ?? course.course_uuid ?? course.course_name}
              className='rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm'
            >
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <p className='text-sm font-semibold'>{course.course_name ?? 'Untitled course'}</p>
                  <p className='text-muted-foreground text-xs'>Updated {updatedLabel}</p>
                </div>
                <Badge
                  variant={
                    course.status === 'COMPLETED'
                      ? 'success'
                      : course.status === 'ACTIVE'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {course.status?.toLowerCase() ?? 'active'}
                </Badge>
              </div>
              <div className='mt-4 space-y-2'>
                <div className='flex items-center justify-between text-xs font-medium'>
                  <span>Progress</span>
                  <span>{progressValue.toFixed(0)}%</span>
                </div>
                <Progress value={progressValue} className='h-2 rounded-full' />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
