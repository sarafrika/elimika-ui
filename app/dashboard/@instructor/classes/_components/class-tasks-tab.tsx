'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllAssignmentsOptions,
  getAllQuizzesOptions,
  getAssignmentSchedulesOptions,
  getQuizSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  Quiz,
} from '@/services/client/types.gen';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, FileQuestion, NotebookPen } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';
import { formatDateTime } from './new-class-page.utils';

type ClassTasksTabProps = {
  classUuid?: string | null;
  classTitle?: string | null;
  courseTitle?: string | null;
  isLoading?: boolean;
};

type AssignmentScheduleItem = ClassAssignmentSchedule & {
  assignment?: Assignment | null;
};

type QuizScheduleItem = ClassQuizSchedule & {
  quiz?: Quiz | null;
};

export function ClassTasksTab({
  classUuid,
  classTitle,
  courseTitle,
  isLoading = false,
}: ClassTasksTabProps) {
  const { data: allAssignments, isLoading: isLoadingAssignments } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: { page: 0, size: 100 } } }),
    enabled: !!classUuid,
  });

  const { data: allQuizzes, isLoading: isLoadingQuizzes } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    enabled: !!classUuid,
  });

  const { data: assignmentSchedules, isLoading: isLoadingAssignmentSchedules } = useQuery({
    ...getAssignmentSchedulesOptions({ path: { classUuid: classUuid ?? '' } }),
    enabled: !!classUuid,
  });

  const { data: quizSchedules, isLoading: isLoadingQuizSchedules } = useQuery({
    ...getQuizSchedulesOptions({ path: { classUuid: classUuid ?? '' } }),
    enabled: !!classUuid,
  });

  const assignmentOptions: Assignment[] = allAssignments?.data?.content ?? [];
  const quizOptions: Quiz[] = allQuizzes?.data?.content ?? [];
  const assignmentScheduleItems: AssignmentScheduleItem[] = (assignmentSchedules?.data ?? []).map(
    item => ({
      ...item,
      assignment: assignmentOptions.find(assignment => assignment.uuid === item.assignment_uuid) ?? null,
    })
  );
  const quizScheduleItems: QuizScheduleItem[] = (quizSchedules?.data ?? []).map(item => ({
    ...item,
    quiz: quizOptions.find(quiz => quiz.uuid === item.quiz_uuid) ?? null,
  }));

  const taskSummary = useMemo(
    () => [
      { label: 'Assignments', value: assignmentScheduleItems.length },
      { label: 'Quizzes', value: quizScheduleItems.length },
      { label: 'Total tasks', value: assignmentScheduleItems.length + quizScheduleItems.length },
    ],
    [assignmentScheduleItems.length, quizScheduleItems.length]
  );

  const isBusy =
    isLoading ||
    isLoadingAssignments ||
    isLoadingQuizzes ||
    isLoadingAssignmentSchedules ||
    isLoadingQuizSchedules;

  const hasTasks = assignmentScheduleItems.length > 0 || quizScheduleItems.length > 0;

  return (
    <Card className='border-border/70 bg-card/90 shadow-sm'>
      <CardContent className='space-y-4 p-4 sm:p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='space-y-1'>
            <h3 className='text-foreground text-lg font-semibold'>Assigned Tasks</h3>
            <p className='text-muted-foreground max-w-2xl text-sm'>
              Review the assignments and quizzes attached to {classTitle ?? 'this class'}.
            </p>
            {courseTitle ? (
              <p className='text-muted-foreground text-xs'>Course: {courseTitle}</p>
            ) : null}
          </div>
          <Badge variant='outline' className='shrink-0'>
            {hasTasks ? `${assignmentScheduleItems.length + quizScheduleItems.length} items` : 'No tasks'}
          </Badge>
        </div>

        <div className='grid gap-2 sm:grid-cols-3'>
          {taskSummary.map(item => (
            <div
              key={item.label}
              className='border-border/70 bg-background/80 rounded-md border px-3 py-2'
            >
              <p className='text-muted-foreground text-[11px] uppercase tracking-[0.14em]'>
                {item.label}
              </p>
              <p className='text-foreground mt-1 text-lg font-semibold'>{item.value}</p>
            </div>
          ))}
        </div>

        {isBusy ? (
          <div className='grid gap-3 lg:grid-cols-2'>
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        ) : hasTasks ? (
          <div className='grid gap-3 lg:grid-cols-2'>
          <AssignmentTaskGroup
            title='Assignments'
            icon={<ClipboardList className='h-4 w-4' />}
            items={assignmentScheduleItems}
            emptyLabel='No assignments have been attached to this class yet.'
          />

          <QuizTaskGroup
            title='Quizzes'
            icon={<FileQuestion className='h-4 w-4' />}
            items={quizScheduleItems}
            emptyLabel='No quizzes have been attached to this class yet.'
          />
        </div>
        ) : (
          <div className='border-border/70 bg-background/80 rounded-md border border-dashed p-6 text-center'>
            <NotebookPen className='text-primary mx-auto mb-3 h-8 w-8' />
            <p className='text-foreground text-sm font-semibold'>No tasks are attached yet</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Assignments and quizzes will appear here once they are linked to {classTitle ?? 'this class'}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AssignmentTaskGroup({
  title,
  icon,
  items,
  emptyLabel,
}: {
  title: string;
  icon: ReactNode;
  items: AssignmentScheduleItem[];
  emptyLabel: string;
}) {
  return (
    <section className='border-border/70 bg-background/80 rounded-md border p-3'>
      <div className='flex items-center gap-2'>
        <span className='bg-primary/10 text-primary grid size-8 place-items-center rounded-md'>
          {icon}
        </span>
        <div>
          <h4 className='text-foreground text-sm font-semibold'>{title}</h4>
          <p className='text-muted-foreground text-xs'>{items.length} attached</p>
        </div>
      </div>

      <div className='mt-3 space-y-2'>
        {items.length > 0 ? (
          items.map(item => (
            <article
              key={item.uuid ?? item.assignment_uuid}
              className='rounded-md border p-3'
            >
              <div className='space-y-1'>
                <p className='text-foreground text-sm font-medium'>
                  {item.assignment?.title || 'Assignment'}
                </p>
                <p className='text-muted-foreground text-xs'>Due {formatDateTime(item.due_at)}</p>
                <p className='text-muted-foreground text-xs'>
                  Grading due {formatDateTime(item.grading_due_at)}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className='border-border/70 rounded-md border border-dashed px-4 py-5 text-center'>
            <p className='text-muted-foreground text-sm'>{emptyLabel}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function QuizTaskGroup({
  title,
  icon,
  items,
  emptyLabel,
}: {
  title: string;
  icon: ReactNode;
  items: QuizScheduleItem[];
  emptyLabel: string;
}) {
  return (
    <section className='border-border/70 bg-background/80 rounded-md border p-3'>
      <div className='flex items-center gap-2'>
        <span className='bg-primary/10 text-primary grid size-8 place-items-center rounded-md'>
          {icon}
        </span>
        <div>
          <h4 className='text-foreground text-sm font-semibold'>{title}</h4>
          <p className='text-muted-foreground text-xs'>{items.length} attached</p>
        </div>
      </div>

      <div className='mt-3 space-y-2'>
        {items.length > 0 ? (
          items.map(item => (
            <article key={item.uuid ?? item.quiz_uuid} className='rounded-md border p-3'>
              <div className='space-y-1'>
                <p className='text-foreground text-sm font-medium'>{item.quiz?.title || 'Quiz'}</p>
                <p className='text-muted-foreground text-xs'>Due {formatDateTime(item.due_at)}</p>
                <p className='text-muted-foreground text-xs'>
                  Visible from {formatDateTime(item.visible_at)}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className='border-border/70 rounded-md border border-dashed px-4 py-5 text-center'>
            <p className='text-muted-foreground text-sm'>{emptyLabel}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function TaskSkeleton() {
  return (
    <div className='border-border/70 bg-background/80 rounded-md border p-3'>
      <div className='flex items-center gap-2'>
        <Skeleton className='size-8 rounded-md' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24 rounded-md' />
          <Skeleton className='h-3 w-20 rounded-md' />
        </div>
      </div>
      <div className='mt-3 space-y-2'>
        <Skeleton className='h-14 w-full rounded-md' />
        <Skeleton className='h-14 w-full rounded-md' />
      </div>
    </div>
  );
}
