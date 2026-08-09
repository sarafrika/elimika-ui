'use client';

import { Plus, Share2, Trophy, CheckCircle2, Clock, BookOpen, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { StatCard } from './SkillsWalletShared';

const ACHIEVEMENTS = [
  { id: 'a1', name: 'Fast Learner', description: 'Completed 5 courses in a single month.', points: 250, achieved_at: '2026-07-15', status: 'Completed' as const, color_key: 'bg-primary', progress: null },
  { id: 'a2', name: 'Top Contributor', description: 'Ranked in the top 10 on the leaderboard.', points: 400, achieved_at: '2026-06-28', status: 'Completed' as const, color_key: 'bg-secondary', progress: null },
  { id: 'a3', name: 'Certification Streak', description: 'Earned 3 credentials back to back.', points: 300, achieved_at: '2026-07-01', status: 'Completed' as const, color_key: 'bg-success', progress: null },
  { id: 'a4', name: 'Mentor in Training', description: 'Guide 10 peers through course material.', points: 150, achieved_at: null, status: 'In Progress' as const, color_key: 'bg-warning', progress: 60 },
];

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export function SkillsWalletAchievementsTab() {
  const completed = ACHIEVEMENTS.filter(item => item.status === 'Completed');
  const totalPts = completed.reduce((sum, item) => sum + item.points, 0);

  const stats = [
    { icon: Trophy, label: 'Total Achievements', value: ACHIEVEMENTS.length, sub: 'All badges', tint: 'bg-primary/10 text-primary' },
    { icon: CheckCircle2, label: 'Completed', value: completed.length, sub: 'Earned', tint: 'bg-success/10 text-success' },
    { icon: Clock, label: 'In Progress', value: ACHIEVEMENTS.filter(item => item.status === 'In Progress').length, sub: 'Active goals', tint: 'bg-warning/10 text-warning' },
    { icon: BookOpen, label: 'Total Points', value: totalPts, sub: 'Points earned', tint: 'bg-secondary text-secondary-foreground' },
    { icon: Star, label: 'Top Score', value: 100, sub: 'Peak performance', tint: 'bg-muted text-foreground' },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>My Achievements</h2>
          <p className='text-sm text-muted-foreground'>Earn badges and recognition for your learning milestones.</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button className='bg-primary hover:bg-primary/90'>
            <Plus className='mr-2 h-4 w-4' /> Add Achievement
          </Button>
          <Button variant='outline'>
            <Share2 className='mr-2 h-4 w-4' /> Share Achievements
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {ACHIEVEMENTS.map(item => (
          <Card key={item.id}>
            <CardContent className='p-5'>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <p className='font-semibold'>{item.name}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>{item.description}</p>
                </div>
                <Badge variant='outline'>{item.points} pts</Badge>
              </div>
              <div className='mt-3 flex items-center justify-between text-xs text-muted-foreground'>
                <span>{item.status}</span>
                <span>{fmtDate(item.achieved_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
