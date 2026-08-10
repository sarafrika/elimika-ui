'use client';

import { ArrowUpRight, Briefcase, CheckCircle2, Sparkles, Target, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import {
  Donut,
  ICON_MAP,
  LegendRow,
  StatCard,
  WalletIdCard,
  type SkillsWalletData
} from './SkillsWalletShared';

type SkillsWalletOverviewTabProps = {
  data: Pick<
    SkillsWalletData,
    'overviewMetrics' | 'topSkills' | 'levelBreakdown' | 'certificates' | 'portfolio' | 'categoryCounts'
  >;
  onNavigateToTab?: (tab: 'skills' | 'competencies' | 'credentials' | 'portfolio' | 'achievements') => void;
};

export function SkillsWalletOverviewTab({ data, onNavigateToTab }: SkillsWalletOverviewTabProps) {
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
      value: data.categoryCounts.length,
      tint: 'bg-warning/10 text-warning',
      actionLabel: 'View details',
      onAction: () => onNavigateToTab?.('competencies'),
    },
    {
      icon: CheckCircle2,
      label: 'Certificates',
      value: data.certificates.length,
      tint: 'bg-success/10 text-success',
      actionLabel: 'View details',
      onAction: () => onNavigateToTab?.('credentials'),
    },
    {
      icon: Briefcase,
      label: 'Projects',
      value: data.portfolio.length,
      tint: 'bg-secondary text-secondary-foreground',
      actionLabel: 'View details',
      onAction: () => onNavigateToTab?.('portfolio'),
    },
    {
      icon: Trophy,
      label: 'Achievements',
      value: data.overviewMetrics.completedSkills,
      tint: 'bg-muted text-foreground',
      actionLabel: 'View details',
      onAction: () => onNavigateToTab?.('achievements'),
    },
  ];

  const totalLevels = data.levelBreakdown.reduce((sum, level) => sum + level.count, 0) || 1;

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-semibold'>Skills Wallet Overview</h2>
          <Badge className='border-0 bg-success/10 text-success'>
            <CheckCircle2 className='mr-1 h-3 w-3' /> Verified
          </Badge>
        </div>
        <div className='flex items-center gap-3'>
          <Button className='bg-primary hover:bg-primary/90'>
            <ArrowUpRight className='mr-2 h-4 w-4' /> Share Wallet
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} actionLabel='View details' />
        ))}
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='rounded-md'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-base'>Overall Proficiency</CardTitle>
              <Badge variant='outline'>All Skills</Badge>
            </div>
          </CardHeader>
          <CardContent className='flex items-center gap-6'>
            <Donut value={data.overviewMetrics.skillsProgress} label='Overall' sub='Across courses' />
            <div className='flex-1 space-y-2'>
              {data.levelBreakdown.map(level => (
                <LegendRow
                  key={level.name}
                  colorClass={level.name.toLowerCase().includes('expert')
                    ? 'bg-secondary'
                    : level.name.toLowerCase().includes('advanced')
                      ? 'bg-primary'
                      : level.name.toLowerCase().includes('intermediate')
                        ? 'bg-warning'
                        : 'bg-success'}
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
            {/* // navigate to my skills tab */}
            <Button size='sm' variant='ghost' className='text-primary'>
              View all <ArrowUpRight className='ml-1 h-3 w-3' />
            </Button>
          </CardHeader>
          <CardContent className='space-y-3'>
            {data.topSkills.slice(0, 5).map(skill => {
              const Icon = skill.icon ?? ICON_MAP[skill.icon_key] ?? Sparkles;
              return (
                <div key={skill.id} className='flex items-center gap-3'>
                  <div className={`grid h-8 w-8 place-items-center rounded-md ${skill.tint ?? 'bg-muted text-muted-foreground'}`}>
                    <Icon className='h-4 w-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between'>
                      <p className='truncate text-sm font-medium'>{skill.name}</p>
                      <span className=' min-w-fit text-muted-foreground text-xs'>{skill.level}</span>
                    </div>
                    <div className='mt-1 flex items-center gap-2'>
                      <Progress value={skill.proficiency_pct} className='h-1.5 flex-1' />
                      <span className='w-9 text-right text-xs tabular-nums'>{skill.proficiency_pct}%</span>
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
            {/* // navigate to achievement tab */}
            <Button size='sm' variant='ghost' className='text-primary'>
              View all <ArrowUpRight className='ml-1 h-3 w-3' />
            </Button>
          </CardHeader>
          <CardContent className='space-y-3'>
            {/* {data.certificates.slice(0, 4).map(certificate => (
              <div key={certificate.uuid ?? certificate.certificate_number} className='flex items-start gap-3'>
                <div className='grid h-9 w-9 place-items-center rounded-md bg-success/10 text-success'>
                  <ShieldCheck className='h-4 w-4' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>
                    {certificate.course_uuid ?? 'Platform Certificate'}
                  </p>
                  <p className='truncate text-xs text-muted-foreground'>
                    {certificate.certificate_number ?? 'Pending number'}
                  </p>
                  <p className='mt-0.5 text-[11px] text-muted-foreground'>
                    {fmtDate(certificate.completion_date)}
                  </p>
                </div>
              </div>
            ))} */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
