'use client';

import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  Medal,
  Star
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';

import { Donut, StatCard, type SkillsWalletData } from './SkillsWalletShared';

type SkillsWalletCompetenciesTabProps = {
  data: Pick<SkillsWalletData, 'competencies'>;
};

export function SkillsWalletCompetenciesTab({ data }: SkillsWalletCompetenciesTabProps) {
  const competencies = data.competencies;
  const total = competencies.length || 1;
  const completedCourses = competencies.filter(record => record.source === 'class').length;
  const assessmentBadges = competencies.filter(record => record.source === 'assessment').length;
  const mastered = competencies.filter(record => record.pct >= 100).length;
  const average =
    competencies.length > 0
      ? Math.round(competencies.reduce((sum, record) => sum + record.pct, 0) / competencies.length)
      : 0;

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>My Competencies</h2>
          <p className='text-sm text-muted-foreground'>
            Completed class work and assessment badges earned from proven learning outcomes.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button className='bg-primary hover:bg-primary/90'>
            <ArrowUpRight className='h-3 w-3' /> Add Evidence
          </Button>
          <Button variant='outline'>
            <ArrowUpRight className='h-3 w-3' /> Share Profile
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        <Card className='rounded-sm p-0'>
          <CardContent className='flex items-center gap-4 p-4'>
            <Donut value={average} size={96} stroke={10} label='Avg. mastery' sub={`${competencies.length} badges`} />
            <div>
              <p className='text-sm text-muted-foreground'>Competency Average</p>
              <p className='mt-1 text-xs text-muted-foreground'>Across completed classes and assessments</p>
            </div>
          </CardContent>
        </Card>
        <StatCard
          icon={BookOpen}
          label='Completed Courses'
          value={completedCourses}
          sub={`${Math.round((completedCourses / total) * 100)}% of total`}
          tint='bg-primary/10 text-primary'
        />
        <StatCard
          icon={ClipboardCheck}
          label='Assessment Badges'
          value={assessmentBadges}
          sub={`${Math.round((assessmentBadges / total) * 100)}% of total`}
          tint='bg-warning/10 text-warning'
        />
        <StatCard
          icon={Medal}
          label='Badges Earned'
          value={competencies.length}
          sub='From completed learning'
          tint='bg-success/10 text-success'
        />
        <StatCard
          icon={Star}
          label='Mastered'
          value={mastered}
          sub={`${Math.round((mastered / total) * 100)}% of total`}
          tint='bg-secondary text-secondary-foreground'
        />
      </div>

      {competencies.length ? (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {competencies.map(record => {
            const sourceLabel = record.source === 'class' ? 'Class completion' : 'Assessment badge';
            const sourceIcon = record.source === 'class' ? BookOpen : ClipboardCheck;
            const SourceIcon = sourceIcon;
            const actionLabel = record.course_id ? 'Open course' : 'Open assessment';

            return (
              <Card key={record.id} className='rounded-sm'>
                <CardContent className='px-4 py-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <p className='break-words font-semibold'>{record.competency}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>{sourceLabel}</p>
                      <div className='mt-2 flex flex-wrap gap-1.5'>
                        <Badge variant='outline' className='text-start max-w-full truncate text-xs'>
                          {record.skill}
                        </Badge>
                        <Badge className='max-w-full truncate border-0 bg-success/10 text-xs text-success'>
                          {record.level}
                        </Badge>
                        <Badge className='max-w-full truncate border-0 bg-primary/10 text-xs text-primary'>
                          {record.badge}
                        </Badge>
                      </div>
                    </div>
                    <ArrowUpRight className='h-4 w-4 shrink-0 text-muted-foreground' />
                  </div>

                  <div className='mt-4'>
                    <div className='mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground'>
                      <span className='inline-flex min-w-0 items-center gap-1 truncate'>
                        <SourceIcon className='h-3.5 w-3.5 shrink-0' />
                        <span className='truncate'>{record.evidence_count} evidence</span>
                      </span>
                      <span className='shrink-0'>{record.last_updated}</span>
                    </div>
                    <Progress value={record.pct} className='h-1.5' />
                    <div className='mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground'>
                      <span className='tabular-nums'>{record.pct}% complete</span>
                      <span className='truncate'>{record.level_num}</span>
                    </div>
                  </div>

                  <div className='mt-3 flex items-center gap-1.5 text-xs font-medium text-primary'>
                    {record.course_id ? (
                      <BookOpen className='h-3.5 w-3.5 shrink-0' />
                    ) : (
                      <ClipboardCheck className='h-3.5 w-3.5 shrink-0' />
                    )}
                    <span className='truncate'>{actionLabel}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          variant='card'
          icon={Medal}
          title='No completed competencies yet'
          description='Once a class reaches completion or an assessment is earned, the badge will appear here.'
          action={
            <Button className='bg-primary hover:bg-primary/90'>
              <ArrowUpRight className='mr-2 h-4 w-4' />
              Explore learning
            </Button>
          }
        />
      )}
    </div>
  );
}
