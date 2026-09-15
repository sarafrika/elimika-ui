'use client';

import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getCourseLessonsInfiniteOptions,
  getCourseLessonOptions,
  getProgramCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course, Lesson } from '@/services/client/types.gen';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STALE_TIMES } from '@/lib/query-client';
import { WorkbookLoading } from './WorkbookLoading';
import {
  hasApiError,
  nextWorkbookPage,
  WORKBOOK_PAGE_SIZE,
  type WorkbookRole,
} from './workbook-data';
import { WorkbookError } from './WorkbookError';
import { useWorkbookNavigation } from './useWorkbookNavigation';
import { ClassLessonWorkbook } from './ClassLessonWorkbook';

export function ClassWorkbookRoute({
  role,
  classId: pathClassId,
}: {
  role: WorkbookRole;
  classId?: string;
}) {
  const searchParams = useSearchParams();
  const classId =
    pathClassId ||
    searchParams.get('classId') ||
    searchParams.get('class') ||
    searchParams.get('id');
  if (!classId) {
    return (
      <EmptyState
        title='Choose a class'
        description='Open a class from your hub to view its lessons.'
        action={
          <Button asChild>
            <Link
              href={
                role === 'instructor'
                  ? '/dashboard/instructor/training-hub'
                  : '/dashboard/student/learning-hub'
              }
            >
              Back to classes
            </Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className='bg-background text-foreground fixed inset-0 z-50 overflow-y-auto'>
      <ClassWorkspace key={classId} classId={classId} role={role} />
    </div>
  );
}

function ClassWorkspace({ classId, role }: { classId: string; role: WorkbookRole }) {
  const query = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classId } }),
    enabled: Boolean(classId),
    staleTime: STALE_TIMES.entity,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return <WorkbookError retry={() => void query.refetch()} />;
  const classDefinition = query.data?.data?.class_definition;
  if (!classDefinition) return <EmptyState title='Class not found' />;
  const props = { classId, classDefinition, role };
  if (classDefinition.program_uuid)
    return <ProgramWorkspace {...props} programId={classDefinition.program_uuid} />;
  if (classDefinition.course_uuid)
    return <CourseWorkspace {...props} courseId={classDefinition.course_uuid} />;
  return (
    <EmptyState
      title='No course linked to this class'
      description='Lessons will appear when a course or training programme is linked.'
    />
  );
}

type WorkspaceProps = { classId: string; classDefinition: ClassDefinition; role: WorkbookRole };

function ProgramWorkspace({ programId, ...props }: WorkspaceProps & { programId: string }) {
  const { searchParams, navigate } = useWorkbookNavigation();
  const query = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programId } }),
    enabled: Boolean(programId),
    staleTime: STALE_TIMES.entity,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return <WorkbookError retry={() => void query.refetch()} />;
  const courses = query.data?.data?.filter(course => Boolean(course.uuid)) ?? [];
  const course = courses.find(item => item.uuid === searchParams.get('course')) ?? courses[0];
  if (!course?.uuid) return <EmptyState title='No courses in this programme' />;
  return (
    <div>
      <div className='bg-background border-b p-4'>
        <Select
          value={course.uuid}
          onValueChange={id =>
            navigate({ course: id, lesson: null, content: null, tab: 'lesson', view: null })
          }
        >
          <SelectTrigger className='w-full sm:w-96' aria-label='Programme course'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {courses.map(item =>
              item.uuid ? (
                <SelectItem key={item.uuid} value={item.uuid}>
                  {item.name}
                </SelectItem>
              ) : null
            )}
          </SelectContent>
        </Select>
      </div>
      <CourseWorkspace key={course.uuid} {...props} courseId={course.uuid} />
    </div>
  );
}

function CourseWorkspace({ courseId, ...props }: WorkspaceProps & { courseId: string }) {
  const { searchParams } = useWorkbookNavigation();
  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId } }),
    enabled: Boolean(courseId),
    staleTime: STALE_TIMES.entity,
  });
  const lessonsQuery = useInfiniteQuery({
    ...getCourseLessonsInfiniteOptions({
      path: { courseUuid: courseId },
      query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(courseId),
    staleTime: STALE_TIMES.entity,
  });
  const lessons = useMemo(
    () =>
      (
        lessonsQuery.data?.pages.flatMap(page =>
          hasApiError(page) ? [] : (page.data?.content ?? [])
        ) ?? []
      )
        .filter(
          lesson =>
            Boolean(lesson.uuid) &&
            (props.role === 'instructor' ||
              (lesson.active !== false && lesson.status?.toUpperCase() === 'PUBLISHED'))
        )
        .sort((a, b) => a.lesson_number - b.lesson_number),
    [lessonsQuery.data, props.role]
  );
  if (courseQuery.isLoading || lessonsQuery.isLoading) return <WorkbookLoading />;
  if (
    courseQuery.isError ||
    lessonsQuery.isError ||
    hasApiError(courseQuery.data) ||
    lessonsQuery.data?.pages.some(hasApiError)
  ) {
    return (
      <WorkbookError
        retry={() => {
          void courseQuery.refetch();
          void lessonsQuery.refetch();
        }}
      />
    );
  }
  const course = courseQuery.data?.data;
  if (!course) return <EmptyState title='Course not found' />;
  const requestedLessonId = searchParams.get('lesson');
  const requestedLesson = lessons.find(lesson => lesson.uuid === requestedLessonId);
  const moreLessons = lessonsQuery.hasNextPage ? (
    <Button
      variant='outline'
      disabled={lessonsQuery.isFetchingNextPage}
      onClick={() => void lessonsQuery.fetchNextPage()}
    >
      Load more lessons
    </Button>
  ) : null;
  const workbookProps = { ...props, course, lessons, moreLessons };
  if (requestedLessonId && !requestedLesson)
    return (
      <RequestedLessonWorkspace
        key={requestedLessonId}
        {...workbookProps}
        courseId={courseId}
        lessonId={requestedLessonId}
      />
    );
  return <ClassLessonWorkbook {...workbookProps} lesson={requestedLesson ?? lessons[0]} />;
}

function RequestedLessonWorkspace({
  courseId,
  lessonId,
  ...props
}: WorkspaceProps & {
  courseId: string;
  lessonId: string;
  course: Course;
  lessons: Lesson[];
  moreLessons: React.ReactNode;
}) {
  const query = useQuery({
    ...getCourseLessonOptions({ path: { courseUuid: courseId, lessonUuid: lessonId } }),
    enabled: Boolean(courseId && lessonId),
    staleTime: STALE_TIMES.entity,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError)
    return <WorkbookError title='Unable to load this lesson' retry={() => void query.refetch()} />;
  const lesson = query.data;
  if (
    !lesson ||
    lesson.course_uuid !== courseId ||
    (props.role === 'student' &&
      (lesson.active === false || lesson.status?.toUpperCase() !== 'PUBLISHED'))
  )
    return <EmptyState title='Lesson unavailable' />;
  return (
    <ClassLessonWorkbook
      {...props}
      lessons={[...props.lessons, lesson].sort((a, b) => a.lesson_number - b.lesson_number)}
      lesson={lesson}
    />
  );
}
