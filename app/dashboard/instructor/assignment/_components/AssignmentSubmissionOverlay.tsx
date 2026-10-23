'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { WorkbookError } from '@/components/lesson/WorkbookError';
import { WorkbookLoading } from '@/components/lesson/WorkbookLoading';
import { hasApiError } from '@/components/lesson/workbook-data';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAssignmentByUuidOptions,
  getAssignmentSchedulesOptions,
  getClassDefinitionOptions,
  getQuizByUuidOptions,
  getQuizSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const LessonGradingPanel = dynamic(
  () => import('@/components/lesson/LessonGradingPanel').then(module => module.LessonGradingPanel),
  { loading: () => <WorkbookLoading /> }
);

export function AssignmentSubmissionOverlay({ taskId }: { taskId: string }) {
  const params = useSearchParams();
  const classId = params.get('classId') ?? '';
  const scheduleId = params.get('scheduleId');
  const kind = taskId.startsWith('assignment_')
    ? 'assignment'
    : taskId.startsWith('quiz_')
      ? 'quiz'
      : undefined;
  const uuid = kind ? taskId.slice(kind.length + 1) : '';

  const classQuery = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classId } }),
    enabled: Boolean(classId),
    staleTime: STALE_TIMES.entity,
  });
  const assignment = useQuery({
    ...getAssignmentByUuidOptions({ path: { uuid } }),
    enabled: Boolean(uuid && kind === 'assignment'),
    staleTime: STALE_TIMES.entity,
  });
  const quiz = useQuery({
    ...getQuizByUuidOptions({ path: { uuid } }),
    enabled: Boolean(uuid && kind === 'quiz'),
    staleTime: STALE_TIMES.entity,
  });
  const assignmentSchedules = useQuery({
    ...getAssignmentSchedulesOptions({ path: { classUuid: classId } }),
    enabled: Boolean(classId && kind === 'assignment'),
    staleTime: STALE_TIMES.live,
  });
  const quizSchedules = useQuery({
    ...getQuizSchedulesOptions({ path: { classUuid: classId } }),
    enabled: Boolean(classId && kind === 'quiz'),
    staleTime: STALE_TIMES.live,
  });

  const taskQuery = kind === 'assignment' ? assignment : quiz;
  const schedulesQuery = kind === 'assignment' ? assignmentSchedules : quizSchedules;
  const task = hasApiError(taskQuery.data) ? undefined : taskQuery.data?.data;
  const classDefinition = hasApiError(classQuery.data)
    ? undefined
    : classQuery.data?.data?.class_definition;
  const schedule = hasApiError(schedulesQuery.data)
    ? undefined
    : kind === 'assignment'
      ? assignmentSchedules.data?.data?.find(
          item => item.assignment_uuid === uuid && (!scheduleId || item.uuid === scheduleId)
        )
      : quizSchedules.data?.data?.find(
          item => item.quiz_uuid === uuid && (!scheduleId || item.uuid === scheduleId)
        );

  return (
    <main className='bg-background space-y-6 p-4 md:p-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>{task?.title || 'Student submissions'}</h1>
          <p className='text-muted-foreground text-sm'>
            {classDefinition?.title}
            {kind === 'quiz' ? ' · Automatic quiz results' : ' · Assignment submissions'}
          </p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/dashboard/instructor/training-hub?tab=assignment'>Back to assignments</Link>
        </Button>
      </div>

      {!kind || !uuid || !classId ? (
        <EmptyState
          title='Select a task from your class assignments'
          description='Open the assignment or quiz from the assignments list to review its students.'
        />
      ) : classQuery.isLoading || taskQuery.isLoading || schedulesQuery.isLoading ? (
        <WorkbookLoading />
      ) : [classQuery, taskQuery, schedulesQuery].some(
          query => query.isError || hasApiError(query.data)
        ) ? (
        <WorkbookError
          title='Unable to load this task'
          retry={() => {
            void classQuery.refetch();
            void taskQuery.refetch();
            void schedulesQuery.refetch();
          }}
        />
      ) : !task || !schedule || !classDefinition?.course_uuid ? (
        <EmptyState title='This task is not available for this class' />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {kind === 'quiz' ? 'Student quiz results' : 'Student assignment grading'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LessonGradingPanel
              key={`${classId}-${taskId}-${schedule.uuid}`}
              scope='class'
              classId={classId}
              courseId={classDefinition.course_uuid}
              tasks={[
                {
                  id: taskId,
                  uuid,
                  kind,
                  title: task.title,
                  rubricId: kind === 'assignment' ? task.rubric_uuid : undefined,
                  maxPoints:
                    kind === 'assignment' && 'max_points' in task ? task.max_points : undefined,
                  schedule,
                },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
