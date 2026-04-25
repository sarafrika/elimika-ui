import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Star } from 'lucide-react';
import type { SkillsFundMiniCard } from '../data';

type SkillsFundMiniTrackerCardProps = {
  card: SkillsFundMiniCard;
};

export function SkillsFundMiniTrackerCard({ card }: SkillsFundMiniTrackerCardProps) {
  return (
    <article className='w-full max-w-[450px] rounded-[10px] border border-border bg-card px-3 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-[8px] text-xs font-semibold text-primary-foreground',
                card.accent === 'blue' ? 'bg-primary' : 'bg-primary/80'
              )}
            >
              {card.title.charAt(0)}
            </div>
            <h3 className='truncate text-[1rem] font-semibold text-foreground sm:text-[1.1rem]'>
              {card.title}
            </h3>
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>{card.subtitle}</p>
        </div>

        <div className='flex items-center gap-0.5'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={`${card.id}-rating-${index + 1}`}
              className={cn(
                'size-4',
                index < card.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
              )}
            />
          ))}
        </div>
      </div>

      <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm font-semibold text-foreground'>{card.amount}</p>
        <Button className='h-8 rounded-[6px] px-4 text-[0.82rem]'>
          {card.actionLabel}
        </Button>
      </div>

      <div className='mt-3 space-y-2'>
        <div className='h-2 overflow-hidden rounded-full bg-muted'>
          <div className='h-full rounded-full bg-primary' style={{ width: `${card.progressPercent}%` }} />
        </div>
        <div className='text-right text-[0.78rem] font-semibold text-muted-foreground'>
          {card.progressLabel}
        </div>
      </div>

      <div className='mt-3 flex flex-wrap items-center gap-2'>
        {card.chips.map(chip => (
          <span
            key={`${card.id}-${chip}`}
            className='inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[0.76rem] font-medium text-muted-foreground'
          >
            <CheckCircle2 className='size-3.5 text-green-500' />
            {chip}
          </span>
        ))}
      </div>
    </article>
  );
}
