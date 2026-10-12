'use client';

import { Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { AsyncSection } from '@/components/data/async-section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
import { cn } from '../../../../../../lib/utils';
import { useStudentUpcomingAssessments } from '../useStudentUpcomingAssessments';

function AssessmentsSkeleton() {
  return (
    <div className='space-y-3'>
      {[0, 1, 2].map(item => (
        <Skeleton key={item} className='h-[72px] w-full rounded-lg' />
      ))}
    </div>
  );
}

export function StudentOverviewAssessmentsCard() {
  const { data: upcomingAssessments, isLoading, error, refetch } = useStudentUpcomingAssessments();

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Clock className='text-primary h-4 w-4' /> Upcoming assessments
        </CardTitle>
        <CardDescription>Assigned but not attempted yet</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <AsyncSection
          name='student-overview-assessments'
          loading={isLoading}
          error={error}
          onRetry={refetch}
          errorTitle='Couldn’t load your assessments'
          empty={upcomingAssessments.length === 0}
          skeleton={<AssessmentsSkeleton />}
          emptyState={
            <div className='rounded-lg border border-dashed p-4'>
              <p className='text-muted-foreground text-sm'>
                No upcoming assessments are waiting for you right now.
              </p>
            </div>
          }
        >
          {upcomingAssessments.slice(0, 5).map(a => {
            const isDue = new Date(a.dueLabel.replace(/^Due\s+/, '')) <= new Date();

            return (
              <Link
                key={a.id}
                href={a.href}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                  isDue
                    ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/50 dark:bg-destructive/10'
                    : 'hover:border-primary/30'
                )}
              >
                <div
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-md',
                    isDue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                  )}
                >
                  <FileText className='h-4 w-4' />
                </div>

                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{a.title}</p>

                  <p
                    className={cn(
                      'text-xs',
                      isDue ? 'text-destructive font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {a.provider} · {a.dueLabel}
                  </p>

                  <p className='text-muted-foreground mt-1 text-[0.72rem]'>
                    {a.classTitle}
                    {a.courseTitle ? ` · ${a.courseTitle}` : ''}
                  </p>
                </div>

                <Badge variant={isDue ? 'destructive' : 'secondary'} className='h-fit text-[10px]'>
                  {isDue ? 'Due' : a.badgeLabel}
                </Badge>
              </Link>
            );
          })}

          {upcomingAssessments.length > 5 && (
            <Button asChild variant='outline' className='w-full'>
              <Link href='/dashboard/student/learning-hub?tab=assignments'>See all</Link>
            </Button>
          )}
        </AsyncSection>
      </CardContent>
    </Card>
  );
}
