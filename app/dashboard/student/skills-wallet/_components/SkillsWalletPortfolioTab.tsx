'use client';

import { Bookmark, CheckCircle2, Download, Eye, Plus, Star, Briefcase } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { StatCard, type SkillsWalletData } from './SkillsWalletShared';

type SkillsWalletPortfolioTabProps = {
  data: Pick<SkillsWalletData, 'portfolio'>;
};

export function SkillsWalletPortfolioTab({ data }: SkillsWalletPortfolioTabProps) {
  const rows = data.portfolio;
  const totalViews = rows.reduce((sum, item) => sum + item.views, 0);
  const totalLikes = rows.reduce((sum, item) => sum + item.likes, 0);

  const stats = [
    { icon: Briefcase, label: 'Total Projects', value: rows.length, tint: 'bg-primary/10 text-primary' },
    { icon: Eye, label: 'Profile Views', value: totalViews, sub: '+0% this month', tint: 'bg-secondary text-secondary-foreground' },
    { icon: CheckCircle2, label: 'Endorsements', value: totalLikes, sub: '+0% this month', tint: 'bg-success/10 text-success' },
    { icon: Download, label: 'Downloads', value: 0, sub: 'API coming later', tint: 'bg-muted text-foreground' },
    { icon: Star, label: 'Avg. Rating', value: '0.0', sub: 'No ratings yet', tint: 'bg-warning/10 text-warning' },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>My Portfolio</h2>
          <p className='text-sm text-muted-foreground'>
            Showcase your best work and track your impact.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>Portfolio Visibility</span>
            <Badge variant='outline'>
              <Eye className='mr-1 h-3 w-3' /> Public
            </Badge>
          </div>
          <Button className='bg-primary hover:bg-primary/90'>
            <Plus className='mr-2 h-4 w-4' /> Add New Project
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {rows.length > 0 ? (
          rows.map(portfolio => (
            <Card key={portfolio.id} className='overflow-hidden'>
              <div className='bg-background/80 grid h-32 place-items-center bg-gradient-to-br from-background to-muted'>
                {portfolio.featured ? <Badge className='absolute left-2 top-2 bg-primary'>Featured</Badge> : null}
                <Button size='icon' variant='secondary' className='absolute right-2 top-2 h-7 w-7'>
                  <Bookmark className='h-3.5 w-3.5' />
                </Button>
                <Briefcase className='h-10 w-10 text-muted-foreground' />
              </div>
              <CardContent className='p-4'>
                <Badge variant='outline' className='text-[10px]'>
                  {portfolio.tag}
                </Badge>
                <p className='mt-2 font-medium'>{portfolio.title}</p>
                <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>{portfolio.description}</p>
                <div className='mt-3 flex items-center justify-between text-xs text-muted-foreground'>
                  <span className='flex items-center gap-3'>
                    <span className='flex items-center gap-1'>
                      <Eye className='h-3 w-3' /> {portfolio.views}
                    </span>
                    <span className='flex items-center gap-1'>
                      <CheckCircle2 className='h-3 w-3' /> {portfolio.likes}
                    </span>
                  </span>
                  <span>{portfolio.project_date}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className='xl:col-span-3'>
            <CardContent className='p-8 text-center text-sm text-muted-foreground'>
              Portfolio entries are not connected yet. You can still keep the current layout ready for future uploads.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
