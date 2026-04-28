'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, BookText, CalendarClock, Files, GraduationCap, Layers3 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteAssignmentScheduleMutation, deleteQuizScheduleMutation, getAssignmentSchedulesQueryKey, getQuizSchedulesQueryKey } from '../../../../../services/client/@tanstack/react-query.gen';
import type { AssignmentCardData } from './assignment-types';

type AssignmentCardProps = {
  assignment: AssignmentCardData;
};

const statusTone: Record<AssignmentCardData['status'], string> = {
  graded: 'border-success/20 bg-success/10 text-success',
  ongoing: 'border-primary/20 bg-primary/10 text-primary',
  overdue: 'border-destructive/20 bg-destructive/10 text-destructive',
};

const iconTone: Record<AssignmentCardData['iconTone'], string> = {
  amber: 'bg-warning/15 text-warning ring-warning/20',
  blue: 'bg-primary/10 text-primary ring-primary/20',
};

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const qc = useQueryClient()
  const deleteAssignmentSchedule = useMutation(deleteAssignmentScheduleMutation())
  const deleteQuizSchedule = useMutation(deleteQuizScheduleMutation())

  const handleDelete = () => {
    const isQuiz = assignment.taskType === 'quiz';

    const confirmed = confirm(
      `Are you sure you want to remove this ${isQuiz ? 'quiz' : 'assignment'}?`
    );
    if (!confirmed) return;

    const payload = {
      path: {
        classUuid: assignment?.classUuid as string,
        scheduleUuid: assignment.scheduleUuid,
      },
    };

    if (isQuiz) {
      deleteQuizSchedule.mutate(payload, {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getQuizSchedulesQueryKey({ path: { classUuid: assignment.classUuid as string } }),
          });
          toast.success('Quiz removed successfully');
        },
        onError: (error) => {
          toast.error(error?.message);
        },
      });
    } else {
      deleteAssignmentSchedule.mutate(payload, {
        onSuccess: (data) => {
          qc.invalidateQueries({
            queryKey: getAssignmentSchedulesQueryKey({ path: { classUuid: assignment.classUuid as string } }),
          });
          toast.success('Assignment removed successfully');
        },
        onError: (error) => {
          toast.error(error?.message);
        },
      });
    }
  };

  return (
    <article className='group border-border/70 bg-card relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-4 lg:p-5'>
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1',
          assignment.status === 'overdue'
            ? 'bg-destructive'
            : assignment.status === 'graded'
              ? 'bg-success'
              : 'bg-primary'
        )}
      />

      <div className='pointer-events-none absolute -top-24 -right-20 h-44 w-44 rounded-full bg-primary/5' />

      <div className='relative flex flex-col gap-4 sm:gap-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex min-w-0 gap-3 sm:gap-4'>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-12 sm:w-12',
                iconTone[assignment.iconTone]
              )}
            >
              <BookText className='h-4 w-4 sm:h-5 sm:w-5' />
            </div>
            <div className='min-w-0 space-y-1.5'>
              <p className='text-muted-foreground line-clamp-1 text-xs font-semibold tracking-wide uppercase sm:text-[13px]'>
                {assignment.lesson}
              </p>
              <h2 className='text-foreground line-clamp-2 text-base leading-snug font-semibold sm:text-lg lg:text-xl'>
                {assignment.subtitle}
              </h2>
              <p className='text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm'>
                <CalendarClock className='h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4' />
                <span className='line-clamp-1'>{assignment.dueLabel}</span>
              </p>
              {(assignment.courseTitle || assignment.classTitle) ? (
                <p className='text-muted-foreground line-clamp-1 text-xs sm:text-sm'>
                  {[assignment.courseTitle, assignment.classTitle].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>

          <Badge
            variant='outline'
            className={cn(
              'w-fit rounded-full px-3 py-1 text-[11px] font-semibold sm:text-xs',
              statusTone[assignment.status]
            )}
          >
            {assignment.statusLabel}
          </Badge>
        </div>

        {assignment.studentSummary ? (
          <div className='bg-muted/40 border-border/60 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:gap-3 sm:text-sm'>
            <div className='flex min-w-0 items-center gap-2'>
              <Avatar className='h-7 w-7 shrink-0'>
                <AvatarFallback className='text-[10px]'>SO</AvatarFallback>
              </Avatar>
              <span className='text-muted-foreground line-clamp-1'>
                {assignment.studentSummary}
              </span>
            </div>
            {assignment.badge ? (
              <Badge
                variant='outline'
                className='border-primary/20 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[11px] sm:text-xs'
              >
                {assignment.badge}
              </Badge>
            ) : null}
          </div>
        ) : assignment.badge ? (
          <Badge
            variant='outline'
            className='border-primary/20 bg-primary/10 text-primary w-fit rounded-full px-2.5 py-1 text-[11px] sm:text-xs'
          >
            {assignment.badge}
          </Badge>
        ) : null}

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='border-border/60 bg-background/70 flex min-w-0 items-center gap-3 rounded-lg border px-3 py-3'>
            <div className='bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
              <Files className='h-4 w-4' />
            </div>
            <div className='min-w-0'>
              <p className='text-foreground text-xs font-semibold sm:text-sm'>Submissions</p>
              <p className='text-muted-foreground line-clamp-1 text-[11px] sm:text-xs'>
                Review learner work
              </p>
            </div>
          </div>

          {assignment.metricValue ? (
            <div className='border-border/60 bg-background/70 flex min-w-0 items-center gap-3 rounded-lg border px-3 py-3'>
              <div className='bg-success/10 text-success flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
                <GraduationCap className='h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-foreground line-clamp-1 text-xs font-semibold sm:text-sm'>
                  {assignment.metricValue}
                </p>
                {assignment.metricLabel ? (
                  <p className='text-muted-foreground line-clamp-1 text-[11px] sm:text-xs'>
                    {assignment.metricLabel}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className='border-border/60 bg-background/70 flex min-w-0 items-center gap-3 rounded-lg border px-3 py-3'>
              <div className='bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
                <Layers3 className='h-4 w-4' />
              </div>
              <p className='text-muted-foreground text-xs sm:text-sm'>No submission metric yet</p>
            </div>
          )}
        </div>

        <div className='border-border/50 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-muted-foreground text-xs sm:text-sm'>
            {assignment.taskType === 'quiz' ? 'Quiz task' : 'Assignment task'}
          </p>

          <div className='flex flex-row items-center gap-4' >
            <Button
              onClick={handleDelete}
              disabled={deleteAssignmentSchedule.isPending}
              className="h-10 w-full rounded-md px-4 text-xs font-semibold sm:w-auto sm:text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAssignmentSchedule.isPending
                ? 'Removing...'
                : assignment.taskType === 'quiz'
                  ? 'Remove Quiz'
                  : 'Remove Assignment'}
            </Button>

            <Button
              asChild
              className={cn(
                'h-10 w-full rounded-md px-4 text-xs font-semibold sm:w-auto sm:text-sm',
                assignment.ctaLabel === 'Grade Now'
                  ? 'bg-warning text-warning-foreground hover:bg-warning/90'
                  : 'bg-primary hover:bg-primary/90'
              )}
            >
              <Link
                href={{
                  pathname: `/dashboard/assignment/${assignment.id}`,
                  query: assignment.classUuid ? { classId: assignment.classUuid } : undefined,
                }}
              >
                {assignment.ctaLabel}
                <ArrowUpRight className='h-4 w-4' />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
