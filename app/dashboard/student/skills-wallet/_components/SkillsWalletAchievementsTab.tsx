'use client';

import { ArrowUpRight, Award, Flame, Plus, Share2, Star, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { StatCard, type AchievementRecord } from './SkillsWalletShared';

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

type SkillsWalletAchievementsTabProps = {
  achievements?: AchievementRecord[];
  title?: string;
  description?: string;
  onAddAchievement?: () => void;
};

export function SkillsWalletAchievementsTab({
  achievements = [],
  title = 'Achievements',
  description = 'Celebrate your milestones and track your progress on your learning journey.',
  onAddAchievement,
}: SkillsWalletAchievementsTabProps) {
  const data = achievements;
  const completed = data.filter(a => a.status === 'Completed');
  const totalPts = completed.reduce((sum, a) => sum + (a.points ?? 0), 0);

  const stats = [
    { icon: Trophy, label: 'Total Achievements', value: data.length, sub: 'Across all categories', tint: 'bg-primary/10 text-primary' },
    { icon: Star, label: 'Milestones Reached', value: completed.length, sub: '+0% this month', tint: 'bg-success/10 text-success' },
    { icon: Flame, label: 'Streak', value: 0, sub: 'Days in a row 🔥', tint: 'bg-warning/10 text-warning' },
    { icon: Award, label: 'Points Earned', value: totalPts.toLocaleString(), sub: '+0 this month', tint: 'bg-muted text-foreground' },
  ];

  const badges = data.map(a => ({
    name: a.name,
    desc: a.description ?? '',
    pts: a.points,
    date: a.status === 'In Progress' ? 'In progress' : fmtDate(a.achieved_at),
    color: a.color_key ?? 'bg-primary',
    status: a.status,
    progress: a.progress ?? undefined,
  }));

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold'>{title}</h2>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline'><Share2 className='h-4 w-4 mr-2' /> Share Achievements</Button>
          <Button
            disabled={true}
            className="bg-primary hover:bg-primary/90 disabled:cursor-not-allowed"
            onClick={onAddAchievement}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Achievement
          </Button>

        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {badges.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {badges.map(b => (
            <Card key={b.name} className='overflow-hidden'>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between'>
                  <div className={`h-14 w-14 ${b.color} text-primary-foreground rounded-xl grid place-items-center`}>
                    <Trophy className='h-7 w-7' />
                  </div>
                  <Badge className={b.status === 'Completed' ? 'bg-success/10 text-success border-0' : 'bg-warning/10 text-warning border-0'}>{b.status}</Badge>
                </div>
                <p className='font-semibold mt-3'>{b.name}</p>
                <p className='text-xs text-muted-foreground mt-1 min-h-8'>{b.desc}</p>
                {b.progress != null && (
                  <div className='mt-2'>
                    <Progress value={b.progress} className='h-1.5' />
                  </div>
                )}
                <div className='flex items-center justify-between mt-3 text-xs'>
                  <Badge variant='outline' className='text-[10px]'>+{b.pts} Points</Badge>
                  <span className='text-muted-foreground'>{b.date}</span>
                </div>
                <Button variant='ghost' size='sm' className='w-full mt-2 text-primary'>View Details <ArrowUpRight className='h-3 w-3 ml-1' /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className='p-8 text-center text-sm text-muted-foreground'>
            No live achievements are available yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
