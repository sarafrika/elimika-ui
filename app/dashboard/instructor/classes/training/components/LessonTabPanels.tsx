'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { WorkbookLoading } from '@/components/lesson/WorkbookLoading';
import { WorkbookError } from '@/components/lesson/WorkbookError';
import {
  hasApiError,
  nextWorkbookPage,
  WORKBOOK_PAGE_SIZE,
  type WorkbookRole,
} from '@/components/lesson/workbook-data';
import { getPracticeActivitiesInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Lesson } from '@/services/client/types.gen';
import { STALE_TIMES } from '@/lib/query-client';
export { MaterialsPanel as ResourcesPanel } from './MaterialsPanel';
export { EvaluationPanel as AssessmentPanel } from '@/components/lesson/EvaluationPanel';

export type LessonTabKey =
  | 'lesson'
  | 'practice'
  | 'quiz'
  | 'assignment'
  | 'grading'
  | 'summary'
  | 'resources';

export function LessonsListPanel({
  lessons,
  currentLesson,
  onSelect,
  moreLessons,
}: {
  lessons: Lesson[];
  currentLesson?: string;
  onSelect: (id: string) => void;
  moreLessons?: ReactNode;
}) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(
    () =>
      lessons.filter(lesson =>
        `${lesson.lesson_number} ${lesson.title} ${lesson.description ?? ''}`
          .toLowerCase()
          .includes(deferredSearch.trim().toLowerCase())
      ),
    [lessons, deferredSearch]
  );
  return (
    <div className='space-y-4'>
      <h2 className='text-lg font-semibold'>All lessons</h2>
      <Input
        aria-label='Search lessons'
        placeholder='Search loaded lessons…'
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      {filtered.length === 0 && (
        <EmptyState title={lessons.length ? 'No matching lessons' : 'No lessons available'} />
      )}
      <ul className='space-y-2'>
        {filtered.map(lesson => (
          <li key={lesson.uuid}>
            <Button
              variant='outline'
              className={`h-auto w-full justify-start gap-3 p-4 text-left whitespace-normal ${lesson.uuid === currentLesson ? 'border-primary bg-primary/5' : ''}`}
              aria-current={lesson.uuid === currentLesson ? 'page' : undefined}
              onClick={() => lesson.uuid && onSelect(lesson.uuid)}
            >
              <BookOpen className='text-primary h-5 w-5 shrink-0' />
              <span className='min-w-0 space-y-1'>
                <span className='block font-semibold'>
                  Lesson {lesson.lesson_number}: {lesson.title}
                </span>
                {lesson.description && (
                  <span className='text-muted-foreground block text-sm font-normal'>
                    {lesson.description}
                  </span>
                )}
              </span>
            </Button>
          </li>
        ))}
      </ul>
      {moreLessons}
    </div>
  );
}

export function PracticePanel({
  courseId,
  lessonId,
  role,
}: {
  courseId: string;
  lessonId: string;
  role: WorkbookRole;
}) {
  const query = useInfiniteQuery({
    ...getPracticeActivitiesInfiniteOptions({
      path: { courseUuid: courseId, lessonUuid: lessonId },
      query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(courseId && lessonId),
    staleTime: STALE_TIMES.entity,
  });
  const activities = useMemo(
    () =>
      (
        query.data?.pages.flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? []))) ??
        []
      )
        .filter(item => role === 'instructor' || item.active)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [query.data, role]
  );
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || query.data?.pages.some(hasApiError))
    return (
      <WorkbookError
        title='Unable to load practice activities'
        retry={() => void query.refetch()}
      />
    );
  return (
    <div className='space-y-4'>
      <h2 className='text-lg font-semibold'>Practice activities</h2>
      {!activities.length && <EmptyState title='No practice activities available' />}
      {activities.map((activity, index) => (
        <Card key={activity.uuid ?? index}>
          <CardHeader>
            <CardTitle className='text-base'>{activity.title}</CardTitle>
            <div className='flex flex-wrap gap-2'>
              {activity.activity_type && (
                <Badge variant='outline'>{activity.activity_type.replaceAll('_', ' ')}</Badge>
              )}
              {activity.grouping && (
                <Badge variant='outline'>{activity.grouping.replaceAll('_', ' ')}</Badge>
              )}
              {activity.estimated_minutes != null && (
                <Badge variant='secondary'>{activity.estimated_minutes} min</Badge>
              )}
              {role === 'instructor' && (
                <Badge variant='outline'>{activity.status ?? 'Draft'}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <RichTextRenderer htmlString={activity.instructions} />
            {activity.materials?.length ? (
              <div>
                <h3 className='mb-2 font-semibold'>Materials</h3>
                <ul className='list-disc space-y-1 pl-5'>
                  {activity.materials.map((material, i) => (
                    <li key={`${i}-${material}`}>{material}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {activity.expected_output && (
              <div>
                <h3 className='mb-2 font-semibold'>Expected output</h3>
                <RichTextRenderer htmlString={activity.expected_output} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {query.hasNextPage && (
        <Button
          variant='outline'
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Load more activities
        </Button>
      )}
    </div>
  );
}
