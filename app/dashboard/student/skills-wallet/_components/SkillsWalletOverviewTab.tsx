'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Briefcase, CheckCircle2, Sparkles, Target, Trophy } from 'lucide-react';

import { WalletShareButton } from '@/app/dashboard/_components/skills-wallet/WalletShareButton';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { STALE_TIMES } from '@/lib/query-client';
import { listPortfolioOptions } from '@/services/client/@tanstack/react-query.gen';
import { requireApiData } from '@/src/features/onboarding/lib/user-onboarding';

import {
  Donut,
  ICON_MAP,
  LegendRow,
  StatCard,
  fmtDate,
  type SkillsWalletData,
} from './SkillsWalletShared';

type SkillsWalletOverviewTabProps = {
  data: Pick<
    SkillsWalletData,
    | 'overviewMetrics'
    | 'topSkills'
    | 'levelBreakdown'
    | 'credentials'
    | 'externalCertificates'
    | 'portfolio'
    | 'competencies'
    | 'achievements'
    | 'skills'
  >;
  isLoading?: boolean;
  achievementsFailed?: boolean;
  onRetryAchievements?: () => void;
  onNavigateToTab?: (
    tab: 'skills' | 'competencies' | 'credentials' | 'portfolio' | 'achievements'
  ) => void;
};

export function SkillsWalletOverviewTab({
  data,
  onNavigateToTab,
  isLoading,
  achievementsFailed,
  onRetryAchievements,
}: SkillsWalletOverviewTabProps) {
  const portfolioQuery = useQuery({
    ...listPortfolioOptions(),
    select: requireApiData,
    staleTime: STALE_TIMES.entity,
  });
  const stats = [
    {
      icon: Sparkles,
      label: 'Total Skills',
      value: data.overviewMetrics.totalSkills,
      tint: 'bg-primary/10 text-primary',
      actionLabel: 'View details',
      onAction: () => onNavigateToTab?.('skills'),
    },
    {
      icon: Target,
      label: 'Competencies',
      value: data.competencies.length,
      tint: 'bg-warning/10 text-warning',
      actionLabel: 'View details',
      onAction: () => onNavigateToTab?.('competencies'),
    },
    {
      icon: CheckCircle2,
      label: 'Credentials',
      value: data.credentials.length + data.externalCertificates.length,
      tint: 'bg-success/10 text-success',
      actionLabel: 'View details',
      onAction: () => onNavigateToTab?.('credentials'),
    },
    {
      icon: Briefcase,
      label: 'Projects',
      value: portfolioQuery.isError ? '—' : portfolioQuery.isPending ? '…' : portfolioQuery.data?.length ?? 0,
      tint: 'bg-secondary text-secondary-foreground',
      actionLabel: 'View details',
      onAction: () => onNavigateToTab?.('portfolio'),
    },
    {
      icon: Trophy,
      label: 'Achievements',
      value: achievementsFailed ? '—' : data.achievements.length,
      tint: 'bg-muted text-foreground',
      actionLabel: 'View details',
      onAction: () => onNavigateToTab?.('achievements'),
    },
  ];

  const recentAchievements = [...data.achievements]
    .sort((a, b) => new Date(b.achieved_at ?? 0).getTime() - new Date(a.achieved_at ?? 0).getTime())
    .slice(0, 4);

  if (isLoading)
    return (
      <div className='space-y-4' aria-label='Loading wallet overview'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-64 w-full' />
      </div>
    );

  const totalLevels = data.levelBreakdown.reduce((sum, level) => sum + level.count, 0) || 1;

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-semibold'>Skills Wallet Overview</h2>
        </div>
        <div className='flex items-center gap-3'>
          <WalletShareButton />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} actionLabel='View details' />
        ))}
      </div>

      {data.overviewMetrics.totalSkills > data.skills.length ? (
        <p className='text-muted-foreground text-sm'>
          Proficiency and top skills summarize the first {data.skills.length} of{' '}
          {data.overviewMetrics.totalSkills} skills. View My Skills to browse all records.
        </p>
      ) : null}

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='rounded-md'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-base'>Overall Proficiency</CardTitle>
              <Badge variant='outline'>All Skills</Badge>
            </div>
          </CardHeader>
          <CardContent className='flex items-center gap-6'>
            <Donut
              value={data.overviewMetrics.skillsProgress}
              label='Overall'
              sub='Across skills'
            />
            <div className='flex-1 space-y-2'>
              {data.levelBreakdown.map(level => (
                <LegendRow
                  key={level.name}
                  colorClass={
                    level.name.toLowerCase().includes('expert')
                      ? 'bg-secondary'
                      : level.name.toLowerCase().includes('advanced')
                        ? 'bg-primary'
                        : level.name.toLowerCase().includes('intermediate')
                          ? 'bg-warning'
                          : 'bg-success'
                  }
                  label={level.name}
                  value={`${Math.round((level.count / totalLevels) * 100)}%`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-md'>
          <CardHeader className='flex flex-row items-center justify-between pb-3'>
            <CardTitle className='text-base'>Top Skills</CardTitle>
            <Button
              size='sm'
              variant='ghost'
              className='text-primary'
              onClick={() => onNavigateToTab?.('skills')}
            >
              View all <ArrowUpRight className='ml-1 h-3 w-3' />
            </Button>
          </CardHeader>
          <CardContent className='space-y-3'>
            {data.topSkills.length === 0 ? (
              <EmptyState
                variant='compact'
                title='No skills yet'
                description='Your saved skills will appear here.'
              />
            ) : null}
            {data.topSkills.slice(0, 5).map(skill => {
              const Icon = skill.icon ?? ICON_MAP[skill.icon_key] ?? Sparkles;
              return (
                <div key={skill.id} className='flex items-center gap-3'>
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-md ${skill.tint ?? 'bg-muted text-muted-foreground'}`}
                  >
                    <Icon className='h-4 w-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between'>
                      <p className='truncate text-sm font-medium'>{skill.name}</p>
                      <span className='text-muted-foreground min-w-fit text-xs'>{skill.level}</span>
                    </div>
                    <div className='mt-1 flex items-center gap-2'>
                      <Progress value={skill.proficiency_pct} className='h-1.5 flex-1' />
                      <span className='w-9 text-right text-xs tabular-nums'>
                        {skill.proficiency_pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className='rounded-md'>
          <CardHeader className='flex flex-row items-center justify-between pb-3'>
            <CardTitle className='text-base'>Recent Achievements</CardTitle>
            <Button
              size='sm'
              variant='ghost'
              className='text-primary'
              onClick={() => onNavigateToTab?.('achievements')}
            >
              View all <ArrowUpRight className='ml-1 h-3 w-3' />
            </Button>
          </CardHeader>
          <CardContent className='space-y-3'>
            {achievementsFailed ? (
              <EmptyState
                variant='compact'
                title='Unable to load achievements'
                action={onRetryAchievements ? <Button type='button' variant='outline' size='sm' onClick={onRetryAchievements}>Try again</Button> : undefined}
              />
            ) : recentAchievements.length ? (
              recentAchievements.map(achievement => (
                <div key={achievement.id} className='flex items-start gap-3'>
                  <div className='bg-success/10 text-success grid h-9 w-9 shrink-0 place-items-center rounded-md'>
                    <Trophy className='h-4 w-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>{achievement.name}</p>
                    <p className='text-muted-foreground text-xs'>{achievement.description}</p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      {fmtDate(achievement.achieved_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                variant='compact'
                title='No achievements yet'
                description='Achievements saved to your profile will appear here.'
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
