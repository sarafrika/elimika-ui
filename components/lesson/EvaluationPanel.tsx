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
import { Skeleton } from '@/components/ui/skeleton';
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
  AssignmentSubmission,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  Quiz,
  QuizAttempt,
  ScheduledInstance,
} from '@/services/client/types.gen';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  Award,
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  FileText,
  type LucideIcon,
  Repeat,
  Target,
  Timer,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { Separator } from '../ui/separator';
import { belongsToSession, gradingDeadline } from './assessment-scheduling';
import { isTaskGraded, taskGradeLabel } from './grading';
import type { AssessmentToSchedule } from './ScheduleAssessmentDialog';
import { useStudentLessonGrades } from './useStudentLessonGrades';
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
const StudentAssessmentDetails = dynamic(
  () => import('./StudentAssessmentDetails').then(module => module.StudentAssessmentDetails),
  { loading: () => <WorkbookLoading /> }
);
const RubricGradingMatrix = dynamic(
  () =>
    import(
      '@/app/dashboard/instructor/classes/class-training/[id]/_components/RubricGradingMatrix'
    ).then(module => module.RubricGradingMatrix),
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

type TaskMetaItem = {
  icon: LucideIcon;
  label: string;
  /** Renders in the default foreground weight instead of muted. */
  emphasis?: boolean;
};

/**
 * One visual shape for both assignments and quizzes: title, a quiet meta strip,
 * optional body, and a footer band holding scheduling context on the left and
 * every action on the right.
 */
function LessonTaskCard({
  title,
  status,
  meta,
  body,
  footerNote,
  actions,
  expandedContent,
}: {
  title: string;
  status?: ReactNode;
  meta: TaskMetaItem[];
  body?: ReactNode;
  footerNote?: ReactNode;
  actions?: ReactNode;
  expandedContent?: ReactNode;
}) {
  return (
    <Card className='gap-4 overflow-hidden pb-0'>
      <CardHeader className='gap-3'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <CardTitle className='text-base'>{title}</CardTitle>
          {status}
        </div>
        {meta.length > 0 && (
          <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs'>
            {meta.map(({ icon: Icon, label, emphasis }) => (
              <span
                key={label}
                className={`flex items-center gap-1.5 ${emphasis ? 'text-foreground font-medium' : ''}`}
              >
                <Icon className='h-3.5 w-3.5 shrink-0' />
                {label}
              </span>
            ))}
          </div>
        )}
      </CardHeader>

      {(body || expandedContent) && (
        <CardContent className='space-y-4 text-sm'>
          {body}
          {expandedContent}
        </CardContent>
      )}

      {(footerNote || actions) && (
        <div className='bg-muted/40 flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3'>
          <div className='text-muted-foreground text-sm'>{footerNote}</div>
          <div className='flex flex-wrap items-center gap-2'>{actions}</div>
        </div>
      )}
    </Card>
  );
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
  const studentTasks = useMemo(
    () => [
      ...(showAssignments
        ? scopedAssignments.flatMap(schedule =>
          schedule.assignment_uuid
            ? [
              {
                id: schedule.uuid ?? schedule.assignment_uuid,
                kind: 'assignment' as const,
                uuid: schedule.assignment_uuid,
                title: 'Assignment',
              },
            ]
            : []
        )
        : []),
      ...(showQuizzes
        ? scopedQuizzes.flatMap(schedule =>
          schedule.quiz_uuid
            ? [
              {
                id: schedule.uuid ?? schedule.quiz_uuid,
                kind: 'quiz' as const,
                uuid: schedule.quiz_uuid,
                title: 'Quiz',
              },
            ]
            : []
        )
        : []),
    ],
    [showAssignments, showQuizzes, scopedAssignments, scopedQuizzes]
  );
  const studentGrades = useStudentLessonGrades(courseId, studentTasks, role === 'student');
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
    submission?: AssignmentSubmission;
  }[] = scopedAssignments.flatMap(schedule =>
    schedule.assignment_uuid
      ? [
        {
          id: schedule.uuid ?? schedule.assignment_uuid,
          assignment:
            assignmentItems.find(item => item.uuid === schedule.assignment_uuid) ??
            assignmentMap[schedule.assignment_uuid],
          schedule,
          submission: studentGrades.enrollmentId
            ? studentGrades.submissionMap.get(
              `${studentGrades.enrollmentId}-${schedule.assignment_uuid}`
            )
            : undefined,
        },
      ]
      : []
  );
  const quizRows: {
    id: string;
    quiz?: Quiz;
    schedule?: ClassQuizSchedule;
    attempt?: QuizAttempt;
  }[] = scopedQuizzes.flatMap(schedule =>
    schedule.quiz_uuid
      ? [
        {
          id: schedule.uuid ?? schedule.quiz_uuid,
          quiz:
            quizItems.find(item => item.uuid === schedule.quiz_uuid) ??
            quizMap[schedule.quiz_uuid],
          schedule,
          attempt: studentGrades.enrollmentId
            ? studentGrades.attemptMap.get(`${studentGrades.enrollmentId}-${schedule.quiz_uuid}`)
            : undefined,
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
                  rubricId: assignment?.rubric_uuid,
                  dueAt: gradingDeadline(schedule),
                  ...assignment,
                  schedule,
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
                  ...quiz,
                  schedule,
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
          {!assignmentRows.length && <EmptyState title='' description='No assignments available' />}
          {assignmentRows.map(({ id, assignment, schedule, submission }) => {
            const uuid = schedule?.assignment_uuid ?? assignment?.uuid;
            const submissionTypes = formatSubmissionTypes(assignment?.submission_types);
            const meta: TaskMetaItem[] = [
              {
                icon: CalendarDays,
                label: schedule ? `Due ${formatDeadline(schedule.due_at)}` : 'Not scheduled',
                emphasis: Boolean(schedule),
              },
              ...(assignment?.max_points != null
                ? [{ icon: Award, label: `${assignment.max_points} points` }]
                : []),
              ...(schedule?.max_attempts != null
                ? [{ icon: Repeat, label: `${schedule.max_attempts} attempts` }]
                : []),
              ...(submissionTypes ? [{ icon: FileText, label: submissionTypes }] : []),
              ...(isGrading && schedule
                ? [
                  {
                    icon: ClipboardCheck,
                    label: `Grading due ${formatDeadline(gradingDeadline(schedule))}`,
                  },
                ]
                : []),
            ];

            return (
              <LessonTaskCard
                key={id}
                title={assignment?.title ?? 'Assignment'}
                status={
                  role === 'instructor' && !schedule && !assignment?.is_published ? (
                    <Badge variant='outline'>Draft</Badge>
                  ) : null
                }
                meta={meta}
                body={
                  !isGrading && (assignment?.description || assignment?.instructions) ? (
                    <>
                      {assignment?.description && (
                        <RichTextRenderer htmlString={assignment.description} />
                      )}
                      {assignment?.instructions && (
                        <RichTextRenderer htmlString={assignment.instructions} />
                      )}
                    </>
                  ) : null
                }
                expandedContent={
                  uuid && expanded === id && isGrading ? (
                    <GradingCriteria rubricId={assignment?.rubric_uuid} />
                  ) : null
                }
                footerNote={
                  role === 'student' ? (
                    <StudentGradeStatus
                      record={submission}
                      maxPoints={assignment?.max_points}
                      loading={studentGrades.assignmentLoading}
                      error={studentGrades.assignmentError}
                      enrollmentId={studentGrades.enrollmentId}
                      retry={studentGrades.refetch}
                    />
                  ) : schedule ? (
                    [
                      `Releases ${schedule.visible_at ? formatDeadline(schedule.visible_at) : 'immediately'}`,
                      `grading ${formatDeadline(gradingDeadline(schedule))}`,
                      schedule.notes,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  ) : null
                }
                actions={
                  <>
                    {role === 'instructor' && !isGrading && uuid && (
                      <Button
                        size='sm'
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
                          size='sm'
                          variant='ghost'
                          aria-expanded={expanded === id}
                          onClick={() => setExpanded(expanded === id ? null : id)}
                        >
                          {expanded === id ? 'Hide criteria' : 'View grading criteria'}
                        </Button>
                      ) : (
                        <AssessmentPreviewSheet
                          title={assignment?.title ?? 'Assignment'}
                          description='Review the assignment details and attachments.'
                          triggerLabel='View details'
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
                    {role === 'student' &&
                      uuid &&
                      (isGrading ? (
                        <AssessmentPreviewSheet
                          title={assignment?.title ?? 'Assignment'}
                          description='Review your submission, score and instructor feedback.'
                          triggerLabel='View submission & feedback'
                          detailsHref={`/dashboard/student/assignment/${uuid}?classId=${encodeURIComponent(classId)}`}
                        >
                          {assignment?.description && (
                            <RichTextRenderer htmlString={assignment.description} />
                          )}
                          {assignment?.instructions && (
                            <RichTextRenderer htmlString={assignment.instructions} />
                          )}
                          <StudentAssessmentDetails
                            kind='assignment'
                            submission={submission}
                            maxPoints={assignment?.max_points}
                            loading={studentGrades.assignmentLoading}
                            error={studentGrades.assignmentError}
                            enrollmentId={studentGrades.enrollmentId}
                            retry={studentGrades.refetch}
                          />
                        </AssessmentPreviewSheet>
                      ) : (
                        <Button size='sm' asChild>
                          <Link
                            href={`/dashboard/student/assignment/${uuid}?classId=${encodeURIComponent(classId)}`}
                          >
                            Open assignment
                          </Link>
                        </Button>
                      ))}
                  </>
                }
              />
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
          {quizRows.map(({ id, quiz, schedule, attempt }) => {
            const uuid = schedule?.quiz_uuid ?? quiz?.uuid;
            const timeLimit = schedule?.time_limit_override ?? quiz?.time_limit_minutes;
            const attempts = schedule?.attempt_limit_override ?? quiz?.attempts_allowed;
            const passingScore = schedule?.passing_score_override ?? quiz?.passing_score;
            const meta: TaskMetaItem[] = [
              {
                icon: CalendarDays,
                label: schedule ? `Due ${formatDeadline(schedule.due_at)}` : 'Not scheduled',
                emphasis: Boolean(schedule),
              },
              ...(timeLimit != null ? [{ icon: Timer, label: `${timeLimit} min` }] : []),
              ...(attempts != null ? [{ icon: Repeat, label: `${attempts} attempts` }] : []),
              ...(passingScore != null
                ? [{ icon: Target, label: `Pass at ${passingScore}%` }]
                : []),
              ...(isGrading && schedule
                ? [
                  {
                    icon: ClipboardCheck,
                    label: `Grading due ${formatDeadline(gradingDeadline(schedule))}`,
                  },
                ]
                : []),
            ];

            return (
              <LessonTaskCard
                key={id}
                title={quiz?.title ?? 'Scheduled quiz'}
                status={
                  role === 'instructor' && !schedule && !quiz?.is_published ? (
                    <Badge variant='outline'>Draft</Badge>
                  ) : null
                }
                meta={meta}
                body={
                  !isGrading && (quiz?.description || quiz?.instructions) ? (
                    <>
                      {quiz?.description && <RichTextRenderer htmlString={quiz.description} />}
                      {quiz?.instructions && <RichTextRenderer htmlString={quiz.instructions} />}
                    </>
                  ) : null
                }
                footerNote={
                  role === 'student' ? (
                    <StudentGradeStatus
                      record={attempt}
                      loading={studentGrades.quizLoading}
                      error={studentGrades.quizError}
                      enrollmentId={studentGrades.enrollmentId}
                      retry={studentGrades.refetch}
                    />
                  ) : schedule ? (
                    [
                      `Releases ${schedule.visible_at ? formatDeadline(schedule.visible_at) : 'immediately'}`,
                      schedule.notes,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  ) : null
                }
                actions={
                  <>
                    {role === 'instructor' && !isGrading && uuid && (
                      <Button
                        size='sm'
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
                    {role === 'instructor' && !isGrading && uuid && (
                      <AssessmentPreviewSheet
                        title={quiz?.title ?? 'Quiz'}
                        description='Preview quiz questions and answer options.'
                        triggerLabel='Preview questions'
                      >
                        <QuizQuestions quizId={uuid} />
                      </AssessmentPreviewSheet>
                    )}
                    {role === 'student' &&
                      uuid &&
                      (isGrading ? (
                        <AssessmentPreviewSheet
                          title={quiz?.title ?? 'Quiz'}
                          description='Review your quiz score and answers.'
                          triggerLabel='View quiz results'
                          detailsHref={`/dashboard/student/assignment/quiz/${uuid}?classId=${encodeURIComponent(classId)}`}
                        >
                          {quiz?.description && <RichTextRenderer htmlString={quiz.description} />}
                          <StudentAssessmentDetails
                            kind='quiz'
                            attempt={attempt}
                            loading={studentGrades.quizLoading}
                            error={studentGrades.quizError}
                            enrollmentId={studentGrades.enrollmentId}
                            retry={studentGrades.refetch}
                          />
                        </AssessmentPreviewSheet>
                      ) : (
                        <Button size='sm' asChild>
                          <Link
                            href={`/dashboard/student/assignment/quiz/${uuid}?classId=${encodeURIComponent(classId)}`}
                          >
                            Open quiz
                          </Link>
                        </Button>
                      ))}
                  </>
                }
              />
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
  detailsHref,
  children,
}: {
  title: string;
  description: string;
  triggerLabel: string;
  detailsHref?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline'>{triggerLabel}</Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-full sm:max-w-5xl'>
        <SheetHeader className='shrink-0 border-b pr-12'>
          <SheetTitle className='break-words'>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
          {detailsHref && (
            <Button asChild variant='outline' size='sm' className='mt-2 w-fit'>
              <Link href={detailsHref} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='h-4 w-4' />
                Open details page
                <span className='sr-only'> (opens in a new tab)</span>
              </Link>
            </Button>
          )}
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6'>{open && children}</div>
      </SheetContent>
    </Sheet>
  );
}

function StudentGradeStatus({
  record,
  maxPoints,
  loading,
  error,
  enrollmentId,
  retry,
}: {
  record?: AssignmentSubmission | QuizAttempt;
  maxPoints?: number;
  loading: boolean;
  error: boolean;
  enrollmentId?: string;
  retry: () => void;
}) {
  if (loading) return <Skeleton className='h-5 w-28' aria-label='Loading score' />;
  if (error)
    return (
      <Button variant='ghost' size='sm' onClick={retry}>
        Retry score
      </Button>
    );
  if (!enrollmentId) return <span>Grade unavailable</span>;
  return isTaskGraded(record) ? (
    <span className='text-foreground flex items-center gap-2 font-semibold'>
      <Award className='h-4 w-4' />
      Score: {taskGradeLabel(record, maxPoints)}
    </span>
  ) : (
    <span>{taskGradeLabel(record, maxPoints)}</span>
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
  const matrix = useMemo(() => {
    const data = hasApiError(query.data) ? undefined : query.data?.data;
    if (!data?.rubric.uuid) return undefined;
    return {
      ...data,
      rubric: { ...data.rubric, uuid: data.rubric.uuid },
      criteria: data.criteria.flatMap(item =>
        item.uuid ? [{ ...item, uuid: item.uuid }] : []
      ),
      scoring_levels: data.scoring_levels.flatMap(item =>
        item.uuid ? [{ ...item, uuid: item.uuid }] : []
      ),
    };
  }, [query.data]);
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return (
      <WorkbookError title='Unable to load grading criteria' retry={() => void query.refetch()} />
    );
  if (!matrix) return <EmptyState title='No grading criteria available' />;
  return (
    <>
      <Separator />
      <section className='space-y-4 border border-border p-3 rounded-sm' aria-label='Assignment grading rubric'>
        <div className='space-y-2'>
          <h3 className='font-semibold'>{matrix.rubric.title}</h3>
          {matrix.rubric.description && (
            <RichTextRenderer htmlString={matrix.rubric.description} />
          )}
          <div className='flex flex-wrap gap-2'>
            <Badge variant='outline'>{matrix.criteria.length} criteria</Badge>
            <Badge variant='outline'>{matrix.scoring_levels.length} scoring levels</Badge>
            {matrix.rubric.max_score != null && (
              <Badge variant='outline'>Maximum {matrix.rubric.max_score} points</Badge>
            )}
          </div>
        </div>
        <RubricGradingMatrix
          matrix={matrix}
          selections={{}}
          readOnly
          showScoreSummary={false}
        />
      </section>
    </>
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
