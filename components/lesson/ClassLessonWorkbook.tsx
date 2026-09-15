'use client';

import { LessonShell } from '@/app/dashboard/instructor/classes/training/components/LessonShell';
import {
  LessonsListPanel,
  PracticePanel,
  ResourcesPanel,
  type LessonTabKey,
} from '@/app/dashboard/instructor/classes/training/components/LessonTabPanels';
import { WorkbookPage } from '@/app/dashboard/instructor/classes/training/components/WorkbookPage';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import Spinner from '@/components/ui/spinner';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAllContentTypesOptions,
  getClassScheduleQueryKey,
  getLessonContentOptions,
  getScheduledInstanceQueryKey,
  startScheduledInstanceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, ContentType, Course, Lesson } from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Video } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { dayjs } from '@/lib/date';
import { useWorkbookSession } from './useWorkbookSession';
import {
  getWorkbookSessionAvailability,
  useWorkbookSessionAvailability,
} from './useWorkbookSessionAvailability';
import { WorkbookClassRegister } from './WorkbookClassRegister';
import { EvaluationPanel } from './EvaluationPanel';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';
import { useWorkbookNavigation } from './useWorkbookNavigation';
import { hasApiError, type WorkbookRole } from './workbook-data';

export function ClassLessonWorkbook(props: {
  classId: string;
  classDefinition: ClassDefinition;
  course: Course;
  lessons: Lesson[];
  lesson?: Lesson;
  role: WorkbookRole;
  moreLessons?: ReactNode;
}) {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => new Set());
  const lessonId = props.lesson?.uuid;
  if (!props.lesson || !lessonId)
    return (
      <div className='space-y-4 p-6'>
        <EmptyState
          title='No lessons available'
          description='Lessons will appear here when they are published.'
        />
        {props.moreLessons}
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
  isCompleted: boolean;
  onComplete: () => void;
}) {
  const { searchParams, navigate } = useWorkbookNavigation();
  const router = useRouter();
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
          queryKey: getClassScheduleQueryKey({ path: { uuid: classId } }),
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
            requestedTab === 'resources'
          ? requestedTab
          : 'lesson';
  const showList = searchParams.get('view') === 'lessons';
  const contentQuery = useQuery({
    ...getLessonContentOptions({ path: { courseUuid: lesson.course_uuid, lessonUuid: lessonId } }),
    enabled: Boolean(lesson.course_uuid && lessonId),
    staleTime: STALE_TIMES.entity,
  });
  const typesQuery = useQuery({
    ...getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    staleTime: STALE_TIMES.reference,
  });
  const contents = useMemo(
    () =>
      hasApiError(contentQuery.data)
        ? []
        : [...(contentQuery.data?.data ?? [])].sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          ),
    [contentQuery.data]
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
      ? '/dashboard/instructor/training-hub'
      : '/dashboard/student/learning-hub';
  const legacyPath =
    role === 'instructor'
      ? `/dashboard/instructor/classes/class-training/${classId}`
      : `/dashboard/student/learning-hub/classes/${classId}`;
  const contextParams = new URLSearchParams(searchParams.toString());
  contextParams.set('course', lesson.course_uuid);
  contextParams.set('lesson', lessonId);
  contextParams.delete('view');
  contextParams.delete('tab');
  const managementHref = `${legacyPath}?${contextParams.toString()}`;
  const selectLesson = (id: string) =>
    navigate({ lesson: id, content: null, view: null, tab: 'lesson' });
  const nextLesson = lessons[lessons.findIndex(item => item.uuid === lessonId) + 1];
  const contentError =
    contentQuery.isError ||
    typesQuery.isError ||
    hasApiError(contentQuery.data) ||
    hasApiError(typesQuery.data);
  const resources = (
    <ResourcesPanel
      materials={contents}
      onOpen={id => navigate({ content: id, tab: 'lesson', view: null })}
    />
  );
  let body: ReactNode;
  if (showList)
    body = (
      <LessonsListPanel
        lessons={lessons}
        currentLesson={lessonId}
        onSelect={selectLesson}
        moreLessons={moreLessons}
      />
    );
  else if (tab === 'practice')
    body = <PracticePanel courseId={lesson.course_uuid} lessonId={lessonId} role={role} />;
  else if (tab === 'quiz' || tab === 'assignment' || tab === 'grading')
    body = (
      <EvaluationPanel
        key={tab}
        classId={classId}
        courseId={lesson.course_uuid}
        lessonId={lessonId}
        role={role}
        managementHref={managementHref}
        section={tab}
        activeSession={sessionState.session}
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
  else if (contentQuery.isLoading || typesQuery.isLoading) body = <WorkbookLoading />;
  else if (contentError)
    body = (
      <WorkbookError
        title='Unable to load lesson content'
        retry={() => {
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
      attendanceRail={
        role === 'instructor' ? (
          <>
            <div className='space-y-2 border-b p-4'>
              <Label htmlFor='workbook-session'>Class session</Label>
              <Select
                value={sessionState.session?.uuid ?? ''}
                onValueChange={schedule => navigate({ schedule })}
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
                onEvaluate={enrollmentId => {
                  const params = new URLSearchParams(contextParams);
                  params.set('enrollment', enrollmentId);
                  if (sessionState.session?.uuid) params.set('schedule', sessionState.session.uuid);
                  router.push(`${legacyPath}?${params.toString()}`);
                }}
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
      onBrowseLessons={() => navigate({ view: 'lessons' })}
      pageIndex={pageIndex}
      pageCount={contentError || (requestedContentId && foundIndex < 0) ? 0 : contents.length}
      contentReady={
        contentQuery.isSuccess &&
        typesQuery.isSuccess &&
        !contentError &&
        (!requestedContentId || foundIndex >= 0)
      }
      onPageChange={index => navigate({ content: contents[index]?.uuid ?? null })}
      onNextLesson={nextLesson?.uuid ? () => selectLesson(nextLesson.uuid!) : undefined}
      actions={
        role === 'instructor' && (
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
              )
                return;
              startClass.mutate({ path: { instanceUuid: session.uuid } });
            }}
          >
            {startClass.isPending ? <Spinner /> : <Video className='h-4 w-4' />}
            {startClass.isPending
              ? 'Starting class…'
              : classStarted
                ? 'Class started'
                : 'Start Class'}
          </Button>
        )
      }
    >
      {body}
    </LessonShell>
  );
}
