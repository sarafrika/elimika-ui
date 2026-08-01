import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Star } from 'lucide-react';
import type { SkillsFundMiniCard } from '../data';

type SkillsFundMiniTrackerCardProps = {
  card: SkillsFundMiniCard;
};

export function SkillsFundMiniTrackerCard({ card }: SkillsFundMiniTrackerCardProps) {
  return (
    <article className='border-border bg-card w-full max-w-[450px] rounded-[10px] border px-3 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <div
              className={cn(
                'text-primary-foreground flex h-7 w-7 items-center justify-center rounded-[8px] text-xs font-semibold',
                card.accent === 'blue' ? 'bg-primary' : 'bg-primary/80'
              )}
            >
              {card.title.charAt(0)}
            </div>
            <h3 className='text-foreground truncate text-[1rem] font-semibold sm:text-[1.1rem]'>
              {card.title}
            </h3>
          </div>
          <p className='text-muted-foreground mt-1 text-sm'>{card.subtitle}</p>
        </div>

        <div className='flex items-center gap-0.5'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={`${card.id}-rating-${index + 1}`}
              className={cn(
                'size-4',
                index < card.rating ? 'fill-warning text-warning' : 'fill-muted text-muted'
              )}
            />
          ))}
        </div>
      </div>

      <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
        <p className='text-foreground text-sm font-semibold'>{card.amount}</p>
        <Button className='h-8 rounded-[6px] px-4 text-[0.82rem]'>{card.actionLabel}</Button>
      </div>

      <div className='mt-3 space-y-2'>
        <div className='bg-muted h-2 overflow-hidden rounded-full'>
          <div
            className='bg-primary h-full rounded-full'
            style={{ width: `${card.progressPercent}%` }}
          />
        </div>
        <div className='text-muted-foreground text-right text-[0.78rem] font-semibold'>
          {card.progressLabel}
        </div>
      </div>

      <div className='mt-3 flex flex-wrap items-center gap-2'>
        {card.chips.map(chip => (
          <span
            key={`${card.id}-${chip}`}
            className='bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.76rem] font-medium'
          >
            <CheckCircle2 className='size-3.5 text-green-500' />
            {chip}
          </span>
        ))}
      </div>
    </article>
  );
}
