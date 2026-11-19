'use client';

import { Button } from '@/components/ui/button';
import { ProgramLessonsPanel } from './ProgramLessonsPanel';
import { useProgramWorkbookLessons } from './useProgramWorkbookLessons';
import { EmptyState } from '@/components/ui/empty-state';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getCourseLessonOptions,
  getCourseLessonsInfiniteOptions,
  getProgramCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course, Lesson } from '@/services/client/types.gen';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { ClassLessonWorkbook } from './ClassLessonWorkbook';
import { useSessionLesson } from './useSessionLesson';
import { useWorkbookNavigation } from './useWorkbookNavigation';
import {
  hasApiError,
  nextWorkbookPage,
  WORKBOOK_PAGE_SIZE,
  type WorkbookRole,
  type WorkbookNextCourse,
} from './workbook-data';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';

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
                  ? '/dashboard/instructor/training-hub?tab=classes'
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
  const query = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programId } }),
    enabled: Boolean(programId),
    staleTime: STALE_TIMES.entity,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return <WorkbookError retry={() => void query.refetch()} />;
  const courses =
    query.data?.data?.filter((course): course is Course & { uuid: string } =>
      Boolean(course.uuid)
    ) ?? [];
  if (!courses.length) return <EmptyState title='No courses in this programme' />;
  return <LoadedProgramWorkspace {...props} courses={courses} />;
}

function LoadedProgramWorkspace({
  courses,
  ...props
}: WorkspaceProps & {
  courses: (Course & { uuid: string })[];
}) {
  const { searchParams, navigate } = useWorkbookNavigation();
  const curriculum = useProgramWorkbookLessons(courses, props.role);
  if (curriculum.isLoading) return <WorkbookLoading />;
  if (curriculum.isError) return <WorkbookError retry={curriculum.retry} />;
  const requestedLesson = searchParams.get('lesson');
  const course =
    courses.find(item => item.uuid === searchParams.get('course')) ??
    courses.find(item =>
      curriculum.lessonsByCourse.get(item.uuid)?.some(lesson => lesson.uuid === requestedLesson)
    ) ??
    courses[0];
  if (!course) return <EmptyState title='No courses in this programme' />;
  const nextCourse = courses[courses.indexOf(course) + 1];

  return (
    <CourseWorkspace
      key={course.uuid}
      {...props}
      courseId={course.uuid}
      programCourse={course}
      programLessons={curriculum.lessonsByCourse.get(course.uuid) ?? []}
      lessonsList={
        <ProgramLessonsPanel
          courses={courses}
          lessonsByCourse={curriculum.lessonsByCourse}
          onSelect={(courseId, lessonId) =>
            navigate({
              course: courseId,
              lesson: lessonId,
              content: null,
              enrollment: null,
              tab: 'lesson',
              view: null,
            })
          }
        />
      }
      nextCourse={
        nextCourse
          ? {
              uuid: nextCourse.uuid,
              name: nextCourse.name,
              lessonUuid: curriculum.lessonsByCourse.get(nextCourse.uuid)?.[0]?.uuid,
            }
          : undefined
      }
    />
  );
}

function CourseWorkspace({
  courseId,
  programCourse,
  programLessons,
  lessonsList,
  nextCourse,
  ...props
}: WorkspaceProps & {
  courseId: string;
  programCourse?: Course;
  programLessons?: Lesson[];
  lessonsList?: ReactNode;
  nextCourse?: WorkbookNextCourse;
}) {
  const { searchParams } = useWorkbookNavigation();
  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId } }),
    enabled: Boolean(courseId) && !programCourse,
    staleTime: STALE_TIMES.entity,
  });
  const lessonsQuery = useInfiniteQuery({
    ...getCourseLessonsInfiniteOptions({
      path: { courseUuid: courseId },
      query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(courseId) && !programLessons,
    staleTime: STALE_TIMES.entity,
  });
  const lessons = useMemo(
    () =>
      (
        programLessons ??
        lessonsQuery.data?.pages.flatMap(page =>
          hasApiError(page) ? [] : (page.data?.content ?? [])
        ) ??
        []
      )
        .filter(
          lesson =>
            Boolean(lesson.uuid) &&
            (props.role === 'instructor' ||
              (lesson.active !== false && lesson.status?.toUpperCase() === 'PUBLISHED'))
        )
        .sort((a, b) => a.lesson_number - b.lesson_number),
    [lessonsQuery.data, programLessons, props.role]
  );
  // A link to a session without a lesson opens the lesson that session teaches.
  const sessionLesson = useSessionLesson(
    props.classId,
    searchParams.get('lesson') ? null : searchParams.get('schedule'),
    lessons
  );
  if ((!programCourse && courseQuery.isLoading) || (!programLessons && lessonsQuery.isLoading))
    return <WorkbookLoading />;
  if (
    (!programCourse && (courseQuery.isError || hasApiError(courseQuery.data))) ||
    (!programLessons && (lessonsQuery.isError || lessonsQuery.data?.pages.some(hasApiError)))
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
  const course = programCourse ?? courseQuery.data?.data;
  if (!course) return <EmptyState title='Course not found' />;
  const requestedLessonId = searchParams.get('lesson');
  const requestedLesson = lessons.find(lesson => lesson.uuid === requestedLessonId);
  const moreLessons =
    !programLessons && lessonsQuery.hasNextPage ? (
      <Button
        variant='outline'
        disabled={lessonsQuery.isFetchingNextPage}
        onClick={() => void lessonsQuery.fetchNextPage()}
      >
        Load more lessons
      </Button>
    ) : null;
  const workbookProps = {
    ...props,
    course: { ...course, uuid: courseId },
    lessons,
    moreLessons,
    lessonsList,
    nextCourse,
  };
  if (requestedLessonId && !requestedLesson)
    return (
      <RequestedLessonWorkspace
        key={requestedLessonId}
        {...workbookProps}
        courseId={courseId}
        lessonId={requestedLessonId}
      />
    );
  return (
    <ClassLessonWorkbook
      {...workbookProps}
      lesson={requestedLesson ?? sessionLesson ?? lessons[0]}
    />
  );
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
  lessonsList?: ReactNode;
  nextCourse?: WorkbookNextCourse;
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
