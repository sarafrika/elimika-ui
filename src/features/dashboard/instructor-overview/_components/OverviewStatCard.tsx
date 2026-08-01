import { cn } from '@/lib/utils';
import type { OverviewStat } from './overview-data';

const toneClasses = {
  blue: 'from-primary to-primary',
  green: 'from-success to-teal-400',
  orange: 'from-orange-500 to-warning',
  red: 'from-destructive to-destructive',
} as const;

type OverviewStatCardProps = {
  stat: OverviewStat;
};

export function OverviewStatCard({ stat }: OverviewStatCardProps) {
  return (
    <article
      className={cn(
        `min-h-[72px] w-full rounded-[10px] bg-gradient-to-r px-4 py-3 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] sm:px-5 sm:py-4`,
        toneClasses[stat.tone]
      )}
    >
      <div className='flex h-full flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3'>
        <span className='text-[clamp(1.5rem,4vw,2.2rem)] leading-none font-semibold'>
          {stat.value}
        </span>

        <span className='text-[clamp(0.85rem,2vw,1.08rem)] leading-tight font-medium break-words'>
          {stat.label}
        </span>
      </div>
    </article>
  );
}
