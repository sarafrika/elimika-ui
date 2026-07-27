'use client';

import { MapPin, Star, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

type Props = {
  totalInstructors: number;
  topSkill: string;
  topLocation: string;
  topRating: number;
};

export function SearchInstructorMetrics({
  totalInstructors,
  topSkill,
  topLocation,
  topRating,
}: Props) {
  const cards = [
    {
      icon: TrendingUp,
      label: 'Top Skill in Demand',
      value: topSkill,
      accent: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      icon: Star,
      label: 'Highest Rated Instructor',
      value: `${topRating.toFixed(1)}`,
      suffix: ' rating',
      accent: 'text-warning',
      iconBg: 'bg-warning/10',
    },
    {
      icon: MapPin,
      label: 'Most Active Location',
      value: topLocation,
      accent: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      icon: Users,
      label: 'Instructors available',
      value: `${totalInstructors}+`,
      suffix: ' instructors',
      accent: 'text-primary',
      iconBg: 'bg-primary/10',
    },
  ];

  return (
    <Card className='rounded-xl border bg-card p-0 shadow-none'>
      <div className='grid gap-0 sm:grid-cols-2 xl:grid-cols-4'>
        {cards.map(card => {
          const Icon = card.icon;

          return (
            <div key={card.label} className='flex items-center gap-3 px-4 py-4'>
              <div className={`${card.iconBg} ${card.accent} flex size-10 items-center justify-center rounded-xl`}>
                <Icon className='size-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-muted-foreground text-xs sm:text-sm'>{card.label}</p>
                <p className='line-clamp-1 text-sm font-semibold sm:text-base'>
                  {card.value}
                  {card.suffix ? <span className='text-muted-foreground'>{card.suffix}</span> : null}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
