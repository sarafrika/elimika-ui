'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAssignmentsByIds, useQuizzesByIds } from '@/hooks/use-batched-lookups';
import { dayjs } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAssignmentAttachmentsOptions,
  getAssignmentSchedulesOptions,
  getQuizSchedulesOptions,
  getRubricMatrixOptions,
  searchAssignmentsInfiniteOptions,
  searchQuizzesInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  Quiz,
  ScheduledInstance,
} from '@/services/client/types.gen';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { belongsToSession, gradingDeadline } from './assessment-scheduling';
import type { AssessmentToSchedule } from './ScheduleAssessmentDialog';
import {
  hasApiError,
  nextWorkbookPage,
  WORKBOOK_PAGE_SIZE,
  type WorkbookRole,
} from './workbook-data';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';

const ScheduleAssessmentDialog = dynamic(
  () => import('./ScheduleAssessmentDialog').then(module => module.ScheduleAssessmentDialog),
  { loading: () => <WorkbookLoading /> }
);

const LessonGradingPanel = dynamic(
  () => import('./LessonGradingPanel').then(module => module.LessonGradingPanel),
  { loading: () => <WorkbookLoading /> }
);

const AssignmentPreview = dynamic(
  () =>
    import('@/components/content-preview/AssignmentContentPreview').then(
      module => module.AssignmentContentPreview
    ),
  { loading: () => <WorkbookLoading /> }
);
const QuizQuestions = dynamic(
  () => import('./QuizQuestions').then(module => module.QuizQuestions),
  { loading: () => <WorkbookLoading /> }
);
const RubricSummaryPreview = dynamic(
  () =>
    import(
      '@/app/dashboard/instructor/classes/class-training/[id]/_components/RubricGradingMatrix'
    ).then(module => module.RubricSummaryPreview),
  { loading: () => <WorkbookLoading /> }
);

function formatDeadline(value?: Date) {
  return value && dayjs(value).isValid()
    ? dayjs(value).format('MMM D, YYYY · h:mm A')
    : 'No deadline';
}

function formatSubmissionTypes(value: unknown) {
  // The API can return an array even though the generated schema declares a scalar.
  return (Array.isArray(value) ? value : [value])
    .filter((type): type is string => typeof type === 'string')
    .map(type => type.replaceAll('_', ' '))
    .filter(Boolean)
    .join(', ');
}

export function EvaluationPanel({
  classId,
  courseId,
  lessonId,
  role,
  managementHref,
  section = 'evaluation',
  activeSession,
}: {
  classId: string;
  courseId: string;
  lessonId: string;
  role: WorkbookRole;
  managementHref: string;
  section?: 'evaluation' | 'quiz' | 'assignment' | 'grading';
  activeSession?: ScheduledInstance;
}) {
  const [taskToSchedule, setTaskToSchedule] = useState<AssessmentToSchedule | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const showAssignments = section !== 'quiz';
  const showQuizzes = section !== 'assignment';
  const isGrading = section === 'grading';
  const instructorGrading = isGrading && role === 'instructor';
  const title =
    section === 'quiz'
      ? 'Quiz'
      : section === 'assignment'
        ? 'Assignment'
        : isGrading
          ? 'Grading'
          : 'Evaluation';
  const assignmentSchedules = useQuery({
    ...getAssignmentSchedulesOptions({ path: { classUuid: classId } }),
    enabled: Boolean(classId) && showAssignments,
    staleTime: STALE_TIMES.live,
  });
  const quizSchedules = useQuery({
    ...getQuizSchedulesOptions({ path: { classUuid: classId } }),
    enabled: Boolean(classId) && showQuizzes,
    staleTime: STALE_TIMES.live,
  });
  const assignments = useInfiniteQuery({
    ...searchAssignmentsInfiniteOptions({
      query: { searchParams: { lesson_uuid_eq: lessonId }, pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(lessonId && classId) && showAssignments && !instructorGrading,
    staleTime: STALE_TIMES.entity,
  });
  const quizzes = useInfiniteQuery({
    ...searchQuizzesInfiniteOptions({
      query: { searchParams: { lesson_uuid_eq: lessonId }, pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(lessonId && classId) && showQuizzes && !instructorGrading,
    staleTime: STALE_TIMES.entity,
  });
  const assignmentItems = useMemo(
    () =>
      assignments.data?.pages
        .flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? [])))
        .filter(item => !item.class_definition_uuid || item.class_definition_uuid === classId) ??
      [],
    [assignments.data, classId]
  );
  const quizItems = useMemo(
    () =>
      quizzes.data?.pages
        .flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? [])))
        .filter(item => !item.class_definition_uuid || item.class_definition_uuid === classId) ??
      [],
    [quizzes.data, classId]
  );
  const scopedAssignments = useMemo(
    () =>
      hasApiError(assignmentSchedules.data)
        ? []
        : (assignmentSchedules.data?.data ?? []).filter(
            item =>
              item.lesson_uuid === lessonId &&
              (role !== 'instructor' || belongsToSession(item, activeSession?.uuid)) &&
              (!item.class_definition_uuid || item.class_definition_uuid === classId) &&
              (role === 'instructor' ||
                !item.visible_at ||
                dayjs(item.visible_at).valueOf() <= Date.now())
          ),
    [assignmentSchedules.data, lessonId, classId, role, activeSession?.uuid]
  );
  const scopedQuizzes = useMemo(
    () =>
      hasApiError(quizSchedules.data)
        ? []
        : (quizSchedules.data?.data ?? []).filter(
            item =>
              item.lesson_uuid === lessonId &&
              (role !== 'instructor' || belongsToSession(item, activeSession?.uuid)) &&
              (!item.class_definition_uuid || item.class_definition_uuid === classId) &&
              (role === 'instructor' ||
                !item.visible_at ||
                dayjs(item.visible_at).valueOf() <= Date.now())
          ),
    [quizSchedules.data, lessonId, classId, role, activeSession?.uuid]
  );
  // Schedules can reference class clones beyond the current template page.
  // Resolve those references in batches, never with a request per card.
  const missingAssignmentIds = useMemo(
    () =>
      showAssignments && (assignments.isSuccess || instructorGrading)
        ? scopedAssignments.flatMap(schedule =>
            schedule.assignment_uuid &&
            !assignmentItems.some(item => item.uuid === schedule.assignment_uuid)
              ? [schedule.assignment_uuid]
              : []
          )
        : [],
    [showAssignments, assignments.isSuccess, instructorGrading, scopedAssignments, assignmentItems]
  );
  const missingQuizIds = useMemo(
    () =>
      showQuizzes && (quizzes.isSuccess || instructorGrading)
        ? scopedQuizzes.flatMap(schedule =>
            schedule.quiz_uuid && !quizItems.some(item => item.uuid === schedule.quiz_uuid)
              ? [schedule.quiz_uuid]
              : []
          )
        : [],
    [showQuizzes, quizzes.isSuccess, instructorGrading, scopedQuizzes, quizItems]
  );
  const {
    assignmentMap,
    isLoading: assignmentsLoading,
    isError: assignmentLookupError,
    refetch: retryAssignments,
  } = useAssignmentsByIds(missingAssignmentIds);
  const {
    quizMap,
    isLoading: quizzesLoading,
    isError: quizLookupError,
    refetch: retryQuizzes,
  } = useQuizzesByIds(missingQuizIds);
  if (assignmentsLoading || quizzesLoading) return <WorkbookLoading />;
  const activeQueries = [
    ...(showAssignments ? [assignmentSchedules, ...(!instructorGrading ? [assignments] : [])] : []),
    ...(showQuizzes ? [quizSchedules, ...(!instructorGrading ? [quizzes] : [])] : []),
  ];
  if (activeQueries.some(query => query.isLoading)) return <WorkbookLoading />;
  if (
    activeQueries.some(query => query.isError) ||
    assignmentLookupError ||
    quizLookupError ||
    (showAssignments &&
      (hasApiError(assignmentSchedules.data) || assignments.data?.pages.some(hasApiError))) ||
    (showQuizzes && (hasApiError(quizSchedules.data) || quizzes.data?.pages.some(hasApiError)))
  ) {
    return (
      <WorkbookError
        title={`Unable to load ${title.toLowerCase()}`}
        retry={() => {
          for (const query of activeQueries) void query.refetch();
          void retryAssignments();
          void retryQuizzes();
        }}
      />
    );
  }
  const assignmentRows: {
    id: string;
    assignment?: Assignment;
    schedule?: ClassAssignmentSchedule;
  }[] = scopedAssignments.flatMap(schedule =>
    schedule.assignment_uuid
      ? [
          {
            id: schedule.uuid ?? schedule.assignment_uuid,
            assignment:
              assignmentItems.find(item => item.uuid === schedule.assignment_uuid) ??
              assignmentMap[schedule.assignment_uuid],
            schedule,
          },
        ]
      : []
  );
  const quizRows: { id: string; quiz?: Quiz; schedule?: ClassQuizSchedule }[] =
    scopedQuizzes.flatMap(schedule =>
      schedule.quiz_uuid
        ? [
            {
              id: schedule.uuid ?? schedule.quiz_uuid,
              quiz:
                quizItems.find(item => item.uuid === schedule.quiz_uuid) ??
                quizMap[schedule.quiz_uuid],
              schedule,
            },
          ]
        : []
    );
  if (instructorGrading) {
    return (
      <LessonGradingPanel
        key={`${classId}-${lessonId}-${activeSession?.uuid ?? ''}`}
        classId={classId}
        courseId={courseId}
        sessionId={activeSession?.uuid}
        tasks={[
          ...assignmentRows.flatMap(({ id, assignment, schedule }) =>
            schedule?.assignment_uuid
              ? [
                  {
                    id: `assignment-${id}`,
                    kind: 'assignment' as const,
                    uuid: schedule.assignment_uuid,
                    title: assignment?.title ?? 'Assignment',
                    maxPoints: assignment?.max_points,
                    dueAt: gradingDeadline(schedule),
                  },
                ]
              : []
          ),
          ...quizRows.flatMap(({ id, quiz, schedule }) =>
            schedule?.quiz_uuid
              ? [
                  {
                    id: `quiz-${id}`,
                    kind: 'quiz' as const,
                    uuid: schedule.quiz_uuid,
                    title: quiz?.title ?? 'Quiz',
                    dueAt: gradingDeadline(schedule),
                  },
                ]
              : []
          ),
        ]}
      />
    );
  }
  if (role === 'instructor') {
    assignmentRows.push(
      ...assignmentItems
        .filter(
          item =>
            item.uuid && !scopedAssignments.some(schedule => schedule.assignment_uuid === item.uuid)
        )
        .map(assignment => ({ id: assignment.uuid!, assignment }))
    );
    quizRows.push(
      ...quizItems
        .filter(
          item => item.uuid && !scopedQuizzes.some(schedule => schedule.quiz_uuid === item.uuid)
        )
        .map(quiz => ({ id: quiz.uuid!, quiz }))
    );
  }
  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold'>{title}</h2>
          {/* <p className='text-muted-foreground text-sm'>
            {isGrading
              ? 'Review grading criteria and open your assessments for results and feedback.'
              : `${title === 'Evaluation' ? 'Assignments and quizzes' : title === 'Quiz' ? 'Quizzes' : 'Assignments'} for this lesson in this class.`}
          </p> */}
          {role === 'instructor' && !isGrading && (
            <p className='text-muted-foreground text-sm'>
              {activeSession
                ? 'Schedule and assign published tasks to students in the selected class session.'
                : 'Select a class session in the register to schedule and assign tasks.'}
            </p>
          )}
        </div>
        {role === 'instructor' && isGrading && (
          <Button asChild variant='outline'>
            <Link href={managementHref}>Manage schedules & grading</Link>
          </Button>
        )}
      </div>

      {taskToSchedule && activeSession && (
        <ScheduleAssessmentDialog
          key={`${taskToSchedule.kind}-${taskToSchedule.uuid}-${activeSession.uuid}`}
          task={taskToSchedule}
          session={activeSession}
          classId={classId}
          lessonId={lessonId}
          onClose={() => setTaskToSchedule(null)}
        />
      )}

      {showAssignments && (
        <section className='space-y-4'>
          {!assignmentRows.length && <EmptyState title='No assignments available' />}
          {assignmentRows.map(({ id, assignment, schedule }) => {
            const uuid = schedule?.assignment_uuid ?? assignment?.uuid;
            const submissionTypes = formatSubmissionTypes(assignment?.submission_types);
            return (
              <Card key={id}>
                <CardHeader>
                  <CardTitle className='text-base'>
                    {assignment?.title ?? 'Scheduled assignment'}
                  </CardTitle>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='secondary'>
                      {schedule ? `Due ${formatDeadline(schedule.due_at)}` : 'Not scheduled'}
                    </Badge>
                    {assignment?.max_points != null && (
                      <Badge variant='outline'>{assignment.max_points} points</Badge>
                    )}
                    {schedule?.max_attempts != null && (
                      <Badge variant='outline'>{schedule.max_attempts} attempts</Badge>
                    )}
                    {submissionTypes && <Badge variant='outline'>{submissionTypes}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {!isGrading && assignment?.description && (
                    <RichTextRenderer htmlString={assignment.description} />
                  )}
                  {!isGrading && assignment?.instructions && (
                    <RichTextRenderer htmlString={assignment.instructions} />
                  )}
                  {role === 'instructor' && schedule && (
                    <p className='text-muted-foreground text-sm'>
                      Release:{' '}
                      {schedule.visible_at ? formatDeadline(schedule.visible_at) : 'Immediately'} ·
                      Grading: {formatDeadline(gradingDeadline(schedule))}
                      {schedule.notes ? ` · ${schedule.notes}` : ''}
                    </p>
                  )}
                  <div className='flex flex-wrap gap-2'>
                    {role === 'instructor' && !isGrading && uuid && (
                      <Button
                        disabled={!activeSession?.uuid || (!schedule && !assignment?.is_published)}
                        onClick={() =>
                          setTaskToSchedule({
                            kind: 'assignment',
                            uuid,
                            title: assignment?.title ?? 'Assignment',
                            schedule,
                          })
                        }
                      >
                        {schedule
                          ? 'Edit schedule'
                          : assignment?.is_published
                            ? 'Schedule & assign'
                            : 'Awaiting publication'}
                      </Button>
                    )}
                    {uuid &&
                      (isGrading ? (
                        <Button
                          variant='outline'
                          onClick={() => setExpanded(expanded === id ? null : id)}
                        >
                          {expanded === id ? 'Hide details' : 'View grading criteria'}
                        </Button>
                      ) : (
                        <AssessmentPreviewSheet
                          title={assignment?.title ?? 'Assignment'}
                          description='Review the assignment details and attachments.'
                          triggerLabel='View assignment & attachments'
                        >
                          {assignment?.description && (
                            <RichTextRenderer htmlString={assignment.description} />
                          )}
                          {assignment?.instructions && (
                            <RichTextRenderer htmlString={assignment.instructions} />
                          )}
                          <AssignmentAttachments assignmentId={uuid} />
                        </AssessmentPreviewSheet>
                      ))}
                    {role === 'student' && uuid && (
                      <Button asChild>
                        <Link
                          href={`/dashboard/student/assignment/${uuid}?classId=${encodeURIComponent(classId)}`}
                        >
                          {isGrading ? 'View submission & feedback' : 'Open assignment'}
                        </Link>
                      </Button>
                    )}
                  </div>
                  {isGrading && schedule && (
                    <p className='text-muted-foreground text-sm'>
                      Grading due {formatDeadline(gradingDeadline(schedule))}
                    </p>
                  )}
                  {uuid && expanded === id && isGrading && (
                    <GradingCriteria rubricId={assignment?.rubric_uuid} />
                  )}
                </CardContent>
              </Card>
            );
          })}
          {assignments.hasNextPage && (
            <Button
              variant='outline'
              disabled={assignments.isFetchingNextPage}
              onClick={() => void assignments.fetchNextPage()}
            >
              Load more assignments
            </Button>
          )}
        </section>
      )}

      {showQuizzes && (
        <section className='space-y-4'>
          {!quizRows.length && <EmptyState title='No quizzes available' />}

          {quizRows.map(({ id, quiz, schedule }) => {
            const uuid = schedule?.quiz_uuid ?? quiz?.uuid;
            const timeLimit = schedule?.time_limit_override ?? quiz?.time_limit_minutes;
            const attempts = schedule?.attempt_limit_override ?? quiz?.attempts_allowed;
            const passingScore = schedule?.passing_score_override ?? quiz?.passing_score;
            return (
              <Card key={id}>
                <CardHeader>
                  <CardTitle className='text-base'>{quiz?.title ?? 'Scheduled quiz'}</CardTitle>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='secondary'>
                      {schedule ? `Due ${formatDeadline(schedule.due_at)}` : 'Not scheduled'}
                    </Badge>
                    {timeLimit != null && <Badge variant='outline'>{timeLimit} min</Badge>}
                    {attempts != null && <Badge variant='outline'>{attempts} attempts</Badge>}
                    {passingScore != null && <Badge variant='outline'>Pass: {passingScore}%</Badge>}
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {!isGrading && quiz?.description && (
                    <RichTextRenderer htmlString={quiz.description} />
                  )}
                  {!isGrading && quiz?.instructions && (
                    <RichTextRenderer htmlString={quiz.instructions} />
                  )}
                  {role === 'instructor' && schedule && (
                    <p className='text-muted-foreground text-sm'>
                      Release:{' '}
                      {schedule.visible_at ? formatDeadline(schedule.visible_at) : 'Immediately'}
                      {schedule.notes ? ` · ${schedule.notes}` : ''}
                    </p>
                  )}
                  {role === 'instructor' && !isGrading && uuid && (
                    <Button
                      disabled={!activeSession?.uuid || (!schedule && !quiz?.is_published)}
                      onClick={() =>
                        setTaskToSchedule({
                          kind: 'quiz',
                          uuid,
                          title: quiz?.title ?? 'Quiz',
                          schedule,
                        })
                      }
                    >
                      {schedule
                        ? 'Edit schedule'
                        : quiz?.is_published
                          ? 'Schedule & assign'
                          : 'Awaiting publication'}
                    </Button>
                  )}
                  {(role === 'instructor' || isGrading) &&
                    uuid &&
                    (isGrading ? (
                      <Button
                        variant='outline'
                        onClick={() => setExpanded(expanded === id ? null : id)}
                      >
                        {expanded === id ? 'Hide details' : 'View grading criteria'}
                      </Button>
                    ) : (
                      <AssessmentPreviewSheet
                        title={quiz?.title ?? 'Quiz'}
                        description='Preview quiz questions and answer options.'
                        triggerLabel='Preview questions'
                      >
                        <QuizQuestions quizId={uuid} />
                      </AssessmentPreviewSheet>
                    ))}
                  {role === 'student' && uuid && (
                    <Button asChild>
                      <Link
                        href={`/dashboard/student/assignment/quiz/${uuid}?classId=${encodeURIComponent(classId)}`}
                      >
                        {isGrading ? 'View quiz results' : 'Open quiz'}
                      </Link>
                    </Button>
                  )}
                  {isGrading && schedule && (
                    <p className='text-muted-foreground text-sm'>
                      Grading due {formatDeadline(gradingDeadline(schedule))}
                    </p>
                  )}
                  {isGrading && expanded === id && <GradingCriteria rubricId={quiz?.rubric_uuid} />}
                </CardContent>
              </Card>
            );
          })}

          {quizzes.hasNextPage && (
            <Button
              variant='outline'
              disabled={quizzes.isFetchingNextPage}
              onClick={() => void quizzes.fetchNextPage()}
            >
              Load more quizzes
            </Button>
          )}
        </section>
      )}
    </div>
  );
}

function AssessmentPreviewSheet({
  title,
  description,
  triggerLabel,
  children,
}: {
  title: string;
  description: string;
  triggerLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline'>{triggerLabel}</Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-full sm:max-w-3xl'>
        <SheetHeader className='shrink-0 border-b pr-12'>
          <SheetTitle className='break-words'>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6'>{open && children}</div>
      </SheetContent>
    </Sheet>
  );
}

function GradingCriteria({ rubricId }: { rubricId?: string | null }) {
  return rubricId ? (
    <RubricPreview rubricId={rubricId} />
  ) : (
    <EmptyState title='No rubric attached' />
  );
}

function RubricPreview({ rubricId }: { rubricId: string }) {
  const query = useQuery({
    ...getRubricMatrixOptions({ path: { rubricUuid: rubricId } }),
    enabled: Boolean(rubricId),
    staleTime: STALE_TIMES.entity,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return (
      <WorkbookError title='Unable to load grading criteria' retry={() => void query.refetch()} />
    );
  const matrix = query.data?.data;
  if (!matrix?.rubric.uuid) return <EmptyState title='No grading criteria available' />;
  return (
    <RubricSummaryPreview
      matrix={{
        ...matrix,
        rubric: { ...matrix.rubric, uuid: matrix.rubric.uuid },
        criteria: matrix.criteria.flatMap(item =>
          item.uuid ? [{ ...item, uuid: item.uuid }] : []
        ),
        scoring_levels: matrix.scoring_levels.flatMap(item =>
          item.uuid ? [{ ...item, uuid: item.uuid }] : []
        ),
      }}
    />
  );
}

function AssignmentAttachments({ assignmentId }: { assignmentId: string }) {
  const query = useQuery({
    ...getAssignmentAttachmentsOptions({ path: { assignmentUuid: assignmentId } }),
    enabled: Boolean(assignmentId),
    staleTime: STALE_TIMES.entity,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return <WorkbookError title='Unable to load attachments' retry={() => void query.refetch()} />;
  return <AssignmentPreview attachments={query.data?.data ?? []} />;
}
