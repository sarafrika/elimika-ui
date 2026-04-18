'use client';

import { Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import type { CourseRecommendation, PortfolioInsight } from '../data';

type MarketplaceRailProps = {
  coursesTitle: string;
  insightsTitle: string;
  matchingTitle: string;
  matchingDescription: string;
  matchingAction: string;
  searchJobsPlaceholder: string;
  sendLabel: string;
  insightsCount: string;
  courses: CourseRecommendation[];
  insights: PortfolioInsight[];
};

export function MarketplaceRail({
  coursesTitle,
  insightsTitle,
  matchingTitle,
  matchingDescription,
  matchingAction,
  searchJobsPlaceholder,
  sendLabel,
  insightsCount,
  courses,
  insights,
}: MarketplaceRailProps) {
  return (
    <aside className='space-y-4'>
      <Card className='gap-4 rounded-[18px] border-white/60 bg-card/95 px-4 py-4 shadow-sm'>
        <h2 className='text-foreground text-lg font-semibold'>{coursesTitle}</h2>
        <div className='space-y-3'>
          {courses.map(course => (
            <div key={course.id} className='flex items-center gap-3 rounded-xl border bg-background/70 p-3'>
              <span
                className={
                  course.accent === 'blue'
                    ? 'grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold'
                    : 'grid size-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--el-accent-azure)_30%,white)] text-primary text-sm font-semibold'
                }
              >
                {course.iconLabel}
              </span>
              <div className='min-w-0'>
                <h3 className='text-foreground truncate text-base font-semibold'>{course.title}</h3>
                <p className='text-muted-foreground text-sm'>
                  {course.subtitle} | {course.hours}
                </p>
              </div>
            </div>
          ))}
        </div>

        <label className='relative block'>
          <Input placeholder={searchJobsPlaceholder} className='rounded-xl pr-10' />
          <Search className='text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2' />
        </label>
        <Button className='rounded-xl'>{sendLabel}</Button>
      </Card>

      <Card className='gap-4 rounded-[18px] border-white/60 bg-card/95 px-4 py-4 shadow-sm'>
        <h2 className='text-foreground text-lg font-semibold'>{insightsTitle}</h2>
        <div className='rounded-xl border bg-background/70 p-4'>
          <div className='mb-4 flex items-center gap-2'>
            <span className='text-foreground text-3xl font-semibold'>{insightsCount}</span>
            <span className='text-primary font-medium'>Portfolio Entites</span>
          </div>
          <div className='space-y-3'>
            {insights.slice(1).map(item => {
              const Icon = item.icon;

              return (
                <div key={item.label} className='text-muted-foreground flex items-center gap-3'>
                  <Icon className='text-primary size-4' />
                  <span>{item.label}</span>
                  <span className='ml-auto'>{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className='gap-4 rounded-[18px] border-white/60 bg-card/95 px-4 py-4 shadow-sm'>
        <h2 className='text-foreground text-lg font-semibold'>{matchingTitle}</h2>
        <div className='flex items-start gap-3 rounded-xl border bg-background/70 p-4'>
          <span className='grid size-12 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--success)_18%,white)] text-success'>
            🤖
          </span>
          <p className='text-muted-foreground text-sm leading-6'>{matchingDescription}</p>
        </div>
        <Button variant='outline' className='rounded-xl border-white/70 bg-background/80'>
          {matchingAction}
        </Button>
      </Card>
    </aside>
  );
}
