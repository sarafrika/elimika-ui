'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/error-utils';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import { getSummaryOptions, listSkillsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { ProficiencyLevelEnum } from '@/services/client/types.gen';

const PROFICIENCY: Record<ProficiencyLevelEnum, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

function readMetricData<T>(response: { data?: T; success?: boolean; error?: unknown; message?: string }): T {
  if (response.error || response.success === false)
    throw new Error(getErrorMessage(response, 'Unable to load achievement metrics.'));
  if (!response.data) throw new Error('No wallet information was returned.');
  return response.data;
}

export function SkillsWalletAchievementMetrics() {
  const { data: session, status } = useSession();
  const enabled = status === 'authenticated' && !session?.error;
  const summary = useQuery({
    ...getSummaryOptions(), select: readMetricData, enabled,
    staleTime: STALE_TIMES.live, ...APPROVAL_QUERY_FRESHNESS,
  });
  const skills = useQuery({
    ...listSkillsOptions(), select: readMetricData, enabled,
    staleTime: STALE_TIMES.entity,
  });
  const metrics = useMemo(() => {
    const counts = summary.data?.section_counts;
    const skillRecords = skills.data ?? [];
    const skillCount = Number(counts?.skills ?? skillRecords.length);
    const expertSkills = skillRecords.filter(skill => skill.proficiency_level === 'expert').length;
    const credentialCount = Number(counts?.certifications ?? 0) + Number(counts?.documents ?? 0);
    const experienceCount = Number(counts?.experience ?? 0);
    const verifiedCount = Number(summary.data?.verified_items ?? 0);
    const topSkill = [...skillRecords].sort(
      (a, b) => (b.proficiency_level ? PROFICIENCY[b.proficiency_level] : 0) -
        (a.proficiency_level ? PROFICIENCY[a.proficiency_level] : 0)
    )[0];
    const topProficiency = topSkill?.proficiency_level ? PROFICIENCY[topSkill.proficiency_level] : 0;

    return [
      {
        id: 'skills', name: 'Skills', value: skillCount, unit: 'skills',
        description: `${expertSkills} of ${skillCount} skills at expert proficiency.`,
        progress: skillCount > 0 ? Math.round((expertSkills / skillCount) * 100) : 0,
        complete: skillCount > 0 && expertSkills === skillCount,
        color: 'bg-primary',
      },
      {
        id: 'credentials', name: 'Credential Vault', value: credentialCount, unit: 'credentials',
        description: `${credentialCount} credentials and evidence documents in your wallet.`,
        progress: credentialCount > 0 ? 100 : 0,
        complete: credentialCount > 0, color: 'bg-success',
      },
      {
        id: 'experience', name: 'Experience', value: experienceCount, unit: 'experience records',
        description: `${experienceCount} experience records showcase your professional journey.`,
        progress: experienceCount > 0 ? 100 : 0,
        complete: experienceCount > 0, color: 'bg-warning',
      },
      {
        id: 'verification', name: 'Trusted Verification', value: verifiedCount, unit: 'verified records',
        description: `${verifiedCount} records verified across your wallet.`,
        progress: verifiedCount > 0 ? 100 : 0,
        complete: verifiedCount > 0, color: 'bg-success/70',
      },
      {
        id: 'top-skill', name: topSkill ? `Top Skill: ${topSkill.skill_name}` : 'Top Skill Growth',
        value: topProficiency, unit: '% proficiency',
        description: topSkill ? `Your strongest reported skill is at ${topProficiency}% proficiency.` : 'No skills are connected yet.',
        progress: topProficiency,
        complete: topProficiency === 100, color: 'bg-primary/70',
      },
    ];
  }, [summary.data, skills.data]);

  if (status === 'loading' || (enabled && (summary.isPending || skills.isPending))) return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4' aria-label='Loading achievement metrics'>
      {['skills', 'credentials', 'experience', 'verification', 'top-skill'].map(id => <Skeleton key={id} className='h-56 w-full' />)}
    </div>
  );
  if (!enabled || summary.isError || skills.isError) return (
    <EmptyState title='Unable to load achievement metrics' description='Please reload your wallet metrics.'
      action={enabled ? <Button type='button' variant='outline' onClick={() => {
        void Promise.all([summary.refetch(), skills.refetch()]);
      }}>Try again</Button> : undefined} />
  );

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4' aria-label='Achievement metrics'>
      {metrics.map(metric => (
        <Card key={metric.id} className='overflow-hidden'>
          <CardContent className='space-y-3 p-4'>
            <div className='flex items-start justify-between gap-2'>
              <div className={`${metric.color} text-primary-foreground grid h-14 w-14 shrink-0 place-items-center rounded-xl`}>
                <Trophy className='h-7 w-7' />
              </div>
              <Badge className={metric.complete ? 'bg-success/10 text-success border-0' : 'bg-warning/10 text-warning border-0'}>
                {metric.complete ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
            <h3 className='font-semibold break-words'>{metric.name}</h3>
            <p className='text-muted-foreground min-h-8 text-xs'>{metric.description}</p>
            <div className='flex items-baseline gap-1'>
              <span className='text-2xl font-bold tabular-nums'>{metric.value}</span>
              <span className='text-muted-foreground text-xs'>{metric.unit}</span>
            </div>
            <div className='space-y-1'>
              <Progress value={metric.progress} className='h-1.5' aria-label={`${metric.name} progress`} />
              <p className='text-muted-foreground text-xs tabular-nums'>{metric.progress}%</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
