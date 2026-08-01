'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, BookText, CalendarClock, Files, GraduationCap, Layers3 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '../../../../../components/ui/avatar';
import {
  deleteAssignmentScheduleMutation,
  deleteQuizScheduleMutation,
  getAssignmentSchedulesQueryKey,
  getQuizSchedulesQueryKey,
} from '../../../../../services/client/@tanstack/react-query.gen';
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
  const qc = useQueryClient();

  const deleteAssignmentSchedule = useMutation(deleteAssignmentScheduleMutation());

  const deleteQuizSchedule = useMutation(deleteQuizScheduleMutation());

  const isDeleting = deleteAssignmentSchedule.isPending || deleteQuizSchedule.isPending;

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
            queryKey: getQuizSchedulesQueryKey({
              path: {
                classUuid: assignment.classUuid as string,
              },
            }),
          });

          toast.success('Quiz removed successfully');
        },

        onError: error => {
          toast.error(error?.message);
        },
      });
    } else {
      deleteAssignmentSchedule.mutate(payload, {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getAssignmentSchedulesQueryKey({
              path: {
                classUuid: assignment.classUuid as string,
              },
            }),
          });

          toast.success('Assignment removed successfully');
        },

        onError: error => {
          toast.error(error?.message);
        },
      });
    }
  };

  return (
    <article
      className={cn(
        'group border-border/70 bg-card relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 sm:min-w-[365px]',
        'hover:border-primary/30 hover:-translate-y-1 hover:shadow-md',
        'p-4 sm:p-4'
      )}
    >
      {/* top accent */}
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

      {/* blur decoration */}
      <div className='bg-primary/5 pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-2xl' />

      <div className='relative flex h-full flex-col gap-5'>
        {/* header */}
        <div className='flex flex-col gap-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 items-start gap-3 sm:gap-4'>
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 sm:h-12 sm:w-12',
                  iconTone[assignment.iconTone]
                )}
              >
                <BookText className='h-5 w-5' />
              </div>

              <div className='min-w-0 space-y-1.5'>
                <p className='text-muted-foreground truncate text-[11px] font-semibold tracking-wide uppercase sm:text-xs'>
                  {assignment.lesson}
                </p>

                <h2 className='text-foreground text-sm leading-snug font-semibold sm:text-base lg:text-lg'>
                  <span className='line-clamp-2'>{assignment.subtitle}</span>
                </h2>

                <div className='text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm'>
                  <CalendarClock className='h-3.5 w-3.5 shrink-0' />
                  <span className='truncate'>{assignment.dueLabel}</span>
                </div>

                {(assignment.courseTitle || assignment.classTitle) && (
                  <p className='text-muted-foreground truncate text-[11px] sm:text-xs'>
                    {[assignment.courseTitle, assignment.classTitle].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>

            <Badge
              variant='outline'
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:px-3 sm:text-[11px]',
                statusTone[assignment.status]
              )}
            >
              {assignment.statusLabel}
            </Badge>
          </div>

          {/* student summary */}
          {assignment.classTitle ? (
            <div className='border-border/60 bg-muted/40 flex flex-wrap items-center gap-2 rounded-xl border p-3'>
              <div className='flex min-w-0 flex-1 items-center gap-2'>
                <Avatar className='h-7 w-7 shrink-0'>
                  <AvatarFallback className='text-[10px]'>
                    {assignment.classTitle
                      ?.split(' ')
                      .filter(Boolean)
                      .map(word => word[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <span className='text-muted-foreground truncate text-xs sm:text-sm'>
                  {assignment.classTitle}
                </span>
                {assignment.uniqueEnrollmentCount !== undefined && (
                  <span className='text-muted-foreground truncate text-xs sm:text-sm'>
                    ( {assignment.uniqueEnrollmentCount} enrolled, {assignment.availableCount}{' '}
                    available seat
                    {assignment.availableCount !== 1 ? 's' : ''} )
                  </span>
                )}
              </div>

              {assignment.badge && (
                <Badge
                  variant='outline'
                  className='border-primary/20 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[10px] sm:text-[11px]'
                >
                  {assignment.badge}
                </Badge>
              )}
            </div>
          ) : assignment.badge ? (
            <Badge
              variant='outline'
              className='border-primary/20 bg-primary/10 text-primary w-fit rounded-full px-2.5 py-1 text-[10px] sm:text-[11px]'
            >
              {assignment.badge}
            </Badge>
          ) : null}
        </div>

        {/* metrics */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='border-border/60 bg-background/70 flex min-w-0 items-center gap-3 rounded-xl border p-3'>
            <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'>
              <Files className='h-4 w-4' />
            </div>

            <div className='min-w-0'>
              <p className='text-foreground text-xs font-semibold sm:text-sm'>Submissions</p>

              <p className='text-muted-foreground truncate text-[11px] sm:text-xs'>
                Review learner work
              </p>
            </div>
          </div>

          {assignment.metricValue ? (
            <div className='border-border/60 bg-background/70 flex min-w-0 items-center gap-3 rounded-xl border p-3'>
              <div className='bg-success/10 text-success flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'>
                <GraduationCap className='h-4 w-4' />
              </div>

              <div className='min-w-0'>
                <p className='text-foreground truncate text-xs font-semibold sm:text-sm'>
                  {assignment.metricValue}
                </p>

                {assignment.metricLabel && (
                  <p className='text-muted-foreground truncate text-[11px] sm:text-xs'>
                    {assignment.metricLabel}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className='border-border/60 bg-background/70 flex min-w-0 items-center gap-3 rounded-xl border p-3'>
              <div className='bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'>
                <Layers3 className='h-4 w-4' />
              </div>

              <p className='text-muted-foreground text-xs sm:text-sm'>No submission metric yet</p>
            </div>
          )}
        </div>

        <div className='border-border/50 mt-auto flex flex-col gap-4 border-t pt-4'>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-muted-foreground text-xs sm:text-sm'>
              {assignment.taskType === 'quiz' ? 'Quiz task' : 'Assignment task'}
            </p>
          </div>

          <div className='flex flex-row justify-end gap-4 sm:flex-row sm:items-center'>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant='destructive'
              className='h-10 text-xs sm:text-sm'
              size={'sm'}
            >
              {isDeleting
                ? 'Removing...'
                : assignment.taskType === 'quiz'
                  ? 'Remove Quiz'
                  : 'Remove Assignment'}
            </Button>

            <Button
              asChild
              size={'sm'}
              className={cn(
                'h-10',
                assignment.ctaLabel === 'Grade Now'
                  ? 'bg-warning text-warning-foreground hover:bg-warning/90'
                  : 'bg-primary hover:bg-primary/90'
              )}
            >
              <Link
                className='flex items-center justify-center gap-2'
                href={{
                  pathname: `/dashboard/instructor/assignment/${assignment.id}`,
                  query: {
                    ...(assignment.courseId && { course_uuid: assignment.courseId }),
                    ...(assignment.classUuid && { classId: assignment.classUuid }),
                  },
                }}
              >
                <span className='truncate text-xs sm:text-sm'>{assignment.ctaLabel}</span>

                <ArrowUpRight className='h-4 w-4 shrink-0' />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
