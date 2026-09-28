'use client';

import {
  BookOpen,
  CircleHelp,
  FileText,
  Headphones,
  ImageIcon,
  Lock,
  PlayCircle,
} from 'lucide-react';
import { AsyncSection } from '@/components/data/async-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OrganisationCourseLesson } from '@/services/client';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { courseCapability, type CourseAccess, type CourseBlockAsyncProps } from '../types';
import { courseContentKind } from './CurriculumTab';

export type ProgramCurriculumCourse = {
  uuid: string;
  name: string;
  thumbnailUrl?: string | null;
  difficulty?: string;
  access: CourseAccess;
  lessons: readonly OrganisationCourseLesson[];
  order: number;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
};

const COURSE_TONES = [
  {
    tile: 'border-chart-2/20 bg-chart-2/10 hover:border-chart-2/40 hover:bg-chart-2/15',
    icon: 'bg-chart-2/15 text-chart-2',
  },
  {
    tile: 'border-info/20 bg-info/10 hover:border-info/40 hover:bg-info/15',
    icon: 'bg-info/15 text-info',
  },
  {
    tile: 'border-chart-4/20 bg-chart-4/10 hover:border-chart-4/40 hover:bg-chart-4/15',
    icon: 'bg-chart-4/20 text-chart-4',
  },
  {
    tile: 'border-primary/20 bg-primary/10 hover:border-primary/40 hover:bg-primary/15',
    icon: 'bg-primary/15 text-primary',
  },
  {
    tile: 'border-chart-1/20 bg-chart-1/10 hover:border-chart-1/40 hover:bg-chart-1/15',
    icon: 'bg-chart-1/15 text-chart-1',
  },
] as const;

export type ProgramsCurriculumTabProps = CourseBlockAsyncProps & {
  courses: readonly ProgramCurriculumCourse[];
  onSelectLesson: (course: ProgramCurriculumCourse, lessonIndex: number) => void;
  className?: string;
};

/** A shared lesson matrix. Its caller supplies bounded, server-scoped course data. */
export function ProgramsCurriculumTab({
  courses,
  onSelectLesson,
  loading,
  error,
  onRetry,
  className,
}: ProgramsCurriculumTabProps) {
  const columns = Math.max(1, ...courses.map(course => course.lessons.length));
  return (
    <AsyncSection
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!courses.length}
      emptyTitle='No courses in this program'
      emptyDescription='Bundled courses and their lessons will appear here.'
      errorTitle='Could not load the program curriculum'
      skeleton={<Skeleton className='h-80 w-full rounded-lg' />}
    >
      <div className={cn('bg-background min-w-0 overflow-hidden rounded-lg border', className)}>
        <div
          className='overflow-x-auto overscroll-x-contain pb-2'
          role='region'
          aria-label='Program curriculum matrix'
          tabIndex={0}
        >
          <table className='min-w-max border-separate border-spacing-0 text-left'>
            <caption className='sr-only'>
              Bundled courses with one column for each lesson. Select a lesson to view its details.
            </caption>
            <thead>
              <tr>
                <th
                  scope='col'
                  className='bg-muted w-20 max-w-20 min-w-20 border-r border-b px-3 py-4 text-xs font-bold md:sticky md:left-0 md:z-20'
                >
                  Course icon
                </th>
                <th
                  scope='col'
                  className='bg-muted w-52 max-w-52 min-w-52 border-r border-b px-4 py-4 text-xs font-bold md:sticky md:left-20 md:z-20'
                >
                  Course name
                </th>
                <th
                  scope='col'
                  className='bg-muted w-28 max-w-28 min-w-28 border-r border-b px-3 py-4 text-xs font-bold md:sticky md:left-72 md:z-20'
                >
                  Difficulty
                </th>
                {Array.from({ length: columns }, (_, index) => (
                  <th
                    scope='col'
                    key={index}
                    className='bg-muted w-[204px] border-r border-b px-2 py-4 text-center text-xs font-bold'
                  >
                    Lesson {index + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map(course => {
                const tone = COURSE_TONES[course.order % COURSE_TONES.length] ?? COURSE_TONES[0];
                const full = courseCapability(course.access).content.level === 'full';
                return (
                  <tr key={course.uuid}>
                    <td className='bg-background w-20 max-w-20 min-w-20 border-r border-b px-3 py-3 align-middle md:sticky md:left-0 md:z-10'>
                      <Avatar className='size-12'>
                        <AvatarImage
                          src={toAuthenticatedMediaUrl(course.thumbnailUrl) || undefined}
                          alt=''
                        />
                        <AvatarFallback className={tone.icon}>
                          <BookOpen className='size-5' aria-hidden />
                        </AvatarFallback>
                      </Avatar>
                    </td>
                    <th
                      scope='row'
                      className='bg-background w-52 max-w-52 min-w-52 border-r border-b px-4 py-3 align-middle md:sticky md:left-20 md:z-10'
                    >
                      <span className='line-clamp-2 text-sm leading-5 font-semibold'>
                        {course.name}
                      </span>
                      <span className='text-muted-foreground mt-1 block text-xs font-normal'>
                        {course.loading
                          ? 'Loading lessons…'
                          : course.error
                            ? 'Curriculum unavailable'
                            : `${course.lessons.length} lessons`}
                      </span>
                    </th>
                    <td className='bg-background w-28 max-w-28 min-w-28 border-r border-b px-3 py-3 text-center align-middle md:sticky md:left-72 md:z-10'>
                      <Badge
                        variant='outline'
                        className='border-success/25 bg-success/10 text-success whitespace-normal'
                      >
                        {course.difficulty || 'Not specified'}
                      </Badge>
                    </td>
                    {course.loading || course.error || course.lessons.length === 0 ? (
                      <td colSpan={columns} className='bg-background border-b p-3'>
                        {course.loading ? (
                          <Skeleton className='h-[92px] w-full min-w-[188px]' />
                        ) : course.error ? (
                          <div className='space-y-2 text-sm'>
                            <p className='text-muted-foreground'>Could not load lessons.</p>
                            {course.onRetry && (
                              <Button size='sm' variant='outline' onClick={course.onRetry}>
                                Retry
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className='text-muted-foreground py-6 text-sm'>
                            No lessons added to this course yet.
                          </p>
                        )}
                      </td>
                    ) : (
                      Array.from({ length: columns }, (_, index) => {
                        const lesson = course.lessons[index];
                        const kinds = full
                          ? (lesson?.contents ?? []).map(item =>
                              courseContentKind(item.content_category ?? item.mime_type)
                            )
                          : [];
                        const Icon = !full
                          ? Lock
                          : kinds.includes('audio')
                            ? Headphones
                            : kinds.includes('video')
                              ? PlayCircle
                              : kinds.includes('quiz')
                                ? CircleHelp
                                : kinds.includes('document')
                                  ? FileText
                                  : BookOpen;
                        return (
                          <td
                            key={index}
                            className='bg-background border-r border-b p-2 align-middle'
                          >
                            {lesson ? (
                              <Button
                                variant='ghost'
                                onClick={() => onSelectLesson(course, index)}
                                aria-label={`${course.name}, lesson ${lesson.lesson_number ?? index + 1}: ${lesson.title || 'Untitled lesson'}`}
                                className={cn(
                                  'h-[92px] w-[188px] items-start justify-start gap-2 rounded-lg border p-3 text-left whitespace-normal shadow-none transition-all hover:-translate-y-0.5 hover:shadow-sm',
                                  tone.tile
                                )}
                              >
                                <span
                                  className={cn(
                                    'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full',
                                    tone.icon
                                  )}
                                >
                                  <Icon className='size-4' aria-hidden />
                                </span>
                                <span className='min-w-0 flex-1'>
                                  <span className='text-foreground line-clamp-3 text-xs leading-4 font-semibold'>
                                    {lesson.title || 'Untitled lesson'}
                                  </span>
                                  <span className='text-muted-foreground mt-1 block text-[10px] font-medium'>
                                    {full
                                      ? `${lesson.content_count ?? lesson.contents?.length ?? 0} content items`
                                      : 'Lesson outline'}
                                  </span>
                                </span>
                              </Button>
                            ) : (
                              <div
                                className='bg-muted/60 text-muted-foreground grid h-[92px] w-[188px] place-items-center rounded-lg text-sm'
                                aria-label={`No lesson ${index + 1}`}
                              >
                                —
                              </div>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className='bg-muted/40 text-muted-foreground flex items-center gap-2 border-t px-4 py-3 text-xs'>
          <ImageIcon className='size-4 shrink-0' aria-hidden />
          Scroll horizontally to explore every lesson. Select a lesson to view its full structure.
        </p>
      </div>
    </AsyncSection>
  );
}
