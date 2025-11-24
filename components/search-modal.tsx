'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { searchCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Course } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Clock, ArrowRight, Loader2, Filter, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';

type SearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CourseFilters = {
  title: string;
  description: string;
  level: string;
  isPublished: boolean;
};

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  // Course filters
  const [courseFilters, setCourseFilters] = useState<CourseFilters>({
    title: '',
    description: '',
    level: '',
    isPublished: true,
  });

  // Debounce filters
  const debouncedCourseFilters = useDebounce(courseFilters, 400);

  // Check if any course filter is active
  const hasCourseFilters = useMemo(
    () =>
      Boolean(
        debouncedCourseFilters.title ||
          debouncedCourseFilters.description ||
          debouncedCourseFilters.level
      ),
    [debouncedCourseFilters]
  );

  // Build course search params
  const courseSearchParams = useMemo(() => {
    const params: Record<string, unknown> = {
      is_published: debouncedCourseFilters.isPublished,
    };

    if (debouncedCourseFilters.title) {
      params.title_like = debouncedCourseFilters.title;
    }
    if (debouncedCourseFilters.description) {
      params.description_like = debouncedCourseFilters.description;
    }
    if (debouncedCourseFilters.level) {
      params.level = debouncedCourseFilters.level;
    }

    return params;
  }, [debouncedCourseFilters]);

  // Build instructor search params
  // Search courses
  const coursesQuery = useQuery({
    ...searchCoursesOptions({
      query: {
        searchParams: courseSearchParams,
        pageable: {
          page: 0,
          size: 20,
        },
      },
    }),
    enabled: hasCourseFilters,
  });

  const courses = useMemo(
    () => coursesQuery.data?.data?.content ?? [],
    [coursesQuery.data]
  );

  const isLoading = coursesQuery.isLoading;

  const handleResetCourseFilters = () => {
    setCourseFilters({
      title: '',
      description: '',
      level: '',
      isPublished: true,
    });
  };

  const handleResultClick = () => {
    onOpenChange(false);
    handleResetCourseFilters();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-6xl rounded-[28px] border-border p-0 max-h-[90vh]'>
        <DialogHeader className='border-b border-border px-6 pt-6 pb-4'>
          <DialogTitle className='text-2xl text-foreground'>
            Advanced Search
          </DialogTitle>
          <DialogDescription className='text-muted-foreground'>
            Search courses using multiple criteria
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-0 lg:grid-cols-[320px_1fr]'>
          {/* Left Sidebar - Filters */}
          <div className='w-full border-b border-border bg-muted/50 p-6 lg:border-b-0 lg:border-r'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Filter className='h-4 w-4 text-primary' />
                <h3 className='text-sm font-semibold text-foreground'>Search filters</h3>
              </div>
              {isLoading && <Loader2 className='h-4 w-4 animate-spin text-primary' />}
            </div>

            <div className='space-y-3'>
              <div className='space-y-2'>
                <Label htmlFor='course-title' className='text-xs font-medium'>
                  Course title
                </Label>
                <Input
                  id='course-title'
                  placeholder='Search by title...'
                  value={courseFilters.title}
                  onChange={e => setCourseFilters({ ...courseFilters, title: e.target.value })}
                  className='h-9 rounded-full'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='course-description' className='text-xs font-medium'>
                  Description
                </Label>
                <Input
                  id='course-description'
                  placeholder='Search in description...'
                  value={courseFilters.description}
                  onChange={e =>
                    setCourseFilters({ ...courseFilters, description: e.target.value })
                  }
                  className='h-9 rounded-full'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='course-level' className='text-xs font-medium'>
                  Course level
                </Label>
                <Select
                  value={courseFilters.level || 'all'}
                  onValueChange={value =>
                    setCourseFilters({ ...courseFilters, level: value === 'all' ? '' : value })
                  }
                >
                  <SelectTrigger className='h-9 rounded-full'>
                    <SelectValue placeholder='All levels' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All levels</SelectItem>
                    <SelectItem value='Beginner'>Beginner</SelectItem>
                    <SelectItem value='Intermediate'>Intermediate</SelectItem>
                    <SelectItem value='Advanced'>Advanced</SelectItem>
                    <SelectItem value='Expert'>Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className='my-3' />

              <Button
                variant='outline'
                size='sm'
                onClick={handleResetCourseFilters}
                className='w-full rounded-full text-xs'
              >
                <RotateCcw className='mr-2 h-3 w-3' />
                Reset filters
              </Button>
            </div>
          </div>

          {/* Right Content - Results */}
          <div className='flex-1 p-6'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                {hasCourseFilters ? (
                  <>
                    Found <span className='font-semibold text-foreground'>{courses.length}</span>{' '}
                    {courses.length === 1 ? 'course' : 'courses'}
                  </>
                ) : (
                  'Enter search criteria to find courses'
                )}
              </div>
              {courses.length > 0 && (
                <Badge variant='secondary' className='rounded-full'>
                  {courses.length} results
                </Badge>
              )}
            </div>

            <ScrollArea className='h-[500px] pr-4'>
              {!hasCourseFilters ? (
                <div className='flex flex-col items-center justify-center py-20 text-center'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20'>
                    <Search className='h-8 w-8 text-primary' />
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Use the filters on the left to search for courses
                  </p>
                </div>
              ) : coursesQuery.isLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className='h-28 w-full rounded-2xl' />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-20 text-center'>
                  <p className='text-sm font-medium text-foreground'>No courses found</p>
                  <p className='mt-1 text-xs text-muted-foreground'>Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className='grid gap-3 md:grid-cols-2'>
                  {courses.map(course => (
                    <CourseResult key={course.uuid} course={course} onClick={handleResultClick} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CourseResult({ course, onClick }: { course: Course; onClick: () => void }) {
  return (
    <Link
      href={`/courses/${course.uuid}`}
      onClick={onClick}
      className='block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50 hover:bg-muted'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1 space-y-2'>
          <h4 className='font-semibold leading-tight text-foreground'>
            {course.title}
          </h4>
          {course.description && (
            <p className='line-clamp-2 text-xs text-muted-foreground'>
              {course.description.replace(/<[^>]*>/g, '')}
            </p>
          )}
          <div className='flex flex-wrap items-center gap-2 pt-1'>
            {course.level && (
              <Badge
                variant='outline'
                className='rounded-full border-primary/30 bg-primary/10 text-xs text-primary'
              >
                {course.level}
              </Badge>
            )}
            {course.duration_weeks && (
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Clock className='h-3 w-3' />
                {course.duration_weeks}w
              </div>
            )}
          </div>
        </div>
        <ArrowRight className='h-4 w-4 shrink-0 text-primary' />
      </div>
    </Link>
  );
}
