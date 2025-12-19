'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GuardianProgramProgress } from '@/services/guardian';
import { formatDistanceToNow } from 'date-fns';
import { Layers3 } from 'lucide-react';

interface GuardianProgramTimelineProps {
  programs: GuardianProgramProgress[];
}

export function GuardianProgramTimeline({ programs }: GuardianProgramTimelineProps) {
  if (!programs.length) {
    return (
      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            <Layers3 className='size-4' />
            Program milestones
          </CardTitle>
        </CardHeader>
        <CardContent className='border-border/70 rounded-2xl border border-dashed p-6 text-sm'>
          <p className='font-medium'>No program milestones yet.</p>
          <p className='text-muted-foreground'>
            Long-form journeys (like STEM accelerators) will appear here once a learner is enrolled.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <Layers3 className='size-4' />
          Program milestones
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {programs.map((program, index) => {
          const updatedLabel =
            program.updated_date && !Number.isNaN(Date.parse(program.updated_date))
              ? formatDistanceToNow(new Date(program.updated_date), { addSuffix: true })
              : 'Recently updated';

          return (
            <div
              key={program.enrollment_uuid ?? program.program_uuid ?? index}
              className='flex gap-4'
            >
              <div className='flex flex-col items-center'>
                <span className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full text-sm font-semibold'>
                  {Math.round(program.progress_percentage ?? 0)}%
                </span>
                {index !== programs.length - 1 && (
                  <span className='bg-border/80 mt-2 h-10 w-px self-center' aria-hidden='true' />
                )}
              </div>
              <div className='border-border/70 flex-1 rounded-2xl border p-4'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <p className='text-sm font-semibold'>{program.program_name ?? 'Program'}</p>
                    <p className='text-muted-foreground text-xs'>Updated {updatedLabel}</p>
                  </div>
                  <Badge
                    variant={
                      program.status === 'COMPLETED'
                        ? 'success'
                        : program.status === 'ACTIVE'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {program.status?.toLowerCase() ?? 'active'}
                  </Badge>
                </div>
                {program.expected_completion_date &&
                  !Number.isNaN(Date.parse(program.expected_completion_date)) && (
                    <p className='text-muted-foreground mt-3 text-xs'>
                      Expected completion:{' '}
                      {new Date(program.expected_completion_date).toLocaleDateString()}
                    </p>
                  )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
