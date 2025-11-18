'use client';

import { useState, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  searchCoursesOptions,
  searchInstructorsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Course, Instructor } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  BookOpen,
  Users,
  X,
  GraduationCap,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';

type SearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'courses' | 'instructors'>('courses');

  // Debounce search query to avoid too many API calls
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search courses
  const coursesQuery = useQuery({
    ...searchCoursesOptions({
      query: {
        searchParams: {
          title_like: debouncedQuery,
          is_published: true,
        },
        pageable: {
          page: 0,
          size: 10,
        },
      },
    }),
    enabled: !!debouncedQuery && activeTab === 'courses',
  });

  // Search instructors
  const instructorsQuery = useQuery({
    ...searchInstructorsOptions({
      query: {
        searchParams: {
          firstName_like: debouncedQuery,
          lastName_like: debouncedQuery,
        },
        pageable: {
          page: 0,
          size: 10,
        },
      },
    }),
    enabled: !!debouncedQuery && activeTab === 'instructors',
  });

  const courses = useMemo(
    () => coursesQuery.data?.data?.content ?? [],
    [coursesQuery.data]
  );

  const instructors = useMemo(
    () => instructorsQuery.data?.data?.content ?? [],
    [instructorsQuery.data]
  );

  const isLoading = coursesQuery.isLoading || instructorsQuery.isLoading;

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResultClick = () => {
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl rounded-[28px] border-blue-200/60 p-0 dark:border-blue-500/25'>
        <DialogHeader className='border-b border-blue-200/40 px-6 pt-6 pb-4 dark:border-blue-500/25'>
          <DialogTitle className='text-2xl text-slate-900 dark:text-blue-50'>
            Search Elimika
          </DialogTitle>
          <DialogDescription className='text-slate-600 dark:text-slate-200'>
            Find courses and instructors across our platform
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className='px-6 pt-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search for courses, instructors...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='h-12 w-full rounded-full border-blue-200/60 bg-white pl-11 pr-12 text-base shadow-sm transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-200/50 dark:border-blue-500/30 dark:bg-blue-950/30'
              autoFocus
            />
            {searchQuery && (
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full'
                onClick={handleClearSearch}
              >
                <X className='h-4 w-4' />
              </Button>
            )}
            {isLoading && (
              <div className='absolute right-12 top-1/2 -translate-y-1/2'>
                <Loader2 className='h-5 w-5 animate-spin text-primary' />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className='px-6'>
          <TabsList className='grid w-full grid-cols-2 rounded-full bg-blue-50 p-1 dark:bg-blue-900/40'>
            <TabsTrigger
              value='courses'
              className='rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-blue-950'
            >
              <BookOpen className='mr-2 h-4 w-4' />
              Courses
              {courses.length > 0 && (
                <Badge variant='secondary' className='ml-2 rounded-full px-2 py-0 text-xs'>
                  {courses.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value='instructors'
              className='rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-blue-950'
            >
              <Users className='mr-2 h-4 w-4' />
              Instructors
              {instructors.length > 0 && (
                <Badge variant='secondary' className='ml-2 rounded-full px-2 py-0 text-xs'>
                  {instructors.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Courses Results */}
          <TabsContent value='courses' className='mt-4'>
            <ScrollArea className='h-[400px] pr-4'>
              {!debouncedQuery ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/40'>
                    <BookOpen className='h-8 w-8 text-primary' />
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Start typing to search for courses
                  </p>
                </div>
              ) : coursesQuery.isLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className='h-24 w-full rounded-2xl' />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <p className='text-sm text-muted-foreground'>
                    No courses found for "{debouncedQuery}"
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {courses.map((course) => (
                    <CourseResult
                      key={course.uuid}
                      course={course}
                      onClick={handleResultClick}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Instructors Results */}
          <TabsContent value='instructors' className='mt-4'>
            <ScrollArea className='h-[400px] pr-4'>
              {!debouncedQuery ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/40'>
                    <Users className='h-8 w-8 text-primary' />
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Start typing to search for instructors
                  </p>
                </div>
              ) : instructorsQuery.isLoading ? (
                <div className='space-y-3'>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className='h-24 w-full rounded-2xl' />
                  ))}
                </div>
              ) : instructors.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <p className='text-sm text-muted-foreground'>
                    No instructors found for "{debouncedQuery}"
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {instructors.map((instructor) => (
                    <InstructorResult
                      key={instructor.uuid}
                      instructor={instructor}
                      onClick={handleResultClick}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className='border-t border-blue-200/40 px-6 py-4 dark:border-blue-500/25'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            Tip: Use specific keywords for better results
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CourseResult({
  course,
  onClick,
}: {
  course: Course;
  onClick: () => void;
}) {
  return (
    <Link
      href={`/courses/${course.uuid}`}
      onClick={onClick}
      className='block rounded-2xl border border-blue-200/40 bg-white p-4 transition hover:border-blue-400/60 hover:bg-blue-50/50 dark:border-blue-500/25 dark:bg-blue-950/30 dark:hover:border-blue-400/40 dark:hover:bg-blue-900/30'
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1 space-y-1'>
          <h4 className='font-semibold text-slate-900 dark:text-blue-50'>
            {course.title}
          </h4>
          {course.description && (
            <p className='line-clamp-2 text-sm text-slate-600 dark:text-slate-200'>
              {course.description.replace(/<[^>]*>/g, '')}
            </p>
          )}
          <div className='flex flex-wrap items-center gap-2 pt-1'>
            {course.level && (
              <Badge
                variant='outline'
                className='rounded-full border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-100'
              >
                {course.level}
              </Badge>
            )}
            {course.duration_weeks && (
              <div className='flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400'>
                <Clock className='h-3 w-3' />
                {course.duration_weeks} weeks
              </div>
            )}
          </div>
        </div>
        <ArrowRight className='h-5 w-5 shrink-0 text-primary' />
      </div>
    </Link>
  );
}

function InstructorResult({
  instructor,
  onClick,
}: {
  instructor: Instructor;
  onClick: () => void;
}) {
  const fullName = `${instructor.firstName ?? ''} ${instructor.lastName ?? ''}`.trim();

  return (
    <Link
      href={`/instructors/${instructor.uuid}`}
      onClick={onClick}
      className='block rounded-2xl border border-blue-200/40 bg-white p-4 transition hover:border-blue-400/60 hover:bg-blue-50/50 dark:border-blue-500/25 dark:bg-blue-950/30 dark:hover:border-blue-400/40 dark:hover:bg-blue-900/30'
    >
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <GraduationCap className='h-6 w-6' />
          </div>
          <div className='space-y-1'>
            <h4 className='font-semibold text-slate-900 dark:text-blue-50'>
              {fullName || 'Instructor'}
            </h4>
            {instructor.bio && (
              <p className='line-clamp-1 text-sm text-slate-600 dark:text-slate-200'>
                {instructor.bio}
              </p>
            )}
          </div>
        </div>
        <ArrowRight className='h-5 w-5 shrink-0 text-primary' />
      </div>
    </Link>
  );
}
