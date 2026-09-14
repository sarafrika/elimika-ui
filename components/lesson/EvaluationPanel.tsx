'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { dayjs } from '@/lib/date';
import { useAssignmentsByIds, useQuizzesByIds } from '@/hooks/use-batched-lookups';
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
  Quiz,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
} from '@/services/client/types.gen';
import {
  hasApiError,
  nextWorkbookPage,
  WORKBOOK_PAGE_SIZE,
  type WorkbookRole,
} from './workbook-data';
import { WorkbookLoading } from './WorkbookLoading';
import { WorkbookError } from './WorkbookError';

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
  lessonId,
  role,
  managementHref,
  section = 'evaluation',
}: {
  classId: string;
  lessonId: string;
  role: WorkbookRole;
  managementHref: string;
  section?: 'evaluation' | 'quiz' | 'assignment' | 'grading';
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const showAssignments = section !== 'quiz';
  const showQuizzes = section !== 'assignment';
  const isGrading = section === 'grading';
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
    enabled: Boolean(lessonId && classId) && showAssignments,
    staleTime: STALE_TIMES.entity,
  });
  const quizzes = useInfiniteQuery({
    ...searchQuizzesInfiniteOptions({
      query: { searchParams: { lesson_uuid_eq: lessonId }, pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(lessonId && classId) && showQuizzes,
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
              (!item.class_definition_uuid || item.class_definition_uuid === classId) &&
              (role === 'instructor' ||
                !item.visible_at ||
                dayjs(item.visible_at).valueOf() <= Date.now())
          ),
    [assignmentSchedules.data, lessonId, classId, role]
  );
  const scopedQuizzes = useMemo(
    () =>
      hasApiError(quizSchedules.data)
        ? []
        : (quizSchedules.data?.data ?? []).filter(
            item =>
              item.lesson_uuid === lessonId &&
              (!item.class_definition_uuid || item.class_definition_uuid === classId) &&
              (role === 'instructor' ||
                !item.visible_at ||
                dayjs(item.visible_at).valueOf() <= Date.now())
          ),
    [quizSchedules.data, lessonId, classId, role]
  );
  // Schedules can reference class clones beyond the current template page.
  // Resolve those references in batches, never with a request per card.
  const missingAssignmentIds = useMemo(
    () =>
      showAssignments && assignments.isSuccess
        ? scopedAssignments.flatMap(schedule =>
            schedule.assignment_uuid &&
            !assignmentItems.some(item => item.uuid === schedule.assignment_uuid)
              ? [schedule.assignment_uuid]
              : []
          )
        : [],
    [showAssignments, assignments.isSuccess, scopedAssignments, assignmentItems]
  );
  const missingQuizIds = useMemo(
    () =>
      showQuizzes && quizzes.isSuccess
        ? scopedQuizzes.flatMap(schedule =>
            schedule.quiz_uuid && !quizItems.some(item => item.uuid === schedule.quiz_uuid)
              ? [schedule.quiz_uuid]
              : []
          )
        : [],
    [showQuizzes, quizzes.isSuccess, scopedQuizzes, quizItems]
  );
  const { assignmentMap, isLoading: assignmentsLoading } =
    useAssignmentsByIds(missingAssignmentIds);
  const { quizMap, isLoading: quizzesLoading } = useQuizzesByIds(missingQuizIds);
  if (assignmentsLoading || quizzesLoading) return <WorkbookLoading />;
  const activeQueries = [
    ...(showAssignments ? [assignmentSchedules, assignments] : []),
    ...(showQuizzes ? [quizSchedules, quizzes] : []),
  ];
  if (activeQueries.some(query => query.isLoading)) return <WorkbookLoading />;
  if (
    activeQueries.some(query => query.isError) ||
    (showAssignments &&
      (hasApiError(assignmentSchedules.data) || assignments.data?.pages.some(hasApiError))) ||
    (showQuizzes && (hasApiError(quizSchedules.data) || quizzes.data?.pages.some(hasApiError)))
  ) {
    return (
      <WorkbookError
        title={`Unable to load ${title.toLowerCase()}`}
        retry={() => {
          for (const query of activeQueries) void query.refetch();
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
          <p className='text-muted-foreground text-sm'>
            {isGrading
              ? 'Review grading criteria and open your assessments for results and feedback.'
              : `${title === 'Evaluation' ? 'Assignments and quizzes' : title === 'Quiz' ? 'Quizzes' : 'Assignments'} for this lesson in this class.`}
          </p>
        </div>
        {role === 'instructor' && (
          <Button asChild variant='outline'>
            <Link href={managementHref}>Manage schedules & grading</Link>
          </Button>
        )}
      </div>
      {showAssignments && (
        <section className='space-y-4'>
          <h3 className='font-semibold'>Assignments</h3>
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
                    {submissionTypes && (
                      <Badge variant='outline'>{submissionTypes}</Badge>
                    )}
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
                      Grading: {formatDeadline(schedule.grading_due_at)}
                      {schedule.notes ? ` · ${schedule.notes}` : ''}
                    </p>
                  )}
                  <div className='flex flex-wrap gap-2'>
                    {uuid && (
                      <Button
                        variant='outline'
                        onClick={() => setExpanded(expanded === id ? null : id)}
                      >
                        {expanded === id
                          ? 'Hide details'
                          : isGrading
                            ? 'View grading criteria'
                            : 'View assignment & attachments'}
                      </Button>
                    )}
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
                      Grading due {formatDeadline(schedule.grading_due_at)}
                    </p>
                  )}
                  {uuid &&
                    expanded === id &&
                    (isGrading ? (
                      <GradingCriteria rubricId={assignment?.rubric_uuid} />
                    ) : (
                      <AssignmentAttachments assignmentId={uuid} />
                    ))}
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
          <h3 className='font-semibold'>Quizzes</h3>
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
                  {(role === 'instructor' || isGrading) && uuid && (
                    <Button
                      variant='outline'
                      onClick={() => setExpanded(expanded === id ? null : id)}
                    >
                      {expanded === id
                        ? 'Hide details'
                        : isGrading
                          ? 'View grading criteria'
                          : 'Preview questions'}
                    </Button>
                  )}
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
                      Grading due {formatDeadline(schedule.grading_due_at)}
                    </p>
                  )}
                  {isGrading && expanded === id && <GradingCriteria rubricId={quiz?.rubric_uuid} />}
                  {!isGrading && role === 'instructor' && uuid && expanded === id && (
                    <QuizQuestions quizId={uuid} />
                  )}
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

function GradingCriteria({ rubricId }: { rubricId?: string }) {
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
