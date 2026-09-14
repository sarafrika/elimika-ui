'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Dumbbell,
  FileQuestion,
  FileText,
  FolderOpen,
  Home,
  List,
  ListChecks,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { Card } from '../../../../../../components/ui/card';
import { InstructorAttendanceRail } from './InstructorAttendanceRail';
import type { LessonTabKey } from './LessonTabPanels';

const TABS = [
  { key: 'lesson', label: 'Learn', icon: BookOpen },
  { key: 'practice', label: 'Practice', icon: Dumbbell },
  { key: 'quiz', label: 'Quiz', icon: FileQuestion },
  { key: 'assignment', label: 'Assignment', icon: FileText },
  { key: 'grading', label: 'Grading', icon: ClipboardCheck },
  { key: 'summary', label: 'Summary', icon: ListChecks },
  { key: 'resources', label: 'Resources', icon: FolderOpen },
] as const;

const NEXT_SECTION: Partial<Record<LessonTabKey, { tab: LessonTabKey; label: string }>> = {
  lesson: { tab: 'practice', label: 'Next: Practice' },
  practice: { tab: 'quiz', label: 'Next: Quiz' },
  quiz: { tab: 'assignment', label: 'Next: Assignment' },
  assignment: { tab: 'grading', label: 'Next: Grading' },
};

const PREVIOUS_SECTION: Partial<Record<LessonTabKey, LessonTabKey>> = {
  practice: 'lesson',
  quiz: 'practice',
  assignment: 'quiz',
  grading: 'assignment',
  summary: 'grading',
};

export function LessonShell({
  classTitle,
  courseTitle,
  lessonTitle,
  lessonNumber,
  roleLabel,
  homeHref,
  tab,
  onTabChange,
  onBrowseLessons,
  showList,
  children,
  actions,
  pageIndex,
  pageCount,
  onPageChange,
  onNextLesson,
  contentReady,
  isCompleted,
  onComplete,
}: {
  classTitle: string;
  courseTitle: string;
  lessonTitle?: string;
  lessonNumber?: number;
  roleLabel: string;
  homeHref: string;
  tab: LessonTabKey;
  onTabChange: (tab: LessonTabKey) => void;
  onBrowseLessons: () => void;
  showList: boolean;
  children: ReactNode;
  actions?: ReactNode;
  pageIndex: number;
  pageCount: number;
  onPageChange: (index: number) => void;
  onNextLesson?: () => void;
  contentReady: boolean;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  const showPagination = tab === 'lesson' && !showList && pageCount > 0;
  const showNavigation = !showList && tab !== 'resources' && (tab !== 'lesson' || contentReady);
  const nextSection = NEXT_SECTION[tab];
  const previousSection = PREVIOUS_SECTION[tab];
  const hasNextContent = tab === 'lesson' && pageIndex < pageCount - 1;
  const nextAction = hasNextContent
    ? { label: 'Next content', onClick: () => onPageChange(pageIndex + 1) }
    : nextSection
      ? { label: nextSection.label, onClick: () => onTabChange(nextSection.tab) }
      : tab === 'grading'
        ? { label: 'Complete lesson', onClick: onComplete }
        : onNextLesson
          ? { label: 'Next lesson', onClick: onNextLesson }
          : { label: 'All lessons', onClick: onBrowseLessons };
  const shellStart = useRef<HTMLDivElement>(null);
  const contentStart = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);
  useEffect(() => {
    const target = hasMounted.current ? contentStart.current : shellStart.current;
    target?.scrollIntoView({ block: 'start' });
    hasMounted.current = true;
  }, [pageIndex, tab, showList]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !showPagination ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          'input, textarea, select, button, a, [contenteditable], [role="dialog"], [role="slider"]'
        )
      )
        return;
      if (document.querySelector('[role="dialog"]')) return;
      if (event.key === 'ArrowRight' && pageIndex < pageCount - 1) {
        event.preventDefault();
        onPageChange(pageIndex + 1);
      }
      if (event.key === 'ArrowLeft' && pageIndex > 0) {
        event.preventDefault();
        onPageChange(pageIndex - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPagination, pageIndex, pageCount, onPageChange]);

  return (
    <div ref={shellStart} className='bg-muted/40 text-foreground flex min-h-screen'>
      <aside className='bg-background border-border hidden w-[4.5rem] shrink-0 flex-col items-center gap-4 border-r py-4 md:flex'>
        <Button asChild size='icon'>
          <Link href={homeHref} aria-label='Back to classes'>
            <Home className='h-5 w-5' />
          </Link>
        </Button>
        <Button variant='ghost' size='icon' onClick={onBrowseLessons} aria-label='All lessons'>
          <BookOpen className='h-5 w-5' />
        </Button>
      </aside>
      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='bg-background border-border border-b px-4 sm:px-7'>
          <nav
            aria-label='Lesson sections'
            className='border-border flex gap-1 overflow-x-auto border-b'
          >
            {TABS.filter(item => item.key !== 'summary' || isCompleted).map(
              ({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant='ghost'
                  onClick={() => onTabChange(key)}
                  aria-current={!showList && tab === key ? 'page' : undefined}
                  className={`h-12 shrink-0 rounded-none border-b-2 px-3 ${!showList && tab === key ? 'border-primary text-primary' : 'text-muted-foreground border-transparent'}`}
                >
                  <Icon className='h-4 w-4' />
                  {label}
                </Button>
              )
            )}
          </nav>
          <div className='flex flex-wrap items-center justify-between gap-4 py-4'>
            <div className='min-w-0'>
              <p className='text-muted-foreground text-xs'>
                {courseTitle} / {classTitle}
              </p>
              <h1 className='mt-1 text-lg font-bold sm:text-xl'>
                {lessonTitle ? `Lesson ${lessonNumber}: ${lessonTitle}` : 'All lessons'}
              </h1>
              <Badge className='mt-2' variant='secondary'>
                {roleLabel}
              </Badge>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Button asChild variant='ghost' size='icon' className='md:hidden'>
                <Link href={homeHref} aria-label='Back to classes'>
                  <Home className='h-4 w-4' />
                </Link>
              </Button>
              <Button variant='outline' onClick={onBrowseLessons}>
                <List className='h-4 w-4' />
                All lessons
              </Button>
              {actions}
            </div>
          </div>
        </header>
        <main className='flex min-w-0 flex-1 flex-col px-3 py-4 sm:px-7 sm:py-6'>
          <div className='mx-auto flex w-full items-start gap-6'>
            <div className='min-w-0 flex-1'>
              <Card className='min-h-[34rem] rounded-lg border shadow-sm'>
                <div
                  ref={contentStart}
                  className='mx-auto w-full space-y-8 px-5 py-7 sm:px-10 sm:py-9'
                >
                  {showPagination && (
                    <div className='flex items-center gap-4 text-xs'>
                      <span>
                        {pageIndex + 1}/{pageCount}
                      </span>

                      <div className='bg-muted h-0.5 flex-1'>
                        <div
                          className='bg-primary h-full'
                          style={{
                            width: `${((pageIndex + 1) / pageCount) * 100}%`,
                          }}
                        />
                      </div>

                      <span className='text-muted-foreground'>Lesson content</span>
                    </div>
                  )}

                  {children}
                </div>
              </Card>

              {showNavigation && (
                <div className='border-border mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3'>
                  <Button
                    variant='outline'
                    disabled={tab === 'lesson' && pageIndex === 0}
                    onClick={() =>
                      previousSection
                        ? onTabChange(previousSection)
                        : onPageChange(pageIndex - 1)
                    }
                  >
                    <ChevronLeft className='h-4 w-4' />
                    Previous
                  </Button>

                  {showPagination && (
                    <p className='text-muted-foreground text-xs'>
                      Content {pageIndex + 1} of {pageCount}
                    </p>
                  )}

                  <Button onClick={nextAction.onClick}>
                    {nextAction.label}
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>

            <Card className='h-full hidden w-80 shrink-0 lg:sticky lg:top-6 lg:block'>
              <InstructorAttendanceRail
                roster={[]}
                onOpenRegister={() => {
                  throw new Error('Function not implemented.');
                }}
                canAdmit={false}
                onAdmit={(studentUuid: string) => {
                  throw new Error('Function not implemented.');
                }}
                onEvaluate={(studentUuid: string) => {
                  throw new Error('Function not implemented.');
                }}
              />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
