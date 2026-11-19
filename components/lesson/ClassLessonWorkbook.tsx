'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Video } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { LessonShell } from '@/app/dashboard/instructor/classes/training/components/LessonShell';
import {
  LessonsListPanel,
  type LessonTabKey,
  PracticePanel,
  ResourcesPanel,
} from '@/app/dashboard/instructor/classes/training/components/LessonTabPanels';
import { WorkbookPage } from '@/app/dashboard/instructor/classes/training/components/WorkbookPage';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { dayjs, parseApiDate } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  endScheduledInstanceMutation,
  getAllContentTypesOptions,
  getClassDefinitionQueryKey,
  getClassScheduleQueryKey,
  getLessonContentOptions,
  getScheduledInstanceQueryKey,
  startScheduledInstanceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, ContentType, Course, Lesson } from '@/services/client/types.gen';
import { courseContentQueryOptions } from '@/src/features/course-record/course-content-query';
import { EvaluationPanel } from './EvaluationPanel';
import { SessionReportPanel } from './SessionReportPanel';
import { useWorkbookNavigation } from './useWorkbookNavigation';
import { useWorkbookSession } from './useWorkbookSession';
import {
  getWorkbookSessionAvailability,
  useWorkbookSessionAvailability,
} from './useWorkbookSessionAvailability';
import { WorkbookClassRegister } from './WorkbookClassRegister';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';
import { hasApiError, type WorkbookRole, type WorkbookNextCourse } from './workbook-data';
import { resolveWorkbookLessonContent } from './workbook-content';

export function ClassLessonWorkbook(props: {
  classId: string;
  classDefinition: ClassDefinition;
  course: Course;
  lessons: Lesson[];
  lesson?: Lesson;
  role: WorkbookRole;
  moreLessons?: ReactNode;
  lessonsList?: ReactNode;
  nextCourse?: WorkbookNextCourse;
}) {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => new Set());
  const { navigate } = useWorkbookNavigation();
  const lessonId = props.lesson?.uuid;
  if ((!props.lesson || !lessonId) && props.lessonsList) {
    return (
      <LessonShell
        classTitle={props.classDefinition.title}
        courseTitle='Programme'
        roleLabel={props.role === 'instructor' ? 'Instructor · Training' : 'Student · Learning'}
        homeHref={
          props.role === 'instructor'
            ? '/dashboard/instructor/training-hub?tab=classes'
            : '/dashboard/student/learning-hub'
        }
        tab='lesson'
        showList
        onTabChange={() => {}}
        onBrowseLessons={() => navigate({ view: 'lessons' })}
        pageIndex={0}
        pageCount={0}
        onPageChange={() => {}}
        contentReady={false}
        isCompleted={false}
        onComplete={() => {}}
      >
        {props.lessonsList}
      </LessonShell>
    );
  }
  if (!props.lesson || !lessonId)
    return (
      <div className='space-y-4 p-6'>
        <EmptyState
          title='No lessons available'
          description='Lessons will appear here when they are published.'
        />
        {props.moreLessons}
        <Button variant='outline' onClick={() => navigate({ view: 'lessons' })}>
          All lessons
        </Button>
      </div>
    );
  return (
    <SelectedLessonWorkbook
      key={lessonId}
      {...props}
      lesson={props.lesson}
      lessonId={lessonId}
      isCompleted={completedLessons.has(lessonId)}
      onComplete={() => setCompletedLessons(previous => new Set(previous).add(lessonId))}
    />
  );
}

function SelectedLessonWorkbook({
  classId,
  classDefinition,
  course,
  lessons,
  lesson,
  lessonId,
  role,
  moreLessons,
  lessonsList,
  nextCourse,
  isCompleted,
  onComplete,
}: {
  classId: string;
  classDefinition: ClassDefinition;
  course: Course;
  lessons: Lesson[];
  lesson: Lesson;
  lessonId: string;
  role: WorkbookRole;
  moreLessons?: ReactNode;
  lessonsList?: ReactNode;
  nextCourse?: WorkbookNextCourse;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  const { searchParams, navigate } = useWorkbookNavigation();
  const sessionState = useWorkbookSession(
    classId,
    searchParams.get('schedule'),
    role === 'instructor'
  );
  const queryClient = useQueryClient();
  const availability = useWorkbookSessionAvailability(sessionState.session);
  const startClass = useMutation({
    ...startScheduledInstanceMutation(),
    onSuccess: async (response, variables) => {
      if (hasApiError(response)) {
        toast.error(response.message || 'Unable to start class.');
        return;
      }
      toast.success('Class started.');
      await Promise.all([
        queryClient.invalidateQueries({
          // An empty pageable still prefix-matches every page size the workbook loaded.
          queryKey: getClassScheduleQueryKey({ path: { uuid: classId }, query: { pageable: {} } }),
        }),
        queryClient.invalidateQueries({
          queryKey: getScheduledInstanceQueryKey({ path: variables.path }),
        }),
      ]);
    },
    onError: () => toast.error('Unable to start class. Please try again.'),
  });
  const classStarted =
    availability.started ||
    (startClass.isSuccess &&
      !hasApiError(startClass.data) &&
      startClass.variables.path.instanceUuid === sessionState.session?.uuid);
  const endClass = useMutation({
    ...endScheduledInstanceMutation(),
    onSuccess: async (response, variables) => {
      if (hasApiError(response)) {
        toast.error(response.message || 'Unable to end class.');
        return;
      }
      toast.success('Class completed.');
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getClassDefinitionQueryKey({ path: { uuid: classId } }),
        }),
        queryClient.invalidateQueries({
          // An empty pageable still prefix-matches every page size the workbook loaded.
          queryKey: getClassScheduleQueryKey({ path: { uuid: classId }, query: { pageable: {} } }),
        }),
        queryClient.invalidateQueries({
          queryKey: getScheduledInstanceQueryKey({ path: variables.path }),
        }),
      ]);
    },
    onError: () => toast.error('Unable to end class. Please try again.'),
  });
  const classCompleted = Boolean(
    sessionState.session?.concluded_at ||
    sessionState.session?.status === 'COMPLETED' ||
    (endClass.isSuccess &&
      !hasApiError(endClass.data) &&
      endClass.variables.path.instanceUuid === sessionState.session?.uuid)
  );
  const classActive = classStarted && !availability.closed && !classCompleted;
  const requestedTab = searchParams.get('tab');
  const tab: LessonTabKey =
    requestedTab === 'assessment' || requestedTab === 'evaluation'
      ? 'quiz'
      : requestedTab === 'summary'
        ? isCompleted
          ? 'summary'
          : 'grading'
        : requestedTab === 'practice' ||
          requestedTab === 'quiz' ||
          requestedTab === 'assignment' ||
          requestedTab === 'grading' ||
          requestedTab === 'resources' ||
          (requestedTab === 'report' && role === 'instructor')
          ? requestedTab
          : 'lesson';
  const showList = searchParams.get('view') === 'lessons';
  // This endpoint resolves instructor/student access on the server and includes
  // lesson bodies for enrolled learners, unlike the authoring lesson endpoint.
  const courseContentQuery = useQuery({
    ...courseContentQueryOptions(course.uuid ?? ''),
    enabled: Boolean(course.uuid),
    staleTime: STALE_TIMES.entity,
  });
  const hasCourseContent =
    !hasApiError(courseContentQuery.data ?? undefined) &&
    courseContentQuery.data?.data?.full_access === true;
  // Some assigned instructors have lesson-level access only. Keep that
  // server-authorised path as a fallback, without fetching every lesson.
  const contentQuery = useQuery({
    ...getLessonContentOptions({ path: { courseUuid: course.uuid ?? '', lessonUuid: lessonId } }),
    enabled:
      Boolean(course.uuid && lessonId) &&
      (courseContentQuery.isSuccess || courseContentQuery.isError) &&
      !hasCourseContent,
    staleTime: STALE_TIMES.entity,
  });
  const typesQuery = useQuery({
    ...getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    staleTime: STALE_TIMES.reference,
  });
  const { contents, lessonFound } = useMemo(
    () =>
      resolveWorkbookLessonContent(courseContentQuery.data, contentQuery.data, lessonId),
    [courseContentQuery.data, contentQuery.data, lessonId]
  );
  const contentTypes = useMemo(
    () =>
      Object.fromEntries(
        (hasApiError(typesQuery.data) ? [] : (typesQuery.data?.data?.content ?? []))
          .filter((type): type is ContentType & { uuid: string } => Boolean(type.uuid))
          .map(type => [type.uuid, type])
      ),
    [typesQuery.data]
  );
  const requestedContentId = searchParams.get('content');
  const foundIndex = contents.findIndex(content => content.uuid === requestedContentId);
  const pageIndex = Math.max(0, foundIndex);
  const selectedContent = contents[pageIndex];
  const homeHref =
    role === 'instructor'
      ? '/dashboard/instructor/training-hub?tab=classes'
      : '/dashboard/student/learning-hub';
  const selectLesson = (id: string) =>
    navigate({ course: course.uuid ?? null, lesson: id, content: null, view: null, tab: 'lesson' });
  const nextLesson = lessons[lessons.findIndex(item => item.uuid === lessonId) + 1];
  const contentError =
    (hasCourseContent
      ? !lessonFound
      : contentQuery.isError || hasApiError(contentQuery.data)) ||
    typesQuery.isError ||
    hasApiError(typesQuery.data);
  const contentLoading =
    courseContentQuery.isLoading || (!hasCourseContent && contentQuery.isLoading);
  const contentSuccess = hasCourseContent || contentQuery.isSuccess;
  const resources = (
    <ResourcesPanel
      materials={contents}
      onOpen={id => navigate({ content: id, tab: 'lesson', view: null })}
    />
  );

  const progressPercentage = classDefinition.class_progress_percentage ?? 0;

  const lessonOutline = showList ? (lessonsList ?? (
      <LessonsListPanel
        lessons={lessons}
        currentLesson={lessonId}
        onSelect={selectLesson}
        moreLessons={moreLessons}
      />
    )) : undefined;
  let body: ReactNode;
  if (tab === 'practice')
    body = <PracticePanel courseId={course.uuid ?? ''} lessonId={lessonId} role={role} />;
  else if (tab === 'quiz' || tab === 'assignment' || tab === 'grading')
    body = (
      <EvaluationPanel
        key={tab}
        classId={classId}
        courseId={course.uuid ?? ''}
        lessonId={lessonId}
        role={role}
        section={tab}
        activeSession={sessionState.session}
      />
    );
  else if (tab === 'report')
    body = (
      <SessionReportPanel
        session={sessionState.session}
        onFix={target => navigate(target === 'grading' ? { tab: 'grading' } : { tab: 'lesson', register: '1' })}
      />
    );
  else if (tab === 'summary')
    body = (
      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Lesson summary</h2>
        {lesson.description && <RichTextRenderer htmlString={lesson.description} />}
        {lesson.learning_objectives && (
          <section className='space-y-3'>
            <h3 className='font-semibold'>Learning objectives</h3>
            <RichTextRenderer htmlString={lesson.learning_objectives} />
          </section>
        )}
        {!lesson.description && !lesson.learning_objectives && (
          <EmptyState title='No summary provided' />
        )}
      </div>
    );
  else if (contentLoading || typesQuery.isLoading) body = <WorkbookLoading />;
  else if (contentError)
    body = (
      <WorkbookError
        title='Unable to load lesson content'
        retry={() => {
          void courseContentQuery.refetch();
          void contentQuery.refetch();
          void typesQuery.refetch();
        }}
      />
    );
  else if (tab === 'resources') body = resources;
  else if (requestedContentId && foundIndex < 0)
    body = (
      <EmptyState
        title='Content unavailable'
        description='This content is not part of the selected lesson.'
        action={<Button onClick={() => navigate({ content: null })}>View lesson content</Button>}
      />
    );
  else if (!selectedContent)
    body = (
      <EmptyState
        title='No content in this lesson yet'
        description='Practice activities and evaluation are available from the tabs above.'
      />
    );
  else
    body = (
      <div className='min-w-0 space-y-6'>
        {/* <Select value={selectedContent.uuid} onValueChange={id => navigate({ content: id })}>
          <SelectTrigger aria-label='Lesson content' className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contents.map(content =>
              content.uuid ? (
                <SelectItem key={content.uuid} value={content.uuid}>
                  {content.title}
                </SelectItem>
              ) : null
            )}
          </SelectContent>
        </Select> */}
        <WorkbookPage
          key={selectedContent.uuid}
          content={selectedContent}
          contentTypes={contentTypes}
        />
      </div>
    );
  return (
    <LessonShell
      showReportTab={role === 'instructor'}
      attendanceRail={
        role === 'instructor' ? (
          <>
            <div className='space-y-2 border-b p-4'>
              <Label htmlFor='workbook-session'>Class session</Label>
              <Select
                value={sessionState.session?.uuid ?? ''}
                onValueChange={schedule => navigate({ schedule, enrollment: null })}
              >
                <SelectTrigger id='workbook-session'>
                  <SelectValue placeholder='Select a session' />
                </SelectTrigger>
                <SelectContent>
                  {sessionState.sessions.map(session => (
                    <SelectItem key={session.uuid} value={session.uuid!}>
                      {dayjs(session.start_time)
                        .tz(session.timezone)
                        .format('MMM D, YYYY · h:mm A')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sessionState.query.hasNextPage && (
                <Button
                  variant='outline'
                  size='sm'
                  disabled={sessionState.query.isFetchingNextPage}
                  onClick={() => void sessionState.query.fetchNextPage()}
                >
                  Load more sessions
                </Button>
              )}
            </div>
            {sessionState.isLoading ? (
              <WorkbookLoading />
            ) : sessionState.isError ? (
              <WorkbookError title='Unable to load class sessions' retry={sessionState.retry} />
            ) : (
              <WorkbookClassRegister
                classId={classId}
                session={sessionState.session}
                onEvaluate={enrollmentId =>
                  navigate({ tab: 'grading', view: null, enrollment: enrollmentId })
                }
              />
            )}
          </>
        ) : undefined
      }
      classTitle={classDefinition.title}
      courseTitle={course.name}
      lessonTitle={lesson.title}
      lessonNumber={lesson.lesson_number}
      roleLabel={role === 'instructor' ? 'Instructor · Training' : 'Student · Learning'}
      homeHref={homeHref}
      tab={tab}
      isCompleted={isCompleted}
      onComplete={() => {
        onComplete();
        navigate({ tab: 'summary', view: null });
      }}
      onTabChange={value => navigate({ tab: value, view: null })}
      showList={showList}
      lessonOutline={lessonOutline}
      onBrowseLessons={() => navigate({ view: showList ? null : 'lessons' })}
      pageIndex={pageIndex}
      pageCount={contentError || (requestedContentId && foundIndex < 0) ? 0 : contents.length}
      contentReady={
        contentSuccess &&
        typesQuery.isSuccess &&
        !contentError &&
        (!requestedContentId || foundIndex >= 0)
      }
      onPageChange={index => navigate({ content: contents[index]?.uuid ?? null })}
      onNextLesson={nextLesson?.uuid ? () => selectLesson(nextLesson.uuid!) : undefined}
      nextCourseAction={
        nextCourse?.uuid &&
        !nextLesson &&
        !moreLessons &&
        (isCompleted ||
          (tab === 'lesson' &&
            !contentLoading &&
            !contentError &&
            (!requestedContentId || foundIndex >= 0) &&
            contents.length > 0 &&
            pageIndex === contents.length - 1))
          ? {
              title: nextCourse.name,
              onStart: () =>
                navigate({
                  course: nextCourse.uuid,
                  lesson: nextCourse.lessonUuid ?? null,
                  content: null,
                  enrollment: null,
                  tab: 'lesson',
                  view: null,
                }),
            }
          : undefined
      }
      actions={
        <div className='flex flex-wrap items-center gap-3'>

          {/* Visible to all roles */}
          <div className='flex items-center gap-2'>
            <div
              className='relative h-10 w-10'
              title={`${progressPercentage}% completed`}
            >
              <svg
                className='h-10 w-10 -rotate-90'
                viewBox='0 0 36 36'
              >
                <circle
                  cx='18'
                  cy='18'
                  r='15.5'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='3'
                  className='text-muted'
                />

                <circle
                  cx='18'
                  cy='18'
                  r='15.5'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='3'
                  strokeLinecap='round'
                  pathLength={100}
                  className='text-primary'
                  strokeDasharray={`${progressPercentage} 100`}
                />
              </svg>

              <span className='absolute inset-0 flex items-center justify-center text-[10px] font-semibold'>
                {progressPercentage}%
              </span>
            </div>
          </div>

          {/* Instructor-only action */}
          {role === 'instructor' && classActive && sessionState.session && (
            <>
              <ClassEndCountdown endTime={sessionState.session.end_time} />
              <Button
                variant='destructive'
                disabled={endClass.isPending || startClass.isPending}
                onClick={() => {
                  const session = sessionState.session;
                  if (
                    !session?.uuid ||
                    !classActive ||
                    endClass.isPending ||
                    startClass.isPending
                  ) {
                    return;
                  }
                  endClass.mutate({ path: { instanceUuid: session.uuid } });
                }}
              >
                {endClass.isPending && <Spinner />}
                {endClass.isPending ? 'Ending class…' : 'End class'}
              </Button>
            </>
          )}
          {role === 'instructor' && classCompleted && (
            <span className='text-success text-sm font-medium' role='status'>
              Class completed
            </span>
          )}
          {role === 'instructor' && !classActive && !classCompleted && (
            <Button
              variant='outline'
              disabled={
                !availability.canStart ||
                classStarted ||
                startClass.isPending ||
                sessionState.isLoading ||
                Boolean(sessionState.isError)
              }
              title='Available from 15 minutes before the session starts until it ends.'
              onClick={() => {
                const session = sessionState.session;

                if (
                  !session?.uuid ||
                  startClass.isPending ||
                  classStarted ||
                  !getWorkbookSessionAvailability(session).canStart
                ) {
                  return;
                }

                startClass.mutate({
                  path: { instanceUuid: session.uuid },
                });
              }}
            >
              {startClass.isPending ? (
                <Spinner />
              ) : (
                <Video className='h-4 w-4' />
              )}

              {startClass.isPending
                ? 'Starting class…'
                : classStarted
                  ? 'Class started'
                  : 'Start Class'}
            </Button>
          )}

        </div>
      }
    >
      {body}
    </LessonShell>
  );
}

function ClassEndCountdown({ endTime }: { endTime: Date }) {
  const end = parseApiDate(endTime)?.valueOf();
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (end === undefined) return;
    const refresh = () => setNow(Date.now());
    refresh();
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [end]);

  if (end === undefined) return null;
  const secondsRemaining = Math.max(0, Math.ceil((end - now) / 1000));
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const countdown = [hours, minutes, seconds]
    .map(value => String(value).padStart(2, '0'))
    .join(':');

  return (
    <div className='text-muted-foreground flex items-center gap-2 text-sm'>
      <Clock className='h-4 w-4' aria-hidden='true' />
      <span
        role='timer'
        aria-label='Time remaining until scheduled class end'
        className='tabular-nums'
      >
        {countdown}
      </span>
      <span>{secondsRemaining === 0 ? 'Scheduled time ended' : 'remaining'}</span>
    </div>
  );
}
