'use client';

import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { STALE_TIMES } from '@/lib/query-client';
import type { Course } from '@/services/client';
import {
  getAllDifficultyLevelsOptions,
  getCourseContentOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  ProgramsCurriculumTab,
  type ProgramCurriculumCourse,
} from '@/src/features/course-record/blocks/ProgramsCurriculumTab';
import type {
  CourseCurriculumItem,
  CourseCurriculumLesson,
} from '@/src/features/course-record/blocks/CurriculumTab';
import { resolveCourseAccess } from '@/src/features/course-record/use-course-access';
import { ProgramLessonDetailSheet } from './ProgramLessonDetailSheet';

// The API exposes curriculum per course, with no multi-course endpoint. Limit
// reads to four visible rows; each response includes all lessons and content.
const PAGE_SIZE = 4;

export function ProgramCurriculumPanel({
  courses,
  loading,
  error,
  onRetry,
  onReadItem,
}: {
  courses: readonly Course[];
  loading: boolean;
  error?: unknown;
  onRetry: () => void;
  onReadItem?: (item: CourseCurriculumItem, lesson: CourseCurriculumLesson) => void;
}) {
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState<{ courseUuid: string; lessonIndex: number } | null>(
    null
  );
  const pageCount = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => courses.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [courses, currentPage]
  );
  const ids = useMemo(
    () => visible.flatMap(course => (course.uuid ? [course.uuid] : [])),
    [visible]
  );
  const queries = useQueries({
    queries: ids.map(courseUuid => ({
      ...getCourseContentOptions({ path: { courseUuid } }),
      enabled: Boolean(courseUuid),
      staleTime: STALE_TIMES.entity,
    })),
  });
  const difficulty = useQuery({
    ...getAllDifficultyLevelsOptions(),
    enabled: courses.length > 0,
    staleTime: STALE_TIMES.reference,
  });
  const difficultyMap = useMemo(
    () =>
      new Map(
        (difficulty.data?.error || difficulty.data?.success === false
          ? []
          : (difficulty.data?.data ?? [])
        ).map(item => [item.uuid, item.name])
      ),
    [difficulty.data]
  );
  const rows: ProgramCurriculumCourse[] = visible.map((course, index) => {
    const query = queries[ids.indexOf(course.uuid ?? '')];
    const failed =
      !course.uuid || query?.error || query?.data?.error || query?.data?.success === false;
    const content = failed ? undefined : query?.data?.data;
    return {
      uuid: course.uuid ?? `missing-${index}`,
      name: course.name,
      thumbnailUrl: course.thumbnail_url,
      difficulty: difficultyMap.get(course.difficulty_uuid ?? ''),
      access: resolveCourseAccess(content),
      order: currentPage * PAGE_SIZE + index,
      lessons: [...(content?.lessons ?? [])].sort(
        (a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0)
      ),
      loading: query?.isPending,
      error: failed,
      onRetry: query ? () => void query.refetch() : undefined,
    };
  });
  const selectedCourse = rows.find(row => row.uuid === selection?.courseUuid);
  const selectedLesson = selection ? selectedCourse?.lessons[selection.lessonIndex] : undefined;

  return (
    <div className='min-w-0 space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-sm font-semibold'>Course curriculum</h3>
        <p className='text-muted-foreground text-xs'>
          {courses.length} bundled {courses.length === 1 ? 'course' : 'courses'}
        </p>
      </div>
      <ProgramsCurriculumTab
        courses={rows}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onSelectLesson={(course, lessonIndex) =>
          setSelection({ courseUuid: course.uuid, lessonIndex })
        }
      />
      {pageCount > 1 && (
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-muted-foreground text-sm'>
            Courses {currentPage * PAGE_SIZE + 1}–
            {Math.min((currentPage + 1) * PAGE_SIZE, courses.length)} of {courses.length}
          </p>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              disabled={currentPage === 0}
              onClick={() => {
                setSelection(null);
                setPage(currentPage - 1);
              }}
            >
              Previous courses
            </Button>
            <Button
              variant='outline'
              disabled={currentPage + 1 >= pageCount}
              onClick={() => {
                setSelection(null);
                setPage(currentPage + 1);
              }}
            >
              Next courses
            </Button>
          </div>
        </div>
      )}
      {selectedCourse && selectedLesson && selection && (
        <ProgramLessonDetailSheet
          key={`${selectedCourse.uuid}:${selection.lessonIndex}`}
          course={selectedCourse}
          lesson={selectedLesson}
          lessonIndex={selection.lessonIndex}
          onClose={() => setSelection(null)}
          onReadItem={onReadItem}
        />
      )}
    </div>
  );
}
