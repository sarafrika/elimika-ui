'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Flag, Pencil, Plus, Star, Trophy } from 'lucide-react';
import { StatCard, fmtDate, type AchievementRecord } from './SkillsWalletShared';

const TYPE_LABELS = {
  AWARD: 'Award',
  MILESTONE: 'Milestone',
  COMPETITION: 'Competition',
  UNLOCKED_SKILL: 'Unlocked skill',
  RECOGNITION: 'Recognition',
};

type SkillsWalletAchievementsTabProps = {
  achievements?: AchievementRecord[];
  title?: string;
  description?: string;
  canAddAchievement?: boolean;
  onAddAchievement?: () => void;
  onEditAchievement?: (achievement: AchievementRecord) => void;
  isLoading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
};

export function SkillsWalletAchievementsTab({
  achievements = [],
  title = 'Achievements',
  description = 'Track your skills, credentials, experience, verified records and achievements.',
  canAddAchievement = false,
  onAddAchievement,
  onEditAchievement,
  isLoading,
  failed,
  onRetry,
}: SkillsWalletAchievementsTabProps) {
  const count = (type: AchievementRecord['achievement_type']) =>
    achievements.filter(item => item.achievement_type === type).length;
  const stats = [
    { icon: Trophy, label: 'Total Achievements', value: achievements.length, sub: 'Across all categories', tint: 'bg-primary/10 text-primary' },
    { icon: Award, label: 'Awards', value: count('AWARD'), sub: 'Saved awards', tint: 'bg-success/10 text-success' },
    { icon: Flag, label: 'Milestones', value: count('MILESTONE'), sub: 'Saved milestones', tint: 'bg-warning/10 text-warning' },
    { icon: Star, label: 'Competitions', value: count('COMPETITION'), sub: 'Saved competition achievements', tint: 'bg-muted text-foreground' },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>{title}</h2>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
        {canAddAchievement && onAddAchievement && (
          <Button type='button' onClick={onAddAchievement}>
            <Plus className='size-4' />Add achievement
          </Button>
        )}
      </div>

      <h3 className='text-lg font-semibold'>Saved achievements</h3>

      {/* <SkillsWalletAchievementMetrics /> */}

      {isLoading ? (
        <div className='space-y-4' aria-label='Loading achievements'>
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-48 w-full' />
        </div>
      ) : failed ? (
        <EmptyState title='Unable to load achievements' description='Please try loading your saved achievements again.'
          action={onRetry ? <Button type='button' variant='outline' onClick={onRetry}>Try again</Button> : undefined} />
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
          </div>
          {achievements.length ? (
            <div className='divide-y rounded-lg border'>
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className='flex items-start gap-3 p-4 sm:items-center'
                >
                  <div className='bg-primary/10 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-lg'>
                    <Trophy className='h-5 w-5' />
                  </div>

                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h3 className='break-words font-medium'>{achievement.name}</h3>
                      <Badge variant='outline'>
                        {TYPE_LABELS[achievement.achievement_type]}
                      </Badge>
                    </div>

                    {achievement.description && (
                      <p className='text-muted-foreground break-words text-sm whitespace-pre-line'>
                        {achievement.description}
                      </p>
                    )}

                    {achievement.awarded_by && (
                      <p className='text-muted-foreground break-words text-xs'>
                        Awarded by {achievement.awarded_by}
                      </p>
                    )}

                    <p className='text-muted-foreground text-xs'>
                      {achievement.achieved_at
                        ? fmtDate(achievement.achieved_at)
                        : 'Award date not specified'}
                    </p>
                  </div>

                  {canAddAchievement &&
                    achievement.uuid &&
                    onEditAchievement && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='shrink-0'
                        aria-label={`Edit ${achievement.name}`}
                        onClick={() => onEditAchievement(achievement)}
                      >
                        <Pencil className='size-4' />
                        <span className='hidden sm:inline'>Edit</span>
                      </Button>
                    )}
                </div>
              ))}
            </div>
          ) : (
            // <EmptyState icon={Trophy} title='No achievements yet' description='Achievements saved to your profile will appear here.' />
            <></>
          )}
        </>
      )}


    </div>
  );
}
